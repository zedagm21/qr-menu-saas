import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    BarChart3, QrCode, Users, Clock, UtensilsCrossed,
    Download, RefreshCw, Smartphone, Search,
    Eye, Share2, Phone, TrendingUp, TrendingDown,
    Calendar, Sparkles, Printer, ArrowRight
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { analyticsApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const TIMEFRAMES = [
    { id: '24h', labelKey: 'analytics.tf_24h', defaultLabel: '24 Hours' },
    { id: '7d', labelKey: 'analytics.tf_7d', defaultLabel: '7 Days' },
    { id: '30d', labelKey: 'analytics.tf_30d', defaultLabel: '30 Days' },
    { id: '90d', labelKey: 'analytics.tf_90d', defaultLabel: '90 Days' },
    { id: 'all', labelKey: 'analytics.tf_all', defaultLabel: 'All Time' },
];

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [timeframe, setTimeframe] = useState<string>('7d');
    const [isExporting, setIsExporting] = useState(false);
    const [hoveredBar, setHoveredBar] = useState<{ label: string; count: number } | null>(null);

    const { data, isLoading, refetch, isFetching } = useAnalytics(timeframe);

    const busiestDay = data?.dayOfWeek
        ? [...data.dayOfWeek].sort((a, b) => b.count - a.count)[0]
        : null;

    const handleExportCsv = async () => {
        try {
            setIsExporting(true);
            const blob = await analyticsApi.downloadCsv(timeframe);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `restaurant-analytics-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(t('analytics.export_success', { defaultValue: 'Analytics report exported successfully!' }));
        } catch {
            toast.error(t('analytics.export_failed', { defaultValue: 'Failed to export CSV report' }));
        } finally {
            setIsExporting(false);
        }
    };

    const maxTimelineCount = Math.max(...(data?.timeline.map(t => t.count) || [1]), 1);
    const maxPeakCount = Math.max(...(data?.peakHours.map(p => p.count) || [1]), 1);

    return (
        <>
            <Helmet>
                <title>{t('nav.analytics', { defaultValue: 'Analytics' })} — OurMenu</title>
                <style>{`
                    @media print {
                        aside, nav, header, button, .print\\:hidden { display: none !important; }
                        body { background: white !important; color: black !important; }
                        .p-4, .sm\\:p-6, .lg\\:p-8 { padding: 0 !important; }
                    }
                `}</style>
            </Helmet>

            <div className="min-h-full p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-8 animate-fade-in">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                            </span>
                            {t('analytics.title', { defaultValue: 'Performance & Scan Analytics' })}
                        </h1>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                            {t('analytics.subtitle', { defaultValue: 'Real-time diner scan volume, peak dining hours, and dish popularity insights.' })}
                        </p>
                    </div>

                    {/* Timeframe selector & Actions */}
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            {TIMEFRAMES.map((tf) => (
                                <button
                                    key={tf.id}
                                    type="button"
                                    onClick={() => setTimeframe(tf.id)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                                        timeframe === tf.id
                                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                                    )}
                                >
                                    {t(tf.labelKey, { defaultValue: tf.defaultLabel })}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            title={t('common.refresh', { defaultValue: 'Refresh' })}
                        >
                            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin text-[color:var(--color-brand-500)]')} />
                        </button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCsv}
                            isLoading={isExporting}
                            icon={<Download className="w-4 h-4 text-emerald-600" />}
                            className="text-xs font-bold"
                        >
                            {t('analytics.export_csv', { defaultValue: 'Export CSV' })}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            icon={<Printer className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />}
                            className="text-xs font-bold"
                        >
                            {t('analytics.print_report', { defaultValue: 'Print Report' })}
                        </Button>
                    </div>
                </div>

                {/* ── 4 Top KPI Cards ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Scans */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                {data?.summary.scanGrowthPct !== undefined && (
                                    <span className={cn(
                                        'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border',
                                        data.summary.scanGrowthPct >= 0
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                    )}>
                                        {data.summary.scanGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {data.summary.scanGrowthPct >= 0 ? `+${data.summary.scanGrowthPct}%` : `${data.summary.scanGrowthPct}%`}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('analytics.total_scans', { defaultValue: 'Total QR Scans' })}</p>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{data?.summary.totalScans.toLocaleString()}</p>
                            <p className="text-[11px] text-neutral-400 mt-1">{t('analytics.scans_in_period', { defaultValue: 'Total diner sessions opened' })}</p>
                        </div>

                        {/* Unique Diners */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
                                    {t('analytics.estimated', { defaultValue: 'Estimated' })}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('analytics.unique_diners', { defaultValue: 'Unique Diners' })}</p>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">{data?.summary.uniqueDiners.toLocaleString()}</p>
                            <p className="text-[11px] text-neutral-400 mt-1">{t('analytics.privacy_deduped', { defaultValue: 'Deduplicated daily devices' })}</p>
                        </div>

                        {/* Peak Dining Rush */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    {t('analytics.rush_hour', { defaultValue: 'Busiest Hour' })}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('analytics.peak_time', { defaultValue: 'Peak Dining Rush' })}</p>
                            <p className="text-xl font-black text-neutral-900 dark:text-white mt-1 truncate">{data?.summary.peakHour}</p>
                            <p className="text-[11px] text-neutral-400 mt-1">{t('analytics.highest_traffic_window', { defaultValue: 'Peak customer ordering window' })}</p>
                        </div>

                        {/* Top Performing Dish */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <UtensilsCrossed className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                                    #1 Favorite
                                </span>
                            </div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t('analytics.top_dish', { defaultValue: 'Top Dish' })}</p>
                            <p className="text-xl font-black text-neutral-900 dark:text-white mt-1 truncate">{data?.summary.topDish}</p>
                            <p className="text-[11px] text-neutral-400 mt-1">{t('analytics.most_viewed_dish', { defaultValue: 'Most tapped dish in menu' })}</p>
                        </div>
                    </div>
                )}

                {/* ── Onboarding Empty State (When Total Scans = 0) ── */}
                {!isLoading && data?.summary.totalScans === 0 && (
                    <div className="bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-amber-500/5 dark:via-neutral-900 dark:to-neutral-900 rounded-3xl p-8 border-2 border-dashed border-amber-500/30 text-center space-y-4 my-4 animate-fade-in print:hidden">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                            <QrCode className="w-8 h-8 animate-pulse" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                            <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                                {t('analytics.empty_title', { defaultValue: 'Ready to Track Live Diner Traffic?' })}
                            </h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {t('analytics.empty_desc', { defaultValue: 'Print your QR code table cards and place them on your dining tables. Once guests scan to browse your dishes, real-time foot traffic and rush hour analytics will populate here automatically.' })}
                            </p>
                        </div>
                        <div className="pt-2">
                            <Link
                                to="/dashboard/qr"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold text-sm shadow-md transition-all active:scale-95"
                            >
                                <QrCode className="w-4 h-4" />
                                {t('analytics.go_to_qr', { defaultValue: 'Print Table QR Codes' })}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Scan Activity Timeline Chart ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[color:var(--color-brand-600)]" />
                                {t('analytics.scan_volume_timeline', { defaultValue: 'Diner Scan Volume Progression' })}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('analytics.timeline_desc', { defaultValue: 'Daily scan count showing customer foot traffic over time' })}
                            </p>
                        </div>
                        {hoveredBar && (
                            <div className="text-xs font-bold px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 animate-fade-in">
                                {hoveredBar.label}: <span className="text-[color:var(--color-brand-600)] font-black">{hoveredBar.count} scans</span>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="h-44 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-[color:var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (data?.timeline.length || 0) === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-neutral-400 text-xs">
                            <QrCode className="w-8 h-8 opacity-40 mb-2" />
                            {t('analytics.no_scans_period', { defaultValue: 'No scans recorded in this timeframe' })}
                        </div>
                    ) : (
                        <div className="flex items-end gap-1.5 sm:gap-2.5 h-48 pt-6 pb-2 px-2 overflow-x-auto">
                            {data?.timeline.map((point) => {
                                const heightPct = maxTimelineCount > 0 ? Math.max((point.count / maxTimelineCount) * 100, 4) : 4;
                                return (
                                    <div
                                        key={point.label}
                                        className="flex-1 min-w-[20px] sm:min-w-[28px] flex flex-col items-center gap-2 group relative cursor-pointer"
                                        onMouseEnter={() => setHoveredBar(point)}
                                        onMouseLeave={() => setHoveredBar(null)}
                                    >
                                        <div className="w-full flex items-end justify-center h-36">
                                            <div
                                                style={{ height: `${heightPct}%` }}
                                                className={cn(
                                                    'w-full max-w-[32px] rounded-t-lg transition-all duration-300',
                                                    point.count > 0
                                                        ? 'bg-gradient-to-t from-[color:var(--color-brand-500)] to-[color:var(--color-brand-400)] group-hover:from-[color:var(--color-brand-600)] group-hover:to-[color:var(--color-brand-500)] shadow-xs'
                                                        : 'bg-neutral-200 dark:bg-neutral-800'
                                                )}
                                            />
                                        </div>
                                        <span className="text-[10px] text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 font-medium truncate w-full text-center">
                                            {point.label.length > 5 ? point.label.slice(5) : point.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Day-of-Week Dining Rhythm (Monday - Sunday) ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-500" />
                                {t('analytics.day_of_week_title', { defaultValue: 'Day-of-Week Dining Rhythm' })}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('analytics.day_of_week_subtitle', { defaultValue: 'Customer foot traffic volume from Monday to Sunday for kitchen prep & staffing' })}
                            </p>
                        </div>
                        {busiestDay && busiestDay.count > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                {t('analytics.busiest_day', { defaultValue: 'Busiest Day' })}: {busiestDay.day} ({busiestDay.pct}%)
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2">
                        {data?.dayOfWeek?.map((item) => {
                            const maxDayCount = Math.max(...(data?.dayOfWeek?.map(d => d.count) || [1]), 1);
                            const heightPct = maxDayCount > 0 ? Math.max((item.count / maxDayCount) * 100, 8) : 8;
                            const isBusiest = busiestDay && item.day === busiestDay.day && item.count > 0;

                            return (
                                <div key={item.day} className="flex flex-col items-center gap-2 group">
                                    <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                                        {item.count > 0 ? item.count : '—'}
                                    </div>
                                    <div className="w-full h-28 sm:h-32 flex items-end justify-center">
                                        <div
                                            style={{ height: `${heightPct}%` }}
                                            className={cn(
                                                'w-full max-w-[36px] rounded-t-xl transition-all duration-300',
                                                isBusiest
                                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                                                    : item.count > 0
                                                    ? 'bg-gradient-to-t from-neutral-400 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 group-hover:from-emerald-500 group-hover:to-emerald-400'
                                                    : 'bg-neutral-100 dark:bg-neutral-800'
                                            )}
                                        />
                                    </div>
                                    <span className={cn(
                                        'text-xs font-bold tracking-tight text-center',
                                        isBusiest
                                            ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                            : 'text-neutral-500 dark:text-neutral-400'
                                    )}>
                                        {item.day}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-medium">
                                        {item.pct}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── 2 Columns: Peak Dining Rush Hours + Audience Insights ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Peak Rush Hours Breakdown */}
                    <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    {t('analytics.peak_hours_title', { defaultValue: 'Peak Dining Rush (24h Distribution)' })}
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {t('analytics.peak_hours_subtitle', { defaultValue: 'Customer activity breakdown across Breakfast, Lunch, and Dinner' })}
                                </p>
                            </div>
                        </div>

                        {/* Rush legend pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                                🍳 Breakfast (8:00 – 11:00)
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-300 border border-orange-200/60 dark:border-orange-500/20">
                                🍔 Lunch Rush (12:00 – 15:00)
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20">
                                🍷 Dinner Rush (18:00 – 22:00)
                            </span>
                        </div>

                        {/* 24-hour bars */}
                        <div className="flex items-end gap-1 sm:gap-1.5 h-36 pt-4 pb-2 overflow-x-auto">
                            {data?.peakHours.map((ph) => {
                                const hPct = maxPeakCount > 0 ? Math.max((ph.count / maxPeakCount) * 100, 4) : 4;
                                const isBreakfast = ph.hour >= 8 && ph.hour <= 11;
                                const isLunch = ph.hour >= 12 && ph.hour <= 15;
                                const isDinner = ph.hour >= 18 && ph.hour <= 22;

                                let barColor = 'bg-neutral-200 dark:bg-neutral-800';
                                if (ph.count > 0) {
                                    if (isLunch) barColor = 'bg-orange-500 hover:bg-orange-400';
                                    else if (isDinner) barColor = 'bg-indigo-500 hover:bg-indigo-400';
                                    else if (isBreakfast) barColor = 'bg-amber-500 hover:bg-amber-400';
                                    else barColor = 'bg-neutral-400 dark:bg-neutral-600';
                                }

                                return (
                                    <div
                                        key={ph.hour}
                                        className="flex-1 min-w-[12px] sm:min-w-[18px] flex flex-col items-center gap-1.5 group cursor-pointer"
                                        title={`${ph.label}: ${ph.count} scans`}
                                    >
                                        <div className="w-full flex items-end justify-center h-24">
                                            <div
                                                style={{ height: `${hPct}%` }}
                                                className={cn('w-full rounded-t-sm transition-all', barColor)}
                                            />
                                        </div>
                                        <span className="text-[9px] text-neutral-400 font-medium truncate">
                                            {ph.hour % 3 === 0 ? `${ph.hour % 12 || 12}` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Audience & Device Split */}
                    <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
                        <div>
                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-indigo-500" />
                                {t('analytics.mobile_diner_insights', { defaultValue: 'Mobile Diner Breakdown' })}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('analytics.device_split_desc', { defaultValue: 'Diner operating systems & menu language toggle preference' })}
                            </p>
                        </div>

                        {/* Mobile OS Split */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                                    <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-300" />
                                    Apple iOS ({data?.devices.iosPct || 0}%)
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Google Android ({data?.devices.androidPct || 0}%)
                                </span>
                            </div>
                            <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                                <div
                                    style={{ width: `${data?.devices.iosPct || 50}%` }}
                                    className="h-full bg-slate-900 dark:bg-slate-300 transition-all duration-700"
                                />
                                <div
                                    style={{ width: `${data?.devices.androidPct || 50}%` }}
                                    className="h-full bg-emerald-500 transition-all duration-700"
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-neutral-400">
                                <span>{data?.devices.ios || 0} iPhones/iPads</span>
                                <span>{data?.devices.android || 0} Android phones</span>
                            </div>
                        </div>

                        {/* Menu Language Split */}
                        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    🇬🇧 English ({data?.languages.enPct || 0}%)
                                </span>
                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    🇪🇹 Amharic ({data?.languages.amPct || 0}%)
                                </span>
                            </div>
                            <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                                <div
                                    style={{ width: `${data?.languages.enPct || 50}%` }}
                                    className="h-full bg-blue-500 transition-all duration-700"
                                />
                                <div
                                    style={{ width: `${data?.languages.amPct || 50}%` }}
                                    className="h-full bg-amber-500 transition-all duration-700"
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-neutral-400">
                                <span>{data?.languages.en || 0} English viewers</span>
                                <span>{data?.languages.am || 0} Amharic viewers</span>
                            </div>
                        </div>

                        {/* Interactions Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold mb-1">
                                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                    {t('analytics.profile_views', { defaultValue: 'About Views' })}
                                </div>
                                <p className="text-lg font-black text-neutral-900 dark:text-white">
                                    {data?.interactions.profileViews || 0}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold mb-1">
                                    <Share2 className="w-3.5 h-3.5 text-pink-500" />
                                    {t('analytics.social_clicks', { defaultValue: 'Social Links' })}
                                </div>
                                <p className="text-lg font-black text-neutral-900 dark:text-white">
                                    {data?.summary.totalSocialClicks || 0}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 col-span-2 sm:col-span-1">
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold mb-1">
                                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                    {t('analytics.call_clicks', { defaultValue: 'Phone Clicks' })}
                                </div>
                                <p className="text-lg font-black text-neutral-900 dark:text-white">
                                    {data?.interactions.callClicks || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2 Columns: Top Performing Dishes + Customer Search Keywords ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top Dishes Leaderboard */}
                    <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                    <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                                    {t('analytics.dish_leaderboard_title', { defaultValue: 'Menu Item Engagement Leaderboard' })}
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {t('analytics.dish_leaderboard_desc', { defaultValue: 'Dishes customers click most to inspect details, ingredients, and photos' })}
                                </p>
                            </div>
                        </div>

                        {(data?.topDishes.length || 0) === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 text-xs">
                                <UtensilsCrossed className="w-8 h-8 opacity-30 mb-2" />
                                {t('analytics.no_dish_clicks', { defaultValue: 'No dish interactions recorded yet in this timeframe' })}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data?.topDishes.map((dish, idx) => (
                                    <div
                                        key={dish.id}
                                        className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                                    >
                                        <div className={cn(
                                            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                                            idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' :
                                            idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' :
                                            idx === 2 ? 'bg-amber-800/10 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                        )}>
                                            #{idx + 1}
                                        </div>

                                        {dish.imageUrl ? (
                                            <img
                                                src={dish.imageUrl}
                                                alt={dish.name}
                                                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                                <UtensilsCrossed className="w-4 h-4" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{dish.name}</p>
                                                {dish.amName && (
                                                    <span className="text-[11px] text-neutral-400 font-medium truncate hidden sm:inline">
                                                        ({dish.amName})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-neutral-400 font-medium truncate">{dish.category} • ETB {dish.price}</p>
                                        </div>

                                        <div className="w-24 sm:w-32 flex flex-col items-end flex-shrink-0">
                                            <span className="text-xs font-black text-neutral-900 dark:text-white">
                                                {dish.clicks} {t('analytics.views', { defaultValue: 'views' })}
                                            </span>
                                            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    style={{ width: `${dish.sharePct}%` }}
                                                    className="h-full bg-emerald-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Customer Search Term Demand */}
                    <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <Search className="w-4 h-4 text-[color:var(--color-brand-600)]" />
                                {t('analytics.search_demand_title', { defaultValue: 'Diner Search Terms (Unmet Demand)' })}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('analytics.search_demand_desc', { defaultValue: 'What customers type in the search bar — helps you identify trending food requests' })}
                            </p>
                        </div>

                        {(data?.topSearches.length || 0) === 0 ? (
                            <div className="flex-1 py-12 flex flex-col items-center justify-center text-neutral-400 text-xs">
                                <Search className="w-8 h-8 opacity-30 mb-2" />
                                {t('analytics.no_searches_period', { defaultValue: 'No diner searches recorded yet in this timeframe' })}
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1">
                                {data?.topSearches.map((s, idx) => (
                                    <div
                                        key={s.query}
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate capitalize">
                                                "{s.query}"
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] flex-shrink-0">
                                            {s.count} {s.count === 1 ? 'search' : 'searches'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
