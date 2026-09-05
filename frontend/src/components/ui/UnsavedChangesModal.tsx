import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface UnsavedChangesModalProps {
    isOpen: boolean;
    onStay: () => void;
    onDiscardAndLeave: () => void;
    onSaveAndLeave: () => void;
    isSaving?: boolean;
    title?: string;
    description?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    onStay,
    onDiscardAndLeave,
    onSaveAndLeave,
    isSaving = false,
    title,
    description,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onStay}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {title || t('restaurant.unsaved_modal_title', { defaultValue: 'Unsaved Changes' })}
                        </h3>
                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {description || t('restaurant.unsaved_modal_desc', { defaultValue: 'You have unsaved changes. What would you like to do before leaving?' })}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onStay}
                        className="w-full sm:w-auto h-10 text-[13px]"
                    >
                        {t('restaurant.stay_on_page', { defaultValue: 'Stay on Page' })}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onDiscardAndLeave}
                        className="w-full sm:w-auto h-10 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        {t('common.discard_and_leave', { defaultValue: 'Discard & Leave' })}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onSaveAndLeave}
                        isLoading={isSaving}
                        className="w-full sm:w-auto h-10 text-[13px] font-semibold"
                    >
                        {t('common.save_and_leave', { defaultValue: 'Save Changes' })}
                    </Button>
                </div>
            </div>
        </div>
    );
};
