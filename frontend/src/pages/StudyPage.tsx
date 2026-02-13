import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, GraduationCap, Network } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PDFViewer } from '../components/PDFViewer';
import { ChatPanel } from '../components/ChatPanel';
import { QuizPanel } from '../components/QuizPanel';
import { KnowledgeMap } from '../components/KnowledgeMap';
import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '../lib/utils';

export function StudyPage() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const isGeneral = documentId === 'general';
    const [activeTab, setActiveTab] = useState<'pdf' | 'chat' | 'quiz' | 'graph'>(isGeneral ? 'chat' : 'chat');

    if (!documentId) return <div>Invalid Document ID</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center px-4 justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-gray-600 dark:text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-semibold text-gray-900 dark:text-slate-200 hidden sm:inline">Study Session</span>
                </div>

                {/* Tab Switcher - Now shows PDF on mobile */}
                {!isGeneral && (
                    <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-1 border border-gray-200 dark:border-slate-800 shrink-0">
                        <button
                            onClick={() => setActiveTab('pdf')}
                            className={cn(
                                "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all lg:hidden",
                                activeTab === 'pdf'
                                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                            )}
                        >
                            PDF
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={cn(
                                "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                activeTab === 'chat'
                                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Chat</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('quiz')}
                            className={cn(
                                "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                activeTab === 'quiz'
                                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                            )}
                        >
                            <GraduationCap className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Quiz</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('graph')}
                            className={cn(
                                "flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                activeTab === 'graph'
                                    ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                            )}
                        >
                            <Network className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Map</span>
                        </button>
                    </div>
                )}

                {/* Right side controls (could add ThemeToggle here too) */}
                <div className="flex items-center gap-2 shrink-0">
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
                {/* Left: PDF Viewer - Visible on Desktop, or when 'pdf' tab active on Mobile */}
                {!isGeneral && (
                    <div className={cn(
                        "w-full h-full lg:w-1/2 bg-gray-100 dark:bg-slate-900 relative",
                        (activeTab !== 'pdf' && activeTab !== 'graph') ? "hidden lg:block" : (activeTab === 'graph' ? "hidden lg:block" : "block")
                    )}>
                        <PDFViewer documentId={documentId} />
                    </div>
                )}

                {/* General Chat Empty State Left Side */}
                {isGeneral && (
                    <div className="hidden lg:flex w-1/2 h-full bg-slate-50 dark:bg-slate-900/40 items-center justify-center p-12 text-center">
                        <div className="max-w-md space-y-6">
                            <div className="bg-primary-500/10 p-4 rounded-2xl w-fit mx-auto">
                                <MessageSquare className="w-12 h-12 text-primary-500" />
                            </div>
                            <h2 className="text-3xl font-bold dark:text-white">General Chat</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Open-ended study session. Ask about anything, use our free web search for real-time info, or just chat with a persona.
                            </p>
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Powered by Frontier AI</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right: Interact Panel - Visible on Desktop, or when 'chat'/'quiz' tab active on Mobile */}
                <div className={cn(
                    "w-full h-full lg:w-1/2 bg-white dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800 overflow-hidden",
                    (isGeneral) ? "lg:w-1/2" : (activeTab === 'pdf') ? "hidden lg:block" : "block"
                )}>
                    {activeTab === 'chat' ? (
                        <ChatPanel documentId={isGeneral ? null : documentId} />
                    ) : activeTab === 'quiz' ? (
                        <QuizPanel documentId={documentId} />
                    ) : (
                        <KnowledgeMap documentId={documentId} />
                    )}
                </div>
            </div>
        </div>
    );
}
