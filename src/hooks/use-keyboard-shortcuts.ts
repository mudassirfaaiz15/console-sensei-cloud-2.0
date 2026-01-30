import { useEffect, useCallback } from 'react';

type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: () => void;
    description: string;
};

const registeredShortcuts: KeyboardShortcut[] = [];

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], deps: unknown[] = []) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Allow Escape key even in inputs
            if (event.key !== 'Escape') return;
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault();
                shortcut.handler();
                return;
            }
        }
    }, [shortcuts, ...deps]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Get formatted shortcut key label
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler' | 'description'>): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
}

/**
 * Register global shortcut for help
 */
export function registerGlobalShortcut(shortcut: KeyboardShortcut) {
    registeredShortcuts.push(shortcut);
}

export function getRegisteredShortcuts(): KeyboardShortcut[] {
    return registeredShortcuts;
}
