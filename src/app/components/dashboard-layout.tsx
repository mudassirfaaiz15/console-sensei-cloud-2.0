import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Scan,
  FileJson,
  Bell,
  Settings,
  Cloud,
  Menu,
  LogOut,
  X,
  DollarSign,
  Shield,
  User,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { cn } from '@/app/components/ui/utils';
import { useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { CommandPalette, useCommandPalette } from '@/app/components/command-palette';

// Navigation items with stable IDs
const NAVIGATION = [
  { id: 'nav-dashboard', name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { id: 'nav-scan', name: 'Scan AWS', href: '/app/connect', icon: Scan },
  { id: 'nav-accounts', name: 'Accounts', href: '/app/accounts', icon: Cloud },
  { id: 'nav-costs', name: 'Costs', href: '/app/costs', icon: DollarSign },
  { id: 'nav-security', name: 'Security', href: '/app/security', icon: Shield },
  { id: 'nav-team', name: 'Team', href: '/app/team', icon: User },
  { id: 'nav-iam', name: 'IAM Explainer', href: '/app/iam-explainer', icon: FileJson },
  { id: 'nav-reminders', name: 'Reminders', href: '/app/reminders', icon: Bell },
  { id: 'nav-settings', name: 'Settings', href: '/app/settings', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex md:flex-col md:w-64 bg-sidebar border-r border-sidebar-border"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-3 h-16 px-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3" aria-label="Go to homepage">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Cloud className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                ConsoleSensei
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAVIGATION.map((item) => {
              const isActive =
                item.href === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
              aria-label="Sign out of your account"
            >
              <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={sidebarOpen}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </Button>
              <div className="flex items-center gap-2 md:hidden">
                <Cloud className="w-5 h-5 text-primary" aria-hidden="true" />
                <h1 className="text-lg font-semibold">ConsoleSensei</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-muted-foreground">
                <span className="hidden lg:inline">AWS Account: </span>
                <span className="font-mono">•••••{user?.awsAccountId || '1234'}</span>
              </div>
              <ThemeToggle />
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-40"
            onClick={closeSidebar}
            aria-hidden="true"
          >
            <aside
              className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
                <Link
                  to="/"
                  className="flex items-center gap-3"
                  onClick={closeSidebar}
                  aria-label="Go to homepage"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                    <Cloud className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground">
                    ConsoleSensei
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidebar}
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
                {NAVIGATION.map((item) => {
                  const isActive =
                    item.href === '/app'
                      ? location.pathname === '/app'
                      : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={closeSidebar}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => {
                    closeSidebar();
                    handleLogout();
                  }}
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
                  Sign Out
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  );
}
