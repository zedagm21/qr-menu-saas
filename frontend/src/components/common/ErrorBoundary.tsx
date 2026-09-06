import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, Home } from 'lucide-react';
import { reportClientError } from '../../lib/telemetry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    compact?: boolean;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    showDetails: boolean;
    copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        showDetails: false,
        copied: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, showDetails: false, copied: false };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught exception:', error, errorInfo);
        reportClientError(error, {
            level: 'FATAL',
            metadata: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    private isStaleBundle = (): boolean => {
        const msg = this.state.error?.message || '';
        const stack = this.state.error?.stack || '';
        return (
            msg.includes('Rendered more hooks') ||
            msg.includes('Rendered fewer hooks') ||
            msg.includes('Invalid hook call') ||
            msg.includes('Failed to fetch dynamically imported module') ||
            msg.includes('Importing a module script failed') ||
            stack.includes('invariant=310') ||
            stack.includes('invariant=300') ||
            stack.includes('error-decoder.html?invariant=310')
        );
    };

    private handleClearCacheAndReload = async () => {
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
        } catch {
            // ignore
        }
        window.location.href = window.location.pathname + '?refresh=' + Date.now();
    };

    private handleReset = () => {
        if (this.props.onReset) {
            this.props.onReset();
            this.setState({ hasError: false, error: null });
        } else {
            this.setState({ hasError: false, error: null });
            window.location.reload();
        }
    };

    private handleCopyError = () => {
        const errText = `Error: ${this.state.error?.message || 'Unknown'}\n\nStack:\n${this.state.error?.stack || 'None'}\n\nURL: ${window.location.href}`;
        navigator.clipboard.writeText(errText);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isCompact = this.props.compact;

            return (
                <div className={isCompact ? 'p-4 flex items-center justify-center' : 'min-h-[50vh] flex items-center justify-center p-6'}>
                    <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-extrabold text-white mb-2 tracking-tight">Something went wrong</h2>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            An unexpected issue occurred while loading this view. The technical team and diagnostics logger have been notified.
                        </p>

                        {/* Stale Bundle / Deploy Update Banner */}
                        {this.isStaleBundle() && (
                            <div className="mb-4 text-left p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed animate-fade-in">
                                <span className="font-extrabold text-amber-400 block mb-1">🚀 New Version Deployed</span>
                                A fresh version of OurMenu was published. Your browser held onto older cached assets. Click the button below to purge the local cache and load the latest version.
                            </div>
                        )}

                        {/* Error Message Pill */}
                        {this.state.error?.message && (
                            <div className="mb-4 text-left p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 text-rose-300 font-mono text-[11px] break-words">
                                <span className="text-[9px] font-black uppercase text-rose-400 block mb-1">Error Diagnostic:</span>
                                {this.state.error.message}
                            </div>
                        )}

                        {/* Collapsible Diagnostic Trace */}
                        {this.state.error?.stack && (
                            <div className="mb-5 text-left">
                                <button
                                    type="button"
                                    onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors mb-2 cursor-pointer"
                                >
                                    {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                                    <span>{this.state.showDetails ? 'Hide technical trace' : 'Show technical trace'}</span>
                                </button>

                                {this.state.showDetails && (
                                    <div className="relative">
                                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                            {this.state.error.stack}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={this.handleCopyError}
                                            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                            {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            <span>{this.state.copied ? 'Copied' : 'Copy Trace'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                            {this.isStaleBundle() ? (
                                <button
                                    type="button"
                                    onClick={this.handleClearCacheAndReload}
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Clear Cache & Load Latest Version</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={this.handleReset}
                                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Reload & Try Again</span>
                                </button>
                            )}

                            <a
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                            >
                                <Home className="w-4 h-4 text-indigo-400" />
                                <span>Go to Dashboard</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

