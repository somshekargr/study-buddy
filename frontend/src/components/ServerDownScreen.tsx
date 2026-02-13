import { AlertCircle, RefreshCcw, Mail, Globe, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { useBackendHealth } from './BackendHealthCheck';
import { useState } from 'react';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'study1997buddy@gmail.com';

export function ServerDownScreen() {
    const { checkHealth } = useBackendHealth();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        await checkHealth();
        // Delay slightly for better UX feel
        setTimeout(() => setIsRetrying(false), 500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-lg animate-fade-in-up">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-3xl opacity-20 blur-2xl" />

                <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-red-100 dark:border-red-900/20 shadow-2xl text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="relative bg-red-100 dark:bg-red-500/10 p-5 rounded-2xl">
                                <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Server Connection Lost
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-slate-400">
                            Our AI backend is currently unreachable. This often happens if the local study server or network tunnel is offline.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col items-center gap-2 group hover:border-red-200 dark:hover:border-red-900/30 transition-colors">
                            <Globe className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Tunnel Status</span>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">Offline</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col items-center gap-2 group hover:border-amber-200 dark:hover:border-amber-900/30 transition-colors">
                            <Mail className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Support</span>
                            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-gray-900 dark:text-slate-200 hover:text-primary-500 transition-colors">
                                Contact Team
                            </a>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <Button
                            className="w-full h-12 rounded-xl text-md font-bold gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all"
                            onClick={handleRetry}
                            disabled={isRetrying}
                        >
                            <RefreshCcw className={isRetrying ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
                            {isRetrying ? 'Checking Connection...' : 'Try Reconnecting'}
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>Still having issues? Email <b>{SUPPORT_EMAIL}</b></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
