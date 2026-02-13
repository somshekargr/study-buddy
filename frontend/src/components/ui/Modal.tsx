import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
    showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    className,
    showClose = true
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                "relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 transition-all duration-300 animate-in zoom-in-95 fade-in slide-in-from-bottom-4",
                className
            )}>
                {title && (
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
