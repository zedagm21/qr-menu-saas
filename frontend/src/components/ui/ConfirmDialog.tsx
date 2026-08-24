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
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
                    </div>
                </div>
                <p className="text-[15px] text-neutral-600 mb-6 leading-relaxed bg-neutral-50/50 p-4 rounded-xl border border-neutral-100">
                    {description}
                </p>
                <div className="flex gap-3 justify-end mt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        {cancelText || t('common.cancel')}
                    </Button>
                    <Button
                        variant={isDestructive ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText || t('common.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
