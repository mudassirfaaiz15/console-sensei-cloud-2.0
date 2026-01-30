// ============================================================================
// ConsoleSensei Cloud - Type Definitions
// ============================================================================

// Resource status types
export type ResourceStatus = 'safe' | 'warning' | 'critical';

// Alert types
export type AlertType = 'critical' | 'warning' | 'info';

// Resource types
export type ResourceType = 'ec2' | 'ebs' | 'eip' | 'rds' | 'nat' | 's3' | 'lambda' | 'vpc' | 'other';

// ============================================================================
// AWS Resource Types
// ============================================================================

export interface Resource {
  id: string;
  name: string;
  value: string;
  status: ResourceStatus;
  description: string;
  type?: ResourceType;
  region?: string;
  icon?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  time: string;
  timestamp?: string;
  resourceId?: string;
}

export interface Activity {
  id: string;
  action: string;
  resource: string;
  time: string;
  user: string;
  region?: string;
  timestamp?: string;
  eventType?: string;
}

export interface CostData {
  month: string;
  cost: number;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  awsAccountId?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// Settings & Preferences
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: Theme;
  emailNotifications: boolean;
  slackNotifications: boolean;
  costAlertThreshold: number;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  badge?: string | number;
}

// ============================================================================
// Reminder Types
// ============================================================================

export interface Reminder {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  condition: 'running' | 'cost_threshold' | 'time_based';
  threshold?: number;
  enabled: boolean;
  createdAt: string;
}

// ============================================================================
// Form Validation Schemas (Zod)
// ============================================================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
