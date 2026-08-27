import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Users, Search, ShieldCheck, ShieldAlert,
    CheckCircle2, XCircle, RefreshCw, Trash2,
    Calendar, Mail, Store, Shield
} from 'lucide-react';
import { useAdminUsers, useUpdateUserRole, useVerifyUserEmail, useDeleteUser } from '../../hooks/useAdmin';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { AdminUserItem } from '../../types';

export default function AdminUsersPage() {
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [verifiedFilter, setVerifiedFilter] = useState('ALL');
    const [page, setPage] = useState(1);

    // Confirmation targets
    const [roleTarget, setRoleTarget] = useState<{ user: AdminUserItem; newRole: 'OWNER' | 'ADMIN' } | null>(null);
    const [verifyTarget, setVerifyTarget] = useState<AdminUserItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);

    const { data, isLoading, refetch, isFetching } = useAdminUsers({
        page,
        limit: 20,
        search,
        role: roleFilter,
        verified: verifiedFilter === 'ALL' ? undefined : verifiedFilter,
    });

    const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
    const { mutate: verifyEmail, isPending: isVerifying } = useVerifyUserEmail();
    const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

    const handleConfirmRoleChange = () => {
        if (!roleTarget) return;
        updateRole(
            { id: roleTarget.user.id, role: roleTarget.newRole },
            {
                onSuccess: () => {
                    toast.success(`User "${roleTarget.user.name}" role updated to ${roleTarget.newRole}`);
                    setRoleTarget(null);
                },
                onError: () => toast.error('Failed to update role'),
            }
        );
    };

    const handleConfirmVerifyEmail = () => {
        if (!verifyTarget) return;
        verifyEmail(verifyTarget.id, {
            onSuccess: () => {
                toast.success(`Email verified for "${verifyTarget.name}"`);
                setVerifyTarget(null);
            },
            onError: () => toast.error('Failed to verify email'),
        });
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        deleteUser(deleteTarget.id, {
            onSuccess: () => {
                toast.success(`User "${deleteTarget.name}" deleted`);
                setDeleteTarget(null);
            },
            onError: () => toast.error('Failed to delete user'),
        });
    };

    return (
        <>
            <Helmet><title>User Directory & Registrations — Super Admin</title></Helmet>

            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                <Users className="w-6 h-6" />
                            </span>
                            Platform User Directory & Registrations
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                            Inspect all registered SaaS users, see who registered when, manage roles, and handle verification states.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Refresh users"
                    >
                        <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin text-emerald-400')} />
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
                            placeholder="Search by user name or email..."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                        />
                    </div>

                    {/* Role & Verification Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Role Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {['ALL', 'OWNER', 'ADMIN'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => { setRoleFilter(r); setPage(1); }}
                                    className={cn(
                                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                                        roleFilter === r
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {r === 'ALL' ? 'All Roles' : r}
                                </button>
                            ))}
                        </div>

                        {/* Verified Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: 'ALL', label: 'All Status' },
                                { id: 'true', label: 'Verified' },
                                { id: 'false', label: 'Unverified' },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => { setVerifiedFilter(v.id); setPage(1); }}
                                    className={cn(
                                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                                        verifiedFilter === v.id
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (data?.data.length || 0) === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs">
                            <Users className="w-10 h-10 opacity-30 mx-auto mb-2" />
                            No users found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-3.5 px-4">User</th>
                                        <th className="py-3.5 px-4">Role</th>
                                        <th className="py-3.5 px-4">Verification</th>
                                        <th className="py-3.5 px-4">Associated Restaurant</th>
                                        <th className="py-3.5 px-4">Registered Date</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {data?.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                            {/* User info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-slate-200 flex-shrink-0">
                                                        {u.name[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-bold text-white truncate">{u.name}</p>
                                                            {u.isGoogleUser && (
                                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    Google
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="py-3.5 px-4">
                                                {u.role === 'ADMIN' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        <Shield className="w-3 h-3" /> Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                                        Owner
                                                    </span>
                                                )}
                                            </td>

                                            {/* Email Verification */}
                                            <td className="py-3.5 px-4">
                                                {u.emailVerified ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                                        <XCircle className="w-3.5 h-3.5" /> Unverified
                                                    </span>
                                                )}
                                            </td>

                                            {/* Restaurant */}
                                            <td className="py-3.5 px-4">
                                                {u.restaurant ? (
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-200 truncate">{u.restaurant.name}</p>
                                                        <span className={cn(
                                                            'text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block',
                                                            u.restaurant.isSuspended ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                                                        )}>
                                                            {u.restaurant.isSuspended ? 'Suspended' : u.restaurant.status}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">No restaurant</span>
                                                )}
                                            </td>

                                            {/* Registered When */}
                                            <td className="py-3.5 px-4 text-slate-400">
                                                <p className="font-semibold text-slate-200">
                                                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Toggle Role Button */}
                                                    {u.role === 'OWNER' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRoleTarget({ user: u, newRole: 'ADMIN' })}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
                                                            title="Promote to Admin"
                                                        >
                                                            Make Admin
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRoleTarget({ user: u, newRole: 'OWNER' })}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                                            title="Demote to Owner"
                                                        >
                                                            Remove Admin
                                                        </button>
                                                    )}

                                                    {/* Manual Verify Button if unverified */}
                                                    {!u.emailVerified && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVerifyTarget(u)}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                                                            title="Manually Verify Email"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}

                                                    {/* Email Contact Shortcut */}
                                                    <a
                                                        href={`mailto:${u.email}?subject=Support from QR Menu SaaS Admin`}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                                                        title={`Email ${u.email}`}
                                                    >
                                                        <Mail className="w-3.5 h-3.5" />
                                                    </a>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(u)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        title="Delete user"
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
                                Page {data?.pagination.page} of {data?.pagination.totalPages} ({data?.pagination.total} users)
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

            {/* Role Confirmation Dialog */}
            {roleTarget && (
                <ConfirmDialog
                    isOpen={!!roleTarget}
                    onClose={() => setRoleTarget(null)}
                    onConfirm={handleConfirmRoleChange}
                    title={`Change Role for ${roleTarget.user.name}?`}
                    description={`Are you sure you want to change ${roleTarget.user.name}'s role to ${roleTarget.newRole}? ${roleTarget.newRole === 'ADMIN' ? 'This user will gain full Super Admin privileges across the entire platform.' : 'This user will lose platform administrator privileges.'}`}
                    confirmText={`Set as ${roleTarget.newRole}`}
                    cancelText="Cancel"
                />
            )}

            {/* Email Verify Dialog */}
            {verifyTarget && (
                <ConfirmDialog
                    isOpen={!!verifyTarget}
                    onClose={() => setVerifyTarget(null)}
                    onConfirm={handleConfirmVerifyEmail}
                    title="Manually Verify Email?"
                    description={`Mark ${verifyTarget.email} as verified immediately? They will be able to log in without OTP email delivery.`}
                    confirmText="Verify Email"
                    cancelText="Cancel"
                />
            )}

            {/* Delete Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                    title="Delete User Account?"
                    description={`Are you sure you want to delete user account "${deleteTarget.email}"? This action cannot be undone.`}
                    confirmText="Delete Account"
                    cancelText="Cancel"
                    isDestructive={true}
                />
            )}
        </>
    );
}
