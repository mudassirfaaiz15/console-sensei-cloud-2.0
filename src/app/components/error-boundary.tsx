import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to monitoring service in production
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-destructive" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-muted-foreground mb-6">
                            We encountered an unexpected error. This has been logged and we'll look into it.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-left">
                                <p className="font-mono text-sm text-destructive break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={this.handleRetry} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleGoHome}>
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
