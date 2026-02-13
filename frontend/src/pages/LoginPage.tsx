import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/useAuthStore';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { GraduationCap, BookOpen, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
    const setToken = useAuthStore((state) => state.setToken);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            if (!credentialResponse.credential) {
                console.error("No credential received");
                return;
            }

            const res = await api.post('/auth/google', {
                token: credentialResponse.credential
            });

            const data = res.data;

            setToken(data.access_token, {
                email: data.email,
                full_name: data.full_name,
                theme_preference: data.theme_preference || 'system'
            });

            navigate('/');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const features = [
        {
            icon: <BookOpen className="w-5 h-5" />,
            title: "Smart Document Analysis",
            description: "Upload PDFs and get instant, intelligent insights."
        },
        {
            icon: <BrainCircuit className="w-5 h-5" />,
            title: "AI-Powered Tutoring",
            description: "Chat with your study materials as if they were alive."
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: "Instant Quiz Generation",
            description: "Convert any chapter into a personalized quiz in seconds."
        }
    ];

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 selection:bg-primary-500/30">
            {/* Left Side: Feature Showcase (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 mesh-gradient opacity-60" />

                <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">Study Buddy</span>
                    </div>

                    <div className="space-y-8 max-w-lg">
                        <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1]">
                            Master Your Studies with <span className="text-primary-400">AI Excellence.</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            The ultimate personalized tutor for students and researchers. Upload, analyze, and learn faster than ever.
                        </p>

                        <div className="pt-8 space-y-6">
                            {features.map((f, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1 bg-white/10 p-2 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                                        <div className="text-primary-400">{f.icon}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">{f.title}</h3>
                                        <p className="text-slate-400">{f.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute bottom-12 flex items-center gap-6 text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary-500" />
                            <span>GDPR Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary-500" />
                            <span>AI Grounding</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Panel */}
            <div className="w-full lg:w-[480px] xl:w-[560px] flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-hidden">
                {/* Background Decorations for Mobile */}
                <div className="lg:hidden absolute inset-0 mesh-gradient opacity-10" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] -ml-48 -mb-48" />

                <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
                    <div className="lg:hidden flex flex-col items-center mb-12">
                        <div className="bg-primary-600 p-3 rounded-2xl shadow-xl shadow-primary-600/20 mb-4">
                            <GraduationCap className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Study Buddy</h2>
                    </div>

                    <Card className="glass-card border-0 backdrop-blur-2xl">
                        <CardHeader className="text-center space-y-2 pt-8">
                            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                                Welcome Back
                            </CardTitle>
                            <p className="text-gray-500 dark:text-slate-400">
                                Sign in to your account to continue
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="flex justify-center pt-2">
                                <div className="w-full group">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => console.error('Login Failed')}
                                        theme="filled_black"
                                        shape="pill"
                                        size="large"
                                        text="continue_with"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-500">
                                        Secure Authentication
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400 lg:hidden">
                        Ready to learn faster? Join thousands of students.
                    </p>
                </div>
            </div>
        </div>
    );
}

