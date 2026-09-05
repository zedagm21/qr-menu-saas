import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
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

import {
    Plus, Pencil, Trash2,
    Check, Tag, GripVertical, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from '../../hooks/useCategories';
import type { Category } from '../../types';
import { getTranslation, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

import { CategoryForm, CategoryFormData } from '../../components/dashboard/CategoryForm';

// ─── Base Category Item ──────────────────────────────────────────
const CategoryItemBase: React.FC<{
    cat: Category;
    idx: number;
    editing: string | null;
    deletingId: string | null;
    setEditing: (id: string | null) => void;
    setDeletingId: (id: string | null) => void;
    handleSave: (data: any) => void;
    updating: boolean;
    remove: (id: string) => void;
    isDragging?: boolean;
    dragOverlay?: boolean;
    attributes?: any;
    listeners?: any;
    setNodeRef?: any;
    style?: React.CSSProperties;
}> = ({ cat, idx, editing, deletingId, setEditing, setDeletingId, handleSave, updating, remove, isDragging, dragOverlay, attributes, listeners, setNodeRef, style }) => {
    const { t, i18n } = useTranslation();
    const { mutate: update } = useUpdateCategory();

    if (editing === cat.id) {
        return (
            <div ref={setNodeRef} style={style} className="relative z-50">
                <CategoryForm initial={cat} onSave={handleSave} onCancel={() => setEditing(null)} isSaving={updating} />
            </div>
        );
    }

    if (deletingId === cat.id) {
        return (
            <div ref={setNodeRef} style={style} className="relative z-50">
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setDeletingId(null)}
                    onConfirm={() => { remove(cat.id); setDeletingId(null); }}
                    title={t('actions.delete')}
                    description={t('actions.deleteCategoryDesc')}
                    confirmText={t('actions.delete')}
                />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative flex items-stretch overflow-hidden',
                'backdrop-blur-md bg-white/80 dark:bg-neutral-900/90 border border-white/70 dark:border-neutral-800/80',
                'rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
                !dragOverlay && 'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-250',
                !cat.isActive && 'opacity-70 dark:opacity-60',
                dragOverlay && 'shadow-2xl ring-2 ring-[color:var(--color-brand-500)]/60 cursor-grabbing select-none pointer-events-none'
            )}
        >
            <div className={cn(
                'w-1.5 flex-shrink-0 rounded-l-[20px] transition-all duration-300',
                cat.isActive
                    ? 'bg-gradient-to-b from-[color:var(--color-brand-400)] to-[color:var(--color-accent-500)]'
                    : 'bg-neutral-200 dark:bg-neutral-700'
            )} />

            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "touch-none flex items-center justify-center w-11 sm:w-12 bg-neutral-50/80 dark:bg-neutral-900/80 border-r border-neutral-200/60 dark:border-neutral-800/80 flex-shrink-0 cursor-grab text-neutral-400 dark:text-neutral-500 hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10 transition-colors",
                    (isDragging || dragOverlay) && "cursor-grabbing bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)]"
                )}
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-3 p-3.5 sm:p-5">
                <div className="relative flex-shrink-0">
                    <div className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm',
                        cat.isActive
                            ? 'bg-gradient-to-br from-[color:var(--color-brand-50)] to-[color:var(--color-accent-50)] dark:from-[color:var(--color-brand-500)]/20 dark:to-[color:var(--color-accent-500)]/10 text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)]'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                    )}>
                        <Tag className="w-4 h-4" />
                    </div>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-white dark:border-neutral-700 text-[10px] font-black text-neutral-600 dark:text-neutral-300 flex items-center justify-center shadow-xs">
                        {idx + 1}
                    </span>
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

            <div className="flex items-center gap-1 pr-3 sm:pr-4 flex-shrink-0">
                <button
                    onClick={() => update({ id: cat.id, data: { isActive: !cat.isActive } as any })}
                    title={cat.isActive ? t('actions.hide') : t('actions.show')}
                    className={cn(
                        'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90',
                        cat.isActive
                            ? 'text-[color:var(--color-brand-500)] dark:text-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10'
                            : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                >
                    {cat.isActive ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button
                    onClick={() => setEditing(cat.id)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90 transition-all duration-200"
                >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                    onClick={() => setDeletingId(cat.id)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all duration-200"
                >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
};

// ─── Sortable Category Item ─────────────────────────────────────────
const SortableCategoryItem: React.FC<{
    cat: Category;
    idx: number;
    editing: string | null;
    deletingId: string | null;
    setEditing: (id: string | null) => void;
    setDeletingId: (id: string | null) => void;
    handleSave: (data: any) => void;
    updating: boolean;
    remove: (id: string) => void;
}> = (props) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.cat.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return <CategoryItemBase {...props} isDragging={isDragging} attributes={attributes} listeners={listeners} setNodeRef={setNodeRef} style={style} />;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CategoriesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { data: categories, isLoading } = useCategories();
    const { mutate: create, isPending: creating } = useCreateCategory();
    const { mutate: update, isPending: updating } = useUpdateCategory();
    const { mutate: remove } = useDeleteCategory();
    const { mutate: reorderCategories } = useReorderCategories();

    const [editing, setEditing] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [localCats, setLocalCats] = useState<Category[]>([]);

    useEffect(() => {
        if (Array.isArray(categories) && !activeId) {
            setLocalCats([...categories].sort((a, b) => a.displayOrder - b.displayOrder));
        }
    }, [categories, activeId]);

    const cats = localCats;

    const buildTranslations = (form: CategoryFormData) => [
        { language: 'EN' as const, name: form.nameEn, description: form.descEn || undefined },
        { language: 'AM' as const, name: form.nameAm || form.nameEn, description: form.descAm || undefined },
    ];

    const handleSave = (form: CategoryFormData) => {
        if (editing === 'new') {
            create({ translations: buildTranslations(form), isActive: form.isActive }, { onSuccess: () => setEditing(null) });
        } else if (editing) {
            update({ id: editing, data: { translations: buildTranslations(form), isActive: form.isActive } as any }, { onSuccess: () => setEditing(null) });
        }
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setLocalCats(prev => {
            const oldIndex = prev.findIndex(c => c.id === active.id);
            const newIndex = prev.findIndex(c => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                return arrayMove(prev, oldIndex, newIndex);
            }
            return prev;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        if (event.active) {
            reorderCategories(localCats.map((c, i) => ({ id: c.id, displayOrder: i })));
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        if (Array.isArray(categories)) {
            setLocalCats([...categories].sort((a, b) => a.displayOrder - b.displayOrder));
        }
    };

    return (
        <>
            <Helmet><title>{t('categories.title')} — OurMenu</title></Helmet>
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
                    <div className="flex flex-col gap-3">

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            <SortableContext items={cats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {cats.map((cat, idx) => (
                                    <SortableCategoryItem
                                        key={cat.id}
                                        cat={cat}
                                        idx={idx}
                                        editing={editing}
                                        deletingId={deletingId}
                                        setEditing={setEditing}
                                        setDeletingId={setDeletingId}
                                        handleSave={handleSave}
                                        updating={updating}
                                        remove={remove}
                                    />
                                ))}
                            </SortableContext>

                            {typeof document !== 'undefined' && createPortal(
                                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                                    {activeId ? (() => {
                                        const activeCat = cats.find(c => c.id === activeId);
                                        if (!activeCat) return null;
                                        const activeIdx = cats.findIndex(c => c.id === activeId);
                                        return (
                                            <div className="w-[calc(100vw-2rem)] max-w-4xl opacity-95">
                                                <CategoryItemBase
                                                    cat={activeCat}
                                                    idx={activeIdx}
                                                    editing={null}
                                                    deletingId={null}
                                                    setEditing={() => {}}
                                                    setDeletingId={() => {}}
                                                    handleSave={() => {}}
                                                    updating={false}
                                                    remove={() => {}}
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
