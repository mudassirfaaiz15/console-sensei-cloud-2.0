import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '@/services/auth-service';
import { logger } from '@/lib/utils/logger';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { user, error } = await authService.getSession();
                if (!error && user) {
                    setUser(user);
                }
            } catch (err) {
                logger.error('Session check failed', err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const { user, error } = await authService.signIn(
                credentials.email,
                credentials.password
            );

            if (error) {
                throw new Error(error);
            }

            if (user) {
                setUser(user);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        setIsLoading(true);
        try {
            const { user, error } = await authService.signUp(
                credentials.email,
                credentials.password,
                credentials.name
            );

            if (error) {
                throw new Error(error);
            }

            if (user) {
                setUser(user);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            const { error } = await authService.signOut();
            if (error) {
                logger.error('Logout error', new Error(error));
            }
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithOAuth = async (provider: 'google' | 'github') => {
        const { error } = await authService.signInWithOAuth(provider);
        if (error) {
            throw new Error(error);
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        const { user: updatedUser, error } = await authService.updateProfile({
            name: updates.name,
            avatarUrl: updates.avatarUrl,
        });

        if (error) {
            throw new Error(error);
        }

        if (updatedUser) {
            setUser(updatedUser);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginWithOAuth,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
