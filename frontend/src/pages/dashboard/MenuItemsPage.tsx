import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import toast from 'react-hot-toast';
import {
    Plus, Pencil, Trash2, X, Check, Image as ImageIcon,
    Star, Tag, UtensilsCrossed, Beef, Search, UploadCloud,
    Sparkles, GripVertical, ToggleLeft, ToggleRight, Camera,
    Smartphone, Loader2
} from 'lucide-react';
import { PhoneCameraModal } from '../../components/dashboard/PhoneCameraModal';
import { isHeicFile } from '../../lib/imageCompression';
import {
    useMenuItems,
    useCreateMenuItem,
    useUpdateMenuItem,
    useToggleItemAvailability,
    useDeleteMenuItem,
    useReorderMenuItems,
    useUploadMenuItemImage,
} from '../../hooks/useMenuItems';
import { useCategories, useCreateCategory } from '../../hooks/useCategories';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useDebounce } from '../../hooks/useDebounce';
import { compressImage } from '../../lib/imageCompression';
import type { MenuItem, Category } from '../../types';
import { CategoryForm, CategoryFormData } from '../../components/dashboard/CategoryForm';
import { getTranslation, formatCurrency, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ─── Quick Category Modal (Inline Category Creator) ───────────────────────────
const QuickCategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newCat: any) => void;
}> = ({ isOpen, onClose, onCreated }) => {
    const { t } = useTranslation();
    const { mutate: createCat, isPending } = useCreateCategory();

    const handleSave = (form: CategoryFormData) => {
        const translations = [
            { language: 'EN' as const, name: form.nameEn, description: form.descEn || undefined },
            { language: 'AM' as const, name: form.nameAm || form.nameEn, description: form.descAm || undefined },
        ];
        createCat({ translations, isActive: form.isActive }, {
            onSuccess: (createdCat: any) => {
                onCreated(createdCat);
                onClose();
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('categories.add_title', { defaultValue: 'Create New Category' })} size="md">
            <div className="p-4 sm:p-6">
                <CategoryForm
                    onSave={handleSave}
                    onCancel={onClose}
                    isSaving={isPending}
                    className="shadow-none border-0 p-0 sm:p-0 bg-transparent dark:bg-transparent ring-0"
                />
            </div>
        </Modal>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ItemForm {
    nameEn: string; descEn: string; ingredientsEn: string; allergensEn: string;
    nameAm: string; descAm: string; ingredientsAm: string; allergensAm: string;
    price: string; discountPrice: string; currency: string; categoryId: string;
    isAvailable: boolean; isFeatured: boolean; isNotFasting: boolean;
    imageUrl?: string | null;
}

// ─── Form Field Style ─────────────────────────────────────────────────────────
const inputCls =
    'w-full h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-medium text-neutral-900 dark:text-neutral-100 ' +
    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 ' +
    'focus:border-[color:var(--color-brand-500)] transition-all shadow-xs';

// ─── Item Form Panel (inside Modal) ──────────────────────────────────────────
const ItemFormPanel: React.FC<{
    initial?: MenuItem;
    categories: Category[];
    defaultCurrency?: string;
    onSave: (d: ItemForm, file: File | null) => void;
    onCancel: () => void;
    onOpenQuickCategory?: () => void;
    isSaving: boolean;
    newCategoryId?: string | null;
}> = ({ initial, categories, defaultCurrency = 'ETB', onSave, onCancel, onOpenQuickCategory, isSaving, newCategoryId }) => {
    const { t, i18n } = useTranslation();
    const [tab, setTab] = useState<'en' | 'am'>('en');
    const [dragOver, setDragOver] = useState(false);
    const [form, setForm] = useState<ItemForm>({
        nameEn: getTranslation(initial?.translations ?? [], 'EN'),
        descEn: getTranslation(initial?.translations ?? [], 'EN', 'description') ?? '',
        ingredientsEn: getTranslation(initial?.translations ?? [], 'EN', 'ingredients') ?? '',
        allergensEn: getTranslation(initial?.translations ?? [], 'EN', 'allergens') ?? '',
        nameAm: getTranslation(initial?.translations ?? [], 'AM'),
        descAm: getTranslation(initial?.translations ?? [], 'AM', 'description') ?? '',
        ingredientsAm: getTranslation(initial?.translations ?? [], 'AM', 'ingredients') ?? '',
        allergensAm: getTranslation(initial?.translations ?? [], 'AM', 'allergens') ?? '',
        price: initial?.price?.toString() ?? '',
        discountPrice: initial?.discountPrice ? initial.discountPrice.toString() : '',
        currency: initial?.currency ?? defaultCurrency,
        categoryId: initial?.categoryId ?? (categories[0]?.id ?? ''),
        imageUrl: initial?.imageUrl ?? null,
        isAvailable: initial?.isAvailable ?? true,
        isFeatured: initial?.isFeatured ?? false,
        isNotFasting: !(initial?.isFasting ?? true),
    });

    const [hasDiscountToggle, setHasDiscountToggle] = useState<boolean>(Boolean(initial?.discountPrice));

    const toggleDiscount = () => {
        if (hasDiscountToggle) {
            setHasDiscountToggle(false);
            set('discountPrice', '');
        } else {
            setHasDiscountToggle(true);
        }
    };

    const regularPriceNum = parseFloat(form.price);
    const discountPriceNum = parseFloat(form.discountPrice);
    const hasValidDiscount = !isNaN(regularPriceNum) && regularPriceNum > 0 && !isNaN(discountPriceNum) && discountPriceNum > 0 && discountPriceNum < regularPriceNum;
    const discountPercentage = hasValidDiscount ? Math.round(((regularPriceNum - discountPriceNum) / regularPriceNum) * 100) : 0;
    const savingsAmount = hasValidDiscount ? (regularPriceNum - discountPriceNum).toFixed(2) : '0';
    const discountError = form.discountPrice.trim() !== '' && !isNaN(regularPriceNum) && (!isNaN(discountPriceNum) && (discountPriceNum <= 0 || discountPriceNum >= regularPriceNum));

    React.useEffect(() => {
        if ((!form.categoryId || !categories.some(c => c.id === form.categoryId)) && categories.length > 0) {
            set('categoryId', categories[categories.length - 1].id);
        }
    }, [categories]);

    React.useEffect(() => {
        if (newCategoryId) {
            set('categoryId', newCategoryId);
        }
    }, [newCategoryId]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
    const [isPhoneCameraModalOpen, setIsPhoneCameraModalOpen] = useState(false);
    const [isConvertingPhoto, setIsConvertingPhoto] = useState(false);

    const cameraInputRef = React.useRef<HTMLInputElement>(null);
    const galleryInputRef = React.useRef<HTMLInputElement>(null);
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const set = (k: keyof ItemForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

    const handleFile = async (file: File) => {
        try {
            if (isHeicFile(file)) {
                setIsConvertingPhoto(true);
            }
            const compressed = await compressImage(file, { maxDimension: 1400, quality: 0.85 });
            setImageFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));
        } catch (err) {
            console.error('Error handling file:', err);
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } finally {
            setIsConvertingPhoto(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleCameraClick = () => {
        if (isMobile) {
            cameraInputRef.current?.click();
        } else {
            setIsPhoneCameraModalOpen(true);
        }
    };

    return (
        <div className="p-5 sm:p-7 space-y-6 animate-fade-in relative bg-white dark:bg-neutral-900 rounded-[28px]">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[color:var(--color-brand-500)]/40 to-transparent" />

            {/* ── Language tabs ── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                    {(['en', 'am'] as const).map(lang => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setTab(lang)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5',
                                tab === lang
                                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                            )}
                        >
                            <span>{lang === 'en' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}</span>
                        </button>
                    ))}
                </div>

                <span className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400">
                    {tab === 'en' ? t('restaurant.english_details') : t('restaurant.amharic_details')}
                </span>
            </div>

            {/* ── Section 1: Basic Info ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-brand-500)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        {t('menu_items.basic_info')}
                    </h3>
                </div>

                <div className="space-y-3.5">
                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {tab === 'en' ? t('menu_items.name_en') : t('menu_items.name_am')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={tab === 'en' ? form.nameEn : form.nameAm}
                            onChange={e => set(tab === 'en' ? 'nameEn' : 'nameAm', e.target.value)}
                            placeholder={tab === 'en' ? t('menu_items.ph_en_name') : t('menu_items.ph_am_name')}
                            className={cn(inputCls, tab === 'am' && 'font-ethiopic')}
                        />
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {tab === 'en' ? t('menu_items.desc_en') : t('menu_items.desc_am')}
                        </label>
                        <textarea
                            value={tab === 'en' ? form.descEn : form.descAm}
                            onChange={e => set(tab === 'en' ? 'descEn' : 'descAm', e.target.value)}
                            rows={3}
                            placeholder={tab === 'en' ? t('menu_items.ph_en_desc') : t('menu_items.ph_am_desc')}
                            className={cn(
                                'w-full p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 text-[14px] font-medium',
                                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30',
                                'focus:border-[color:var(--color-brand-500)] transition-all shadow-xs resize-none',
                                tab === 'am' && 'font-ethiopic'
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 2: Pricing & Category ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-brand-500)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('menu_items.pricing_category')}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price with Currency Selector */}
                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {t('menu_items.price')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.price}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        set('price', val);
                                    }
                                }}
                                onWheel={e => e.currentTarget.blur()}
                                placeholder="0.00"
                                className="w-full h-11 pl-4 pr-24 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[15px] font-bold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all shadow-xs"
                            />
                            <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center">
                                <select
                                    value={form.currency}
                                    onChange={e => set('currency', e.target.value)}
                                    className="h-full px-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[12px] font-black text-neutral-800 dark:text-neutral-200 shadow-xs focus:outline-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <option value="ETB">{t('currency.code', { defaultValue: 'ETB' })}</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {t('menu_items.category_label')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={form.categoryId}
                                onChange={e => {
                                    if (e.target.value === '__add_new__') {
                                        if (onOpenQuickCategory) onOpenQuickCategory();
                                    } else {
                                        set('categoryId', e.target.value);
                                    }
                                }}
                                className="w-full h-11 px-4 pr-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-bold text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all shadow-xs cursor-pointer appearance-none"
                            >
                                {categories.length === 0 ? (
                                    <option value="">{t('menu_items.select_or_create_category', { defaultValue: '-- Select or Create Category --' })}</option>
                                ) : null}
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {getTranslation(c.translations, i18n.language)}
                                    </option>
                                ))}
                                <option disabled className="text-neutral-400">──────────</option>
                                <option value="__add_new__" className="font-bold text-[color:var(--color-brand-600)]">
                                    ➕ {t('menu_items.add_new_category', { defaultValue: '+ Add New Category' })}
                                </option>
                            </select>
                            <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Discount / Promotional Price Toggle & Input */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={toggleDiscount}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-colors duration-200 relative p-0.5 focus:outline-none cursor-pointer",
                                    hasDiscountToggle ? "bg-emerald-500 shadow-sm" : "bg-neutral-300 dark:bg-neutral-700"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md",
                                        hasDiscountToggle ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </button>
                            <label onClick={toggleDiscount} className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer select-none flex items-center gap-1.5">
                                <span>🏷️</span>
                                <span>{t('menu_items.has_discount', { defaultValue: 'Apply Special Offer / Discount' })}</span>
                            </label>
                        </div>
                        {hasDiscountToggle && hasValidDiscount && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 animate-fade-in">
                                <span>🎉</span> {discountPercentage}% {t('menu_items.discount_off', { defaultValue: 'OFF' })} ({savingsAmount} {form.currency} {t('menu_items.save_amount', { defaultValue: 'saved' })})
                            </span>
                        )}
                    </div>

                    {hasDiscountToggle && (
                        <div className="space-y-1.5 animate-fade-in pl-1">
                            <label className="text-[12px] font-bold text-neutral-600 dark:text-neutral-400 block">
                                {t('menu_items.discount_price', { defaultValue: 'Discounted Selling Price' })} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={form.discountPrice}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                            set('discountPrice', val);
                                        }
                                    }}
                                    onWheel={e => e.currentTarget.blur()}
                                    placeholder={t('menu_items.discount_price_placeholder', { defaultValue: 'e.g. 150' })}
                                    autoFocus
                                    className={cn(
                                        "w-full h-11 pl-4 pr-16 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-bold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all shadow-xs",
                                        discountError && "border-red-500 focus:ring-red-500/30",
                                        hasValidDiscount && "border-emerald-500 dark:border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-500/5"
                                    )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400 dark:text-neutral-500 pointer-events-none">
                                    {form.currency}
                                </div>
                            </div>
                            {discountError && (
                                <p className="text-[12px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                    <span>⚠️</span> {t('menu_items.discount_error', { defaultValue: 'Discount price must be less than regular price' })}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Section 3: Photo Upload ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[color:var(--color-brand-500)]" />
                        <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t("menu_items.food_photo")}</h3>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">{t('menu_items.photo_hint', { defaultValue: 'PNG, JPG, WebP, HEIC · Max 5MB' })}</span>
                </div>

                {isConvertingPhoto && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] text-xs font-bold animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('menu_items.converting_heic', { defaultValue: 'Optimizing & converting HEIC photo...' })}</span>
                    </div>
                )}

                {previewUrl ? (
                    <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-sm group">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2.5 backdrop-blur-xs p-4 flex-wrap">
                            <button
                                type="button"
                                onClick={handleCameraClick}
                                className="bg-white text-neutral-900 px-3.5 py-2 text-[12px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-neutral-100 active:scale-95 transition-all"
                            >
                                <Camera className="w-3.5 h-3.5 text-[color:var(--color-brand-600)]" />
                                <span>{isMobile ? t('menu_items.take_photo', { defaultValue: 'Camera' }) : t('menu_items.phone_camera', { defaultValue: 'Phone Camera' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className="bg-white text-neutral-900 px-3.5 py-2 text-[12px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-neutral-100 active:scale-95 transition-all"
                            >
                                <UploadCloud className="w-3.5 h-3.5 text-[color:var(--color-brand-600)]" />
                                <span>{t('menu_items.change_photo', { defaultValue: 'Gallery' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setImageFile(null); setPreviewUrl(null); set('imageUrl', ''); }}
                                className="bg-red-600 text-white px-3.5 py-2 text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-lg hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('menu_items.remove_photo', { defaultValue: 'Remove' })}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={cn(
                            'relative flex flex-col items-center justify-center w-full p-5 rounded-2xl border-2 border-dashed transition-all duration-200 group overflow-hidden',
                            dragOver
                                ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 shadow-md'
                                : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-300 dark:border-neutral-700 hover:border-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-50)]/30 dark:hover:bg-[color:var(--color-brand-500)]/10'
                        )}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => {
                            e.preventDefault();
                            setDragOver(false);
                            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                        }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 shadow-xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                            <ImageIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-[color:var(--color-brand-600)] dark:group-hover:text-[color:var(--color-brand-400)]" />
                        </div>
                        <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-300 group-hover:text-[color:var(--color-brand-700)] dark:group-hover:text-[color:var(--color-brand-400)] transition-colors">
                            {t('menu_items.drop_food_image')}
                        </span>
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-medium mb-3">
                            {t('menu_items.photo_recommend', { defaultValue: 'Recommended: 800x600px square or landscape' })}
                        </span>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap justify-center">
                            <button
                                type="button"
                                onClick={handleCameraClick}
                                className="px-3.5 py-2 rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            >
                                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isMobile ? t('menu_items.take_photo', { defaultValue: 'Take Live Photo' }) : t('menu_items.take_photo_phone', { defaultValue: '📸 Take Photo with Phone' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[12px] font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                                <UploadCloud className="w-3.5 h-3.5 text-neutral-500" />
                                <span>{t('menu_items.browse_gallery', { defaultValue: 'Browse Files / Gallery' })}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Hidden File Inputs */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,image/heic,image/heif,.heic,.heif"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                />
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*,image/heic,image/heif,.heic,.heif"
                    onChange={handleImageChange}
                    className="hidden"
                />

                {/* Phone-to-Desktop QR Companion Modal */}
                <PhoneCameraModal
                    isOpen={isPhoneCameraModalOpen}
                    onClose={() => setIsPhoneCameraModalOpen(false)}
                    onPhotoReceived={(url) => {
                        setPreviewUrl(url);
                        set('imageUrl', url);
                    }}
                    itemName={form.nameEn || form.nameAm}
                />
            </div>

            {/* ── Section 4: Attribute Toggles ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-brand-500)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('menu_items.attributes_badges')}</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {/* Available */}
                    <button
                        type="button"
                        onClick={() => set('isAvailable', !form.isAvailable)}
                        className={cn(
                            'relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 gap-2',
                            form.isAvailable
                                ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                        )}
                    >
                        <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-transform',
                            form.isAvailable
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                        )}>
                            {form.isAvailable ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[2.5]" />}
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                            {form.isAvailable ? t('menu_items.available') : t('menu_items.sold_out')}
                        </span>
                    </button>

                    {/* Featured */}
                    <button
                        type="button"
                        onClick={() => set('isFeatured', !form.isFeatured)}
                        className={cn(
                            'relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 gap-2',
                            form.isFeatured
                                ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                        )}
                    >
                        <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-transform',
                            form.isFeatured
                                ? 'bg-amber-500 text-amber-950 shadow-xs'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                        )}>
                            <Star className={cn('w-4 h-4', form.isFeatured ? 'fill-amber-950' : '')} />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                            {t('menu_items.featured')}
                        </span>
                    </button>

                    {/* Not Fasting */}
                    <button
                        type="button"
                        onClick={() => set('isNotFasting', !form.isNotFasting)}
                        className={cn(
                            'relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 gap-2',
                            form.isNotFasting
                                ? 'border-orange-500 bg-orange-50/90 dark:bg-orange-500/10 text-orange-900 dark:text-orange-400 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                        )}
                    >
                        <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-transform',
                            form.isNotFasting
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                        )}>
                            <Beef className={cn('w-4 h-4', form.isNotFasting && 'fill-white')} />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide">
                            {t('menu_items.not_fasting')}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Section 5: Ingredients & Allergens ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--color-brand-500)]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('menu_items.dietary_extra')}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {tab === 'en' ? t('menu_items.key_ingredients') : t('menu_items.key_ingredients')}
                        </label>
                        <input
                            value={tab === 'en' ? form.ingredientsEn : form.ingredientsAm}
                            onChange={e => set(tab === 'en' ? 'ingredientsEn' : 'ingredientsAm', e.target.value)}
                            placeholder={tab === 'en' ? t('menu_items.ph_en_ingredients') : t('menu_items.ph_am_ingredients')}
                            className={cn(inputCls, tab === 'am' && 'font-ethiopic')}
                        />
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                            {tab === 'en' ? t('menu_items.allergen_warning') : t('menu_items.allergen_warning')}
                        </label>
                        <input
                            value={tab === 'en' ? form.allergensEn : form.allergensAm}
                            onChange={e => set(tab === 'en' ? 'allergensEn' : 'allergensAm', e.target.value)}
                            placeholder={tab === 'en' ? t('menu_items.ph_en_allergens') : t('menu_items.ph_am_allergens')}
                            className={cn(inputCls, tab === 'am' && 'font-ethiopic')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                    variant="outline"
                    className="h-11 px-6 rounded-xl border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold"
                    onClick={onCancel}
                >
                    {t('actions.cancel')}
                </Button>
                <Button
                    variant="primary"
                    className="h-11 px-8 rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold"
                    isLoading={isSaving}
                    onClick={() => onSave(form, imageFile)}
                    icon={<Check className="w-4 h-4 stroke-[2.5]" />}
                >
                    {t('actions.save')}
                </Button>
            </div>
        </div>
    );
};

// ─── Base Menu Item Card ──────────────────────────────────────────
const MenuItemCardBase: React.FC<{
    item: MenuItem;
    cats: Category[];
    onEdit: () => void;
    onDelete: () => void;
    onToggleAvailability: () => void;
    orderIndex?: number;
    isDragging?: boolean;
    dragOverlay?: boolean;
    attributes?: any;
    listeners?: any;
    setNodeRef?: any;
    style?: React.CSSProperties;
}> = ({ item, cats, onEdit, onDelete, onToggleAvailability, orderIndex, isDragging, dragOverlay, attributes, listeners, setNodeRef, style }) => {
    const { t, i18n } = useTranslation();
    const catName = getTranslation(cats.find(c => c.id === item.categoryId)?.translations ?? [], i18n.language);
    const name = getTranslation(item.translations, i18n.language);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative flex items-stretch overflow-hidden',
                'backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[22px]',
                !dragOverlay && 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
                dragOverlay && 'shadow-2xl ring-2 ring-[color:var(--color-brand-500)]/60 cursor-grabbing select-none pointer-events-none'
            )}
        >
            {/* Left status accent strip */}
            <div
                className={cn(
                    'w-1.5 flex-shrink-0 transition-colors duration-300',
                    item.isAvailable
                        ? item.isFeatured
                            ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                            : 'bg-gradient-to-b from-[color:var(--color-brand-400)] to-[color:var(--color-brand-600)]'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                )}
            />

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "flex items-center justify-center w-10 sm:w-11 bg-neutral-50/80 dark:bg-neutral-900/80 border-r border-neutral-200/60 dark:border-neutral-800/80 flex-shrink-0 cursor-grab text-neutral-400 dark:text-neutral-500 hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 transition-colors",
                    (isDragging || dragOverlay) && "cursor-grabbing bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)]"
                )}
            >
                <GripVertical className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                {/* Thumbnail with position badge */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shrink-0 shadow-sm">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={name}
                            className={cn(
                                'w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105',
                                !item.isAvailable && 'grayscale-[40%]'
                            )}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[color:var(--color-brand-50)] to-neutral-100 dark:from-[color:var(--color-brand-900)] dark:to-neutral-800">
                            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--color-brand-400)] dark:text-[color:var(--color-brand-600)]" />
                        </div>
                    )}
                    {typeof orderIndex === 'number' && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-black text-white shadow-xs">
                            #{orderIndex}
                        </span>
                    )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
                    {/* Title & Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1 sm:mb-1.5">
                        <h3 className="text-[14px] sm:text-[16px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight truncate group-hover:text-[color:var(--color-brand-600)] transition-colors min-w-0">
                            {name}
                        </h3>

                        {item.isFeatured && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 dark:text-amber-400" /> {t('menu_items.featured')}
                            </span>
                        )}

                        {item.isFasting === false && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border border-orange-200/80 dark:border-orange-500/20">
                                <Beef className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" /> {t('menu_items.not_fasting')}
                            </span>
                        )}
                    </div>

                    {/* Category & Price */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 shrink-0">
                            <Tag className="w-3 h-3" />
                            <span className="text-[11px] font-extrabold truncate max-w-[120px]">{catName}</span>
                        </div>

                        {item.discountPrice && parseFloat(item.discountPrice) < parseFloat(item.price) ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-[15px] sm:text-[16px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                    {formatCurrency(item.discountPrice, item.currency)}
                                </span>
                                <span className="text-[12px] font-bold line-through text-neutral-400 dark:text-neutral-500">
                                    {formatCurrency(item.price, item.currency)}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                    -{Math.round(((parseFloat(item.price) - parseFloat(item.discountPrice)) / parseFloat(item.price)) * 100)}%
                                </span>
                            </div>
                        ) : (
                            <div className="text-[15px] sm:text-[16px] font-black text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] tracking-tight">
                                {formatCurrency(item.price, item.currency)}
                            </div>
                        )}
                    </div>
                </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
                {/* Sliding Toggle Switch */}
                <button
                    type="button"
                    onClick={onToggleAvailability}
                    title={item.isAvailable ? t('menu_items.mark_sold_out') : t('menu_items.mark_available')}
                    className={cn(
                        'w-9 h-5 sm:w-10 sm:h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 active:scale-95 cursor-pointer focus:outline-none shrink-0 border border-neutral-200/50 dark:border-neutral-700/50',
                        item.isAvailable
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30 border-transparent'
                            : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    )}
                >
                    <div className={cn(
                        'bg-white w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full shadow-sm transition-transform duration-200 ease-out',
                        item.isAvailable ? 'translate-x-[16px] sm:translate-x-[18px]' : 'translate-x-0'
                    )} />
                </button>

                {/* Edit */}
                <button
                    onClick={onEdit}
                    title={t('menu_items.edit')}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-[color:var(--color-brand-600)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 hover:border-[color:var(--color-brand-200)] dark:hover:border-[color:var(--color-brand-500)]/30 active:scale-90 transition-all duration-150 shrink-0 shadow-xs"
                >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    title={t('menu_items.delete')}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 active:scale-90 transition-all duration-150 shrink-0 shadow-xs"
                >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </div>
            </div>
        </div>
    );
};

// ─── Sortable Menu Item Card ──────────────────────────────────────────
const SortableMenuItemCard: React.FC<{
    item: MenuItem;
    cats: Category[];
    onEdit: () => void;
    onDelete: () => void;
    onToggleAvailability: () => void;
    orderIndex?: number;
}> = (props) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return <MenuItemCardBase {...props} isDragging={isDragging} attributes={attributes} listeners={listeners} setNodeRef={setNodeRef} style={style} />;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MenuItemsPage() {
    const { t, i18n } = useTranslation();
    const { data: restaurant } = useRestaurant();
    const { data: menuItems, isLoading } = useMenuItems();
    const { data: categories } = useCategories();
    const { mutate: create, isPending: creating } = useCreateMenuItem();
    const { mutate: update, isPending: updating } = useUpdateMenuItem();
    const { mutate: toggleAvailability } = useToggleItemAvailability();
    const { mutate: remove } = useDeleteMenuItem();
    const { mutate: uploadImage } = useUploadMenuItemImage();

    const [editing, setEditing] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterCat, setFilterCat] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [quickCatOpen, setQuickCatOpen] = useState(false);
    const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [localItems, setLocalItems] = useState<MenuItem[]>([]);

    const cats = Array.isArray(categories) ? categories : [];

    // Keep local items in sync with server query when not actively dragging
    useEffect(() => {
        if (Array.isArray(menuItems) && !activeId) {
            setLocalItems([...menuItems].sort((a, b) => a.displayOrder - b.displayOrder));
        }
    }, [menuItems, activeId]);

    const items: MenuItem[] = localItems;
    const editingItem = items.find(i => i.id === editing);
    const availableCount = items.filter(i => i.isAvailable).length;

    const debouncedSearch = useDebounce(searchQuery, 300);

    const handleCategoryCreated = (newCat: any) => {
        if (newCat?.id) {
            setNewCategoryId(newCat.id);
            if (!editing) {
                setEditing('new');
            }
        }
    };

    const filtered = items
        .filter(i => filterCat === 'all' || i.categoryId === filterCat)
        .filter(i => {
            if (!debouncedSearch) return true;
            const q = debouncedSearch.toLowerCase();
            const name = getTranslation(i.translations, i18n.language).toLowerCase();
            const desc = (getTranslation(i.translations, i18n.language, 'description') ?? '').toLowerCase();
            const ingr = (getTranslation(i.translations, i18n.language, 'ingredients') ?? '').toLowerCase();
            return name.includes(q) || desc.includes(q) || ingr.includes(q);
        });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { mutate: reorderMenuItems } = useReorderMenuItems();

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeItem = localItems.find(i => i.id === active.id);
        const overItem = localItems.find(i => i.id === over.id);

        if (!activeItem || !overItem) return;

        // Reorder immediately within the same category for real-time live preview
        if (activeItem.categoryId === overItem.categoryId) {
            setLocalItems(prev => {
                const oldIndex = prev.findIndex(i => i.id === active.id);
                const newIndex = prev.findIndex(i => i.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    return arrayMove(prev, oldIndex, newIndex);
                }
                return prev;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active } = event;
        setActiveId(null);
        if (active) {
            const activeItem = localItems.find(i => i.id === active.id);
            if (activeItem) {
                const categoryItems = localItems.filter(i => i.categoryId === activeItem.categoryId);
                reorderMenuItems(categoryItems.map((item, index) => ({ id: item.id, displayOrder: index })));
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        if (Array.isArray(menuItems)) {
            setLocalItems([...menuItems].sort((a, b) => a.displayOrder - b.displayOrder));
        }
    };

    const handleSave = async (form: ItemForm, file: File | null) => {
        const parsedPrice = parseFloat(form.price);
        if (!form.price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
            toast.error(t('menu_items.price_required'));
            return;
        }

        let parsedDiscountPrice: number | null = null;
        if (form.discountPrice.trim()) {
            parsedDiscountPrice = parseFloat(form.discountPrice);
            if (isNaN(parsedDiscountPrice) || parsedDiscountPrice <= 0 || parsedDiscountPrice >= parsedPrice) {
                toast.error(t('menu_items.discount_error', { defaultValue: 'Discount price must be less than regular price' }));
                return;
            }
        }

        const translations: any[] = [];
        if (form.nameEn) translations.push({ language: 'EN', name: form.nameEn, description: form.descEn, ingredients: form.ingredientsEn, allergens: form.allergensEn });
        if (form.nameAm) translations.push({ language: 'AM', name: form.nameAm, description: form.descAm, ingredients: form.ingredientsAm, allergens: form.allergensAm });

        const payload: any = {
            translations,
            price: parsedPrice,
            discountPrice: parsedDiscountPrice,
            currency: form.currency,
            categoryId: form.categoryId,
            isAvailable: form.isAvailable,
            isFeatured: form.isFeatured,
            isFasting: !form.isNotFasting,
        };

        // If a photo was received via Phone Camera companion (already stored) or cleared
        if (!file && form.imageUrl !== undefined) {
            payload.imageUrl = form.imageUrl || null;
        }

        const compressedFile = file ? await compressImage(file, { maxDimension: 1400, quality: 0.85 }) : null;

        if (editing === 'new') {
            create(payload as any, {
                onSuccess: (res: any) => {
                    if (compressedFile) uploadImage({ id: res.id, file: compressedFile });
                    setEditing(null);
                },
            });
        } else if (editing) {
            update({ id: editing, data: payload as any }, {
                onSuccess: () => {
                    if (compressedFile) uploadImage({ id: editing, file: compressedFile });
                    setEditing(null);
                },
            });
        }
    };

    return (
        <>
            <Helmet><title>{t('menu_items.title')} — QR Menu</title></Helmet>

            <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/90 dark:to-neutral-900 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6 pb-28 lg:pb-12 transition-colors duration-200">

                {/* ── Header ── */}
                <div className="animate-fade-in-up delay-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20">
                                {t('menu_items.catalog_management')}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('menu_items.food_and_drinks')}</h1>

                        {/* Stats pill counters */}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-full text-[12px] font-medium text-neutral-600 dark:text-neutral-400 shadow-sm flex items-center gap-1.5">
                                <UtensilsCrossed className="w-3 h-3 text-[color:var(--color-brand-500)]" />
                                <span><strong className="text-neutral-900 dark:text-neutral-50 font-bold">{items.length}</strong> {t("menu_items.items_count")}</span>
                            </div>

                            <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-full text-[12px] font-medium text-neutral-600 dark:text-neutral-400 shadow-sm flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span><strong className="text-neutral-900 dark:text-neutral-50 font-bold">{availableCount}</strong> {t("menu_items.active_count")}</span>
                            </div>

                            <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-full text-[12px] font-medium text-neutral-600 dark:text-neutral-400 shadow-sm flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-blue-500" />
                                <span><strong className="text-neutral-900 dark:text-neutral-50 font-bold">{cats.length}</strong> {t("menu_items.tags_count")}</span>
                            </div>
                        </div>
                    </div>

                    {cats.length > 0 ? (
                        <Button
                            variant="primary"
                            className="hidden sm:flex h-12 px-7 rounded-2xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white hover:-translate-y-0.5 transition-all font-bold"
                            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                            onClick={() => setEditing('new')}
                        >
                            {t('menu_items.add_food_item')}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            className="h-12 px-7 rounded-2xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white hover:-translate-y-0.5 transition-all font-bold shadow-sm"
                            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                            onClick={() => setQuickCatOpen(true)}
                        >
                            {t('menu_items.create_first_category', { defaultValue: 'Create First Category' })}
                        </Button>
                    )}
                </div>

                {/* ── Search + Filter Pills ── */}
                <div className="animate-fade-in-up delay-75 space-y-3">
                    {/* Search bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400 group-focus-within:text-[color:var(--color-brand-500)] transition-colors pointer-events-none" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t("menu_items.search_ph")}
                            className={cn(
                                'w-full h-12 pl-11 pr-10 rounded-2xl text-[14px] font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
                                'backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-sm',
                                'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)] focus:border-[color:var(--color-brand-500)]/0 focus:shadow-md cursor-text',
                                'transition-all duration-200',
                                i18n.language === 'am' && 'font-ethiopic'
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Category filter pills */}
                    {cats.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                            {/* All Items */}
                            <button
                                onClick={() => setFilterCat('all')}
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer',
                                    filterCat === 'all'
                                        ? 'bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/30 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] shadow-sm'
                                        : 'bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50',
                                    i18n.language === 'am' && 'font-ethiopic'
                                )}
                            >
                                <span>{t("menu_items.all_items")}</span>
                                <span className={cn(
                                    'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                                    filterCat === 'all' ? 'bg-[color:var(--color-brand-500)]/20 dark:bg-[color:var(--color-brand-500)]/20 text-[color:var(--color-brand-800)] dark:text-[color:var(--color-brand-300)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                )}>
                                    {items.length}
                                </span>
                            </button>

                            {/* Categories */}
                            {cats.map(c => {
                                const catItemCount = items.filter(i => i.categoryId === c.id).length;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setFilterCat(c.id)}
                                        className={cn(
                                            'px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer',
                                            filterCat === c.id
                                                ? 'bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/30 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] shadow-sm'
                                                : 'bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50',
                                            i18n.language === 'am' && 'font-ethiopic'
                                        )}
                                    >
                                        <span>{getTranslation(c.translations, i18n.language)}</span>
                                        <span className={cn(
                                            'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                                            filterCat === c.id ? 'bg-[color:var(--color-brand-500)]/20 dark:bg-[color:var(--color-brand-500)]/20 text-[color:var(--color-brand-800)] dark:text-[color:var(--color-brand-300)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                        )}>
                                            {catItemCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Item list ── */}
                <div className="animate-fade-in-up delay-150">
                    {isLoading ? (
                        /* Realistic Shimmer Skeleton */
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 rounded-[22px] p-4 flex items-center gap-4 shadow-xs"
                                >
                                    <div className="w-20 h-20 rounded-2xl skeleton shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 rounded-md skeleton" />
                                        <div className="h-3 w-2/3 rounded-md skeleton" />
                                        <div className="h-3 w-1/4 rounded-md skeleton" />
                                    </div>
                                    <div className="w-24 h-9 rounded-xl skeleton shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        /* Empty state */
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[24px] p-10 sm:p-14 flex flex-col items-center justify-center text-center shadow-xs">
                            <div className="w-18 h-18 rounded-3xl bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 border border-[color:var(--color-brand-100)] dark:border-[color:var(--color-brand-500)]/20 flex items-center justify-center text-4xl mb-4 shadow-xs">
                                {items.length === 0 ? '🍽️' : '🔍'}
                            </div>

                            <h3 className="text-[20px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight mb-1.5">
                                {items.length === 0 ? t('menu_items.empty') : t('menu_items.no_matching_results')}
                            </h3>

                            <p className="text-[14px] text-neutral-600 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
                                {items.length === 0
                                    ? t('menu_items.empty_hint')
                                    : t('menu_items.no_matching_desc')}
                            </p>

                            {items.length === 0 && cats.length > 0 && (
                                <Button
                                    variant="primary"
                                    className="h-11 px-7 text-[14px] rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold"
                                    icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                                    onClick={() => setEditing('new')}
                                >
                                    {t('menu_items.add_first_item')}
                                </Button>
                            )}

                            {items.length === 0 && cats.length === 0 && (
                                <div className="flex flex-col items-center gap-4 animate-fade-in">
                                    <p className="text-[14px] text-neutral-600 dark:text-neutral-400 max-w-md text-center leading-relaxed">
                                        {t('menu_items.no_category_hint', { defaultValue: 'Create your first category (e.g. Main Dishes, Drinks, Desserts) to start adding menu items.' })}
                                    </p>
                                    <Button
                                        variant="primary"
                                        className="h-11 px-7 text-[14px] rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold shadow-sm hover:scale-105 transition-all"
                                        icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                                        onClick={() => setQuickCatOpen(true)}
                                    >
                                        {t('menu_items.create_first_category', { defaultValue: 'Create First Category' })}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* List of items */
                        <div className="space-y-6">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                                onDragCancel={handleDragCancel}
                            >
                                {cats.filter(c => filterCat === 'all' || filterCat === 'featured' || c.id === filterCat).map(cat => {
                                    const catItems = filtered
                                        .filter(i => i.categoryId === cat.id);

                                    if (catItems.length === 0) return null;

                                    return (
                                        <div key={cat.id} className="space-y-3">
                                            {(filterCat === 'all' || filterCat === 'featured') && (
                                                <h3 className="text-[16px] font-black text-neutral-900 dark:text-neutral-50 px-2 pt-2">
                                                    {getTranslation(cat.translations, i18n.language)}
                                                </h3>
                                            )}
                                            <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                                {catItems.map((item, idx) => {
                                                    const catIndex = catItems.findIndex(i => i.id === item.id);
                                                    const orderIndex = catIndex >= 0 ? catIndex + 1 : undefined;

                                                    return deletingId === item.id ? (
                                                        <ConfirmDialog
                                                            key={item.id}
                                                            isOpen={true}
                                                            onClose={() => setDeletingId(null)}
                                                            onConfirm={() => { remove(item.id); setDeletingId(null); }}
                                                            title={t('actions.delete')}
                                                            description={t('actions.deleteItemDesc')}
                                                            confirmText={t('actions.delete')}
                                                        />
                                                    ) : (
                                                        <SortableMenuItemCard
                                                            key={item.id}
                                                            item={item}
                                                            cats={cats}
                                                            onEdit={() => setEditing(item.id)}
                                                            onDelete={() => setDeletingId(item.id)}
                                                            onToggleAvailability={() => toggleAvailability({ id: item.id, isAvailable: !item.isAvailable })}
                                                            orderIndex={orderIndex}
                                                        />
                                                    );
                                                })}
                                            </SortableContext>
                                        </div>
                                    );
                                })}

                                {typeof document !== 'undefined' && createPortal(
                                    <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                                        {activeId ? (() => {
                                            const activeItem = items.find(i => i.id === activeId);
                                            if (!activeItem) return null;
                                            return (
                                                <div className="w-[calc(100vw-2rem)] max-w-4xl opacity-95">
                                                    <MenuItemCardBase
                                                        item={activeItem}
                                                        cats={cats}
                                                        onEdit={() => {}}
                                                        onDelete={() => {}}
                                                        onToggleAvailability={() => {}}
                                                        dragOverlay
                                                    />
                                                </div>
                                            );
                                        })() : null}
                                    </DragOverlay>,
                                    document.body
                                )}
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* Mobile FAB */}
                {!editing && (
                    <div className="fixed bottom-20 right-5 sm:hidden z-40">
                        <button
                            onClick={() => cats.length === 0 ? setQuickCatOpen(true) : setEditing('new')}
                            className="w-14 h-14 rounded-full bg-[color:var(--color-brand-500)] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Plus className="w-6 h-6 stroke-[2.5]" />
                        </button>
                    </div>
                )}
            </div>

            {/* Editing Modal */}
            {editing && (
                <Modal
                    isOpen={!!editing}
                    onClose={() => setEditing(null)}
                    title={editing === 'new' ? t('menu_items.add_food_item') : t('menu_items.edit_food_item')}
                    size="lg"
                >
                    <ItemFormPanel
                        initial={editing === 'new' ? undefined : editingItem}
                        categories={cats}
                        defaultCurrency={restaurant?.currency}
                        onSave={handleSave}
                        onCancel={() => setEditing(null)}
                        onOpenQuickCategory={() => setQuickCatOpen(true)}
                        isSaving={creating || updating}
                        newCategoryId={newCategoryId}
                    />
                </Modal>
            )}

            {/* Inline Quick Category Creation Modal */}
            <QuickCategoryModal
                isOpen={quickCatOpen}
                onClose={() => setQuickCatOpen(false)}
                onCreated={handleCategoryCreated}
            />
        </>
    );
}
