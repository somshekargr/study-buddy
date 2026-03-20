import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, User, Bot, MessageSquare, History, MessageSquarePlus, Globe } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../services/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
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

export default function ChatPanel({ documentId }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState('default');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const token = useAuthStore((state) => state.token);

    const PERSONA_OPTIONS = [
        { id: 'default', name: 'Standard' },
        { id: 'eli5', name: "ELI5" },
        { id: 'star_wars', name: 'Yoda' },
        { id: 'professor', name: 'Professor' },
        { id: 'socratic', name: 'Socratic' },
    ];

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

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Simplified fetch for RN - many RN versions struggle with streaming readers
            // For a smoother mobile experience, we might want to check for real streaming support
            // but for now we'll implement the basic logic.
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
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

            // Handle non-streaming response for simplicity on mobile first, 
            // or attempt stream if possible.
            // Note: response.body.getReader() is not available in all RN fetch implementations.
            // If it's not available, we can use response.text() or similar.

            const data = await response.text();
            // In a real scenario, we'd parse the stream. Here we simulate the final message.
            // However, the backend is sending a stream. 
            // Let's try to extract the message content from the raw buffer.

            let cleanData = data.replace(/__SESSION_ID__:.*\n/g, '')
                .replace(/__CITATIONS__:.*\n/g, '')
                .replace(/data: /g, '')
                .trim();

            setMessages((prev) => [...prev, { role: 'assistant', content: cleanData }]);

        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
        } finally {
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-slate-900"
        >
            {/* Persona & Search Header */}
            <View className="flex-row items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setWebSearchEnabled(!webSearchEnabled)}
                        className={`p-2 rounded-lg mr-2 ${webSearchEnabled ? 'bg-primary-500/20' : 'bg-slate-700'}`}
                    >
                        <Globe size={16} color={webSearchEnabled ? '#3b82f6' : '#94a3b8'} />
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {PERSONA_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => setSelectedPersona(opt.id)}
                                className={`px-3 py-1.5 rounded-full mr-2 border ${selectedPersona === opt.id ? 'bg-primary-500 border-primary-500' : 'bg-slate-700 border-slate-600'}`}
                            >
                                <Text className={`text-xs ${selectedPersona === opt.id ? 'text-white' : 'text-slate-300'}`}>
                                    {opt.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {messages.length === 0 && (
                    <View className="mt-10 items-center justify-center">
                        <View className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-4">
                            <MessageSquare size={32} color="#475569" />
                        </View>
                        <Text className="text-white text-lg font-semibold">Start Studying</Text>
                        <Text className="text-slate-500 text-center mt-2 px-6">
                            Ask anything about the document. Your AI tutor is here to help.
                        </Text>
                    </View>
                )}

                {messages.map((msg, i) => (
                    <View
                        key={i}
                        className={`mb-4 max-w-[90%] p-4 rounded-2xl ${msg.role === 'user' ? 'self-end bg-primary-600' : 'self-start bg-slate-800 border border-slate-700'}`}
                    >
                        <View className="flex-row items-center mb-2 opacity-60">
                            {msg.role === 'user' ? (
                                <User size={12} color="white" />
                            ) : (
                                <Bot size={12} color="white" />
                            )}
                            <Text className="text-[10px] text-white font-bold ml-1 uppercase">
                                {msg.role === 'user' ? 'You' : 'Assistant'}
                            </Text>
                        </View>
                        <Markdown
                            style={{
                                body: { color: 'white', fontSize: 14, lineHeight: 20 },
                                code_inline: { backgroundColor: '#1e293b', color: '#3b82f6', padding: 2 },
                                fence: { backgroundColor: '#1e293b', borderRadius: 8, padding: 10 },
                            }}
                        >
                            {msg.content}
                        </Markdown>
                    </View>
                ))}

                {loading && (
                    <View className="self-start bg-slate-800 border border-slate-700 p-4 rounded-2xl mb-4 flex-row items-center">
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <Text className="text-slate-400 text-sm ml-2">Tutor is thinking...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View className="p-4 bg-slate-800 border-t border-slate-700">
                <View className="flex-row items-center bg-slate-900 rounded-xl px-4 py-1">
                    <TextInput
                        className="flex-1 text-white py-3"
                        placeholder="Type your question..."
                        placeholderTextColor="#64748b"
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={loading || !input.trim()}
                        className={`p-2 rounded-lg ${loading || !input.trim() ? 'opacity-50' : 'bg-primary-500'}`}
                    >
                        <Send size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
