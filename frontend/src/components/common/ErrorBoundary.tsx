import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportClientError } from '../../lib/telemetry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
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

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[50vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-extrabold text-white mb-2">Something went wrong</h2>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            An unexpected issue occurred while loading this view. The technical team has been notified.
                        </p>

                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reload & Try Again</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
