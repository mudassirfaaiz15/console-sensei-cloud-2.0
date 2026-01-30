import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Check if we're using demo mode (no real Supabase configured)
export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co';
