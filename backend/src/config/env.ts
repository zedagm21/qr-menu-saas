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
};
