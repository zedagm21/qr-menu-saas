import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Plus, Pencil, Trash2, ChevronUp, ChevronDown,
    Check, ToggleLeft, ToggleRight, Tag,
} from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from '../../hooks/useCategories';
import type { Category } from '../../types';
import { getTranslation, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategoryFormData {
    nameEn: string; descEn: string;
    nameAm: string; descAm: string;
    isActive: boolean;
}

// ─── Field style ─────────────────────────────────────────────────────────────
const fieldCls =
    'w-full h-12 lg:h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 ' +
    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 ' +
    'focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all duration-200';

// ─── Category Form (inline panel) ────────────────────────────────────────────
const CategoryForm: React.FC<{
    initial?: Category;
    onSave: (data: CategoryFormData) => void;
    onCancel: () => void;
    isSaving: boolean;
}> = ({ initial, onSave, onCancel, isSaving }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'en' | 'am'>('en');
    const [form, setForm] = useState<CategoryFormData>({
        nameEn: getTranslation(initial?.translations ?? [], 'EN'),
        descEn: getTranslation(initial?.translations ?? [], 'EN', 'description'),
        nameAm: getTranslation(initial?.translations ?? [], 'AM'),
        descAm: getTranslation(initial?.translations ?? [], 'AM', 'description'),
        isActive: initial?.isActive ?? true,
    });

    const set = (k: keyof CategoryFormData, v: string | boolean) =>
        setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="animate-fade-in-up backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-white/60 dark:border-neutral-800/90 rounded-[24px] p-5 lg:p-7 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.30)] text-left ring-1 ring-[color:var(--color-brand-500)]/20">

            {/* Gradient top bar */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[color:var(--color-brand-500)]/40 to-transparent rounded-full" />

            {/* Language tab switcher */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
                {(['en', 'am'] as const).map(lang => (
                    <button key={lang} type="button" onClick={() => setTab(lang)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200',
                            tab === lang
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700'
                                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                        )}>
                        {lang === 'en' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                    </button>
                ))}
            </div>

            {tab === 'en' ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">{t('categories.name_en')} *</label>
                        <input value={form.nameEn} onChange={e => set('nameEn', e.target.value)} className={fieldCls} placeholder={t("categories.ph_en_name")} />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">{t('categories.desc_en')}</label>
                        <input value={form.descEn} onChange={e => set('descEn', e.target.value)} className={fieldCls} placeholder={t("categories.ph_en_desc")} />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 font-ethiopic">
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">{t('categories.name_am')}</label>
                        <input value={form.nameAm} onChange={e => set('nameAm', e.target.value)} className={fieldCls} placeholder={t("categories.ph_am_name")} />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">{t('categories.desc_am')}</label>
                        <input value={form.descAm} onChange={e => set('descAm', e.target.value)} className={fieldCls} placeholder={t("categories.ph_am_desc")} />
                    </div>
                </div>
            )}

            {/* Visibility toggle */}
            <div>
                <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">{t("categories.visibility")}</label>
                <button type="button" onClick={() => set('isActive', !form.isActive)}
                    className="flex items-center gap-3 h-11 w-fit active:scale-95 transition-transform">
                    <div className={cn(
                        'w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 shadow-inner',
                        form.isActive
                            ? 'bg-[color:var(--color-brand-500)] shadow-[color:var(--color-brand-500)]/30'
                            : 'bg-neutral-200 dark:bg-neutral-700'
                    )}>
                        <div className={cn(
                            'bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300',
                            form.isActive ? 'translate-x-5' : 'translate-x-0'
                        )} />
                    </div>
                    <span className={cn(
                        'text-[13px] font-bold transition-colors',
                        form.isActive ? 'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-500)]' : 'text-neutral-400 dark:text-neutral-500'
                    )}>
                        {form.isActive ? t('categories.status_active') : t('categories.status_hidden')}
                    </span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                    variant="primary"
                    className="h-12 lg:h-11 w-full sm:w-auto"
                    isLoading={isSaving}
                    onClick={() => onSave(form)}
                    icon={<Check className="w-4 h-4" />}
                >
                    {t('actions.save')}
                </Button>
                <Button
                    className="h-12 lg:h-11 w-full sm:w-auto dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    variant="outline"
                    onClick={onCancel}
                >
                    {t('actions.cancel')}
                </Button>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CategoriesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data: categories, isLoading } = useCategories();
    const { mutate: create, isPending: creating } = useCreateCategory();
    const { mutate: update, isPending: updating } = useUpdateCategory();
    const { mutate: remove } = useDeleteCategory();
    const { mutate: reorder } = useReorderCategories();

    const [editing, setEditing] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const buildTranslations = (form: CategoryFormData) => {
        const tr = [];
        if (form.nameEn) tr.push({ language: 'EN', name: form.nameEn, description: form.descEn || undefined });
        if (form.nameAm) tr.push({ language: 'AM', name: form.nameAm, description: form.descAm || undefined });
        return tr;
    };

    const handleSave = (form: CategoryFormData) => {
        if (editing === 'new') {
            create({ translations: buildTranslations(form), isActive: form.isActive }, { onSuccess: () => setEditing(null) });
        } else if (editing) {
            update({ id: editing, data: { translations: buildTranslations(form), isActive: form.isActive } }, { onSuccess: () => setEditing(null) });
        }
    };

    const handleMove = (cats: Category[], idx: number, dir: -1 | 1) => {
        const arr = [...cats];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        reorder(arr.map((c, i) => ({ id: c.id, displayOrder: i })));
    };

    const cats = Array.isArray(categories)
        ? [...categories].sort((a, b) => a.displayOrder - b.displayOrder)
        : [];

    return (
        <>
            <Helmet><title>{t('categories.title')} — QR Menu</title></Helmet>
            <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/90 dark:to-neutral-900 transition-colors duration-200 p-4 lg:p-10 max-w-3xl mx-auto pb-24 lg:pb-12">

                {/* ── Page header ── */}
                <div className="animate-fade-in-up delay-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('categories.title')}</h1>
                        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mt-1">{t("categories.organize_desc")}</p>
                    </div>
                    {!editing && cats.length > 0 && (
                        <Button
                            variant="primary"
                            className="hidden sm:flex h-11 px-6 hover:-translate-y-0.5 transition-transform"
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => setEditing('new')}
                        >
                            {t('categories.add')}
                        </Button>
                    )}
                </div>

                {/* ── New category form ── */}
                {editing === 'new' && (
                    <div className="mb-6 relative">
                        <CategoryForm onSave={handleSave} onCancel={() => setEditing(null)} isSaving={creating} />
                    </div>
                )}

                {/* ── Category list or empty state ── */}
                {isLoading ? (
                    <SkeletonList count={4} />
                ) : cats.length === 0 && editing !== 'new' ? (
                    /* ─ Empty state ─ */
                    <div className="animate-fade-in-up delay-75 flex flex-col items-center justify-center py-24 text-center">
                        <div className="animate-bounce text-6xl mb-6 select-none">📋</div>
                        <h3 className="text-[22px] font-extrabold text-neutral-800 dark:text-neutral-200 tracking-tight mb-2">{t('categories.empty')}</h3>
                        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-8 max-w-xs leading-relaxed">{t('categories.empty_hint')}</p>
                        <Button
                            variant="primary"
                            className="h-12 px-8 text-[15px]"
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => setEditing('new')}
                        >
                            {t('categories.add')}
                        </Button>
                    </div>
                ) : (
                    <div className="animate-fade-in-up delay-75 flex flex-col gap-3">
                        {cats.map((cat, idx) => (
                            <div key={cat.id}>
                                {editing === cat.id ? (
                                    <div className="relative">
                                        <CategoryForm initial={cat} onSave={handleSave} onCancel={() => setEditing(null)} isSaving={updating} />
                                    </div>
                                ) : deletingId === cat.id ? (
                                    <ConfirmDialog
                                        isOpen={true}
                                        onClose={() => setDeletingId(null)}
                                        onConfirm={() => { remove(cat.id); setDeletingId(null); }}
                                        title={t('actions.delete')}
                                        description={t('actions.deleteCategoryDesc')}
                                        confirmText={t('actions.delete')}
                                    />
                                ) : (
                                    /* ─ Category card ─ */
                                    <div
                                        style={{ animationDelay: `${idx * 50 + 75}ms` }}
                                        className={cn(
                                            'animate-fade-in-up group relative flex items-stretch overflow-hidden',
                                            'backdrop-blur-md bg-white/80 dark:bg-neutral-900/90 border border-white/70 dark:border-neutral-800/80',
                                            'rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
                                            'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
                                            'hover:shadow-[color:var(--color-brand-500)]/[0.08] dark:hover:shadow-[color:var(--color-brand-500)]/[0.15]',
                                            'transition-all duration-250',
                                            !cat.isActive && 'opacity-70 dark:opacity-60',
                                        )}
                                    >
                                        {/* Colored left border */}
                                        <div className={cn(
                                            'w-1.5 flex-shrink-0 rounded-l-[20px] transition-all duration-300',
                                            cat.isActive
                                                ? 'bg-gradient-to-b from-[color:var(--color-brand-400)] to-[color:var(--color-accent-500)]'
                                                : 'bg-neutral-200 dark:bg-neutral-700'
                                        )} />

                                        {/* Reorder arrows — fade in on hover */}
                                        <div className="flex flex-col w-12 sm:w-14 bg-neutral-50/60 dark:bg-neutral-900/60 border-r border-neutral-100/80 dark:border-neutral-800/80 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => handleMove(cats, idx, -1)}
                                                disabled={idx === 0}
                                                className="flex-1 min-h-[44px] flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all duration-150"
                                            >
                                                <ChevronUp className="w-5 h-5" />
                                            </button>
                                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 w-full" />
                                            <button
                                                onClick={() => handleMove(cats, idx, 1)}
                                                disabled={idx === cats.length - 1}
                                                className="flex-1 min-h-[44px] flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all duration-150"
                                            >
                                                <ChevronDown className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex items-center gap-3 p-4 sm:p-5">
                                            {/* Category icon */}
                                            <div className={cn(
                                                'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm',
                                                cat.isActive
                                                    ? 'bg-gradient-to-br from-[color:var(--color-brand-50)] to-[color:var(--color-accent-50)] dark:from-[color:var(--color-brand-500)]/20 dark:to-[color:var(--color-accent-500)]/10 text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)]'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                                            )}>
                                                <Tag className="w-4 h-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-[15px] sm:text-[17px] font-extrabold text-neutral-900 dark:text-neutral-50 truncate tracking-tight">
                                                        {getTranslation(cat.translations, i18n.language)}
                                                    </h3>
                                                    {!cat.isActive && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 px-2 py-0.5 rounded-full flex-shrink-0">
                                                            {t('categories.status_hidden')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1 pr-3 sm:pr-4 flex-shrink-0">
                                            {/* Visibility toggle */}
                                            <button
                                                onClick={() => update({ id: cat.id, data: { isActive: !cat.isActive } })}
                                                title={cat.isActive ? 'Hide Category' : 'Show Category'}
                                                className={cn(
                                                    'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90',
                                                    cat.isActive
                                                        ? 'text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10'
                                                        : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300'
                                                )}
                                            >
                                                {cat.isActive
                                                    ? <ToggleRight className="w-6 h-6" />
                                                    : <ToggleLeft className="w-6 h-6" />
                                                }
                                            </button>
                                            {/* Edit */}
                                            <button
                                                onClick={() => setEditing(cat.id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90 transition-all duration-200"
                                            >
                                                <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeletingId(cat.id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all duration-200"
                                            >
                                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Desktop "Add more" button below list */}
                        {!editing && cats.length > 0 && (
                            <div className="hidden lg:flex justify-start mt-2">
                                <Button
                                    variant="outline"
                                    className="h-11 px-6 hover:-translate-y-0.5 transition-transform dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setEditing('new')}
                                >
                                    {t('categories.add')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Mobile FAB ── */}
                {!editing && cats.length > 0 && (
                    <div className="fixed bottom-20 right-5 lg:hidden z-40">
                        <button
                            onClick={() => setEditing('new')}
                            className="w-14 h-14 rounded-full bg-[color:var(--color-brand-500)] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all duration-200 hover:scale-105"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CategoriesPage;
