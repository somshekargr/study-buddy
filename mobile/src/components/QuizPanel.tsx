import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Loader2, CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react-native';
import api from '../services/api';

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
}

interface QuizPanelProps {
    documentId: string;
}

export default function QuizPanel({ documentId }: QuizPanelProps) {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const generateQuiz = async () => {
        setLoading(true);
        try {
            const response = await api.post('/quiz/generate', {
                document_id: documentId,
                num_questions: 5
            });

            const data = response.data;
            setQuestions(data.questions || []);
            setStarted(true);
            setCurrentIndex(0);
            setScore(0);
            setShowResult(false);
            setIsAnswered(false);
            setSelectedOption(null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === questions[currentIndex].correct_answer) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900">
                <Loader2 size={32} color="#3b82f6" />
                <Text className="text-slate-400 mt-4">Generating your quiz...</Text>
            </View>
        );
    }

    if (!started) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-6">
                <View className="w-16 h-16 bg-primary-500/10 rounded-full items-center justify-center mb-6">
                    <Trophy size={32} color="#3b82f6" />
                </View>
                <Text className="text-white text-2xl font-bold text-center">Test Your Knowledge</Text>
                <Text className="text-slate-400 text-center mt-2 mb-8">
                    Challenge yourself with 5 questions tailored to this document.
                </Text>
                <TouchableOpacity
                    onPress={generateQuiz}
                    className="w-full bg-primary-500 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-semibold text-lg">Start Quiz</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (showResult) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-6">
                <Trophy size={64} color="#eab308" />
                <Text className="text-white text-3xl font-bold mt-4">Quiz Complete!</Text>
                <View className="flex-row items-baseline mt-2">
                    <Text className="text-primary-400 text-4xl font-bold">{score}</Text>
                    <Text className="text-slate-500 text-xl ml-1">/ {questions.length}</Text>
                </View>
                <Text className="text-slate-400 text-center mt-4 mb-8">
                    {score === questions.length ? "Incredible! You've mastered this topic." :
                        score > questions.length / 2 ? "Solid effort! A bit more study and you'll be perfect." :
                            "Keep at it! Learning takes time."}
                </Text>
                <TouchableOpacity
                    onPress={generateQuiz}
                    className="flex-row items-center bg-slate-800 border border-slate-700 px-6 py-3 rounded-xl"
                >
                    <RefreshCw size={18} color="#94a3b8" />
                    <Text className="text-slate-300 font-semibold ml-2">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <ScrollView className="flex-1 bg-slate-900">
            <View className="px-6 py-4">
                {/* Progress Bar */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-slate-500 text-xs uppercase font-bold">
                        Question {currentIndex + 1} of {questions.length}
                    </Text>
                    <Text className="text-primary-400 text-xs font-bold">Score: {score}</Text>
                </View>

                {/* Question Container */}
                <View className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
                    <Text className="text-white text-lg font-medium mb-6">
                        {currentQuestion.question}
                    </Text>

                    <View className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            let itemStyle = "flex-row items-center w-full p-4 rounded-xl border mb-3 ";
                            let textStyle = "flex-1 ";

                            if (isAnswered) {
                                if (idx === currentQuestion.correct_answer) {
                                    itemStyle += "bg-green-500/10 border-green-500/50";
                                    textStyle += "text-green-400";
                                } else if (idx === selectedOption) {
                                    itemStyle += "bg-red-500/10 border-red-500/50";
                                    textStyle += "text-red-400";
                                } else {
                                    itemStyle += "bg-slate-800/50 border-slate-800 opacity-40";
                                    textStyle += "text-slate-500";
                                }
                            } else {
                                itemStyle += selectedOption === idx ? "bg-primary-500/20 border-primary-500" : "bg-slate-700 border-slate-600";
                                textStyle += selectedOption === idx ? "text-primary-400" : "text-slate-200";
                            }

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => handleOptionSelect(idx)}
                                    disabled={isAnswered}
                                    className={itemStyle}
                                >
                                    <View className={`w-6 h-6 rounded-full border items-center justify-center mr-3 ${isAnswered && idx === currentQuestion.correct_answer ? 'border-green-500' : 'border-slate-500'}`}>
                                        <Text className={`text-[10px] ${isAnswered && idx === currentQuestion.correct_answer ? 'text-green-500' : 'text-slate-400'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </Text>
                                    </View>
                                    <Text className={textStyle}>{option}</Text>
                                    {isAnswered && idx === currentQuestion.correct_answer && (
                                        <CheckCircle size={16} color="#4ade80" />
                                    )}
                                    {isAnswered && idx === selectedOption && idx !== currentQuestion.correct_answer && (
                                        <XCircle size={16} color="#f87171" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Feedback & Next */}
                {isAnswered && (
                    <View>
                        <View className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
                            <Text className="text-primary-400 font-bold mb-1">Explanation</Text>
                            <Text className="text-slate-400 text-sm leading-5">
                                {currentQuestion.explanation}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={nextQuestion}
                            className="bg-primary-500 py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold">
                                {currentIndex === questions.length - 1 ? "See Results" : "Continue"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
