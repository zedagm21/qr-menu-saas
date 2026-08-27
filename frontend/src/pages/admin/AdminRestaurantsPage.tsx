import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Store, Search, ExternalLink, ShieldAlert,
    ShieldCheck, Eye, Trash2, RefreshCw, AlertTriangle,
    SlidersHorizontal, CheckCircle2, ChevronRight, X,
    Phone, Mail, MessageSquare, CreditCard, Sparkles
} from 'lucide-react';
import { useAdminRestaurants, useUpdateRestaurantAccess, useDeleteRestaurant } from '../../hooks/useAdmin';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { AdminRestaurantItem, SubscriptionTier } from '../../types';

function getTierBadge(r: AdminRestaurantItem) {
    const now = new Date();
    const expiresAt = r.subscriptionExpiresAt ? new Date(r.subscriptionExpiresAt) : null;
    const isExpired = expiresAt ? expiresAt < now : false;
    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (r.subscriptionTier === 'PRO') {
        return {
            label: 'Pro',
            sublabel: isExpired ? 'Expired' : daysLeft !== null ? `${daysLeft}d left` : 'Active',
            color: isExpired
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            isExpired,
        };
    }
    if (r.subscriptionTier === 'STARTER') {
        return {
            label: 'Starter',
            sublabel: isExpired ? 'Expired' : daysLeft !== null ? `${daysLeft}d left` : 'Active',
            color: isExpired
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            isExpired,
        };
    }
    return {
        label: 'Free Trial',
        sublabel: isExpired ? 'Trial Expired' : daysLeft !== null ? `${daysLeft}d left` : 'Active',
        color: isExpired
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        isExpired,
    };
}

export default function AdminRestaurantsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [tierFilter, setTierFilter] = useState('ALL');
    const [page, setPage] = useState(1);

    // Selected restaurant for access modal
    const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurantItem | null>(null);
    const [modalIsSuspended, setModalIsSuspended] = useState(false);
    const [modalReason, setModalReason] = useState('');
    const [modalStatus, setModalStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
    const [modalTier, setModalTier] = useState<SubscriptionTier>('FREE_TRIAL');
    const [modalExpiresAt, setModalExpiresAt] = useState<string | null>(null);

    // Delete restaurant state
    const [deleteTarget, setDeleteTarget] = useState<AdminRestaurantItem | null>(null);

    const { data, isLoading, refetch, isFetching } = useAdminRestaurants({
        page,
        limit: 20,
        search,
        status: statusFilter,
        tier: tierFilter !== 'ALL' ? tierFilter : undefined,
    });

    const { mutate: updateAccess, isPending: isUpdatingAccess } = useUpdateRestaurantAccess();
    const { mutate: deleteRestaurant, isPending: isDeleting } = useDeleteRestaurant();

    const handleOpenAccessModal = (r: AdminRestaurantItem) => {
        setSelectedRestaurant(r);
        setModalIsSuspended(r.isSuspended);
        setModalReason(r.suspensionReason || '');
        setModalStatus(r.status);
        setModalTier(r.subscriptionTier || 'FREE_TRIAL');
        setModalExpiresAt(r.subscriptionExpiresAt || null);
    };

    const handleSaveAccess = () => {
        if (!selectedRestaurant) return;

        updateAccess(
            {
                id: selectedRestaurant.id,
                data: {
                    isSuspended: modalIsSuspended,
                    suspensionReason: modalIsSuspended ? modalReason : null,
                    status: modalStatus,
                    subscriptionTier: modalTier,
                    subscriptionExpiresAt: modalExpiresAt,
                },
            },
            {
                onSuccess: () => {
                    toast.success(`✅ Settings updated for "${selectedRestaurant.name}"`);
                    setSelectedRestaurant(null);
                },
                onError: () => {
                    toast.error('Failed to update restaurant access');
                },
            }
        );
    };

    const handleImpersonate = (r: AdminRestaurantItem) => {
        localStorage.setItem('admin_impersonating_restaurant_id', r.id);
        localStorage.setItem('admin_impersonating_restaurant_name', r.name);
        toast.success(`👑 Entering "${r.name}" dashboard in Admin Mode`, { icon: '👑' });
        navigate('/dashboard');
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        deleteRestaurant(deleteTarget.id, {
            onSuccess: () => {
                toast.success(`Restaurant "${deleteTarget.name}" deleted successfully`);
                setDeleteTarget(null);
            },
            onError: () => {
                toast.error('Failed to delete restaurant');
            },
        });
    };

    return (
        <>
            <Helmet><title>Manage Restaurants — Super Admin</title></Helmet>

            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                <Store className="w-6 h-6" />
                            </span>
                            Restaurant Directory & Access Control
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                            Monitor all registered restaurants, grant or suspend access with custom notices, and enter restaurants as Super Admin.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin text-indigo-400')} />
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
                            placeholder="Search by name, slug, owner email, city..."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                        />
                    </div>

                    {/* Status & Tier Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: 'ALL', label: 'All Status' },
                                { id: 'PUBLISHED', label: 'Live' },
                                { id: 'DRAFT', label: 'Draft' },
                                { id: 'SUSPENDED', label: 'Suspended' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                                    className={cn(
                                        'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                                        statusFilter === tab.id
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: 'ALL', label: 'All Tiers' },
                                { id: 'FREE_TRIAL', label: 'Trial' },
                                { id: 'STARTER', label: 'Starter' },
                                { id: 'PRO', label: 'Pro' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => { setTierFilter(tab.id); setPage(1); }}
                                    className={cn(
                                        'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                                        tierFilter === tab.id
                                            ? 'bg-purple-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (data?.data.length || 0) === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            <Store className="w-10 h-10 opacity-30 mx-auto mb-2" />
                            No restaurants found matching your criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-3.5 px-4">Restaurant</th>
                                        <th className="py-3.5 px-4">Owner / Contact</th>
                                        <th className="py-3.5 px-4">Access Status</th>
                                        <th className="py-3.5 px-4">Catalog & Traffic</th>
                                        <th className="py-3.5 px-4">Registered Date</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {data?.data.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                                            {/* Restaurant info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    {r.logoUrl ? (
                                                        <img src={r.logoUrl} alt={r.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-indigo-400 flex-shrink-0">
                                                            {r.name[0]}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white truncate">{r.name}</p>
                                                        <a
                                                            href={`/r/${r.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium mt-0.5"
                                                        >
                                                            <span>/r/{r.slug}</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Owner & Quick Contact */}
                                            <td className="py-3.5 px-4">
                                                {r.owner ? (
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-200 truncate">{r.owner.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{r.owner.email}</p>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            {r.phone && (
                                                                <a
                                                                    href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                    title={`WhatsApp ${r.phone}`}
                                                                >
                                                                    <MessageSquare className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                            {r.phone && (
                                                                <a
                                                                    href={`tel:${r.phone}`}
                                                                    className="p-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                                    title={`Call ${r.phone}`}
                                                                >
                                                                    <Phone className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                            {(r.owner?.email || r.email) && (
                                                                <a
                                                                    href={`mailto:${r.owner?.email || r.email}?subject=Regarding your menu on QR Menu SaaS`}
                                                                    className="p-1 rounded-md bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                                                    title={`Email ${r.owner?.email || r.email}`}
                                                                >
                                                                    <Mail className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">No owner linked</span>
                                                )}
                                            </td>

                                            {/* Access Status & Subscription Tier */}
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1.5">
                                                    <div>
                                                        {r.isSuspended ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                                <ShieldAlert className="w-3 h-3" /> Suspended
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                <ShieldCheck className="w-3 h-3" /> Active
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {(() => {
                                                            const badge = getTierBadge(r);
                                                            return (
                                                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border', badge.color)}>
                                                                    <CreditCard className="w-2.5 h-2.5" />
                                                                    {badge.label} • {badge.sublabel}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Catalog & Traffic */}
                                            <td className="py-3.5 px-4">
                                                <div className="text-slate-300 font-medium">
                                                    <span className="font-bold text-white">{r.itemCount}</span> items ({r.categoryCount} cats)
                                                </div>
                                                <div className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                                                    {r.scanCount.toLocaleString()} scans
                                                </div>
                                            </td>

                                            {/* Registered Date */}
                                            <td className="py-3.5 px-4 text-slate-400">
                                                <p className="font-medium text-slate-300">
                                                    {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Manage Access Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAccessModal(r)}
                                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                                                        title="Manage Access & Suspension"
                                                    >
                                                        Access
                                                    </button>

                                                    {/* Impersonate Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImpersonate(r)}
                                                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                                        title="Enter Dashboard in Super Admin Mode"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        <span>Manage</span>
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(r)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        title="Delete restaurant"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {(data?.pagination.totalPages || 0) > 1 && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                Page {data?.pagination.page} of {data?.pagination.totalPages} ({data?.pagination.total} restaurants)
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

            {/* ── Access Management Modal ── */}
            {selectedRestaurant && (
                <Modal
                    isOpen={!!selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    title={`Manage Access — ${selectedRestaurant.name}`}
                >
                    <div className="space-y-5 text-neutral-800 dark:text-neutral-200">
                        {/* Suspension Toggle */}
                        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold">Restaurant Access State</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        When suspended, diner menus display a polite "Temporarily Unavailable" screen and dashboard editing is locked in read-only.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setModalIsSuspended(!modalIsSuspended)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all',
                                        modalIsSuspended
                                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                            : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                    )}
                                >
                                    {modalIsSuspended ? 'Suspended' : 'Active'}
                                </button>
                            </div>

                            {modalIsSuspended && (
                                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 animate-fade-in">
                                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                        Suspension Reason (displayed on restaurant owner dashboard):
                                    </label>
                                    <textarea
                                        value={modalReason}
                                        onChange={(e) => setModalReason(e.target.value)}
                                        rows={3}
                                        placeholder="e.g. Account suspended due to overdue subscription or terms review. Please contact support."
                                        className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:outline-none focus:border-rose-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Subscription Plan Tier & Expiration */}
                        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-3">
                            <div>
                                <p className="text-sm font-bold">Subscription Plan Tier</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Assign or upgrade the restaurant's SaaS tier.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'FREE_TRIAL', label: 'Free Trial', color: 'border-blue-500 text-blue-600 dark:text-blue-400' },
                                    { id: 'STARTER', label: 'Starter', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400' },
                                    { id: 'PRO', label: 'Pro', color: 'border-purple-500 text-purple-600 dark:text-purple-400' },
                                ].map((tier) => (
                                    <button
                                        key={tier.id}
                                        type="button"
                                        onClick={() => setModalTier(tier.id as any)}
                                        className={cn(
                                            'py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center',
                                            modalTier === tier.id
                                                ? cn('bg-neutral-100 dark:bg-neutral-800 ring-2 ring-offset-1 dark:ring-offset-neutral-950 font-black', tier.color)
                                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        {tier.label}
                                    </button>
                                ))}
                            </div>

                            {/* Subscription Expiration Extension */}
                            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-neutral-600 dark:text-neutral-400">Current Expiry:</span>
                                    <span className="font-mono text-neutral-800 dark:text-neutral-200 font-bold">
                                        {modalExpiresAt ? new Date(modalExpiresAt).toLocaleDateString() : 'Never (Unlimited)'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[11px] text-neutral-400 self-center mr-1">Extend:</span>
                                    {[
                                        { label: '+14 Days', days: 14 },
                                        { label: '+30 Days', days: 30 },
                                        { label: '+90 Days', days: 90 },
                                        { label: '+1 Year', days: 365 },
                                    ].map((ext) => (
                                        <button
                                            key={ext.label}
                                            type="button"
                                            onClick={() => {
                                                const base = modalExpiresAt ? new Date(modalExpiresAt) : new Date();
                                                const newDate = new Date(base.getTime() + ext.days * 24 * 60 * 60 * 1000);
                                                setModalExpiresAt(newDate.toISOString());
                                            }}
                                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            {ext.label}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setModalExpiresAt(null)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                                    >
                                        Clear Expiry
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Menu Status Toggle */}
                        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">Menu Publication Status</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Set whether the menu is in Draft or Published mode.
                                </p>
                            </div>
                            <select
                                value={modalStatus}
                                onChange={(e) => setModalStatus(e.target.value as any)}
                                className="text-xs font-bold p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                            >
                                <option value="PUBLISHED">Published (Live)</option>
                                <option value="DRAFT">Draft Mode</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedRestaurant(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSaveAccess}
                                isLoading={isUpdatingAccess}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirmation Dialog ── */}
            {deleteTarget && (
                <ConfirmDialog
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Restaurant Permanently?"
                    description={`Are you sure you want to delete "${deleteTarget.name}"? All menu items, categories, QR codes, and analytics will be permanently destroyed. This action cannot be undone.`}
                    confirmText="Delete Restaurant"
                    cancelText="Cancel"
                    isDestructive={true}
                />
            )}
        </>
    );
}
