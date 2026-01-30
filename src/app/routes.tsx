import { createBrowserRouter, Navigate } from "react-router";
import { lazy, Suspense } from "react";

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import("@/app/pages/landing-page").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("@/app/pages/login-page").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/app/pages/register-page").then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("@/app/pages/dashboard-page").then(m => ({ default: m.DashboardPage })));
const AWSConnectPage = lazy(() => import("@/app/pages/aws-connect-page").then(m => ({ default: m.AWSConnectPage })));
const IAMExplainerPage = lazy(() => import("@/app/pages/iam-explainer-page").then(m => ({ default: m.IAMExplainerPage })));
const RemindersPage = lazy(() => import("@/app/pages/reminders-page").then(m => ({ default: m.RemindersPage })));
const SettingsPage = lazy(() => import("@/app/pages/settings-page").then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import("@/app/pages/not-found-page").then(m => ({ default: m.NotFoundPage })));

// New pages
const MultiAccountPage = lazy(() => import("@/app/pages/multi-account-page").then(m => ({ default: m.MultiAccountPage })));
const CostBreakdownPage = lazy(() => import("@/app/pages/cost-breakdown-page").then(m => ({ default: m.CostBreakdownPage })));
const SecurityAuditPage = lazy(() => import("@/app/pages/security-audit-page").then(m => ({ default: m.SecurityAuditPage })));
const TeamManagementPage = lazy(() => import("@/app/pages/team-management-page").then(m => ({ default: m.TeamManagementPage })));

// Premium feature pages
const ActivityLogPage = lazy(() => import("@/app/pages/activity-log-page").then(m => ({ default: m.ActivityLogPage })));
const BudgetAlertsPage = lazy(() => import("@/app/pages/budget-alerts-page").then(m => ({ default: m.BudgetAlertsPage })));
const ReportsPage = lazy(() => import("@/app/pages/reports-page").then(m => ({ default: m.ReportsPage })));

// Import layout and protected route
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { ProtectedRoute } from "@/app/components/protected-route";

// Loading fallback component
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}

// Wrap component with Suspense
function withSuspense(Component: React.ComponentType) {
    return (
        <Suspense fallback={<PageLoader />}>
            <Component />
        </Suspense>
    );
}

export const router = createBrowserRouter([
    // Public routes
    {
        path: "/",
        element: withSuspense(LandingPage),
    },
    {
        path: "/login",
        element: withSuspense(LoginPage),
    },
    {
        path: "/register",
        element: withSuspense(RegisterPage),
    },

    // Protected app routes
    {
        path: "/app",
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: withSuspense(DashboardPage),
            },
            {
                path: "connect",
                element: withSuspense(AWSConnectPage),
            },
            {
                path: "iam-explainer",
                element: withSuspense(IAMExplainerPage),
            },
            {
                path: "reminders",
                element: withSuspense(RemindersPage),
            },
            {
                path: "settings",
                element: withSuspense(SettingsPage),
            },
            {
                path: "accounts",
                element: withSuspense(MultiAccountPage),
            },
            {
                path: "costs",
                element: withSuspense(CostBreakdownPage),
            },
            {
                path: "security",
                element: withSuspense(SecurityAuditPage),
            },
            {
                path: "team",
                element: withSuspense(TeamManagementPage),
            },
            {
                path: "activity",
                element: withSuspense(ActivityLogPage),
            },
            {
                path: "budgets",
                element: withSuspense(BudgetAlertsPage),
            },
            {
                path: "reports",
                element: withSuspense(ReportsPage),
            },
        ],
    },

    // 404 catch-all
    {
        path: "/404",
        element: withSuspense(NotFoundPage),
    },
    {
        path: "*",
        element: <Navigate to="/404" replace />,
    },
]);
