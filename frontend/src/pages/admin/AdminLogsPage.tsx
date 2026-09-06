import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    AlertOctagon, Search, RefreshCw, CheckCircle2,
    Clock, Terminal, Copy, Check, Filter,
    Server, Smartphone, Trash2, ArrowUpRight,
    AlertTriangle, ShieldAlert, Sparkles, X, ChevronRight,
    Send
} from 'lucide-react';
import {
    useSystemLogs,
    useSystemLogMetrics,
    useUpdateSystemLogStatus,
    usePurgeSystemLogs,
} from '../../hooks/useSystemLogs';
import type { SystemLogEntry, LogLevel, LogStatus, LogSource } from '../../types';
import { cn } from '../../lib/utils';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';


const AUTO_REFRESH_OPTIONS = [
    { label: 'Off', value: 0 },
    { label: '10s', value: 10_000 },
    { label: '30s', value: 30_000 },
];

export default function AdminLogsPage() {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(10_000);
    const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);
    const [copiedStack, setCopiedStack] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [purgeDays, setPurgeDays] = useState(30);
    const [telegramStatus, setTelegramStatus] = useState<{ isConfigured: boolean; isEnabled: boolean; adminCount: number } | null>(null);
    const [isTogglingTelegram, setIsTogglingTelegram] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    const { data: metrics, refetch: refetchMetrics } = useSystemLogMetrics(autoRefreshInterval);
    const {
        data: logsData,
        isLoading,
        isFetching,
        isError,
        error: logsError,
        refetch: refetchLogs,
    } = useSystemLogs(
        {
            page,
            limit: 25,
            level: levelFilter,
            source: sourceFilter,
            status: statusFilter,
            search,
        },
        autoRefreshInterval
    );

    const updateStatusMutation = useUpdateSystemLogStatus();
    const purgeMutation = usePurgeSystemLogs();

    const logs = Array.isArray(logsData?.data) ? logsData.data : [];
    const pagination = logsData?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

    useEffect(() => {
        adminApi.getTelegramStatus().then(setTelegramStatus).catch(() => {});
    }, []);

    const handleToggleTelegram = async () => {
        if (!telegramStatus) return;
        const nextVal = !telegramStatus.isEnabled;
        setIsTogglingTelegram(true);
        try {
            await adminApi.toggleTelegramBot(nextVal);
            setTelegramStatus(prev => prev ? { ...prev, isEnabled: nextVal } : null);
            toast.success(nextVal ? 'Telegram alerts enabled' : 'Telegram alerts paused');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to toggle Telegram alerts');
        } finally {
            setIsTogglingTelegram(false);
        }
    };

    const handleSendTestAlert = async () => {
        setIsSendingTest(true);
        try {
            await adminApi.sendTelegramTest();
            toast.success('Test alert sent to Telegram admins!');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to dispatch test alert');
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleRefreshAll = () => {
        refetchMetrics();
        refetchLogs();
    };

    const handleToggleStatus = async (log: SystemLogEntry, targetStatus: LogStatus) => {
        try {
            await updateStatusMutation.mutateAsync({ id: log.id, status: targetStatus });
            toast.success(`Log marked as ${targetStatus.toLowerCase()}`);
            if (selectedLog?.id === log.id) {
                setSelectedLog({ ...selectedLog, status: targetStatus });
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to update status');
        }
    };

    const handleCopyStack = (stack: string) => {
        navigator.clipboard.writeText(stack);
        setCopiedStack(true);
        setTimeout(() => setCopiedStack(false), 2000);
        toast.success('Stack trace copied to clipboard');
    };

    const handlePurge = async () => {
        try {
            const result = await purgeMutation.mutateAsync({ olderThanDays: purgeDays });
            toast.success(`Cleaned up ${result.deletedCount} old log records`);
            setShowPurgeModal(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to purge logs');
        }
    };

    return (
        <>
            <Helmet><title>System Logs & Diagnostics — Super Admin</title></Helmet>

            <div className="space-y-6 animate-fade-in pb-12">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                                <AlertOctagon className="w-6 h-6" />
                            </span>
                            System Logs & Diagnostics
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                            Real-time platform error tracking, exception diagnostics, and customer frontend health reporting.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Auto-Refresh Toggle */}
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                            <span className="px-2 text-slate-500 font-bold uppercase text-[10px]">Auto-refresh:</span>
                            {AUTO_REFRESH_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAutoRefreshInterval(opt.value)}
                                    className={cn(
                                        'px-2 py-1 rounded-lg font-bold transition-all',
                                        autoRefreshInterval === opt.value
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Manual Refresh */}
                        <button
                            type="button"
                            onClick={handleRefreshAll}
                            disabled={isFetching}
                            className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                            title="Refresh logs & metrics"
                        >
                            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin text-indigo-400')} />
                        </button>

                        {/* Purge Logs Button */}
                        <button
                            type="button"
                            onClick={() => setShowPurgeModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors text-xs font-bold"
                            title="Clean up old logs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Retention Purge</span>
                        </button>
                    </div>
                </div>

                {/* ── Telegram Admin Bot Alert Control Card ── */}
                <div className="p-4 sm:p-5 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-white">Telegram Admin Bot & Real-Time Alerts</span>
                                {telegramStatus?.isConfigured ? (
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase',
                                        telegramStatus.isEnabled
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    )}>
                                        {telegramStatus.isEnabled ? `Active (${telegramStatus.adminCount} Admin${telegramStatus.adminCount > 1 ? 's' : ''})` : 'Paused'}
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                        Token Not Configured
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Instant push alerts for DB outages, 500 crashes, UI client errors, and 21:00 EAT nightly digest.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {telegramStatus?.isConfigured && (
                            <button
                                type="button"
                                onClick={handleSendTestAlert}
                                disabled={isSendingTest || !telegramStatus.isEnabled}
                                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className={cn('w-3.5 h-3.5 text-sky-400', isSendingTest && 'animate-pulse')} />
                                <span>{isSendingTest ? 'Sending...' : 'Send Test Alert'}</span>
                            </button>
                        )}

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                                {telegramStatus?.isEnabled ? 'Alerts ON' : 'Alerts OFF'}
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={telegramStatus?.isEnabled ?? false}
                                disabled={isTogglingTelegram || !telegramStatus?.isConfigured}
                                onClick={handleToggleTelegram}
                                className={cn(
                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed',
                                    telegramStatus?.isEnabled ? 'bg-sky-600' : 'bg-slate-700'
                                )}
                            >
                                <span
                                    className={cn(
                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                        telegramStatus?.isEnabled ? 'translate-x-5' : 'translate-x-0'
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── KPI Problem Summary Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Unresolved Count */}
                    <div className={cn(
                        'p-5 rounded-3xl border transition-all',
                        (metrics?.unresolvedCount || 0) > 0
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : 'bg-slate-900/90 border-slate-800 text-slate-200'
                    )}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unresolved Issues</span>
                            <span className={cn(
                                'w-2.5 h-2.5 rounded-full',
                                (metrics?.unresolvedCount || 0) > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                            )} />
                        </div>
                        <p className="text-3xl font-black mt-2 tracking-tight text-white">
                            {metrics?.unresolvedCount ?? '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {(metrics?.unresolvedCount || 0) > 0 ? 'Active attention required' : 'All clear across platform'}
                        </p>
                    </div>

                    {/* 24h Critical Errors */}
                    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">24h Server 500s</span>
                            <Server className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-3xl font-black mt-2 tracking-tight text-white">
                            {metrics?.last24hFatal ?? '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {metrics?.last24hErrors ?? 0} total errors today
                        </p>
                    </div>

                    {/* Frontend Diner Menu Crashes */}
                    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frontend Telemetry</span>
                            <Smartphone className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="text-3xl font-black mt-2 tracking-tight text-white">
                            {metrics?.frontendCount ?? '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Client-side runtime crashes (7 days)
                        </p>
                    </div>

                    {/* Total 7d Errors */}
                    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Captured (7d)</span>
                            <ShieldAlert className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-3xl font-black mt-2 tracking-tight text-white">
                            {metrics?.last7dTotal ?? '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {metrics?.backendCount ?? 0} backend · {metrics?.frontendCount ?? 0} client
                        </p>
                    </div>
                </div>

                {/* ── 7-Day Error Frequency Timeline ── */}
                {metrics?.timeline && metrics.timeline.length > 0 && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-extrabold text-white">7-Day Incident Frequency</h2>
                                <p className="text-xs text-slate-400">Daily breakdown of errors and warnings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 border-t border-slate-800/80">
                            {metrics.timeline.map((day) => {
                                const maxVal = Math.max(...metrics.timeline.map(t => t?.total || 0), 1);
                                const heightPct = Math.max(Math.round(((day?.total || 0) / maxVal) * 100), 8);
                                const isToday = day?.date === new Date().toISOString().slice(0, 10);

                                return (
                                    <div key={day.date} className="flex flex-col items-center">
                                        <div className="h-28 w-full flex items-end justify-center pb-1">
                                            <div
                                                style={{ height: `${heightPct}%` }}
                                                className={cn(
                                                    'w-full max-w-[36px] rounded-xl transition-all relative group cursor-pointer flex flex-col justify-end overflow-hidden',
                                                    (day?.fatal || 0) > 0 ? 'bg-gradient-to-t from-rose-600 to-rose-400' :
                                                    (day?.errors || 0) > 0 ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                                                    (day?.total || 0) > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' :
                                                    'bg-slate-800'
                                                )}
                                                title={`${day?.date}: ${day?.total || 0} events (${day?.fatal || 0} fatal, ${day?.errors || 0} errors, ${day?.warnings || 0} warns)`}
                                            >
                                                {/* Tooltip on hover */}
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                                    <span className="font-bold text-white">{day.date}</span>
                                                    <span className="text-rose-400">Fatal 500s: {day.fatal}</span>
                                                    <span className="text-amber-400">Errors: {day.errors}</span>
                                                    <span className="text-slate-400">Warnings: {day.warnings}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-white mt-1">{day?.total || 0}</span>
                                        <span className={cn(
                                            'text-[10px] font-bold mt-0.5',
                                            isToday ? 'text-indigo-400' : 'text-slate-500'
                                        )}>
                                            {day?.date ? new Date(day.date).toLocaleDateString([], { weekday: 'short' }) : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Filter & Search Toolbar ── */}
                <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-lg">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search by error message, path, IP, or user..."
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                            />
                        </div>

                        {/* Severity Level Filter */}
                        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                            <span className="px-2 text-slate-500 font-bold uppercase text-[10px]">Level:</span>
                            {['ALL', 'FATAL', 'ERROR', 'WARN', 'INFO'].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => { setLevelFilter(lvl); setPage(1); }}
                                    className={cn(
                                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                                        levelFilter === lvl
                                            ? lvl === 'FATAL' ? 'bg-rose-600 text-white' :
                                              lvl === 'ERROR' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                                              lvl === 'WARN' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                                              'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Filters: Source & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Source */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <span className="px-2 text-slate-500 font-bold uppercase text-[10px]">Source:</span>
                                {['ALL', 'BACKEND', 'FRONTEND'].map((src) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => { setSourceFilter(src); setPage(1); }}
                                        className={cn(
                                            'px-2 py-0.5 text-xs font-bold rounded-lg transition-all',
                                            sourceFilter === src ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                                        )}
                                    >
                                        {src}
                                    </button>
                                ))}
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <span className="px-2 text-slate-500 font-bold uppercase text-[10px]">Status:</span>
                                {['ALL', 'UNRESOLVED', 'RESOLVED', 'IGNORED'].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => { setStatusFilter(st); setPage(1); }}
                                        className={cn(
                                            'px-2 py-0.5 text-xs font-bold rounded-lg transition-all',
                                            statusFilter === st ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                                        )}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <span className="text-[11px] text-slate-500">
                            Showing {logs.length} of {pagination.total} logs
                        </span>
                    </div>
                </div>

                {/* ── Log Entries Table ── */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-16 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : isError ? (
                        <div className="p-16 text-center text-slate-400 text-xs">
                            <AlertTriangle className="w-10 h-10 text-rose-400 opacity-80 mx-auto mb-2" />
                            <p className="font-bold text-rose-300">Failed to load system logs</p>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                {(logsError as any)?.response?.data?.error || (logsError as any)?.message || 'Database connection may be re-synchronizing. Please try refreshing.'}
                            </p>
                            <button
                                type="button"
                                onClick={handleRefreshAll}
                                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all text-xs inline-flex items-center gap-2 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Retry Query</span>
                            </button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 text-xs">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-60 mx-auto mb-2" />
                            <p className="font-bold text-slate-300">No logs found</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">No system errors match your current filter criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-3.5 px-4">Severity & Status</th>
                                        <th className="py-3.5 px-4">Source & Route</th>
                                        <th className="py-3.5 px-4">Error Message</th>
                                        <th className="py-3.5 px-4">Context / Target</th>
                                        <th className="py-3.5 px-4">Timestamp</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {logs.map((log) => {
                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() => setSelectedLog(log)}
                                                className={cn(
                                                    'hover:bg-slate-800/40 transition-colors cursor-pointer',
                                                    log.status === 'RESOLVED' && 'opacity-60'
                                                )}
                                            >
                                                {/* Severity & Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                                                            log.level === 'FATAL' ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' :
                                                            log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                            log.level === 'WARN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                        )}>
                                                            {log.level}
                                                        </span>

                                                        <span className={cn(
                                                            'text-[10px] font-bold px-2 py-0.5 rounded-md',
                                                            log.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                            log.status === 'IGNORED' ? 'bg-slate-800 text-slate-400' :
                                                            'bg-rose-500/10 text-rose-400'
                                                        )}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Source & Route */}
                                                <td className="py-3.5 px-4 max-w-[200px]">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <span className={cn(
                                                            'text-[9px] font-black px-1.5 py-0.2 rounded uppercase',
                                                            log.source === 'BACKEND' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-teal-500/20 text-teal-300'
                                                        )}>
                                                            {log.source}
                                                        </span>
                                                        {log.statusCode && (
                                                            <span className="text-[10px] font-mono text-slate-400 font-bold">
                                                                HTTP {log.statusCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-mono text-[11px] text-slate-300 truncate" title={log.path || ''}>
                                                        {log.method && <span className="text-indigo-400 font-bold mr-1">{log.method}</span>}
                                                        {log.path || '—'}
                                                    </p>
                                                </td>

                                                {/* Error Message */}
                                                <td className="py-3.5 px-4 max-w-sm">
                                                    <p className="font-semibold text-slate-200 truncate" title={log.message}>
                                                        {log.message}
                                                    </p>
                                                    {log.stack && (
                                                        <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 mt-0.5">
                                                            <Terminal className="w-3 h-3 flex-shrink-0" />
                                                            Stack trace available
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Context / User / Restaurant */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {log.restaurant ? (
                                                        <p className="font-semibold text-slate-200 truncate max-w-[140px]" title={log.restaurant.name}>
                                                            {log.restaurant.name}
                                                        </p>
                                                    ) : log.user ? (
                                                        <p className="text-[11px] text-slate-300 truncate max-w-[140px]" title={log.user.email}>
                                                            {log.user.email}
                                                        </p>
                                                    ) : (
                                                        <span className="text-slate-500 text-[11px]">{log.ipAddress || '—'}</span>
                                                    )}
                                                </td>

                                                {/* Timestamp */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                                                    <p className="font-medium text-slate-200">
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                    </p>
                                                </td>

                                                {/* Quick Action Button */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    {log.status === 'UNRESOLVED' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(log, 'RESOLVED')}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all"
                                                        >
                                                            Resolve
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(log, 'UNRESOLVED')}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold transition-all"
                                                        >
                                                            Reopen
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} events)
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
                                    onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                                    disabled={page >= pagination.totalPages}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg font-bold"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Diagnostic Detail Drawer / Modal ── */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div className="flex items-center gap-2.5">
                                <span className={cn(
                                    'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase',
                                    selectedLog.level === 'FATAL' ? 'bg-rose-600 text-white' :
                                    selectedLog.level === 'ERROR' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                )}>
                                    {selectedLog.level}
                                </span>
                                <h3 className="font-extrabold text-sm text-white truncate max-w-md">
                                    {selectedLog.message}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                            {/* Key Properties Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Source</span>
                                    <p className="font-bold text-slate-200 mt-0.5">{selectedLog.source}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">HTTP Status</span>
                                    <p className="font-bold text-slate-200 mt-0.5">{selectedLog.statusCode || 'None'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Method & Path</span>
                                    <p className="font-mono text-slate-200 mt-0.5 truncate">{selectedLog.method || ''} {selectedLog.path || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Client IP</span>
                                    <p className="font-mono text-slate-200 mt-0.5">{selectedLog.ipAddress || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Restaurant</span>
                                    <p className="font-bold text-indigo-400 mt-0.5 truncate">
                                        {selectedLog.restaurant ? `${selectedLog.restaurant.name} (${selectedLog.restaurant.slug})` : '—'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">User</span>
                                    <p className="font-bold text-slate-200 mt-0.5 truncate">
                                        {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* User Agent */}
                            {selectedLog.userAgent && (
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">User Agent</span>
                                    <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}

                            {/* Stack Trace */}
                            {selectedLog.stack && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Exception Stack Trace</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyStack(selectedLog.stack!)}
                                            className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            {copiedStack ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedStack ? 'Copied' : 'Copy Trace'}</span>
                                        </button>
                                    </div>
                                    <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap max-h-64 leading-relaxed">
                                        {selectedLog.stack}
                                    </pre>
                                </div>
                            )}

                            {/* Sanitized Metadata */}
                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Request / Client Context (Sanitized)</span>
                                    <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-52">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <span className="text-[11px] text-slate-500">
                                Recorded at {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleToggleStatus(selectedLog, selectedLog.status === 'RESOLVED' ? 'UNRESOLVED' : 'RESOLVED')}
                                    className={cn(
                                        'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                                        selectedLog.status === 'RESOLVED'
                                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                                    )}
                                >
                                    {selectedLog.status === 'RESOLVED' ? 'Reopen Issue' : 'Mark as Resolved'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleStatus(selectedLog, 'IGNORED')}
                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                                >
                                    Ignore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Purge Retention Modal ── */}
            {showPurgeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-extrabold text-white mb-2">Purge Diagnostic Logs</h3>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Clean up older logs to protect database storage. Choose retention window:
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {[7, 30, 60].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setPurgeDays(d)}
                                    className={cn(
                                        'py-2 px-3 rounded-xl text-xs font-bold border transition-all',
                                        purgeDays === d
                                            ? 'bg-rose-600 border-rose-500 text-white'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    Older than {d}d
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowPurgeModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePurge}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30"
                            >
                                Purge Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
