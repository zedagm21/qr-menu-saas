import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    data?: any;
}

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Handle Multer upload errors cleanly
    if (err instanceof multer.MulterError || err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size exceeds the maximum allowed limit of 5MB.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field in upload request.';
        }
        res.status(400).json({ error: message });
        return;
    }

    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const isUnexpected = !err?.isOperational || statusCode >= 500;
    const message = isUnexpected ? 'Internal server error' : (err?.message || 'Error occurred');

    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    } else if (isUnexpected) {
        console.error('Unhandled server error:', err);
    }

    res.status(statusCode).json({
        error: message,
        ...((!isUnexpected || process.env.NODE_ENV === 'development') && err?.data && { data: err.data }),
        ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
    });
};

export const createError = (message: string, statusCode: number, data?: any): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    error.data = data;
    return error;
};
