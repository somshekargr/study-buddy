import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastContextType {
    showToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const iconMap = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const bgMap = {
        success: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10',
        error: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10',
        info: 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10',
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-fade-in-down min-w-[280px] max-w-[400px] pointer-events-auto",
                bgMap[toast.type]
            )}
        >
            {iconMap[toast.type]}
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: Toast['type'], message: string) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container - Top centered on mobile, top-right on desktop */}
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[100] flex flex-col items-center md:items-end gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
