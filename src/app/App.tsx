import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';
import { AuthProvider } from '@/app/context/auth-context';
import { ErrorBoundary } from '@/app/components/error-boundary';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

function ThemedToaster() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={isDark ? 'dark' : 'light'}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <ThemedToaster />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
