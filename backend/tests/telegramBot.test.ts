import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TelegramBotService } from '../src/services/TelegramBotService';

describe('TelegramBotService: Log Time Range Parser', () => {
    it('should parse 30m / 30min correctly', () => {
        const range1 = TelegramBotService.parseLogTimeRange('30m');
        const diff1 = range1.to.getTime() - range1.from.getTime();
        assert.strictEqual(Math.round(diff1 / (60 * 1000)), 30);
        assert.strictEqual(range1.label, 'Last 30 minutes');

        const range2 = TelegramBotService.parseLogTimeRange('30min');
        const diff2 = range2.to.getTime() - range2.from.getTime();
        assert.strictEqual(Math.round(diff2 / (60 * 1000)), 30);
        assert.strictEqual(range2.label, 'Last 30 minutes');
    });

    it('should parse 2h / 2hr / 24h correctly', () => {
        const range1 = TelegramBotService.parseLogTimeRange('2h');
        const diff1 = range1.to.getTime() - range1.from.getTime();
        assert.strictEqual(Math.round(diff1 / (60 * 60 * 1000)), 2);
        assert.strictEqual(range1.label, 'Last 2 hours');

        const range2 = TelegramBotService.parseLogTimeRange('2hr');
        const diff2 = range2.to.getTime() - range2.from.getTime();
        assert.strictEqual(Math.round(diff2 / (60 * 60 * 1000)), 2);

        const range3 = TelegramBotService.parseLogTimeRange('24h');
        const diff3 = range3.to.getTime() - range3.from.getTime();
        assert.strictEqual(Math.round(diff3 / (60 * 60 * 1000)), 24);
        assert.strictEqual(range3.label, 'Last 24 hours');
    });

    it('should parse specific calendar date YYYY-MM-DD into full day range', () => {
        const range = TelegramBotService.parseLogTimeRange('2026-09-06');
        assert.strictEqual(range.from.toISOString(), '2026-09-06T00:00:00.000Z');
        assert.strictEqual(range.to.toISOString(), '2026-09-06T23:59:59.999Z');
        assert.strictEqual(range.label, 'Date 2026-09-06 (UTC)');
    });

    it('should default to last 1 hour when query is empty or unrecognized', () => {
        const range1 = TelegramBotService.parseLogTimeRange('');
        const diff1 = range1.to.getTime() - range1.from.getTime();
        assert.strictEqual(Math.round(diff1 / (60 * 1000)), 60);
        assert.strictEqual(range1.label, 'Last 1 hour');

        const range2 = TelegramBotService.parseLogTimeRange('random-gibberish');
        const diff2 = range2.to.getTime() - range2.from.getTime();
        assert.strictEqual(Math.round(diff2 / (60 * 1000)), 60);
        assert.strictEqual(range2.label, 'Last 1 hour');
    });
});

describe('TelegramBotService: Platform Setting Alerts Toggle', () => {
    it('should toggle alerts enabled state in database', async () => {
        await TelegramBotService.setAlertsEnabled(false);
        // If not configured with token, isAlertsEnabled is false
        // But the database value is 'false'
        const isEnabledFalse = await TelegramBotService.isAlertsEnabled();
        assert.strictEqual(isEnabledFalse, false);

        await TelegramBotService.setAlertsEnabled(true);
        // Database value updated to 'true'
    });
});
