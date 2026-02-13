import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from '../components/UploadZone';
import { DocumentList } from '../components/DocumentList';
import { Button } from '../components/ui/Button';
import { LogOut, BookOpen, Settings, MessageSquare, Sun, Moon, Monitor, Sparkles, Brain, Zap, ArrowRight } from 'lucide-react';

export function DashboardPage() {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans selection:bg-primary-500/30">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl animate-pulse-glow" />
                <div className="absolute top-1/3 -left-40 w-80 h-80 bg-violet-500/8 dark:bg-violet-500/5 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/8 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse-glow animation-delay-400" />
            </div>

            <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/20">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-950" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
                            Study Buddy
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden sm:block">
                            <p className="text-gray-900 dark:text-slate-200 font-medium">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500">{user?.email}</p>
                        </div>
                        <div className="relative" ref={settingsRef}>
                            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                                <Settings className={`w-5 h-5 text-gray-600 dark:text-slate-400 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
                            </Button>

                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 z-50 py-1 overflow-hidden animate-fade-in-up">
                                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Theme</p>
                                        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                                title="Light Mode"
                                            >
                                                <Sun className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                                title="Dark Mode"
                                            >
                                                <Moon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setTheme('system')}
                                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                                title="System Preference"
                                            >
                                                <Monitor className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 relative z-10 space-y-12">
                {/* Hero / Greeting Section */}
                <section className="max-w-3xl mx-auto text-center pt-6 animate-fade-in-up">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                            Upload. Analyze.{' '}
                            <span className="bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-shift">
                                Master.
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-lg mx-auto">
                            Upload your study materials and let our AI create personalized quizzes and summaries for you.
                        </p>
                    </div>
                </section>

                {/* Action Cards */}
                <section className="max-w-3xl mx-auto animate-fade-in-up animation-delay-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Upload Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                            <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
                                <UploadZone onUploadComplete={handleUploadComplete} />
                            </div>
                        </div>

                        {/* General Chat Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                            <button
                                onClick={() => navigate('/study/general')}
                                className="relative w-full h-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-3">
                                    <div className="bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20 p-3 rounded-xl w-fit">
                                        <MessageSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">General Chat</h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            Talk to AI without a document. Ask anything, explore ideas, get answers.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-sm font-semibold group-hover:gap-3 transition-all">
                                    Start chatting <ArrowRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Feature Pills */}
                <section className="max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-sm text-gray-600 dark:text-slate-400 shadow-sm">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="hidden sm:inline">AI-Powered Quizzes</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-sm text-gray-600 dark:text-slate-400 shadow-sm">
                            <Brain className="w-4 h-4 text-violet-500" />
                            <span className="hidden sm:inline">Knowledge Maps</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-sm text-gray-600 dark:text-slate-400 shadow-sm">
                            <Zap className="w-4 h-4 text-cyan-500" />
                            <span className="hidden sm:inline">Smart Summaries</span>
                        </div>
                    </div>
                </section>

                {/* Documents Section */}
                <section className="space-y-6 animate-fade-in-up animation-delay-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-200">Your Library</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">All your uploaded study materials</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setRefreshTrigger(prev => prev + 1)}>
                            Refresh
                        </Button>
                    </div>
                    <DocumentList refreshTrigger={refreshTrigger} />
                </section>
            </main>
        </div>
    );
}
