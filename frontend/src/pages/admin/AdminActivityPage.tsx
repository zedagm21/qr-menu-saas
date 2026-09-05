import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Activity, Search, RefreshCw, Clock,
    Shield, Store, User, Terminal, Calendar
} from 'lucide-react';
import { useAdminAuditLogs } from '../../hooks/useAdmin';
import { cn } from '../../lib/utils';

const ACTIONS = [
    { id: 'ALL', label: 'All Events' },
    { id: 'USER_REGISTERED', label: 'User Registrations' },
    { id: 'USER_VERIFIED', label: 'Email Verifications' },
    { id: 'USER_LOGIN', label: 'Logins' },
    { id: 'RESTAURANT_SUSPENDED', label: 'Suspensions' },
    { id: 'RESTAURANT_ACTIVATED', label: 'Activations' },
    { id: 'ROLE_UPDATED', label: 'Role Changes' },
    { id: 'RESTAURANT_DELETED', label: 'Deletions' },
];

export default function AdminActivityPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const { data, isLoading, refetch, isFetching } = useAdminAuditLogs({
        page,
        limit: 25,
        action: actionFilter,
        search,
    });

    return (
        <>
            <Helmet><title>Activity Audit Log — Super Admin</title></Helmet>

            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                                <Activity className="w-6 h-6" />
                            </span>
                            Activity & Audit Log
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                            Immutable audit trail of all platform registrations, access state modifications, and administrative operations.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Refresh audit logs"
                    >
                        <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin text-purple-400')} />
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by action, email, user, or restaurant..."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-500"
                        />
                    </div>

                    {/* Action Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {ACTIONS.map((a) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => { setActionFilter(a.id); setPage(1); }}
                                className={cn(
                                    'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                                    actionFilter === a.id
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-slate-200'
                                )}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (data?.data.length || 0) === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            <Activity className="w-10 h-10 opacity-30 mx-auto mb-2" />
                            No activity events found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-3.5 px-4">Event / Action</th>
                                        <th className="py-3.5 px-4">User</th>
                                        <th className="py-3.5 px-4">Target Restaurant</th>
                                        <th className="py-3.5 px-4">Details Payload</th>
                                        <th className="py-3.5 px-4 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {data?.data.map((log) => {
                                        const isExpanded = expandedLogId === log.id;
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                                {/* Action Pill */}
                                                <td className="py-3.5 px-4">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase',
                                                        log.action.includes('SUSPEND') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                        log.action.includes('ACTIVAT') || log.action.includes('VERIFIED') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                        log.action.includes('REGISTER') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                        log.action.includes('ROLE') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                        'bg-slate-800 text-slate-300 border border-slate-700'
                                                    )}>
                                                        {log.action}
                                                    </span>
                                                </td>

                                                {/* User */}
                                                <td className="py-3.5 px-4">
                                                    {log.user ? (
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-200 truncate">{log.user.name}</p>
                                                            <p className="text-[11px] text-slate-400 truncate">{log.user.email}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 italic">System</span>
                                                    )}
                                                </td>

                                                {/* Restaurant */}
                                                <td className="py-3.5 px-4">
                                                    {log.restaurant ? (
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-200 truncate">{log.restaurant.name}</p>
                                                            <span className="text-[10px] text-indigo-400 font-mono">/r/{log.restaurant.slug}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 italic">—</span>
                                                    )}
                                                </td>

                                                {/* Details payload */}
                                                <td className="py-3.5 px-4 max-w-xs">
                                                    {log.details ? (
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                                className="text-[11px] font-mono text-purple-400 hover:underline flex items-center gap-1 text-left truncate"
                                                            >
                                                                <Terminal className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                                                                </span>
                                                            </button>
                                                            {isExpanded && (
                                                                <pre className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono animate-fade-in">
                                                                    {JSON.stringify(log.details, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">—</span>
                                                    )}
                                                </td>

                                                {/* Timestamp */}
                                                <td className="py-3.5 px-4 text-right text-slate-400">
                                                    <p className="font-semibold text-slate-200">
                                                        {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {(data?.pagination.totalPages || 0) > 1 && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                Page {data?.pagination.page} of {data?.pagination.totalPages} ({data?.pagination.total} events)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(p + 1, data?.pagination.totalPages || 1))}
                                    disabled={page === data?.pagination.totalPages}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
