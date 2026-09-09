import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    isLoading,
    isDestructive = true,
}) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3.5 mb-3.5">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50">{title}</h2>
                    </div>
                </div>
                <p className="text-[13px] sm:text-[14px] text-neutral-600 dark:text-neutral-300 mb-5 leading-relaxed bg-neutral-50/80 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                    {description}
                </p>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto h-10 text-[13px]"
                    >
                        {cancelText || t('common.cancel')}
                    </Button>
                    <Button
                        variant={isDestructive ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className="w-full sm:w-auto h-10 text-[13px] font-bold"
                    >
                        {confirmText || t('common.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
