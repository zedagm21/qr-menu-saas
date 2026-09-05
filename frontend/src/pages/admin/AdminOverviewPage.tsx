import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Store, Users, QrCode, UtensilsCrossed,
    TrendingUp, ShieldAlert, CheckCircle2,
    Calendar, ArrowUpRight, Activity, Clock,
    Megaphone, Radio, BellRing, Sparkles, Trophy
} from 'lucide-react';
import { useAdminOverview, useAdminBroadcast, useSetBroadcast } from '../../hooks/useAdmin';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminOverviewPage() {
    const { t } = useTranslation();
    const { data, isLoading } = useAdminOverview();
    const { data: broadcastData } = useAdminBroadcast();
    const { mutate: setBroadcast, isPending: isSettingBroadcast } = useSetBroadcast();

    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success'>('info');
    const [broadcastActive, setBroadcastActive] = useState(true);

    useEffect(() => {
        if (broadcastData) {
            setBroadcastTitle(broadcastData.title);
            setBroadcastMessage(broadcastData.message);
            setBroadcastType(broadcastData.type);
            setBroadcastActive(broadcastData.isActive);
        }
    }, [broadcastData]);

    const handleSaveBroadcast = () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            toast.error('Please provide both title and message');
            return;
        }

        setBroadcast(
            {
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim(),
                type: broadcastType,
                isActive: broadcastActive,
            },
            {
                onSuccess: () => {
                    toast.success(
                        broadcastActive
                            ? '📢 Global announcement is now LIVE across all dashboards!'
                            : 'Announcement updated (currently inactive)'
                    );
                    setIsBroadcastModalOpen(false);
                },
                onError: () => {
                    toast.error('Failed to update broadcast announcement');
                },
            }
        );
    };

    const maxTimelineSignups = Math.max(
        ...(data?.signupTimeline.map(s => Math.max(s.users, s.restaurants)) || [1]),
        1
    );

    return (
        <>
            <Helmet><title>Super Admin Overview — OurMenu</title></Helmet>

            <div className="space-y-8 animate-fade-in">
                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                                Platform Control
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Platform Health & System Metrics
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                            Global overview across all restaurants, user signups, menu items, and diner traffic.
                        </p>
                    </div>

                    {/* Quick navigation pills */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/admin/restaurants"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                        >
                            <Store className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Manage Restaurants</span>
                        </Link>
                        <Link
                            to="/admin/users"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
                        >
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <span>User Directory</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className={cn(
                                'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2',
                                broadcastData?.isActive
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                            )}
                        >
                            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                            <span>Broadcast Banner</span>
                            {broadcastData?.isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                        </button>
                    </div>
                </div>

                {/* ── 4 Top KPI Cards ── */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Restaurants Card */}
                        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Store className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {data?.restaurants.published || 0} Live
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Restaurants</p>
                            <p className="text-3xl font-black text-white mt-1">{data?.restaurants.total || 0}</p>
                            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                                <span>{data?.restaurants.draft || 0} Draft</span>
                                <span className={cn(
                                    'font-bold',
                                    (data?.restaurants.suspended || 0) > 0 ? 'text-rose-400' : 'text-slate-500'
                                )}>
                                    {data?.restaurants.suspended || 0} Suspended
                                </span>
                            </div>
                        </div>

                        {/* Users Card */}
                        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {Math.round(((data?.users.verified || 0) / Math.max(data?.users.total || 1, 1)) * 100)}% Verified
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Platform Users</p>
                            <p className="text-3xl font-black text-white mt-1">{data?.users.total || 0}</p>
                            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                                <span>{data?.users.verified || 0} Verified</span>
                                <span>{data?.users.unverified || 0} Unverified</span>
                            </div>
                        </div>

                        {/* Platform Scans */}
                        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    +{data?.scans.today || 0} Today
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Diner Scans</p>
                            <p className="text-3xl font-black text-white mt-1">{data?.scans.total.toLocaleString() || 0}</p>
                            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                                <span>{data?.scans.week.toLocaleString() || 0} This Week</span>
                                <span>All-Time Global</span>
                            </div>
                        </div>

                        {/* Total Catalog Items */}
                        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                    <UtensilsCrossed className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {data?.catalog.totalCategories || 0} Categories
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Menu Items</p>
                            <p className="text-3xl font-black text-white mt-1">{data?.catalog.totalItems.toLocaleString() || 0}</p>
                            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                                <span>{data?.catalog.totalCategories || 0} Categories</span>
                                <span>Platform wide</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 30-Day Platform Signups Growth Chart ── */}
                <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-400" />
                                30-Day Platform Growth & Signups
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Daily new accounts registered across OurMenu
                            </p>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-indigo-400">
                                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Users Joined
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Restaurants Created
                            </span>
                        </div>
                    </div>

                    {/* Timeline Bars */}
                    <div className="flex items-end gap-1.5 sm:gap-2 h-44 pt-6 pb-2 px-2 overflow-x-auto">
                        {data?.signupTimeline.map((item) => {
                            const userHeight = maxTimelineSignups > 0 ? Math.max((item.users / maxTimelineSignups) * 100, 4) : 4;
                            const restHeight = maxTimelineSignups > 0 ? Math.max((item.restaurants / maxTimelineSignups) * 100, 4) : 4;

                            return (
                                <div
                                    key={item.date}
                                    className="flex-1 min-w-[22px] flex flex-col items-center gap-2 group cursor-pointer"
                                    title={`${item.date}: ${item.users} users, ${item.restaurants} restaurants`}
                                >
                                    <div className="w-full flex items-end justify-center gap-0.5 h-32">
                                        <div
                                            style={{ height: `${userHeight}%` }}
                                            className={cn(
                                                'w-1/2 rounded-t-sm transition-all',
                                                item.users > 0 ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-slate-800'
                                            )}
                                        />
                                        <div
                                            style={{ height: `${restHeight}%` }}
                                            className={cn(
                                                'w-1/2 rounded-t-sm transition-all',
                                                item.restaurants > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-slate-800'
                                            )}
                                        />
                                    </div>
                                    <span className="text-[9px] text-slate-500 group-hover:text-slate-300 truncate w-full text-center">
                                        {item.date.slice(8)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── 2 Columns: Top Restaurants Leaderboard + Recent Audit Stream ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top Performing Restaurants by Diner Foot Traffic */}
                    <div className="lg:col-span-6 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        Top Restaurants by Foot Traffic
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Highest diner QR scans across the platform
                                    </p>
                                </div>
                                <Link
                                    to="/admin/restaurants"
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                >
                                    <span>All</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {(data?.topRestaurants.length || 0) === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-500">
                                    No diner scans recorded across restaurants yet
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/80">
                                    {data?.topRestaurants.map((restaurant, idx) => (
                                        <div key={restaurant.id} className="py-3 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={cn(
                                                    'w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center flex-shrink-0',
                                                    idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                    idx === 1 ? 'bg-slate-700 text-slate-200' :
                                                    idx === 2 ? 'bg-amber-900/30 text-amber-400' :
                                                    'bg-slate-800 text-slate-400'
                                                )}>
                                                    #{idx + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-white truncate">{restaurant.name}</p>
                                                        <span className={cn(
                                                            'text-[10px] font-black px-2 py-0.5 rounded-full uppercase',
                                                            restaurant.tier === 'PRO' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                            restaurant.tier === 'STARTER' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                        )}>
                                                            {restaurant.tier.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        /{restaurant.slug} {restaurant.city ? `• ${restaurant.city}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-black text-indigo-400">{restaurant.scans.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-500">total scans</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Platform Audit Activities */}
                    <div className="lg:col-span-6 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-purple-400" />
                                        Recent Platform Activity Stream
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Live audit trail of registration, status changes, and administrative actions
                                    </p>
                                </div>
                                <Link
                                    to="/admin/activity"
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                >
                                    <span>Log</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {(data?.recentAudits.length || 0) === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-500">
                                    No audit activities recorded yet
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/80">
                                    {data?.recentAudits.map((log) => (
                                        <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase flex-shrink-0',
                                                    log.action.includes('SUSPEND') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                    log.action.includes('ACTIVATE') || log.action.includes('VERIFIED') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                    log.action.includes('REGISTER') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                    log.action.includes('BROADCAST') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                    'bg-slate-800 text-slate-300'
                                                )}>
                                                    {log.action}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-200 truncate">
                                                        {log.user?.name ? `${log.user.name} (${log.user.email})` : log.restaurant?.name || 'System'}
                                                    </p>
                                                    {log.details && (
                                                        <p className="text-[11px] text-slate-400 truncate">
                                                            {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[11px] text-slate-500 flex-shrink-0 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Broadcast Announcement Modal ── */}
                <Modal
                    isOpen={isBroadcastModalOpen}
                    onClose={() => setIsBroadcastModalOpen(false)}
                    title="Platform Broadcast Announcement"
                >
                    <div className="space-y-4">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Broadcast an announcement banner directly to all restaurant owners inside their dashboard. Useful for new feature updates, scheduled maintenance, or holiday wishes.
                        </p>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                Announcement Title
                            </label>
                            <input
                                type="text"
                                value={broadcastTitle}
                                onChange={(e) => setBroadcastTitle(e.target.value)}
                                placeholder="e.g. Scheduled System Maintenance"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                Message Body
                            </label>
                            <textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                rows={3}
                                placeholder="e.g. We will be performing server upgrades on Sunday at 2:00 AM. Menus will remain accessible to diners."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                Banner Tone
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'info', label: 'Info (Blue)', color: 'border-blue-500 text-blue-600 dark:text-blue-400' },
                                    { id: 'warning', label: 'Alert (Amber)', color: 'border-amber-500 text-amber-600 dark:text-amber-400' },
                                    { id: 'success', label: 'Notice (Green)', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400' },
                                ].map((tone) => (
                                    <button
                                        key={tone.id}
                                        type="button"
                                        onClick={() => setBroadcastType(tone.id as any)}
                                        className={cn(
                                            'py-2 px-2.5 rounded-xl text-xs font-bold border transition-all',
                                            broadcastType === tone.id
                                                ? cn('bg-neutral-100 dark:bg-neutral-700 ring-2 ring-offset-1 dark:ring-offset-neutral-900', tone.color)
                                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        {tone.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="pt-2">
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Live Preview on Owner Dashboard:</p>
                            <div className={cn(
                                'p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 shadow-sm',
                                broadcastType === 'warning'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                    : broadcastType === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                            )}>
                                <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">{broadcastTitle || 'Announcement Title'}</p>
                                    <p className="opacity-90 mt-0.5">{broadcastMessage || 'Announcement message preview will appear here.'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Active switch */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                            <div>
                                <p className="text-xs font-bold text-neutral-800 dark:text-white">Active Status</p>
                                <p className="text-[11px] text-neutral-400">Toggle whether this announcement is currently shown to owners</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBroadcastActive(!broadcastActive)}
                                className={cn(
                                    'w-11 h-6 flex items-center rounded-full p-1 transition-colors',
                                    broadcastActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                                )}
                            >
                                <div className={cn(
                                    'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform',
                                    broadcastActive ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsBroadcastModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveBroadcast}
                                isLoading={isSettingBroadcast}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                                Save & Publish Banner
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}
