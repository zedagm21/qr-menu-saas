import React from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface FloatingSaveBarProps {
    isModified: boolean;
    isSaving: boolean;
    onSave?: () => void;
    onDiscard?: () => void;
    saveLabel?: string;
    discardLabel?: string;
    unsavedText?: string;
    savedText?: string;
    saveButtonType?: 'submit' | 'button';
    disabled?: boolean;
    className?: string;
}

export const FloatingSaveBar: React.FC<FloatingSaveBarProps> = ({
    isModified,
    isSaving,
    onSave,
    onDiscard,
    saveLabel,
    discardLabel,
    unsavedText,
    savedText,
    saveButtonType = 'submit',
    disabled = false,
    className,
}) => {
    const { t } = useTranslation();

    if (!isModified && !isSaving) {
        return null;
    }

    return (
        <div className={cn("fixed bottom-0 lg:bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none pb-20 lg:pb-0 animate-in fade-in slide-in-from-bottom-3 duration-300", className)}>
            <div className="pointer-events-auto max-w-3xl w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 p-3 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300">
                {/* Status Indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="text-[13px] font-semibold text-amber-700 dark:text-amber-400 truncate">
                        {unsavedText || t('restaurant.unsaved_changes', { defaultValue: 'You have unsaved changes' })}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {onDiscard && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onDiscard}
                            className="h-10 text-[13px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            {discardLabel || t('common.discard', { defaultValue: 'Discard' })}
                        </Button>
                    )}
                    <Button
                        type={saveButtonType}
                        variant="primary"
                        size="sm"
                        onClick={onSave}
                        className="h-10 px-6 text-[13px] font-semibold"
                        isLoading={isSaving}
                        disabled={disabled}
                        icon={<Save className="w-4 h-4" />}
                    >
                        {saveLabel || t('restaurant.save', { defaultValue: 'Save Changes' })}
                    </Button>
                </div>
            </div>
        </div>
    );
};
