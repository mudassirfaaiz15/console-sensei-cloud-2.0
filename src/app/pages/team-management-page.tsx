import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
    User,
    Plus,
    Mail,
    Shield,
    Trash2,
    MoreVertical,
    Sparkles,
    Eye,
    Edit,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';
import { notifications } from '@/lib/notifications';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
    avatar: string;
    lastActive: string;
    accounts: string[];
}

interface Invitation {
    id: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
}

const TEAM_MEMBERS: TeamMember[] = [
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
    {
        id: 'user-4',
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        role: 'viewer',
        status: 'pending',
        avatar: 'SW',
        lastActive: 'Never',
        accounts: ['Production'],
    },
];

const PENDING_INVITATIONS: Invitation[] = [
    {
        id: 'inv-1',
        email: 'alex@example.com',
        role: 'member',
        invitedBy: 'John Doe',
        invitedAt: '2 days ago',
        expiresAt: 'in 5 days',
    },
    {
        id: 'inv-2',
        email: 'emma@example.com',
        role: 'viewer',
        invitedBy: 'Jane Smith',
        invitedAt: '1 week ago',
        expiresAt: 'Expired',
    },
];

const ROLE_CONFIG = {
    owner: { label: 'Owner', color: 'bg-amber-500', icon: Sparkles, description: 'Full access, can delete organization' },
    admin: { label: 'Admin', color: 'bg-purple-500', icon: Shield, description: 'Full access, cannot delete organization' },
    member: { label: 'Member', color: 'bg-blue-500', icon: Edit, description: 'Can view and edit resources' },
    viewer: { label: 'Viewer', color: 'bg-gray-500', icon: Eye, description: 'Read-only access' },
};

const STATUS_CONFIG = {
    active: { label: 'Active', icon: CheckCircle2, color: 'text-green-500' },
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-500' },
    inactive: { label: 'Inactive', icon: XCircle, color: 'text-red-500' },
};

export function TeamManagementPage() {
    const [members, setMembers] = useState(TEAM_MEMBERS);
    const [invitations, setInvitations] = useState(PENDING_INVITATIONS);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [memberDialogOpen, setMemberDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

    const handleInvite = () => {
        if (!inviteEmail) return;

        setInvitations(prev => [...prev, {
            id: `inv-${Date.now()}`,
            email: inviteEmail,
            role: inviteRole,
            invitedBy: 'You',
            invitedAt: 'Just now',
            expiresAt: 'in 7 days',
        }]);

        notifications.success('Invitation sent', `Invited ${inviteEmail} as ${inviteRole}`);
        setInviteEmail('');
        setInviteDialogOpen(false);
    };

    const handleRemoveMember = (memberId: string) => {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        notifications.success('Member removed', 'The team member has been removed');
        setMemberDialogOpen(false);
    };

    const handleCancelInvitation = (invitationId: string) => {
        setInvitations(prev => prev.filter(i => i.id !== invitationId));
        notifications.success('Invitation cancelled', 'The invitation has been cancelled');
    };

    const handleResendInvitation = (email: string) => {
        notifications.success('Invitation resent', `A new invitation has been sent to ${email}`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <p className="text-muted-foreground">
                        Manage team members and their access permissions
                    </p>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{members.length}</div>
                                <div className="text-sm text-muted-foreground">Team Members</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {members.filter(m => m.status === 'active').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{invitations.length}</div>
                                <div className="text-sm text-muted-foreground">Pending Invites</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Shield className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Admins</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">
                        Team Members
                        <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="invitations">
                        Pending Invitations
                        <Badge variant="secondary" className="ml-2">{invitations.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {members.map((member) => {
                                    const roleConfig = ROLE_CONFIG[member.role];
                                    const statusConfig = STATUS_CONFIG[member.status];
                                    const RoleIcon = roleConfig.icon;
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedMember(member);
                                                setMemberDialogOpen(true);
                                            }}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                {member.avatar}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{member.name}</span>
                                                    {member.role === 'owner' && (
                                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>

                                            {/* Role */}
                                            <Badge className={`${roleConfig.color} text-white`}>
                                                <RoleIcon className="w-3 h-3 mr-1" />
                                                {roleConfig.label}
                                            </Badge>

                                            {/* Status */}
                                            <div className="flex items-center gap-1">
                                                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                                <span className="text-sm text-muted-foreground">{statusConfig.label}</span>
                                            </div>

                                            {/* Last Active */}
                                            <div className="hidden md:block text-sm text-muted-foreground w-32 text-right">
                                                {member.lastActive}
                                            </div>

                                            {/* Actions */}
                                            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invitations Tab */}
                <TabsContent value="invitations" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {invitations.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p>No pending invitations</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {invitations.map((invitation) => {
                                        const roleConfig = ROLE_CONFIG[invitation.role];
                                        const isExpired = invitation.expiresAt === 'Expired';

                                        return (
                                            <div key={invitation.id} className="flex items-center gap-4 p-4">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">{invitation.email}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Invited by {invitation.invitedBy} • {invitation.invitedAt}
                                                    </div>
                                                </div>
                                                <Badge className={`${roleConfig.color} text-white`}>
                                                    {roleConfig.label}
                                                </Badge>
                                                <div className={`text-sm ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    {invitation.expiresAt}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResendInvitation(invitation.email)}
                                                    >
                                                        Resend
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancelInvitation(invitation.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                                <Card key={key}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.color}/10`}>
                                                <Icon className={`w-5 h-5 text-white`} style={{ color: config.color.replace('bg-', '') }} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{config.label}</CardTitle>
                                                <CardDescription>{config.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                <span>View all resources and metrics</span>
                                            </div>
                                            {(key === 'owner' || key === 'admin' || key === 'member') && (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>Run scans and export reports</span>
                                                </div>
                                            )}
                                            {(key === 'owner' || key === 'admin') && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span>Manage team members</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span>Configure AWS accounts</span>
                                                    </div>
                                                </>
                                            )}
                                            {key === 'owner' && (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>Delete organization</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to join your team
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                <option value="admin">Admin - Full access, cannot delete org</option>
                                <option value="member">Member - Can view and edit resources</option>
                                <option value="viewer">Viewer - Read-only access</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={!inviteEmail}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Member Details Dialog */}
            <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
                <DialogContent>
                    {selectedMember && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                                        {selectedMember.avatar}
                                    </div>
                                    <div>
                                        <DialogTitle>{selectedMember.name}</DialogTitle>
                                        <DialogDescription>{selectedMember.email}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase">Role</label>
                                        <div className="mt-1">
                                            <Badge className={`${ROLE_CONFIG[selectedMember.role].color} text-white`}>
                                                {ROLE_CONFIG[selectedMember.role].label}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase">Status</label>
                                        <div className="flex items-center gap-1 mt-1">
                                            {(() => {
                                                const StatusIcon = STATUS_CONFIG[selectedMember.status].icon;
                                                return (
                                                    <>
                                                        <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[selectedMember.status].color}`} />
                                                        <span>{STATUS_CONFIG[selectedMember.status].label}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase">Last Active</label>
                                    <div className="mt-1">{selectedMember.lastActive}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase">Account Access</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedMember.accounts.map((account) => (
                                            <Badge key={account} variant="outline">{account}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                {selectedMember.role !== 'owner' && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleRemoveMember(selectedMember.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Member
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
