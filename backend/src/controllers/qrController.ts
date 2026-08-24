import { Request, Response, NextFunction } from 'express';
import { qrService } from '../services/QRService';

export const getQRCodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const codes = await qrService.getQRCodes(req.user!.restaurantId!);
        res.json(codes);
    } catch (error) {
        next(error);
    }
};

export const ensureQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const code = await qrService.ensureQRCode(req.user!.restaurantId!);
        res.json(code);
    } catch (error) {
        next(error);
    }
};

export const deleteQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await qrService.deleteQRCode(req.user!.restaurantId!, req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
