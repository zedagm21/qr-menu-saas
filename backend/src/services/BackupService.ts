import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import zlib from 'zlib';
import prisma from '../config/database';
import { config } from '../config/env';

export class BackupService {
    /**
     * Creates S3 / Cloudflare R2 client from environment configuration
     */
    private static getR2Client(): S3Client | null {
        if (!config.cloudflareAccessKeyId || !config.cloudflareSecretAccessKey || !config.cloudflareR2BucketName) {
            return null;
        }

        const endpoint =
            config.cloudflareR2Endpoint ||
            (config.cloudflareAccountId
                ? `https://${config.cloudflareAccountId}.r2.cloudflarestorage.com`
                : undefined);

        return new S3Client({
            region: 'auto',
            endpoint,
            credentials: {
                accessKeyId: config.cloudflareAccessKeyId,
                secretAccessKey: config.cloudflareSecretAccessKey,
            },
        });
    }

    /**
     * Dump database using pg_dump if installed on system
     */
    private static async dumpViaPgDump(dbUrl: string): Promise<Buffer | null> {
        return new Promise((resolve) => {
            try {
                const pgDump = spawn('pg_dump', ['--clean', '--if-exists', '--no-owner', dbUrl], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    shell: true,
                });

                const gzip = zlib.createGzip({ level: 9 });
                const chunks: Buffer[] = [];

                pgDump.stdout.pipe(gzip);

                gzip.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                gzip.on('end', () => resolve(Buffer.concat(chunks)));

                pgDump.on('error', (err) => {
                    console.warn('[Backup] pg_dump executable not available or failed:', err.message);
                    resolve(null);
                });

                pgDump.stderr.on('data', (data) => {
                    const msg = data.toString();
                    if (msg.includes('error') || msg.includes('fatal')) {
                        console.warn('[Backup] pg_dump stderr:', msg.trim());
                    }
                });

                pgDump.on('close', (code) => {
                    if (code !== 0) {
                        console.warn(`[Backup] pg_dump exited with code ${code}, falling back to Prisma dump.`);
                        resolve(null);
                    }
                });
            } catch {
                resolve(null);
            }
        });
    }

    /**
     * Fallback Prisma Data Exporter: exports all platform data to compressed JSON
     */
    private static async dumpViaPrisma(): Promise<Buffer> {
        console.log('[Backup] Exporting platform database entities via Prisma ORM...');

        const [
            restaurants,
            restaurantTranslations,
            themes,
            slugAliases,
            categories,
            categoryTranslations,
            menuItems,
            menuItemTranslations,
            qrCodes,
            users,
            broadcasts,
            systemLogs,
        ] = await Promise.all([
            prisma.restaurant.findMany(),
            prisma.restaurantTranslation.findMany(),
            prisma.restaurantTheme.findMany(),
            prisma.restaurantSlugAlias.findMany(),
            prisma.category.findMany(),
            prisma.categoryTranslation.findMany(),
            prisma.menuItem.findMany(),
            prisma.menuItemTranslation.findMany(),
            prisma.qRCode.findMany(),
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    passwordHash: true,
                    googleId: true,
                    emailVerified: true,
                    role: true,
                    restaurantId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.broadcastAnnouncement.findMany(),
            prisma.systemLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } }),
        ]);

        const exportPayload = {
            metadata: {
                app: 'OurMenu',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                recordCounts: {
                    restaurants: restaurants.length,
                    categories: categories.length,
                    menuItems: menuItems.length,
                    users: users.length,
                    qrCodes: qrCodes.length,
                },
            },
            data: {
                restaurants,
                restaurantTranslations,
                themes,
                slugAliases,
                categories,
                categoryTranslations,
                menuItems,
                menuItemTranslations,
                qrCodes,
                users,
                broadcasts,
                systemLogs,
            },
        };

        const jsonString = JSON.stringify(exportPayload, null, 2);
        return zlib.gzipSync(Buffer.from(jsonString, 'utf-8'), { level: 9 });
    }

    /**
     * Prune older backups from R2, keeping the latest 30 snapshots
     */
    private static async pruneOldBackups(s3: S3Client, bucket: string, maxToKeep = 30): Promise<void> {
        try {
            const listCmd = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: 'backups/',
            });

            const res = await s3.send(listCmd);
            const contents = res.Contents || [];

            if (contents.length <= maxToKeep) return;

            // Sort descending by LastModified
            contents.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

            const toDelete = contents.slice(maxToKeep);
            for (const item of toDelete) {
                if (item.Key) {
                    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: item.Key }));
                    console.log(`[Backup] Pruned old backup archive: ${item.Key}`);
                }
            }
        } catch (err: any) {
            console.warn('[Backup] Failed to prune old backups:', err.message || err);
        }
    }

    /**
     * Main automated database backup routine
     */
    public static async runDatabaseBackup(): Promise<string | null> {
        const s3 = this.getR2Client();
        if (!s3) {
            console.warn('[Backup] Cloudflare R2 credentials not configured. Skipping automated backup.');
            return null;
        }

        const bucket = config.cloudflareR2BucketName;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dbUrl = process.env.DATABASE_URL || '';

        console.log(`[Backup] Starting automated database backup at ${new Date().toISOString()}...`);

        let backupBuffer: Buffer | null = null;
        let fileName = `ourmenu-backup-${timestamp}.sql.gz`;

        if (dbUrl) {
            backupBuffer = await this.dumpViaPgDump(dbUrl);
        }

        if (!backupBuffer) {
            backupBuffer = await this.dumpViaPrisma();
            fileName = `ourmenu-backup-${timestamp}.json.gz`;
        }

        const key = `backups/${fileName}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: backupBuffer,
                ContentType: 'application/gzip',
                Metadata: {
                    timestamp: new Date().toISOString(),
                    sizeBytes: String(backupBuffer.length),
                },
            })
        );

        console.log(`[Backup] ✅ Database backup successfully uploaded to R2: ${key} (${(backupBuffer.length / 1024).toFixed(1)} KB)`);

        // Prune older backups
        await this.pruneOldBackups(s3, bucket, 30);

        return key;
    }

    /**
     * Start background daily scheduler
     */
    public static startDailyBackupScheduler(): void {
        // Skip in testing environment
        if (process.env.NODE_ENV === 'test') return;

        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        // Perform first backup check 5 minutes after server start to let system boot cleanly
        setTimeout(() => {
            this.runDatabaseBackup().catch((err) => {
                console.warn('[Backup] Scheduled backup task encountered an error:', err);
            });
        }, 5 * 60 * 1000);

        // Schedule recurring daily backup every 24 hours
        setInterval(() => {
            this.runDatabaseBackup().catch((err) => {
                console.warn('[Backup] Scheduled daily backup task encountered an error:', err);
            });
        }, TWENTY_FOUR_HOURS);

        console.log('⏰ Automated daily database backup scheduler initialized (24h frequency).');
    }
}
