import multer from 'multer';
import { config } from '../config/env';
import { createError } from './errorHandler';

// Use memoryStorage so untrusted uploaded files are never written directly to disk
const storage = multer.memoryStorage();

const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
    'image/x-webp',
    'image/heic',
    'image/heic-sequence',
    'image/heif',
    'image/heif-sequence',
    'application/octet-stream', // Some mobile browsers upload .heic as application/octet-stream
];

const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const mime = file.mimetype.toLowerCase();
    const isExtensionAllowed = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.originalname);

    // Initial coarse MIME & extension filter (rigorous magic-byte inspection follows in ImageProcessor)
    if (allowedMimeTypes.includes(mime) || isExtensionAllowed) {
        cb(null, true);
    } else {
        cb(createError('Unsupported file type. Allowed formats: JPEG, PNG, WebP, HEIC/HEIF.', 400));
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: config.maxFileSize, // 5MB limit
        files: 1, // Single file per upload endpoint
    },
    fileFilter,
});
