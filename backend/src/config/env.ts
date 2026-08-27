import dotenv from 'dotenv';
dotenv.config();

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'change-cookie-secret',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    isProduction: process.env.NODE_ENV === 'production',

    // Cloudflare R2 / S3 Object Storage Configuration
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    cloudflareAccessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
    cloudflareSecretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
    cloudflareR2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
    cloudflareR2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || '',
    cloudflareR2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '',

    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    // SMTP Email Configuration (Gmail SMTP / Brevo / Custom)
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@qrmenu.app',

    // Super Admin bootstrap emails
    superAdminEmails: (process.env.SUPER_ADMIN_EMAILS || 'admin@bluenile.et')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
};
