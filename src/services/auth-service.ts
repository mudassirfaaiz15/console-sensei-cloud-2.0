import { supabase, isDemoMode } from '@/lib/supabase';
import type { User } from '@/types';

export interface AuthResult {
    user: User | null;
    error: string | null;
}

// Mock user for demo mode
const DEMO_USER: User = {
    id: 'demo-user-001',
    email: 'demo@consolesensei.cloud',
    name: 'Demo User',
    avatarUrl: undefined,
    awsAccountId: '123456789012',
    createdAt: new Date().toISOString(),
};

// Simulate network delay for demo mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
    /**
     * Sign in with email and password
     */
    async signIn(email: string, password: string): Promise<AuthResult> {
        if (isDemoMode) {
            await delay(800);
            // In demo mode, accept any credentials
            const user: User = {
                ...DEMO_USER,
                email,
                name: email.split('@')[0],
            };
            localStorage.setItem('consolesensei_user', JSON.stringify(user));
            localStorage.setItem('consolesensei_auth', 'true');
            return { user, error: null };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, error: error.message };
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || email.split('@')[0],
            avatarUrl: data.user.user_metadata?.avatar_url,
            createdAt: data.user.created_at,
        };

        return { user, error: null };
    },

    /**
     * Sign up with email and password
     */
    async signUp(email: string, password: string, name: string): Promise<AuthResult> {
        if (isDemoMode) {
            await delay(800);
            const user: User = {
                ...DEMO_USER,
                email,
                name,
            };
            localStorage.setItem('consolesensei_user', JSON.stringify(user));
            localStorage.setItem('consolesensei_auth', 'true');
            return { user, error: null };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Registration failed' };
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: name,
            createdAt: data.user.created_at,
        };

        return { user, error: null };
    },

    /**
     * Sign out
     */
    async signOut(): Promise<{ error: string | null }> {
        if (isDemoMode) {
            await delay(300);
            localStorage.removeItem('consolesensei_user');
            localStorage.removeItem('consolesensei_auth');
            return { error: null };
        }

        const { error } = await supabase.auth.signOut();
        return { error: error?.message || null };
    },

    /**
     * Get current session
     */
    async getSession(): Promise<AuthResult> {
        if (isDemoMode) {
            const storedAuth = localStorage.getItem('consolesensei_auth');
            const storedUser = localStorage.getItem('consolesensei_user');

            if (storedAuth === 'true' && storedUser) {
                return { user: JSON.parse(storedUser), error: null };
            }
            return { user: null, error: null };
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            return { user: null, error: error?.message || null };
        }

        const user: User = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || '',
            avatarUrl: data.session.user.user_metadata?.avatar_url,
            createdAt: data.session.user.created_at,
        };

        return { user, error: null };
    },

    /**
     * Sign in with OAuth provider
     */
    async signInWithOAuth(provider: 'google' | 'github'): Promise<{ error: string | null }> {
        if (isDemoMode) {
            // In demo mode, just simulate a login
            await delay(500);
            const user: User = {
                ...DEMO_USER,
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                email: `user@${provider}.com`,
            };
            localStorage.setItem('consolesensei_user', JSON.stringify(user));
            localStorage.setItem('consolesensei_auth', 'true');
            window.location.href = '/app';
            return { error: null };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/app`,
            },
        });

        return { error: error?.message || null };
    },

    /**
     * Update user profile
     */
    async updateProfile(updates: { name?: string; avatarUrl?: string }): Promise<AuthResult> {
        if (isDemoMode) {
            await delay(500);
            const storedUser = localStorage.getItem('consolesensei_user');
            if (storedUser) {
                const user = { ...JSON.parse(storedUser), ...updates };
                localStorage.setItem('consolesensei_user', JSON.stringify(user));
                return { user, error: null };
            }
            return { user: null, error: 'No user found' };
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                name: updates.name,
                avatar_url: updates.avatarUrl,
            },
        });

        if (error) {
            return { user: null, error: error.message };
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            avatarUrl: data.user.user_metadata?.avatar_url,
            createdAt: data.user.created_at,
        };

        return { user, error: null };
    },
};
