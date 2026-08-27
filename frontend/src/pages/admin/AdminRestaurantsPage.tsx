import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Store, Search, ExternalLink, ShieldAlert,
    ShieldCheck, Eye, Trash2, RefreshCw, AlertTriangle,
    SlidersHorizontal, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { useAdminRestaurants, useUpdateRestaurantAccess, useDeleteRestaurant } from '../../hooks/useAdmin';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { AdminRestaurantItem } from '../../types';

export default function AdminRestaurantsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);

    // Selected restaurant for access modal
    const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurantItem | null>(null);
    const [modalIsSuspended, setModalIsSuspended] = useState(false);
    const [modalReason, setModalReason] = useState('');
    const [modalStatus, setModalStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

    // Delete restaurant state
    const [deleteTarget, setDeleteTarget] = useState<AdminRestaurantItem | null>(null);

    const { data, isLoading, refetch, isFetching } = useAdminRestaurants({
        page,
        limit: 20,
        search,
        status: statusFilter,
    });

    const { mutate: updateAccess, isPending: isUpdatingAccess } = useUpdateRestaurantAccess();
    const { mutate: deleteRestaurant, isPending: isDeleting } = useDeleteRestaurant();

    const handleOpenAccessModal = (r: AdminRestaurantItem) => {
        setSelectedRestaurant(r);
        setModalIsSuspended(r.isSuspended);
        setModalReason(r.suspensionReason || '');
        setModalStatus(r.status);
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
                },
            },
            {
                onSuccess: () => {
                    toast.success(
                        modalIsSuspended
                            ? `🔒 Access suspended for "${selectedRestaurant.name}"`
                            : `✅ Access restored for "${selectedRestaurant.name}"`
                    );
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

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                            { id: 'ALL', label: 'All' },
                            { id: 'PUBLISHED', label: 'Live' },
                            { id: 'DRAFT', label: 'Draft' },
                            { id: 'SUSPENDED', label: 'Suspended' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                                    statusFilter === tab.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-slate-200'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
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

                                            {/* Owner */}
                                            <td className="py-3.5 px-4">
                                                {r.owner ? (
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-200 truncate">{r.owner.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{r.owner.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">No owner linked</span>
                                                )}
                                            </td>

                                            {/* Access Status */}
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    {r.isSuspended ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                            <ShieldAlert className="w-3 h-3" /> Suspended
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            <ShieldCheck className="w-3 h-3" /> Active
                                                        </span>
                                                    )}
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            Menu: {r.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                                                        </span>
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
