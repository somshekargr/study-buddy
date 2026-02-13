import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
    loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'danger',
    loading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} showClose={!loading}>
            <div className="flex flex-col items-center text-center">
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-4 ring-8",
                    variant === 'danger'
                        ? "bg-red-50 text-red-600 ring-red-50/50 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/10"
                        : "bg-blue-50 text-blue-600 ring-blue-50/50 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/10"
                )}>
                    {variant === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        className="flex-1"
                        onClick={onConfirm}
                        isLoading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
