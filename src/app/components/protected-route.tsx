import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/app/context/auth-context';
import { ReactNode, useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Wait for auth to finish loading and user to be set
        if (!isLoading && isAuthenticated && user) {
            setIsReady(true);
        }
    }, [isLoading, isAuthenticated, user]);

    // Show loading state while checking authentication or waiting for user data
    if (isLoading || !isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
