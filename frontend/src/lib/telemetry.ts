import axios from 'axios';

const reportedErrors = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60_000; // 60 seconds

export interface TelemetryContext {
    path?: string;
    level?: 'FATAL' | 'ERROR' | 'WARN' | 'INFO';
    metadata?: Record<string, any>;
}

/**
 * Report client-side uncaught exception or runtime failure to backend diagnostics
 */
export async function reportClientError(
    error: unknown,
    context: TelemetryContext = {}
): Promise<void> {
    try {
        let message = 'Unknown client error';
        let stack: string | null = null;

        if (error instanceof Error) {
            message = error.message;
            stack = error.stack || null;
        } else if (typeof error === 'string') {
            message = error;
        } else if (error && typeof error === 'object') {
            message = (error as any).message || JSON.stringify(error);
        }

        // Deduplication check: prevent flooding backend with identical errors in quick succession
        const dedupKey = `${message}:${context.path || window.location.pathname}`;
        const now = Date.now();
        const lastReported = reportedErrors.get(dedupKey);

        if (lastReported && now - lastReported < DEDUPLICATION_WINDOW_MS) {
            return;
        }
        reportedErrors.set(dedupKey, now);

        // Clean up old deduplication cache entries
        if (reportedErrors.size > 100) {
            for (const [key, timestamp] of reportedErrors.entries()) {
                if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
                    reportedErrors.delete(key);
                }
            }
        }

        const payload = {
            message,
            stack,
            path: context.path || window.location.pathname + window.location.search,
            level: context.level || 'ERROR',
            metadata: {
                ...context.metadata,
                url: window.location.href,
                screen: `${window.innerWidth}x${window.innerHeight}`,
                online: navigator.onLine,
            },
        };

        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        await axios.post(`${apiUrl}/public/report-error`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
    } catch {
        // Silently catch so telemetry failure never triggers another error
    }
}

/**
 * Setup global window error and unhandled promise rejection listeners
 */
export function initGlobalTelemetry() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
        // Ignore cross-origin script error noise
        if (!event.message || event.message === 'Script error.') return;
        reportClientError(event.error || event.message, {
            level: 'ERROR',
            metadata: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            },
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        reportClientError(event.reason || 'Unhandled Promise Rejection', {
            level: 'WARN',
            metadata: { type: 'unhandledrejection' },
        });
    });
}
