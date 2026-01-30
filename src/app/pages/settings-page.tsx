import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { useAuth } from '@/app/context/auth-context';
import { ThemeToggle } from '@/app/components/theme-toggle';
import {
    User,
    Bell,
    Shield,
    CreditCard,
    Link2,
    LogOut,
    Save,
    Trash2,
} from 'lucide-react';

export function SettingsPage() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile
                    </CardTitle>
                    <CardDescription>
                        Your personal information and public profile
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20">
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="font-medium text-lg">{user?.name || 'User'}</p>
                            <p className="text-muted-foreground">{user?.email || 'user@example.com'}</p>
                            <Button variant="outline" size="sm" aria-label="Change profile picture">
                                Change Photo
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                defaultValue={user?.name || ''}
                                placeholder="Your name"
                                aria-label="Display name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                defaultValue={user?.email || ''}
                                placeholder="your@email.com"
                                aria-label="Email address"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button aria-label="Save profile changes">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize how ConsoleSensei looks on your device
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-muted-foreground">
                                Switch between light and dark mode
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Configure how you want to receive alerts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive alerts via email
                            </p>
                        </div>
                        <Switch defaultChecked aria-label="Toggle email notifications" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Cost Alerts</p>
                            <p className="text-sm text-muted-foreground">
                                Get notified when costs exceed threshold
                            </p>
                        </div>
                        <Switch defaultChecked aria-label="Toggle cost alerts" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Security Alerts</p>
                            <p className="text-sm text-muted-foreground">
                                Instant alerts for security issues
                            </p>
                        </div>
                        <Switch defaultChecked aria-label="Toggle security alerts" />
                    </div>
                </CardContent>
            </Card>

            {/* AWS Connection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        AWS Connection
                    </CardTitle>
                    <CardDescription>
                        Manage your AWS account connections
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">AWS Account</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                    ••••••••{user?.awsAccountId || '1234'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-green-500">Connected</span>
                            <Link to="/app/connect">
                                <Button variant="outline" size="sm" aria-label="Manage AWS connection">
                                    Manage
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Billing */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Billing
                    </CardTitle>
                    <CardDescription>
                        Manage your subscription and payment methods
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div>
                            <p className="font-medium">Free Plan</p>
                            <p className="text-sm text-muted-foreground">
                                You're currently on the free tier
                            </p>
                        </div>
                        <Button variant="outline" aria-label="Upgrade subscription plan">
                            Upgrade
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Sign Out</p>
                            <p className="text-sm text-muted-foreground">
                                Sign out of your account on this device
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogout} aria-label="Sign out of account">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button variant="destructive" aria-label="Delete account permanently">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
