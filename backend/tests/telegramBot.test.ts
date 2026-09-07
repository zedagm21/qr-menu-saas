import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TelegramBotService } from '../src/services/TelegramBotService';
import { BackupService } from '../src/services/BackupService';

describe('TelegramBotService: Log Time Range Parser', () => {
    it('should parse 10m / 10min / 10 bare number correctly', () => {
        const range1 = TelegramBotService.parseLogTimeRange('10m');
        const diff1 = range1.to.getTime() - range1.from.getTime();
        assert.strictEqual(Math.round(diff1 / (60 * 1000)), 10);
        assert.strictEqual(range1.label, 'Last 10 minutes');

        const range2 = TelegramBotService.parseLogTimeRange('10min');
        const diff2 = range2.to.getTime() - range2.from.getTime();
        assert.strictEqual(Math.round(diff2 / (60 * 1000)), 10);
        assert.strictEqual(range2.label, 'Last 10 minutes');

        const range3 = TelegramBotService.parseLogTimeRange('10 mins');
        const diff3 = range3.to.getTime() - range3.from.getTime();
        assert.strictEqual(Math.round(diff3 / (60 * 1000)), 10);
        assert.strictEqual(range3.label, 'Last 10 minutes');

        const range4 = TelegramBotService.parseLogTimeRange('10');
        const diff4 = range4.to.getTime() - range4.from.getTime();
        assert.strictEqual(Math.round(diff4 / (60 * 1000)), 10);
        assert.strictEqual(range4.label, 'Last 10 minutes');
    });

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

describe('TelegramBotService: Interactive Pending Actions & Command Resolution', () => {
    it('should set and clear pending actions for chat IDs', () => {
        const testChatId = 'test-chat-123';
        TelegramBotService.clearPendingAction(testChatId);
        assert.strictEqual(TelegramBotService.getPendingAction(testChatId), undefined);

        TelegramBotService.setPendingAction(testChatId, 'find');
        const pending = TelegramBotService.getPendingAction(testChatId);
        assert.ok(pending);
        assert.strictEqual(pending.action, 'find');

        TelegramBotService.setPendingAction(testChatId, 'log');
        TelegramBotService.setPendingAction(testChatId, 'backup');
        const pendingBackup = TelegramBotService.getPendingAction(testChatId);
        assert.ok(pendingBackup);
        assert.strictEqual(pendingBackup.action, 'backup');

        TelegramBotService.clearPendingAction(testChatId);
        assert.strictEqual(TelegramBotService.getPendingAction(testChatId), undefined);
    });

    it('should resolve commands with or without leading slash', () => {
        // Slash commands
        assert.deepStrictEqual(TelegramBotService.resolveCommand('/stats'), { command: '/stats', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('/log 10m'), { command: '/log', args: ['10m'] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('/find Lucy'), { command: '/find', args: ['Lucy'] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('/cancel'), { command: '/cancel', args: [] });

        // Plain command keywords without slash
        assert.deepStrictEqual(TelegramBotService.resolveCommand('stats'), { command: '/stats', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('overview'), { command: '/overview', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('top'), { command: '/top', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('help'), { command: '/help', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('cancel'), { command: '/cancel', args: [] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('log 10m'), { command: '/log', args: ['10m'] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('find Lucy'), { command: '/find', args: ['Lucy'] });
        assert.deepStrictEqual(TelegramBotService.resolveCommand('backup'), { command: '/backup', args: [] });

        // Non-command user inputs
        assert.strictEqual(TelegramBotService.resolveCommand('Lucy'), null);
        assert.strictEqual(TelegramBotService.resolveCommand('10m'), null);
        assert.strictEqual(TelegramBotService.resolveCommand('bole-bistro'), null);
        assert.strictEqual(TelegramBotService.resolveCommand(''), null);
    });
});

describe('TelegramBotService: Platform Setting Alerts Toggle', () => {
    it('should toggle alerts enabled state in database', async () => {
        await TelegramBotService.setAlertsEnabled(false);
        const isEnabledFalse = await TelegramBotService.isAlertsEnabled();
        assert.strictEqual(isEnabledFalse, false);

        await TelegramBotService.setAlertsEnabled(true);
    });
});

describe('BackupService: Database Dump Generation', () => {
    it('should generate a valid compressed dump buffer and filename', async () => {
        const dump = await BackupService.generateDatabaseDump();
        assert.ok(dump.buffer instanceof Buffer);
        assert.ok(dump.buffer.length > 0);
        assert.ok(dump.fileName.startsWith('ourmenu-backup-'));
        assert.ok(dump.fileName.endsWith('.gz'));
    });
});
