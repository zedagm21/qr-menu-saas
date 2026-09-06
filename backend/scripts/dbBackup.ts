import { BackupService } from '../src/services/BackupService';

// Allow direct execution via CLI: ts-node scripts/dbBackup.ts (or npm run db:backup)
if (require.main === module) {
    BackupService.runDatabaseBackup()
        .then((key) => {
            if (key) console.log(`[Backup] Backup completed successfully: ${key}`);
            process.exit(0);
        })
        .catch((err) => {
            console.error('[Backup] Backup failed:', err);
            process.exit(1);
        });
}

export { BackupService };
