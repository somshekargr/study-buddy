import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, History, MessageSquare, ChevronLeft, MessageSquarePlus } from 'lucide-react';
import api from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuthStore } from '../stores/useAuthStore';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: number[];
}

interface ChatSession {
    id: string;
    title: string;
    persona: string;
    updated_at: string;
}

interface ChatPanelProps {
    documentId: string | null;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState('default');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const token = useAuthStore((state) => state.token);
    // const setPage = useStudyStore((state) => state.setPage); // Unused for now while citations are hidden

    const PERSONA_OPTIONS = [
        { id: 'default', name: 'Standard Tutor' },
        { id: 'general', name: 'General Assistant' },
        { id: 'eli5', name: "Explain Like I'm 5" },
        { id: 'star_wars', name: 'Yoda / Star Wars' },
        { id: 'professor', name: 'Strict Professor' },
        { id: 'socratic', name: 'Socratic Tutor' },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        fetchSessions();
    }, [documentId]);

    const fetchSessions = async () => {
        try {
            const url = documentId ? `/sessions?document_id=${documentId}` : `/sessions?document_id=`;
            const response = await api.get(url);
            setSessions(response.data);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    };

    const loadSession = async (sessionId: string) => {
        setLoading(true);
        setShowHistory(false);
        try {
            const response = await api.get(`/sessions/${sessionId}/messages`);
            setMessages(response.data);
            setActiveSessionId(sessionId);

            // Sync persona if available in session
            const session = sessions.find(s => s.id === sessionId);
            if (session) setSelectedPersona(session.persona);
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setActiveSessionId(null);
        setShowHistory(false);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    document_id: documentId,
                    question: userMessage.content,
                    persona: selectedPersona,
                    session_id: activeSessionId,
                    web_search: webSearchEnabled,
                }),
            });

            if (!response.ok) throw new Error('Chat failed');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No stream');

            setMessages((prev) => [...prev, { role: 'assistant', content: '', citations: [] }]);

            const decoder = new TextDecoder();
            let assistantMessage = '';
            let rawBuffer = '';
            let citationsParsed = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                rawBuffer += chunk;

                // Process citations if not yet parsed
                if (!citationsParsed) {
                    // Check availability of citations line
                    const citationMatch = rawBuffer.match(/__CITATIONS__:(.*)\n/);
                    if (citationMatch) {
                        try {
                            const citations = JSON.parse(citationMatch[1]);
                            setMessages(prev => {
                                const newMessages = [...prev];
                                const lastMsg = newMessages[newMessages.length - 1];
                                if (lastMsg.role === 'assistant') {
                                    lastMsg.citations = citations;
                                }
                                return newMessages;
                            });
                            citationsParsed = true;
                            // Remove the citation line from buffer to avoid rendering it
                            rawBuffer = rawBuffer.replace(citationMatch[0], '');
                        } catch (e) {
                            console.error("Failed parsing citations", e);
                        }
                    }

                    const sessionMatch = rawBuffer.match(/__SESSION_ID__:(.*)\n/);
                    if (sessionMatch) {
                        const sid = sessionMatch[1].trim();
                        if (!activeSessionId) {
                            setActiveSessionId(sid);
                            fetchSessions(); // Refresh session list
                        }
                        rawBuffer = rawBuffer.replace(sessionMatch[0], '');
                    }
                }

                // After special tokens are potentially handled/removed, append to message
                // But wait, if we are in the middle of a chunk that contains both header and content,
                // we need to be careful. The above replace logic handles it.
                // We only append the *new* content to assistantMessage.
                // Actually, easiest is to just re-render the whole buffer as content minus headers.

                // Let's rely on the fact that headers come FIRST.
                // If we haven't finished parsing headers, we shouldn't show content?
                // Or just strip them.

                let displayContent = rawBuffer;
                displayContent = displayContent.replace(/__SESSION_ID__:.*\n/, '');
                displayContent = displayContent.replace(/__CITATIONS__:.*\n/, '');

                assistantMessage = displayContent;

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = assistantMessage;
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full relative overflow-hidden bg-white dark:bg-slate-950">
            {/* Session Sidebar */}
            <div className={cn(
                "absolute inset-y-0 left-0 z-20 w-64 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out shadow-xl",
                showHistory ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-slate-100 flex items-center">
                            <History className="w-4 h-4 mr-2" /> History
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {sessions.length === 0 ? (
                            <p className="text-xs text-center text-gray-500 mt-4 italic">No previous chats</p>
                        ) : (
                            sessions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => loadSession(s.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-3 group",
                                        activeSessionId === s.id
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800"
                                            : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <MessageSquare className={cn(
                                        "w-4 h-4 mt-0.5 shrink-0",
                                        activeSessionId === s.id ? "text-primary-500" : "text-gray-400"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{s.title}</div>
                                        <div className="text-[10px] opacity-60 truncate">
                                            {new Date(s.updated_at).toLocaleDateString()} • {s.persona}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for mobile history */}
            {showHistory && (
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 lg:hidden"
                    onClick={() => setShowHistory(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(true)}
                            className={cn(showHistory && "hidden", "border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800")}
                        >
                            <History className="w-4 h-4 text-gray-500" />
                        </Button>
                        {messages.length > 0 && (
                            <div className="flex flex-col">
                                <button
                                    onClick={handleNewChat}
                                    className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left flex items-center gap-2"
                                    title="New Conversation"
                                >
                                    <span className="hidden sm:inline">{activeSessionId ? "Active Chat" : "New Conversation"}</span>
                                    <MessageSquarePlus className="w-5 h-5 sm:hidden" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                webSearchEnabled
                                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                                    : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700"
                            )}
                            title="Free Web Search (Powered by DuckDuckGo)"
                        >
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                webSearchEnabled ? "bg-primary-500 animate-pulse" : "bg-gray-400"
                            )} />
                            <span className="hidden sm:inline">Web Search</span>
                            <span className="sm:hidden">Web</span>
                        </button>

                        {documentId && (
                            <select
                                value={selectedPersona}
                                onChange={(e) => setSelectedPersona(e.target.value)}
                                className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 text-sm border border-gray-200 dark:border-slate-700 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                {PERSONA_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id} className="bg-white dark:bg-slate-800">{opt.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-slate-500 mt-10">
                            <div className="bg-primary-50 dark:bg-primary-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-primary-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">
                                {documentId ? "Start a conversation" : "Welcome to General Chat"}
                            </h3>
                            <p className="max-w-xs mx-auto text-sm">
                                {documentId
                                    ? "Ask a question about your document and your tutor will help you study."
                                    : "Ask anything! Enable Web Search for real-time information."}
                            </p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex max-w-[85%] flex-col rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 border border-primary-100 dark:border-primary-800"
                                        : "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                )}
                            >
                                <div className="flex items-center mb-1 text-xs opacity-50">
                                    {msg.role === 'user' ? (
                                        <User className="w-3 h-3 mr-1" />
                                    ) : (
                                        <Bot className="w-3 h-3 mr-1" />
                                    )}
                                    <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                                </div>

                                <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start w-full">
                            <div className="bg-gray-100 text-gray-900 border border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div >
    );
}
