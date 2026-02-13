import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
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

export function QuizPanel({ documentId }: QuizPanelProps) {
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
            alert('Failed to generate quiz. Please try again.');
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
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p>Generating your quiz...</p>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-primary-600 dark:text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Your Knowledge</h2>
                <p className="text-gray-600 dark:text-slate-400 max-w-md">
                    Generate a 5-question multiple choice quiz based on this document to test your understanding.
                </p>
                <Button onClick={generateQuiz} size="lg" className="w-full max-w-xs">
                    Start Quiz
                </Button>
            </div>
        );
    }

    if (showResult) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <Trophy className="w-16 h-16 text-yellow-500 mb-2" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Complete!</h2>
                <div className="text-xl text-gray-800 dark:text-slate-300">
                    You scored <span className="text-primary-600 dark:text-primary-400 font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
                </div>
                <p className="text-gray-600 dark:text-slate-500">
                    {score === questions.length ? "Perfect score! You're a master." :
                        score > questions.length / 2 ? "Great job! Keep studying." : "Keep practicing!"}
                </p>
                <Button onClick={generateQuiz} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
            </div>
        );
    }

    if (questions.length === 0) return <div>No questions generated.</div>;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 p-6 overflow-y-auto">
            {/* Progress */}
            <div className="flex justify-between items-center mb-6 text-sm text-gray-600 dark:text-slate-400">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
            </div>

            {/* Question Card */}
            <Card className="p-6 mb-6 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        let className = "justify-start text-left h-auto py-3 px-4 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white";

                        if (isAnswered) {
                            if (idx === currentQuestion.correct_answer) {
                                className = "justify-start text-left h-auto py-3 px-4 border-green-500/50 bg-green-500/10 text-green-400";
                            } else if (idx === selectedOption) {
                                className = "justify-start text-left h-auto py-3 px-4 border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
                            } else {
                                className = "justify-start text-left h-auto py-3 px-4 border-gray-100 dark:border-slate-800 opacity-50";
                            }
                        }

                        return (
                            <Button
                                key={idx}
                                variant="ghost" // Using ghost but creating custom classes for states
                                className={cn("w-full", className)}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={isAnswered}
                            >
                                <div className="flex items-center w-full">
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs mr-3 shrink-0">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{option}</span>
                                    {isAnswered && idx === currentQuestion.correct_answer && (
                                        <CheckCircle className="w-4 h-4 ml-auto text-green-400" />
                                    )}
                                    {isAnswered && idx === selectedOption && idx !== currentQuestion.correct_answer && (
                                        <XCircle className="w-4 h-4 ml-auto text-red-400" />
                                    )}
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </Card>

            {/* Explanation & Next Buton */}
            {isAnswered && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gray-100/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg p-4 text-sm text-gray-700 dark:text-slate-300">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">Explanation: </span>
                        {currentQuestion.explanation}
                    </div>
                    <Button onClick={nextQuestion} className="w-full">
                        {currentIndex === questions.length - 1 ? "Show Results" : "Next Question"}
                    </Button>
                </div>
            )}
        </div>
    );
}
