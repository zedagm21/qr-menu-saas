import { config } from '../config/env';
import prisma from '../config/database';
import { adminService } from './AdminService';
import { BackupService } from './BackupService';

interface ErrorAlertParams {
    statusCode?: number | null;
    message: string;
    path?: string | null;
    method?: string | null;
    stack?: string | null;
    userId?: string | null;
    restaurantId?: string | null;
    source?: string;
    metadata?: any;
}

export class TelegramBotService {
    private static errorDebounceMap = new Map<string, { count: number; firstSeen: number; lastAlert: number }>();
    private static isNightlyScheduled = false;
    private static pendingActionMap = new Map<string, { action: 'find' | 'log' | 'backup'; timestamp: number }>();

    /**
     * Get active pending action for a chat ID
     */
    static getPendingAction(chatId: string): { action: 'find' | 'log' | 'backup'; timestamp: number } | undefined {
        return this.pendingActionMap.get(chatId);
    }

    /**
     * Set active pending action for a chat ID
     */
    static setPendingAction(chatId: string, action: 'find' | 'log' | 'backup'): void {
        this.pendingActionMap.set(chatId, { action, timestamp: Date.now() });
    }

    /**
     * Clear active pending action for a chat ID
     */
    static clearPendingAction(chatId: string): void {
        this.pendingActionMap.delete(chatId);
    }

    /**
     * Resolves incoming text into a recognized command and argument array.
     * Supports slash-prefixed commands (/stats, /log, etc.) as well as plain command keywords.
     */
    static resolveCommand(text: string): { command: string; args: string[] } | null {
        const trimmed = (text || '').trim();
        if (!trimmed) return null;

        const parts = trimmed.split(/\s+/);
        const rawFirst = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Slash-prefixed command: e.g. /stats, /log, /find, /cancel
        if (rawFirst.startsWith('/')) {
            return { command: rawFirst, args };
        }

        // Plain command keyword map without leading slash
        const commandKeywords: Record<string, string> = {
            start: '/start',
            help: '/help',
            cancel: '/cancel',
            stats: '/stats',
            overview: '/overview',
            top: '/top',
            find: '/find',
            log: '/log',
            logs: '/logs',
            backup: '/backup',
        };

        if (commandKeywords[rawFirst]) {
            return { command: commandKeywords[rawFirst], args };
        }

        return null;
    }

    /**
     * Checks whether the Telegram Bot has been configured with token and allowed admin chat IDs
     */
    static isConfigured(): boolean {
        return Boolean(config.telegramBotToken && config.telegramAdminChatIds.length > 0);
    }

    /**
     * Checks database setting `telegram_bot_enabled` to determine if outbound alerts are active
     */
    static async isAlertsEnabled(): Promise<boolean> {
        if (!this.isConfigured()) return false;
        try {
            const setting = await prisma.platformSetting.findUnique({
                where: { key: 'telegram_bot_enabled' },
            });
            if (!setting) return true;
            return setting.value.toLowerCase() === 'true';
        } catch {
            return true;
        }
    }

    /**
     * Toggle alerts on or off from the Admin Portal
     */
    static async setAlertsEnabled(enabled: boolean): Promise<boolean> {
        await prisma.platformSetting.upsert({
            where: { key: 'telegram_bot_enabled' },
            update: { value: enabled ? 'true' : 'false' },
            create: { key: 'telegram_bot_enabled', value: enabled ? 'true' : 'false' },
        });
        return enabled;
    }

    /**
     * Initialize webhook registration with Telegram API on production boot
     */
    static async initWebhook(appUrl: string): Promise<void> {
        if (!this.isConfigured() || !appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
            return;
        }

        const cleanBaseUrl = (appUrl || '').replace(/\/+$/, '').replace(/\/api$/, '');
        const webhookUrl = `${cleanBaseUrl}/api/telegram/webhook`;
        try {
            console.log(`🤖 [TelegramBotService] Registering webhook: ${webhookUrl}`);
            const body: Record<string, any> = { url: webhookUrl };
            if (config.telegramWebhookSecret) {
                body.secret_token = config.telegramWebhookSecret;
            }

            const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json() as { ok: boolean; description?: string };
            if (data.ok) {
                console.log('✅ [TelegramBotService] Webhook successfully registered with Telegram');
            } else {
                console.warn('⚠️ [TelegramBotService] Webhook registration warning:', data.description);
            }
        } catch (error) {
            console.error('⚠️ [TelegramBotService] Failed to register Telegram webhook:', error);
        }
    }

    /**
     * Send a formatted HTML text message to a specific Telegram chat
     */
    static async sendMessage(chatId: string, text: string, extra?: Record<string, any>): Promise<{ ok: boolean; description?: string }> {
        if (!config.telegramBotToken) return { ok: false, description: 'Telegram bot token is not configured' };
        try {
            const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    ...extra,
                }),
            });
            const data = await res.json() as { ok: boolean; description?: string };
            if (!data.ok) {
                console.warn(`⚠️ [TelegramBotService] Send failed to ${chatId}:`, data.description);
            }
            return { ok: data.ok, description: data.description };
        } catch (err: any) {
            console.error(`⚠️ [TelegramBotService] Network error sending to ${chatId}:`, err);
            return { ok: false, description: err?.message || 'Network error' };
        }
    }

    /**
     * Send a document (.log or .txt file) attachment to a specific Telegram chat
     */
    static async sendDocument(chatId: string, filename: string, content: string | Buffer, caption?: string): Promise<boolean> {
        if (!config.telegramBotToken) return false;
        try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            const mimeType = filename.endsWith('.gz') ? 'application/gzip' : 'text/plain';
            const blob = new Blob([content], { type: mimeType });
            formData.append('document', blob, filename);
            if (caption) {
                formData.append('caption', caption);
                formData.append('parse_mode', 'HTML');
            }

            const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendDocument`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json() as { ok: boolean; description?: string };
            return data.ok;
        } catch (err) {
            console.error(`⚠️ [TelegramBotService] Document upload failed to ${chatId}:`, err);
            return false;
        }
    }

    /**
     * Broadcast a message to all allowlisted admin chat IDs (if alerts are enabled)
     */
    static async broadcastToAdmins(text: string, force = false): Promise<{ successful: number; total: number; failures: string[] }> {
        if (!this.isConfigured()) return { successful: 0, total: 0, failures: ['Bot not configured'] };
        if (!force) {
            const enabled = await this.isAlertsEnabled();
            if (!enabled) return { successful: 0, total: 0, failures: ['Alerts disabled'] };
        }

        const results = await Promise.allSettled(
            config.telegramAdminChatIds.map((chatId) => this.sendMessage(chatId, text))
        );

        const failures: string[] = [];
        let successful = 0;

        results.forEach((r, idx) => {
            const chatId = config.telegramAdminChatIds[idx];
            if (r.status === 'fulfilled') {
                if (r.value.ok) {
                    successful++;
                } else {
                    failures.push(`Chat ${chatId}: ${r.value.description || 'Unknown error'}`);
                }
            } else {
                failures.push(`Chat ${chatId}: ${r.reason?.message || 'Network error'}`);
            }
        });

        return { successful, total: config.telegramAdminChatIds.length, failures };
    }

    /**
     * Broadcast a file document attachment to all allowlisted admin chat IDs
     */
    static async broadcastDocumentToAdmins(filename: string, content: string | Buffer, caption?: string): Promise<void> {
        if (!this.isConfigured()) return;
        const enabled = await this.isAlertsEnabled();
        if (!enabled) return;

        await Promise.allSettled(
            config.telegramAdminChatIds.map((chatId) => this.sendDocument(chatId, filename, content, caption))
        );
    }

    // ─── Real-Time Push Alerts ──────────────────────────────────────────────────

    /**
     * Dispatches intelligent debounced 500 / fatal crash alerts
     */
    static async sendErrorAlert(params: ErrorAlertParams): Promise<void> {
        if (!this.isConfigured()) return;
        const enabled = await this.isAlertsEnabled();
        if (!enabled) return;

        const errorKey = `${params.statusCode || 500}_${params.path || ''}_${(params.message || '').slice(0, 100)}`;
        const now = Date.now();
        const existing = this.errorDebounceMap.get(errorKey);

        if (existing) {
            existing.count++;
            // Alert again only after 5 minutes has elapsed since the first occurrence
            if (now - existing.lastAlert < 5 * 60 * 1000) {
                return;
            }
            // 5 minutes reached: notify with aggregated frequency count
            const text = [
                `🚨 <b>CRITICAL REPEAT INCIDENT (${existing.count}x in 5m)</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `<b>Error:</b> <code>${this.escapeHtml(params.message)}</code>`,
                `<b>Status:</b> <code>${params.statusCode || 500}</code>`,
                params.path ? `<b>Path:</b> <code>${params.method || 'GET'} ${params.path}</code>` : null,
                `<b>Repeats:</b> ${existing.count} total occurrences`,
                `🔗 <a href="${config.frontendUrl}/admin/logs">Inspect in Admin Diagnostics</a>`,
            ].filter(Boolean).join('\n');

            this.errorDebounceMap.set(errorKey, { count: 0, firstSeen: now, lastAlert: now });
            await this.broadcastToAdmins(text);
            return;
        }

        // First time seeing this error: register and alert immediately
        this.errorDebounceMap.set(errorKey, { count: 1, firstSeen: now, lastAlert: now });

        const stackSnippet = params.stack
            ? params.stack.split('\n').slice(0, 4).join('\n').slice(0, 400)
            : null;

        const text = [
            `🚨 <b>SYSTEM INTERNAL ERROR (500)</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `<b>Message:</b> <code>${this.escapeHtml(params.message)}</code>`,
            params.path ? `<b>Endpoint:</b> <code>${params.method || 'GET'} ${params.path}</code>` : null,
            `<b>Status Code:</b> <code>${params.statusCode || 500}</code>`,
            params.userId ? `<b>User ID:</b> <code>${params.userId}</code>` : null,
            params.restaurantId ? `<b>Restaurant ID:</b> <code>${params.restaurantId}</code>` : null,
            stackSnippet ? `\n<pre>${this.escapeHtml(stackSnippet)}</pre>` : null,
            `\n🔗 <a href="${config.frontendUrl}/admin/logs">Open Admin Diagnostics</a>`,
        ].filter(Boolean).join('\n');

        await this.broadcastToAdmins(text);
    }

    /**
     * Database crash or connection timeout alert
     */
    static async sendDatabaseFailureAlert(details: { message: string; endpoint?: string; stack?: string | null }): Promise<void> {
        const text = [
            `💥 <b>DATABASE OUTAGE / CRITICAL FAILURE</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `<b>Failure:</b> <code>${this.escapeHtml(details.message)}</code>`,
            details.endpoint ? `<b>Trigger Endpoint:</b> <code>${details.endpoint}</code>` : null,
            `<b>Timestamp:</b> <code>${new Date().toISOString()}</code>`,
            `\n⚠️ <i>PostgreSQL connection or transaction failed. Database may be inaccessible.</i>`,
            `🔗 <a href="${config.frontendUrl}/admin/logs">View System Logs</a>`,
        ].filter(Boolean).join('\n');

        await this.broadcastToAdmins(text);
    }

    /**
     * Client-side UI error alert ("Unexpected Application Error" / React crash)
     */
    static async sendClientCrashAlert(details: { message: string; url?: string; userAgent?: string; userId?: string | null; stack?: string | null }): Promise<void> {
        const text = [
            `📱 <b>UI CLIENT CRASH ALERT</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `<b>User Hit Error:</b> <code>${this.escapeHtml(details.message)}</code>`,
            details.url ? `<b>Page URL:</b> <code>${details.url}</code>` : null,
            details.userId ? `<b>User ID:</b> <code>${details.userId}</code>` : null,
            details.userAgent ? `<b>Device:</b> <code>${this.escapeHtml(details.userAgent.slice(0, 100))}</code>` : null,
            `\n🔗 <a href="${config.frontendUrl}/admin/logs?source=FRONTEND">View Frontend Errors</a>`,
        ].filter(Boolean).join('\n');

        await this.broadcastToAdmins(text);
    }

    /**
     * Server boot / deployment schema sync failure alert
     */
    static async sendDeploymentAlert(details: { error: string; details?: string }): Promise<void> {
        const text = [
            `🚨 <b>DEPLOYMENT / BOOT INTEGRITY FAILURE</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `<b>Error:</b> <code>${this.escapeHtml(details.error)}</code>`,
            details.details ? `<b>Details:</b> <code>${this.escapeHtml(details.details)}</code>` : null,
            `<b>Time:</b> <code>${new Date().toISOString()}</code>`,
            `\n⚠️ <i>Server startup schema verification encountered an issue.</i>`,
        ].filter(Boolean).join('\n');

        await this.broadcastToAdmins(text, true); // Force delivery even if setting is paused
    }

    /**
     * Daily backup result alert (Cloudflare R2)
     */
    static async sendBackupAlert(result: { success: boolean; key?: string; sizeBytes?: number; error?: string }): Promise<void> {
        const sizeMb = result.sizeBytes ? (result.sizeBytes / (1024 * 1024)).toFixed(2) : '0';
        const text = result.success
            ? [
                `💾 <b>DATABASE BACKUP SUCCESSFUL</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `<b>Status:</b> ✅ Snapshot uploaded to Cloudflare R2`,
                `<b>File:</b> <code>${result.key}</code>`,
                `<b>Size:</b> ${sizeMb} MB`,
                `<b>Timestamp:</b> <code>${new Date().toISOString()}</code>`,
            ].join('\n')
            : [
                `⚠️ <b>DATABASE BACKUP FAILED</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `<b>Status:</b> ❌ Backup process failed`,
                `<b>Error:</b> <code>${this.escapeHtml(result.error || 'Unknown error')}</code>`,
                `<b>Timestamp:</b> <code>${new Date().toISOString()}</code>`,
                `\n🔗 <a href="${config.frontendUrl}/admin/logs">Inspect Diagnostics</a>`,
            ].join('\n');

        await this.broadcastToAdmins(text);
    }

    /**
     * New restaurant onboarding completion alert
     */
    static async sendSignupAlert(restaurant: { id: string; name: string; slug?: string | null; city?: string | null }, owner?: { email?: string; name?: string }): Promise<void> {
        const liveMenuUrl = restaurant.slug ? `${config.frontendUrl}/r/${restaurant.slug}` : null;
        const text = [
            `🎉 <b>NEW RESTAURANT ACTIVATED!</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `🏪 <b>Name:</b> <b>${this.escapeHtml(restaurant.name)}</b>`,
            restaurant.slug ? `🔗 <b>Handle:</b> <code>/r/${restaurant.slug}</code>` : null,
            restaurant.city ? `📍 <b>City:</b> ${this.escapeHtml(restaurant.city)}` : null,
            owner?.name ? `👤 <b>Owner:</b> ${this.escapeHtml(owner.name)}` : null,
            owner?.email ? `✉️ <b>Email:</b> <code>${owner.email}</code>` : null,
            `\n${liveMenuUrl ? `🌐 <a href="${liveMenuUrl}">View Live Menu</a> | ` : ''}<a href="${config.frontendUrl}/admin/restaurants">Admin Access</a>`,
        ].filter(Boolean).join('\n');

        await this.broadcastToAdmins(text);
    }

    /**
     * Nightly Performance Digest (21:00 EAT / 18:00 UTC)
     */
    static async sendNightlyDigest(): Promise<void> {
        try {
            const metrics = await adminService.getOverviewMetrics();
            const topRestaurants = metrics.topRestaurants || [];

            const topLines = topRestaurants.slice(0, 3).map((r, i) => {
                return `  ${i + 1}. <b>${this.escapeHtml(r.name)}</b> — ${r.scans || 0} scans`;
            }).join('\n');

            const text = [
                `🌙 <b>OURMENU NIGHTLY EXECUTIVE DIGEST</b>`,
                `📅 <b>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `📊 <b>Today's Diners & Scans:</b> <b>${metrics.scans.today.toLocaleString()}</b>`,
                `📈 <b>Last 7 Days Scans:</b> <b>${metrics.scans.week.toLocaleString()}</b>`,
                `🏪 <b>Active Menus:</b> ${metrics.restaurants.published} live (${metrics.restaurants.total} total)`,
                `👥 <b>Total Accounts:</b> ${metrics.users.total} (${metrics.users.verified} verified)`,
                `\n🏆 <b>Top Restaurants Today:</b>`,
                topLines || '  <i>No scan activity logged today</i>',
                `\n━━━━━━━━━━━━━━━━━━━━━`,
                `🔗 <a href="${config.frontendUrl}/admin">Open Executive Dashboard</a>`,
            ].join('\n');


            await this.broadcastToAdmins(text);
        } catch (err) {
            console.error('⚠️ [TelegramBotService] Failed to compile nightly digest:', err);
        }
    }

    /**
     * Start the automated daily scheduler for Nightly Digest at 21:00 EAT (18:00 UTC)
     */
    static startNightlyScheduler(): void {
        if (this.isNightlyScheduled) return;
        this.isNightlyScheduled = true;

        setInterval(() => {
            const now = new Date();
            // Check if current UTC time is 18:00 (which is 21:00 EAT) and minute is 0
            if (now.getUTCHours() === 18 && now.getUTCMinutes() === 0) {
                this.sendNightlyDigest().catch(() => {});
            }
        }, 60 * 1000); // Check once per minute
    }

    // ─── Interactive Two-Way Command Handler ────────────────────────────────────

    /**
     * Ingests incoming Telegram webhook update and executes commands
     */
    static async handleIncomingUpdate(update: any): Promise<void> {
        // 1. Handle Inline Keyboard button callback queries
        if (update?.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = String(callbackQuery.message?.chat?.id || callbackQuery.from?.id || '');
            const data = callbackQuery.data?.trim();

            if (config.telegramBotToken && callbackQuery.id) {
                fetch(`https://api.telegram.org/bot${config.telegramBotToken}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
                }).catch(() => {});
            }

            if (!chatId || !data) return;

            const isAuthorized = config.telegramAdminChatIds.includes(chatId);
            if (!isAuthorized) {
                await this.sendMessage(
                    chatId,
                    `⛔ <b>Access Denied</b>\n\nYour Telegram ID <code>${chatId}</code> is not on the OurMenu admin allowlist.`
                );
                return;
            }

            await this.handleIncomingUpdate({
                message: {
                    chat: { id: chatId },
                    text: data,
                },
            });
            return;
        }

        const message = update?.message;
        if (!message || !message.text) return;

        const chatId = String(message.chat?.id || '');
        const text = message.text.trim();

        // 2. Security Allowlist Check
        const isAuthorized = config.telegramAdminChatIds.includes(chatId);
        if (!isAuthorized) {
            await this.sendMessage(
                chatId,
                `⛔ <b>Access Denied</b>\n\nYour Telegram ID <code>${chatId}</code> is not on the OurMenu admin allowlist.\nContact the platform administrator to add this ID to <code>TELEGRAM_ADMIN_CHAT_IDS</code>.`
            );
            return;
        }

        // Check if there is an active pending action for this chat (valid for 10 minutes)
        const pending = this.pendingActionMap.get(chatId);
        const isStale = pending && (Date.now() - pending.timestamp > 10 * 60 * 1000);
        if (isStale) {
            this.pendingActionMap.delete(chatId);
        }

        // 3. Resolve command (slash-commands or recognized command keywords)
        const recognized = this.resolveCommand(text);

        if (recognized) {
            const { command, args } = recognized;
            const hadPending = Boolean(pending && !isStale);
            // Any recognized command entered cancels any existing pending prompt and proceeds to execute
            this.pendingActionMap.delete(chatId);

            switch (command) {
                case '/start':
                case '/help':
                    await this.handleHelpCommand(chatId);
                    break;

                case '/cancel':
                    if (hadPending) {
                        await this.sendMessage(chatId, '🚫 Action cancelled.');
                    } else {
                        await this.sendMessage(chatId, 'ℹ️ No active command to cancel.');
                    }
                    break;

                case '/stats':
                case '/overview':
                    await this.handleStatsCommand(chatId);
                    break;

                case '/top':
                    await this.handleTopCommand(chatId);
                    break;

                case '/find': {
                    const query = args.join(' ').trim();
                    if (!query) {
                        this.pendingActionMap.set(chatId, { action: 'find', timestamp: Date.now() });
                        await this.sendMessage(
                            chatId,
                            `🔍 <b>Restaurant Search</b>\n━━━━━━━━━━━━━━━━━━━━━\nPlease reply with the <b>restaurant name</b> or <b>URL handle/slug</b> to search.\n\n<i>Example: <code>Lucy</code> or <code>bole-bistro</code>\n(Type /cancel or another command to dismiss)</i>`
                        );
                        return;
                    }
                    await this.handleFindCommand(chatId, query);
                    break;
                }

                case '/log':
                case '/logs': {
                    const query = args.join(' ').trim();
                    if (!query) {
                        this.pendingActionMap.set(chatId, { action: 'log', timestamp: Date.now() });
                        await this.sendMessage(
                            chatId,
                            [
                                `📄 <b>System Diagnostics Logs</b>`,
                                `━━━━━━━━━━━━━━━━━━━━━`,
                                `Please select or reply with a time window:`,
                                ``,
                                `⏱️ <b>Available Options:</b>`,
                                `• <code>10m</code> — Last 10 minutes`,
                                `• <code>30m</code> — Last 30 minutes`,
                                `• <code>1h</code> or <code>2h</code> — Last 1 or 2 hours`,
                                `• <code>24h</code> or <code>1d</code> — Last 24 hours (1 day)`,
                                `• <code>YYYY-MM-DD</code> — Specific date (e.g. <code>${new Date().toISOString().slice(0, 10)}</code>)`,
                                ``,
                                `<i>Tap an option below, reply with a time window, or type /cancel to dismiss.</i>`,
                            ].join('\n'),
                            {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: '⏱️ 10 min', callback_data: '/log 10m' },
                                            { text: '⏱️ 30 min', callback_data: '/log 30m' },
                                            { text: '🕐 1 hour', callback_data: '/log 1h' },
                                        ],
                                        [
                                            { text: '🕒 2 hours', callback_data: '/log 2h' },
                                            { text: '📅 24 hours', callback_data: '/log 24h' },
                                        ],
                                    ],
                                },
                            }
                        );
                        return;
                    }
                    await this.handleLogCommand(chatId, query);
                    break;
                }

                case '/backup': {
                    const subCommand = args[0]?.toLowerCase();

                    // If already confirmed directly (e.g. "/backup confirm" or inline button callback)
                    if (subCommand === 'confirm' || subCommand === 'yes') {
                        await this.executeTelegramBackup(chatId);
                        break;
                    }

                    // Prompt for confirmation before generating backup
                    this.pendingActionMap.set(chatId, { action: 'backup', timestamp: Date.now() });
                    await this.sendMessage(
                        chatId,
                        [
                            `💾 <b>Database Backup Confirmation</b>`,
                            `━━━━━━━━━━━━━━━━━━━━━`,
                            `Are you sure you want to generate a full database backup now?`,
                            ``,
                            `📦 <i>A compressed snapshot (.sql.gz or .json.gz) will be created and sent directly to this Telegram chat.</i>`,
                            `☁️ <i>Note: Automated Cloudflare R2 backups run on the daily schedule.</i>`,
                            ``,
                            `<i>Tap a button below or reply with confirm / cancel.</i>`,
                        ].join('\n'),
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '✅ Confirm Backup', callback_data: '/backup confirm' },
                                        { text: '❌ Cancel', callback_data: '/cancel' },
                                    ],
                                ],
                            },
                        }
                    );
                    break;
                }

                default:
                    await this.sendMessage(
                        chatId,
                        `❓ Unknown command <code>${this.escapeHtml(command)}</code>.\nType /help to see all available admin diagnostic commands.`
                    );
                    break;
            }
            return;
        }

        // 4. Handle Pending User Prompts (Plain text replies without leading slash)
        if (pending && !isStale) {
            this.pendingActionMap.delete(chatId);
            if (pending.action === 'find') {
                await this.handleFindCommand(chatId, text);
                return;
            }
            if (pending.action === 'log') {
                await this.handleLogCommand(chatId, text);
                return;
            }
            if (pending.action === 'backup') {
                const clean = text.toLowerCase().trim();
                if (['confirm', 'yes', 'y', 'proceed', 'ok'].includes(clean)) {
                    await this.executeTelegramBackup(chatId);
                    return;
                }
                if (['cancel', 'no', 'n'].includes(clean)) {
                    await this.sendMessage(chatId, '🚫 Backup cancelled.');
                    return;
                }
                await this.sendMessage(
                    chatId,
                    `⚠️ Please confirm the backup by tapping <b>Confirm Backup</b> or typing <code>confirm</code> (or <code>/cancel</code> to abort).`
                );
                this.pendingActionMap.set(chatId, { action: 'backup', timestamp: Date.now() });
                return;
            }
        }

        // 5. Unrecognized input with no pending action
        await this.sendMessage(
            chatId,
            `❓ Unrecognized input: "<code>${this.escapeHtml(text.slice(0, 50))}</code>".\nType /help to see available commands.`
        );
    }

    // ─── Command Handlers ───────────────────────────────────────────────────────

    private static async handleHelpCommand(chatId: string): Promise<void> {
        const alertsActive = await this.isAlertsEnabled();
        const text = [
            `👑 <b>OurMenu Admin Command Center</b>`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `Status: ${alertsActive ? '🟢 <b>Alerts Active</b>' : '⏸️ <b>Alerts Paused</b>'}`,
            `\n<b>Available Diagnostic Commands:</b>`,
            `📊 /stats — Live overview metrics and diner scans`,
            `🏆 /top — Top 5 restaurants by scan foot traffic`,
            `🔍 /find [name or slug] — Search restaurant profile & owner (prompts if omitted)`,
            `📄 /log [10m|30m|2hr|24h|date] — Extract and download system logs (prompts if omitted)`,
            `💾 /backup — Request database backup archive sent to Telegram (with confirmation)`,
            `🚫 /cancel — Cancel an active prompt or input`,
            `ℹ️ /help — View this reference cheatsheet`,
            `\n<i>Note: Administrative write actions (suspensions, broadcasts) must be performed securely in the <a href="${config.frontendUrl}/admin">Admin Portal</a>.</i>`,
        ].join('\n');

        await this.sendMessage(chatId, text);
    }

    private static async handleStatsCommand(chatId: string): Promise<void> {
        try {
            const metrics = await adminService.getOverviewMetrics();
            const text = [
                `📊 <b>LIVE OPERATIONAL METRICS</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `📱 <b>Diner Scans:</b>`,
                `  • Today: <b>${metrics.scans.today.toLocaleString()}</b>`,
                `  • Last 7 Days: <b>${metrics.scans.week.toLocaleString()}</b>`,
                `  • All-Time: <b>${metrics.scans.total.toLocaleString()}</b>`,
                `\n🏪 <b>Restaurants:</b>`,
                `  • Published & Live: <b>${metrics.restaurants.published}</b>`,
                `  • In Setup / Draft: <b>${metrics.restaurants.draft}</b>`,
                `  • Suspended: <b>${metrics.restaurants.suspended}</b>`,
                `  • Total: <b>${metrics.restaurants.total}</b>`,
                `\n👥 <b>Users:</b>`,
                `  • Total Registered: <b>${metrics.users.total}</b>`,
                `  • Email Verified: <b>${metrics.users.verified}</b>`,
                `\n🍽️ <b>Menu Catalog:</b>`,
                `  • Total Items: <b>${metrics.catalog.totalItems}</b>`,
                `  • Total Categories: <b>${metrics.catalog.totalCategories}</b>`,
                `\n🔗 <a href="${config.frontendUrl}/admin">Open Admin Portal</a>`,
            ].join('\n');

            await this.sendMessage(chatId, text);
        } catch (err) {
            await this.sendMessage(chatId, `❌ Failed to fetch platform metrics: ${err}`);
        }
    }

    private static async handleTopCommand(chatId: string): Promise<void> {
        try {
            const metrics = await adminService.getOverviewMetrics();
            const topRestaurants = metrics.topRestaurants || [];

            if (topRestaurants.length === 0) {
                await this.sendMessage(chatId, `🏆 <b>Top Restaurants:</b> No scan events recorded yet.`);
                return;
            }

            const lines = topRestaurants.map((r, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
                const scans = r.scans || 0;
                return `${medal} <b>${this.escapeHtml(r.name)}</b> (<code>/r/${r.slug}</code>)\n    Scans: <b>${scans.toLocaleString()}</b> | City: ${this.escapeHtml(r.city || 'N/A')}`;
            });


            const text = [
                `🏆 <b>TOP PERFORMING RESTAURANTS</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                ...lines,
                `\n🔗 <a href="${config.frontendUrl}/admin/restaurants">Manage All Restaurants</a>`,
            ].join('\n');

            await this.sendMessage(chatId, text);
        } catch (err) {
            await this.sendMessage(chatId, `❌ Failed to fetch top restaurants: ${err}`);
        }
    }

    private static async handleFindCommand(chatId: string, query: string): Promise<void> {
        if (!query.trim()) {
            await this.sendMessage(chatId, `⚠️ Please provide a restaurant name or handle.\nExample: <code>/find bole-bistro</code> or <code>/find Lucy</code>`);
            return;
        }

        try {
            const restaurants = await prisma.restaurant.findMany({
                where: {
                    OR: [
                        { name: { contains: query.trim(), mode: 'insensitive' } },
                        { slug: { contains: query.trim(), mode: 'insensitive' } },
                    ],
                },
                take: 5,
                include: {
                    users: { select: { email: true, name: true } },
                    _count: { select: { scanEvents: true, menuItems: true } },
                },
            });

            if (restaurants.length === 0) {
                await this.sendMessage(chatId, `🔍 No restaurants found matching: "<b>${this.escapeHtml(query)}</b>"`);
                return;
            }

            const cards = restaurants.map((r) => {
                const owner = r.users[0];
                const statusBadge = r.isSuspended ? '🚫 SUSPENDED' : r.status === 'PUBLISHED' ? '🟢 PUBLISHED' : '📝 DRAFT';
                const liveLink = r.slug ? `<a href="${config.frontendUrl}/r/${r.slug}">Live Menu</a> | ` : '';
                return [
                    `🏪 <b>${this.escapeHtml(r.name || 'Unnamed')}</b> (${statusBadge})`,
                    `  • Handle: <code>/r/${r.slug || 'no-slug'}</code>`,
                    `  • Tier: <b>${r.subscriptionTier}</b>`,
                    `  • Owner: ${owner ? `${this.escapeHtml(owner.name)} (<code>${owner.email}</code>)` : 'None'}`,
                    `  • Scans: <b>${r._count.scanEvents}</b> | Dishes: <b>${r._count.menuItems}</b>`,
                    `  • Actions: ${liveLink}<a href="${config.frontendUrl}/admin/restaurants?search=${encodeURIComponent(r.slug || r.name)}">Edit in Admin</a>`,
                ].join('\n');
            });

            const text = [
                `🔍 <b>Search Results (${restaurants.length})</b>`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                cards.join('\n\n'),
            ].join('\n');

            await this.sendMessage(chatId, text);
        } catch (err) {
            await this.sendMessage(chatId, `❌ Search error: ${err}`);
        }
    }

    /**
     * Parses duration or date arguments for /log command and extracts system logs
     */
    static parseLogTimeRange(query: string): { from: Date; to: Date; label: string } {
        const now = new Date();
        const clean = query.trim().toLowerCase();

        if (!clean) {
            return {
                from: new Date(now.getTime() - 60 * 60 * 1000),
                to: now,
                label: 'Last 1 hour',
            };
        }

        // Match minutes: e.g. "10m", "10min", "10mins", "30m", "45mins"
        const minuteMatch = clean.match(/^(\d+)\s*(m|min|mins|minute|minutes)$/);
        if (minuteMatch) {
            const mins = parseInt(minuteMatch[1], 10);
            return {
                from: new Date(now.getTime() - mins * 60 * 1000),
                to: now,
                label: `Last ${mins} minutes`,
            };
        }

        // Match bare numbers as minutes: e.g. "10", "30"
        const bareNumberMatch = clean.match(/^(\d+)$/);
        if (bareNumberMatch) {
            const mins = parseInt(bareNumberMatch[1], 10);
            return {
                from: new Date(now.getTime() - mins * 60 * 1000),
                to: now,
                label: `Last ${mins} minutes`,
            };
        }

        // Match hours: e.g. "2h", "2hr", "2hrs", "24h"
        const hourMatch = clean.match(/^(\d+)\s*(h|hr|hrs|hour|hours)$/);
        if (hourMatch) {
            const hrs = parseInt(hourMatch[1], 10);
            return {
                from: new Date(now.getTime() - hrs * 60 * 60 * 1000),
                to: now,
                label: `Last ${hrs} hour${hrs > 1 ? 's' : ''}`,
            };
        }

        // Match days: e.g. "1d", "3days"
        const dayMatch = clean.match(/^(\d+)\s*(d|day|days)$/);
        if (dayMatch) {
            const days = parseInt(dayMatch[1], 10);
            return {
                from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
                to: now,
                label: `Last ${days} day${days > 1 ? 's' : ''}`,
            };
        }

        // Match specific date: YYYY-MM-DD
        const dateMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10) - 1;
            const day = parseInt(dateMatch[3], 10);
            const from = new Date(Date.UTC(year, month, day, 0, 0, 0));
            const to = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
            return {
                from,
                to,
                label: `Date ${clean} (UTC)`,
            };
        }

        // Default fallback: 1 hour
        return {
            from: new Date(now.getTime() - 60 * 60 * 1000),
            to: now,
            label: 'Last 1 hour',
        };
    }

    private static async handleLogCommand(chatId: string, query: string): Promise<void> {
        const { from, to, label } = this.parseLogTimeRange(query);

        await this.sendMessage(chatId, `⏳ Querying diagnostics log for <b>${label}</b>...`);

        try {
            const logs = await prisma.systemLog.findMany({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to,
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 200,
            });

            if (logs.length === 0) {
                await this.sendMessage(
                    chatId,
                    `✅ <b>System Clean</b>\n\nNo errors or diagnostic logs recorded for <b>${label}</b>.`
                );
                return;
            }

            // If 1 to 3 short logs: render directly in Telegram
            if (logs.length <= 3) {
                const items = logs.map((l) => {
                    return [
                        `• [<code>${l.level}</code>] <b>${this.escapeHtml(l.message)}</b>`,
                        `  Status: <code>${l.statusCode || 'N/A'}</code> | Source: <code>${l.source}</code>`,
                        l.path ? `  Path: <code>${l.method || 'GET'} ${l.path}</code>` : null,
                        `  Time: <code>${l.createdAt.toISOString().slice(11, 19)} UTC</code>`,
                    ].filter(Boolean).join('\n');
                });

                const text = [
                    `📄 <b>Diagnostics Log (${logs.length} entries - ${label})</b>`,
                    `━━━━━━━━━━━━━━━━━━━━━`,
                    items.join('\n\n'),
                    `\n🔗 <a href="${config.frontendUrl}/admin/logs">Inspect in Admin Portal</a>`,
                ].join('\n');

                await this.sendMessage(chatId, text);
                return;
            }

            // > 3 logs: generate clean .log document and send as file attachment
            const header = [
                '================================================================================',
                'OURMENU PRODUCTION SYSTEM & DIAGNOSTICS LOG',
                `Window: ${from.toISOString()} to ${to.toISOString()} (${label})`,
                `Total Entries: ${logs.length}`,
                '================================================================================\n\n',
            ].join('\n');

            const entries = logs.map((l) => {
                return [
                    `[${l.createdAt.toISOString()}] [${l.level}] [${l.source}] Status: ${l.statusCode || 'N/A'}`,
                    l.path ? `Path: ${l.method || 'GET'} ${l.path}` : null,
                    `Message: ${l.message}`,
                    l.ipAddress ? `IP: ${l.ipAddress}` : null,
                    l.userId ? `User: ${l.userId}` : null,
                    l.restaurantId ? `Restaurant: ${l.restaurantId}` : null,
                    l.stack ? `Stack Trace:\n${l.stack}` : null,
                    '--------------------------------------------------------------------------------',
                ].filter(Boolean).join('\n');
            }).join('\n\n');

            const fullContent = header + entries;
            const filename = `ourmenu_logs_${from.toISOString().slice(0, 10)}_${label.replace(/\s+/g, '-').toLowerCase()}.log`;

            await this.sendDocument(
                chatId,
                filename,
                fullContent,
                `📄 <b>Attached:</b> ${logs.length} log entries for <b>${label}</b>.`
            );
        } catch (err) {
            await this.sendMessage(chatId, `❌ Failed to extract logs: ${err}`);
        }
    }

    private static async executeTelegramBackup(chatId: string): Promise<void> {
        await this.sendMessage(chatId, `⏳ Generating database backup archive... Please wait a moment.`);
        try {
            const success = await BackupService.sendBackupToTelegram(chatId);
            if (!success) {
                await this.sendMessage(
                    chatId,
                    `❌ <b>Backup Delivery Failed</b>\n\nFailed to upload the backup file to Telegram. Please inspect the server logs.`
                );
            }
        } catch (err: any) {
            console.error('⚠️ [TelegramBotService] Backup error:', err);
            await this.sendMessage(
                chatId,
                `❌ <b>Backup Error:</b> <code>${this.escapeHtml(err?.message || String(err))}</code>`
            );
        }
    }

    /**
     * Escapes raw HTML characters to prevent Telegram parse errors
     */
    private static escapeHtml(text: string): string {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

export const telegramBotService = TelegramBotService;
