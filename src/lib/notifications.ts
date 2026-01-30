import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Show a notification toast
 */
export function notify(type: NotificationType, options: NotificationOptions): void {
    const { title, description, duration = 5000, action } = options;

    const toastOptions = {
        description,
        duration,
        action: action
            ? {
                label: action.label,
                onClick: action.onClick,
            }
            : undefined,
    };

    switch (type) {
        case 'success':
            toast.success(title, toastOptions);
            break;
        case 'error':
            toast.error(title, toastOptions);
            break;
        case 'warning':
            toast.warning(title, toastOptions);
            break;
        case 'info':
        default:
            toast.info(title, toastOptions);
            break;
    }
}

/**
 * Convenience methods
 */
export const notifications = {
    success: (title: string, description?: string) =>
        notify('success', { title, description }),

    error: (title: string, description?: string) =>
        notify('error', { title, description }),

    warning: (title: string, description?: string) =>
        notify('warning', { title, description }),

    info: (title: string, description?: string) =>
        notify('info', { title, description }),

    // Specific app notifications
    scanComplete: (resourceCount: number) =>
        notify('success', {
            title: 'Scan Complete',
            description: `Successfully scanned ${resourceCount} AWS resources.`,
        }),

    alertDismissed: () =>
        notify('info', {
            title: 'Alert Dismissed',
            description: 'You can view dismissed alerts in the history.',
        }),

    connectionSuccess: (accountId: string) =>
        notify('success', {
            title: 'AWS Connected',
            description: `Successfully connected to account ${accountId}.`,
        }),

    connectionError: (error: string) =>
        notify('error', {
            title: 'Connection Failed',
            description: error,
        }),

    exportSuccess: (filename: string) =>
        notify('success', {
            title: 'Export Complete',
            description: `Report saved as ${filename}`,
        }),

    settingsSaved: () =>
        notify('success', {
            title: 'Settings Saved',
            description: 'Your preferences have been updated.',
        }),

    loginSuccess: (name: string) =>
        notify('success', {
            title: 'Welcome back!',
            description: `Logged in as ${name}`,
        }),

    logoutSuccess: () =>
        notify('info', {
            title: 'Logged out',
            description: 'You have been successfully logged out.',
        }),
};
