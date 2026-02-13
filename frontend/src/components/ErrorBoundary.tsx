import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200 p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-lg p-6 text-center shadow-lg">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-slate-400 mb-6 text-sm">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="gap-2 w-full"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
