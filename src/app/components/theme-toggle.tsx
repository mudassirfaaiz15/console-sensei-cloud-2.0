import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import type { Theme } from '@/types';

const THEME_STORAGE_KEY = 'consolesensei_theme';

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

        if (storedTheme) {
            setTheme(storedTheme);
            applyTheme(storedTheme);
        } else {
            // Default to dark theme for this app
            setTheme('dark');
            applyTheme('dark');
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        const body = document.body;

        // Remove existing theme classes
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
            body.classList.add(systemTheme);
        } else {
            root.classList.add(newTheme);
            body.classList.add(newTheme);
        }
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
                <Sun className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle theme"
                    className="relative"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleThemeChange('light')}
                    className="cursor-pointer"
                >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('dark')}
                    className="cursor-pointer"
                >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('system')}
                    className="cursor-pointer"
                >
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
