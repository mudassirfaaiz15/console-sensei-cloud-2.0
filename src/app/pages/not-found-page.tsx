import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Cloud, Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-3 mb-8"
                    aria-label="Go to homepage"
                >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                        <Cloud className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-semibold">ConsoleSensei</span>
                </Link>

                {/* 404 Graphic */}
                <div className="relative mb-8">
                    <div className="text-[120px] md:text-[160px] font-bold text-muted/20 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <Search className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl md:text-3xl font-bold mb-3">
                    Page Not Found
                </h1>
                <p className="text-muted-foreground mb-8">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        aria-label="Go back to previous page"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Link to="/">
                        <Button aria-label="Go to homepage">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                        Looking for something specific?
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link
                            to="/app"
                            className="text-primary hover:underline"
                            aria-label="Go to dashboard"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/app/connect"
                            className="text-primary hover:underline"
                            aria-label="Go to AWS connection page"
                        >
                            Connect AWS
                        </Link>
                        <Link
                            to="/app/settings"
                            className="text-primary hover:underline"
                            aria-label="Go to settings"
                        >
                            Settings
                        </Link>
                        <Link
                            to="/login"
                            className="text-primary hover:underline"
                            aria-label="Go to login page"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
