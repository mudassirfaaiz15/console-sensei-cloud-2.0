import { supabase, isDemoMode } from '@/lib/supabase';

// Types
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
    avatar: string;
    lastActive: string;
    accounts: string[];
}

export interface Invitation {
    id: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
}

export interface TeamData {
    members: TeamMember[];
    invitations: Invitation[];
    totalMembers: number;
    activeMembers: number;
    pendingInvites: number;
    adminCount: number;
}

// Demo data
const DEMO_MEMBERS: TeamMember[] = [
    {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        status: 'active',
        avatar: 'JD',
        lastActive: 'Now',
        accounts: ['Production', 'Staging', 'Development'],
    },
    {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        status: 'active',
        avatar: 'JS',
        lastActive: '5 minutes ago',
        accounts: ['Production', 'Staging'],
    },
    {
        id: 'user-3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'member',
        status: 'active',
        avatar: 'MJ',
        lastActive: '2 hours ago',
        accounts: ['Development'],
    },
];

const DEMO_INVITATIONS: Invitation[] = [
    {
        id: 'inv-1',
        email: 'alex@example.com',
        role: 'member',
        invitedBy: 'John Doe',
        invitedAt: '2 days ago',
        expiresAt: 'in 5 days',
    },
];

// API Functions
export async function fetchTeamData(): Promise<TeamData> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            members: DEMO_MEMBERS,
            invitations: DEMO_INVITATIONS,
            totalMembers: DEMO_MEMBERS.length,
            activeMembers: DEMO_MEMBERS.filter(m => m.status === 'active').length,
            pendingInvites: DEMO_INVITATIONS.length,
            adminCount: DEMO_MEMBERS.filter(m => m.role === 'admin' || m.role === 'owner').length,
        };
    }

    const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending');

    const members = data || [];
    const pendingInvitations = invitations || [];

    return {
        members,
        invitations: pendingInvitations,
        totalMembers: members.length,
        activeMembers: members.filter((m: TeamMember) => m.status === 'active').length,
        pendingInvites: pendingInvitations.length,
        adminCount: members.filter((m: TeamMember) => m.role === 'admin' || m.role === 'owner').length,
    };
}

export async function inviteMember(email: string, role: Invitation['role']): Promise<Invitation> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            id: `inv-${Date.now()}`,
            email,
            role,
            invitedBy: 'You',
            invitedAt: 'Just now',
            expiresAt: 'in 7 days',
        };
    }

    const { data, error } = await supabase
        .from('invitations')
        .insert({ email, role, status: 'pending' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeMember(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function cancelInvitation(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
    }

    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function resendInvitation(id: string): Promise<void> {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
    }

    const { error } = await supabase
        .from('invitations')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}
