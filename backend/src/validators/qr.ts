import { z } from 'zod';

export const createQRCodeSchema = z.object({
    name: z.string().min(1).max(100).optional().default('Main QR'),
});

export const qrCodeIdSchema = z.object({
    id: z.string().cuid({ message: 'Invalid QR code ID' }),
});

export type CreateQRCodeInput = z.infer<typeof createQRCodeSchema>;
