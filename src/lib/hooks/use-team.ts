import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamData, inviteMember, removeMember, cancelInvitation, resendInvitation, type Invitation } from '@/lib/api/team';
import { notifications } from '@/lib/notifications';

// Query keys
export const teamKeys = {
    all: ['team'] as const,
    members: ['team', 'members'] as const,
    invitations: ['team', 'invitations'] as const,
};

// Fetch all team data
export function useTeamData() {
    return useQuery({
        queryKey: teamKeys.all,
        queryFn: fetchTeamData,
        staleTime: 30000, // 30 seconds
    });
}

// Invite member
export function useInviteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ email, role }: { email: string; role: Invitation['role'] }) =>
            inviteMember(email, role),
        onSuccess: (_, { email }) => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            notifications.success('Invitation sent', `Invited ${email} to the team`);
        },
        onError: (error) => {
            notifications.error('Failed to send invitation', error.message);
        },
    });
}

// Remove member
export function useRemoveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            notifications.success('Member removed', 'Team member has been removed');
        },
        onError: (error) => {
            notifications.error('Failed to remove member', error.message);
        },
    });
}

// Cancel invitation
export function useCancelInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            notifications.success('Invitation cancelled', 'The invitation has been cancelled');
        },
        onError: (error) => {
            notifications.error('Failed to cancel invitation', error.message);
        },
    });
}

// Resend invitation
export function useResendInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: resendInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            notifications.success('Invitation resent', 'A new invitation has been sent');
        },
        onError: (error) => {
            notifications.error('Failed to resend invitation', error.message);
        },
    });
}
