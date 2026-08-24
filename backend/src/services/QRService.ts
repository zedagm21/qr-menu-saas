import prisma from '../config/database';
import { createError } from '../middleware/errorHandler';
import { config } from '../config/env';

export class QRService {
    getMenuUrl(slug: string): string {
        return `${config.appUrl}/r/${slug}`;
    }

    async getQRCodes(restaurantId: string) {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) throw createError('Restaurant not found', 404);

        const codes = await prisma.qRCode.findMany({
            where: { restaurantId },
            orderBy: { createdAt: 'asc' },
        });

        return codes.map((code) => ({
            ...code,
            targetUrl: this.getMenuUrl(restaurant.slug),
        }));
    }

    async ensureQRCode(restaurantId: string) {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) throw createError('Restaurant not found', 404);

        let qrCode = await prisma.qRCode.findFirst({ where: { restaurantId } });

        if (!qrCode) {
            qrCode = await prisma.qRCode.create({
                data: {
                    restaurantId,
                    name: 'Main QR',
                    isActive: true,
                },
            });
        }

        return {
            ...qrCode,
            targetUrl: this.getMenuUrl(restaurant.slug),
        };
    }

    async deleteQRCode(restaurantId: string, qrCodeId: string) {
        const qr = await prisma.qRCode.findUnique({ where: { id: qrCodeId } });
        if (!qr || qr.restaurantId !== restaurantId) {
            throw createError('QR code not found', 404);
        }
        return prisma.qRCode.delete({ where: { id: qrCodeId } });
    }
}

export const qrService = new QRService();
