import { Router, Request, Response } from 'express';
import { config } from '../config/env';
import { TelegramBotService } from '../services/TelegramBotService';

const router = Router();

/**
 * Webhook endpoint called by Telegram servers when an authorized admin messages the bot
 */
router.post('/webhook', (req: Request, res: Response) => {
    // 1. Verify secret token if configured
    if (config.telegramWebhookSecret) {
        const receivedSecret = req.get('X-Telegram-Bot-Api-Secret-Token');
        if (receivedSecret !== config.telegramWebhookSecret) {
            console.warn('⚠️ [Telegram Webhook] Unauthorized request: secret token mismatch');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
    }

    // 2. Immediately respond 200 OK to Telegram servers
    res.status(200).json({ ok: true });

    // 3. Asynchronously handle the incoming command/update
    TelegramBotService.handleIncomingUpdate(req.body).catch((err) => {
        console.error('⚠️ [Telegram Webhook] Error processing update:', err);
    });
});

export default router;
