import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import {
    LayoutDashboard,
    Settings,
    Bell,
    FileJson,
    Scan,
    Search,
    LogOut,
    Home,
    Download,
    RefreshCw,
    Moon,
    Sun,
    ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';

type CommandItem = {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    shortcut?: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'settings';
};

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();

    // Define commands
    const commands: CommandItem[] = [
        // Navigation
        {
            id: 'nav-home',
            label: 'Go to Home',
            description: 'Return to landing page',
            icon: Home,
            action: () => navigate('/'),
            category: 'navigation',
        },
        {
            id: 'nav-dashboard',
            label: 'Go to Dashboard',
            description: 'View AWS overview',
            icon: LayoutDashboard,
            shortcut: 'G D',
            action: () => navigate('/app'),
            category: 'navigation',
        },
        {
            id: 'nav-connect',
            label: 'AWS Connect',
            description: 'Connect your AWS account',
            icon: Scan,
            shortcut: 'G C',
            action: () => navigate('/app/connect'),
            category: 'navigation',
        },
        {
            id: 'nav-iam',
            label: 'IAM Explainer',
            description: 'Understand IAM policies',
            icon: FileJson,
            shortcut: 'G I',
            action: () => navigate('/app/iam-explainer'),
            category: 'navigation',
        },
        {
            id: 'nav-reminders',
            label: 'Reminders',
            description: 'Manage cost alerts',
            icon: Bell,
            shortcut: 'G R',
            action: () => navigate('/app/reminders'),
            category: 'navigation',
        },
        {
            id: 'nav-settings',
            label: 'Settings',
            description: 'Account preferences',
            icon: Settings,
            shortcut: 'G S',
            action: () => navigate('/app/settings'),
            category: 'navigation',
        },
        // Actions
        {
            id: 'action-scan',
            label: 'Run New Scan',
            description: 'Scan AWS resources',
            icon: RefreshCw,
            shortcut: 'Ctrl+Shift+S',
            action: () => {
                onOpenChange(false);
                // Trigger scan event
                window.dispatchEvent(new CustomEvent('trigger-scan'));
            },
            category: 'actions',
        },
        {
            id: 'action-export',
            label: 'Export Report',
            description: 'Download PDF report',
            icon: Download,
            shortcut: 'Ctrl+E',
            action: () => {
                onOpenChange(false);
                window.dispatchEvent(new CustomEvent('trigger-export'));
            },
            category: 'actions',
        },
        {
            id: 'action-search',
            label: 'Search Resources',
            description: 'Find specific resources',
            icon: Search,
            shortcut: 'Ctrl+F',
            action: () => {
                onOpenChange(false);
                // Could open search modal
            },
            category: 'actions',
        },
        // Settings
        {
            id: 'settings-theme-dark',
            label: 'Switch to Dark Mode',
            description: 'Use dark theme',
            icon: Moon,
            action: () => {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
                localStorage.setItem('theme', 'dark');
                onOpenChange(false);
            },
            category: 'settings',
        },
        {
            id: 'settings-theme-light',
            label: 'Switch to Light Mode',
            description: 'Use light theme',
            icon: Sun,
            action: () => {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                onOpenChange(false);
            },
            category: 'settings',
        },
        ...(isAuthenticated
            ? [
                {
                    id: 'action-logout',
                    label: 'Log Out',
                    description: 'Sign out of your account',
                    icon: LogOut,
                    action: () => {
                        onOpenChange(false);
                        logout();
                        navigate('/');
                    },
                    category: 'settings' as const,
                },
            ]
            : []),
    ];

    // Filter commands based on search
    const filteredCommands = commands.filter(
        (cmd) =>
            cmd.label.toLowerCase().includes(search.toLowerCase()) ||
            cmd.description?.toLowerCase().includes(search.toLowerCase())
    );

    // Group commands by category
    const groupedCommands = {
        navigation: filteredCommands.filter((c) => c.category === 'navigation'),
        actions: filteredCommands.filter((c) => c.category === 'actions'),
        settings: filteredCommands.filter((c) => c.category === 'settings'),
    };

    // Flatten for keyboard navigation
    const flatCommands = [...groupedCommands.navigation, ...groupedCommands.actions, ...groupedCommands.settings];

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
            setSearch('');
            setSelectedIndex(0);
        }
    }, [open]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (flatCommands[selectedIndex]) {
                        flatCommands[selectedIndex].action();
                        onOpenChange(false);
                    }
                    break;
                case 'Escape':
                    onOpenChange(false);
                    break;
            }
        },
        [flatCommands, selectedIndex, onOpenChange]
    );

    const renderCommandGroup = (title: string, commands: CommandItem[], startIndex: number) => {
        if (commands.length === 0) return null;

        return (
            <div className="mb-4">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </div>
                <div className="space-y-1">
                    {commands.map((cmd, i) => {
                        const index = startIndex + i;
                        const Icon = cmd.icon;
                        const isSelected = index === selectedIndex;

                        return (
                            <button
                                key={cmd.id}
                                onClick={() => {
                                    cmd.action();
                                    onOpenChange(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted text-foreground'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{cmd.label}</div>
                                    {cmd.description && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {cmd.description}
                                        </div>
                                    )}
                                </div>
                                {cmd.shortcut && (
                                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                                        {cmd.shortcut}
                                    </kbd>
                                )}
                                {isSelected && (
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center border-b border-border px-4 py-3">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                        ESC
                    </kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {flatCommands.length === 0 ? (
                        <div className="px-3 py-8 text-center text-muted-foreground">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No commands found</p>
                        </div>
                    ) : (
                        <>
                            {renderCommandGroup('Navigation', groupedCommands.navigation, 0)}
                            {renderCommandGroup(
                                'Actions',
                                groupedCommands.actions,
                                groupedCommands.navigation.length
                            )}
                            {renderCommandGroup(
                                'Settings',
                                groupedCommands.settings,
                                groupedCommands.navigation.length + groupedCommands.actions.length
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↑↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">↵</kbd>
                            to select
                        </span>
                    </div>
                    <span>Press <kbd className="px-1.5 py-0.5 bg-background rounded border border-border">Ctrl+K</kbd> to open</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Hook to manage command palette state
 */
export function useCommandPalette() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { open, setOpen };
}
