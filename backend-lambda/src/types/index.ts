// Common types for ConsoleSensei backend

export type ResourceType =
  | 'EC2_Instance'
  | 'EBS_Volume'
  | 'S3_Bucket'
  | 'RDS_Instance'
  | 'Lambda_Function'
  | 'Load_Balancer'
  | 'NAT_Gateway'
  | 'Elastic_IP'
  | 'IAM_User'
  | 'IAM_Role'
  | 'Security_Group'
  | 'VPC'
  | 'Subnet'
  | 'ECS_Task'
  | 'EKS_Cluster'
  | 'CloudWatch_LogGroup'
  | 'CloudWatch_Alarm';

export interface Resource {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  region: string;
  state: string;
  creationDate?: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  estimatedCostMonthly?: number;
}

export interface ScanSummary {
  totalResources: number;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
}

export interface CostData {
  estimatedMonthly: number;
  byService: Record<string, number>;
  byRegion: Record<string, number>;
  byTag?: Record<string, number>;
}

export interface ScanError {
  type: string;
  service: string;
  region?: string;
  message: string;
  timestamp: string;
}

export interface ScanResult {
  scanId: string;
  userId: string;
  timestamp: string;
  resources: Resource[];
  summary: ScanSummary;
  costData?: CostData;
  errors: ScanError[];
  ttl?: number;
}

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface FixGuide {
  title: string;
  steps: string[];
  cliCommands?: string[];
  consoleSteps?: string[];
  documentationUrl?: string;
}

export interface Issue {
  type: string;
  severity: IssueSeverity;
  resourceId: string;
  resourceName?: string;
  description: string;
  deduction: number;
  fixGuide?: FixGuide;
}

export interface ScoreComponent {
  score: number;
  maxScore: number;
  issues: Issue[];
}

export interface ScoreBreakdown {
  security: ScoreComponent;
  costEfficiency: ScoreComponent;
  bestPractices: ScoreComponent;
}

export interface ScoreResult {
  scanId: string;
  userId: string;
  timestamp: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  ttl?: number;
}

export interface AIRecommendation {
  id: string;
  category: 'cost' | 'security' | 'performance';
  title: string;
  description: string;
  estimatedSavings?: number;
  priority: 'high' | 'medium' | 'low';
  affectedResources: string[];
  actionItems: string[];
}

export interface RiskSummary {
  summary: string;
  criticalIssues: Issue[];
  highIssues: Issue[];
  mediumIssues: Issue[];
  lowIssues: Issue[];
}

export interface PolicyExplanation {
  policyName?: string;
  explanation: string;
  statements: {
    statement: string;
    explanation: string;
    risks: string[];
  }[];
  overallRisk: IssueSeverity;
  recommendations: string[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  timestamp: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  cronExpression?: string;
  timezone: string;
}

export interface AlertConfig {
  email: {
    enabled: boolean;
    address: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
  };
  thresholds: {
    hygieneScoreDrop: number;
    costIncreasePercent: number;
  };
}

export interface UserPreferences {
  defaultRegions?: string[];
  aiModel?: 'bedrock-claude' | 'openai-gpt4';
}

export interface User {
  userId: string;
  email: string;
  cognitoSub: string;
  roleArn?: string;
  scheduleConfig?: ScheduleConfig;
  alertConfig?: AlertConfig;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  alertId: string;
  userId: string;
  timestamp: string;
  alertType: 'new_security_issues' | 'hygiene_score_drop' | 'cost_increase';
  severity: IssueSeverity;
  message: string;
  details: Record<string, any>;
  channels: ('email' | 'slack')[];
  deduplicationKey: string;
  ttl?: number;
}

export interface AICache {
  cacheKey: string;
  userId: string;
  response: any;
  createdAt: string;
  ttl: number;
}

// Lambda Event Types

export interface ScanEvent {
  userId: string;
  roleArn?: string;
  regions?: string[];
}

export interface ScoreEvent {
  scanId: string;
}

export interface AIEvent {
  action: 'cost_advisor' | 'risk_summary' | 'iam_explainer' | 'chat';
  data: any;
  userId: string;
}

export interface ReportEvent {
  scanId: string;
  reportType: 'pdf' | 'diagram';
  options?: Record<string, any>;
  userId: string;
}

export interface SchedulerEvent {
  userId: string;
  scheduleConfig: ScheduleConfig;
}

// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
    requestId?: string;
  };
}
