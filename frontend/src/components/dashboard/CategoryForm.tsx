import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { Category } from '../../types';
import { getTranslation, cn } from '../../lib/utils';
import { Button } from '../ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CategoryFormData {
    nameEn: string;
    descEn: string;
    nameAm: string;
    descAm: string;
    isActive: boolean;
}

// ─── Field style ─────────────────────────────────────────────────────────────
const fieldCls =
    'w-full h-12 lg:h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 ' +
    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 ' +
    'focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all duration-200';

// ─── Reusable Category Form ──────────────────────────────────────────────────
export const CategoryForm: React.FC<{
    initial?: Category;
    onSave: (data: CategoryFormData) => void;
    onCancel: () => void;
    isSaving: boolean;
    className?: string;
}> = ({ initial, onSave, onCancel, isSaving, className }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'en' | 'am'>('en');
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<CategoryFormData>({
        nameEn: getTranslation(initial?.translations ?? [], 'EN'),
        descEn: getTranslation(initial?.translations ?? [], 'EN', 'description'),
        nameAm: getTranslation(initial?.translations ?? [], 'AM'),
        descAm: getTranslation(initial?.translations ?? [], 'AM', 'description'),
        isActive: initial?.isActive ?? true,
    });

    const set = (k: keyof CategoryFormData, v: string | boolean) => {
        if (error && (k === 'nameEn' || k === 'nameAm') && (v as string).trim()) {
            setError(null);
        }
        setForm(f => ({ ...f, [k]: v }));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!form.nameEn.trim() && !form.nameAm.trim()) {
            setError(t('menu_items.name_required', { defaultValue: 'Please enter a category name' }));
            return;
        }
        setError(null);
        onSave(form);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-white/60 dark:border-neutral-800/90 rounded-[24px] p-5 lg:p-7 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.30)] text-left ring-1 ring-[color:var(--color-brand-500)]/20 relative',
                className
            )}
        >
            {/* Gradient top bar */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[color:var(--color-brand-500)]/40 to-transparent rounded-full" />

            {/* Language tab switcher */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
                {(['en', 'am'] as const).map(lang => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => setTab(lang)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200',
                            tab === lang
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700'
                                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                        )}
                    >
                        {lang === 'en' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                    </button>
                ))}
            </div>

            {tab === 'en' ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                            {t('categories.name_en')} *
                        </label>
                        <input
                            value={form.nameEn}
                            onChange={e => set('nameEn', e.target.value)}
                            className={cn(
                                fieldCls,
                                error && !form.nameEn.trim() && !form.nameAm.trim() && 'border-red-500 focus:ring-red-500/30'
                            )}
                            placeholder={t('categories.ph_en_name')}
                            autoFocus
                        />
                        {error && !form.nameEn.trim() && !form.nameAm.trim() && (
                            <p className="text-[12px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
                                <span>⚠️</span> {error}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                            {t('categories.desc_en')}
                        </label>
                        <input
                            value={form.descEn}
                            onChange={e => set('descEn', e.target.value)}
                            className={fieldCls}
                            placeholder={t('categories.ph_en_desc')}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 font-ethiopic">
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                            {t('categories.name_am')} *
                        </label>
                        <input
                            value={form.nameAm}
                            onChange={e => set('nameAm', e.target.value)}
                            className={cn(
                                fieldCls,
                                error && !form.nameEn.trim() && !form.nameAm.trim() && 'border-red-500 focus:ring-red-500/30'
                            )}
                            placeholder={t('categories.ph_am_name')}
                            autoFocus
                        />
                        {error && !form.nameEn.trim() && !form.nameAm.trim() && (
                            <p className="text-[12px] font-bold text-red-500 mt-1.5 flex items-center gap-1">
                                <span>⚠️</span> {error}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                            {t('categories.desc_am')}
                        </label>
                        <input
                            value={form.descAm}
                            onChange={e => set('descAm', e.target.value)}
                            className={fieldCls}
                            placeholder={t('categories.ph_am_desc')}
                        />
                    </div>
                </div>
            )}

            {/* Visibility toggle */}
            <div>
                <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
                    {t('categories.visibility')}
                </label>
                <button
                    type="button"
                    onClick={() => set('isActive', !form.isActive)}
                    className="flex items-center gap-3 h-11 w-fit active:scale-95 transition-transform"
                >
                    <div
                        className={cn(
                            'w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 shadow-inner',
                            form.isActive
                                ? 'bg-[color:var(--color-brand-500)] shadow-[color:var(--color-brand-500)]/30'
                                : 'bg-neutral-200 dark:bg-neutral-700'
                        )}
                    >
                        <div
                            className={cn(
                                'bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300',
                                form.isActive ? 'translate-x-5' : 'translate-x-0'
                            )}
                        />
                    </div>
                    <span
                        className={cn(
                            'text-[13px] font-bold transition-colors',
                            form.isActive
                                ? 'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-500)]'
                                : 'text-neutral-400 dark:text-neutral-500'
                        )}
                    >
                        {form.isActive ? t('categories.status_active') : t('categories.status_hidden')}
                    </span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                    variant="primary"
                    type="submit"
                    className="h-12 lg:h-11 w-full sm:w-auto"
                    isLoading={isSaving}
                    icon={<Check className="w-4 h-4" />}
                >
                    {t('actions.save')}
                </Button>
                <Button
                    type="button"
                    className="h-12 lg:h-11 w-full sm:w-auto dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    variant="outline"
                    onClick={onCancel}
                >
                    {t('actions.cancel')}
                </Button>
            </div>
        </form>
    );
};
