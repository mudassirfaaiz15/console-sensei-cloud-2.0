# Requirements Document

## Introduction

ConsoleSensei Cloud is transforming from a frontend-heavy demo with a basic Flask backend into a production-ready AWS-integrated SaaS platform. This transformation will create a secure, scalable, serverless architecture suitable for AWS competition submission, featuring real-time AWS resource scanning, AI-powered insights, automated scheduling, and comprehensive security best practices.

The system will replace all mock data with real AWS SDK integrations, implement a production-grade hygiene scoring algorithm, integrate AI capabilities for cost optimization and security analysis, and deploy on AWS serverless infrastructure (Lambda, API Gateway, DynamoDB, S3, EventBridge, Cognito).

## Glossary

- **System**: The ConsoleSensei Cloud platform
- **Backend**: AWS Lambda functions and API Gateway endpoints
- **Frontend**: React 18 + TypeScript web application
- **Scanner**: AWS resource scanning service using boto3 or AWS SDK
- **Hygiene_Score**: Calculated metric (0-100) representing AWS account health
- **AI_Service**: AWS Bedrock or OpenAI API integration for intelligent insights
- **Scheduler**: AWS EventBridge service for automated scans
- **Alert_System**: SES and Slack notification service
- **User**: Authenticated user with AWS account access
- **Resource**: Any AWS service entity (EC2, S3, RDS, Lambda, etc.)
- **Scan_Result**: Complete snapshot of AWS resources at a point in time
- **Cross_Account_Role**: IAM role for secure AssumeRole access
- **DynamoDB_Store**: NoSQL database for scan results and user data
- **S3_Report_Storage**: S3 bucket for PDF reports and exports
- **Cognito_Auth**: AWS Cognito user pool for authentication

## Requirements

### Requirement 1: Serverless Backend Architecture

**User Story:** As a platform architect, I want to deploy the backend on AWS serverless infrastructure, so that the system is scalable, cost-effective, and production-ready.

#### Acceptance Criteria

1. THE System SHALL deploy all backend logic as AWS Lambda functions
2. THE System SHALL expose APIs through AWS API Gateway with REST endpoints
3. THE System SHALL use DynamoDB for persistent storage of scan results, user data, and alert configurations
4. THE System SHALL use S3 for storing PDF reports and exported data
5. THE System SHALL implement AWS EventBridge for scheduled scan triggers
6. THE System SHALL use CloudWatch for centralized logging and metrics
7. THE System SHALL define IAM roles with least privilege access for all Lambda functions
8. THE System SHALL support both Node.js and Python Lambda runtimes
9. THE System SHALL implement API Gateway request validation and throttling
10. THE System SHALL use environment variables for all configuration and secrets

### Requirement 2: Secure Authentication and Authorization

**User Story:** As a security-conscious user, I want secure authentication and authorization, so that only authorized users can access AWS resources.

#### Acceptance Criteria

1. THE System SHALL implement AWS Cognito for user authentication
2. THE System SHALL support user registration, login, and password reset flows
3. THE System SHALL issue JWT tokens for authenticated API requests
4. THE System SHALL validate JWT tokens on all protected API endpoints
5. THE System SHALL implement cross-account IAM role assumption using STS AssumeRole
6. THE System SHALL never store or log AWS root credentials
7. THE System SHALL require MFA for administrative operations
8. THE System SHALL implement session timeout after 24 hours of inactivity
9. THE System SHALL encrypt all sensitive data at rest using AWS KMS
10. THE System SHALL implement API rate limiting per user

### Requirement 3: Real AWS Resource Scanning

**User Story:** As a user, I want to scan my AWS account for all resources across all regions, so that I have complete visibility into my infrastructure.

#### Acceptance Criteria

1. WHEN a scan is initiated, THE Scanner SHALL discover all enabled AWS regions
2. WHEN scanning regions, THE Scanner SHALL scan EC2 instances, EBS volumes, Elastic IPs, security groups, and VPCs
3. WHEN scanning storage, THE Scanner SHALL scan S3 buckets with size, encryption status, and public access configuration
4. WHEN scanning databases, THE Scanner SHALL scan RDS instances, Aurora clusters, and DynamoDB tables
5. WHEN scanning compute, THE Scanner SHALL scan Lambda functions, ECS tasks, and EKS clusters
6. WHEN scanning networking, THE Scanner SHALL scan load balancers, NAT gateways, VPN connections, and Transit Gateways
7. WHEN scanning IAM, THE Scanner SHALL scan users, roles, policies, and MFA status
8. WHEN scanning monitoring, THE Scanner SHALL scan CloudWatch log groups, alarms, and metrics
9. WHEN scanning completes, THE Scanner SHALL store results in DynamoDB with timestamp and user ID
10. WHEN scanning encounters errors, THE Scanner SHALL log errors to CloudWatch and continue scanning other resources
11. THE Scanner SHALL complete full account scans within 5 minutes for accounts with up to 1000 resources
12. THE Scanner SHALL use concurrent execution for multi-region scanning

### Requirement 4: Hygiene Score Algorithm

**User Story:** As a user, I want an accurate hygiene score for my AWS account, so that I can quickly assess my cloud health.

#### Acceptance Criteria

1. THE System SHALL calculate a hygiene score from 0 to 100 based on security, cost efficiency, and best practices
2. THE System SHALL weight security factors at 40% of the total score
3. WHEN calculating security score, THE System SHALL deduct points for public S3 buckets without encryption
4. WHEN calculating security score, THE System SHALL deduct points for security groups allowing 0.0.0.0/0 access on sensitive ports
5. WHEN calculating security score, THE System SHALL deduct points for unencrypted EBS volumes
6. WHEN calculating security score, THE System SHALL deduct points for IAM users without MFA enabled
7. WHEN calculating security score, THE System SHALL deduct points for overly permissive IAM policies
8. THE System SHALL weight cost efficiency factors at 30% of the total score
9. WHEN calculating cost efficiency score, THE System SHALL deduct points for stopped EC2 instances running for more than 7 days
10. WHEN calculating cost efficiency score, THE System SHALL deduct points for unattached EBS volumes
11. WHEN calculating cost efficiency score, THE System SHALL deduct points for oversized instances with low CPU utilization
12. WHEN calculating cost efficiency score, THE System SHALL deduct points for unassociated Elastic IPs
13. THE System SHALL weight best practices factors at 30% of the total score
14. WHEN calculating best practices score, THE System SHALL deduct points for resources without proper tags
15. WHEN calculating best practices score, THE System SHALL deduct points for missing backup policies on critical resources
16. WHEN calculating best practices score, THE System SHALL deduct points for disabled CloudWatch monitoring
17. THE System SHALL store the scoring methodology documentation in the codebase
18. THE System SHALL provide detailed breakdown of score components in API responses

### Requirement 5: Remove All Mock Data

**User Story:** As a user, I want to see real data from my AWS account, so that the dashboard reflects my actual infrastructure.

#### Acceptance Criteria

1. THE Frontend SHALL remove all mock data from Dashboard components
2. THE Frontend SHALL remove all mock data from AWS Resources page
3. THE Frontend SHALL remove all mock data from Accounts page
4. THE Frontend SHALL remove all mock data from Cost Breakdown page
5. THE Frontend SHALL remove all mock data from Security Audit page
6. THE Frontend SHALL remove all mock data from Reminders page
7. THE Frontend SHALL remove all mock data from IAM Explainer page
8. THE Frontend SHALL fetch all data from Backend APIs
9. WHEN API calls fail, THE Frontend SHALL display appropriate error messages
10. WHEN data is loading, THE Frontend SHALL display loading states with skeleton screens
11. THE Frontend SHALL implement error boundaries for graceful error handling
12. THE Frontend SHALL cache API responses for 5 minutes to reduce backend calls

### Requirement 6: AI-Powered Cost Advisor

**User Story:** As a user, I want AI-generated cost optimization recommendations, so that I can reduce my AWS spending.

#### Acceptance Criteria

1. THE AI_Service SHALL integrate with AWS Bedrock Claude model or OpenAI GPT-4
2. WHEN analyzing costs, THE AI_Service SHALL receive scan results and Cost Explorer data
3. WHEN generating recommendations, THE AI_Service SHALL identify unused resources with estimated savings
4. WHEN generating recommendations, THE AI_Service SHALL suggest right-sizing opportunities for oversized instances
5. WHEN generating recommendations, THE AI_Service SHALL recommend Reserved Instance or Savings Plan purchases
6. WHEN generating recommendations, THE AI_Service SHALL identify opportunities to use cheaper storage classes
7. THE AI_Service SHALL provide estimated monthly savings for each recommendation
8. THE AI_Service SHALL prioritize recommendations by potential savings amount
9. THE AI_Service SHALL generate recommendations in plain English suitable for non-technical users
10. THE System SHALL cache AI recommendations for 24 hours to reduce API costs
11. THE System SHALL implement retry logic with exponential backoff for AI API failures

### Requirement 7: AI-Powered Risk Summary

**User Story:** As a user, I want AI-generated security risk summaries, so that I can understand security issues in plain English.

#### Acceptance Criteria

1. WHEN security issues are detected, THE AI_Service SHALL generate a plain English summary
2. WHEN summarizing risks, THE AI_Service SHALL categorize issues by severity (critical, high, medium, low)
3. WHEN summarizing risks, THE AI_Service SHALL explain the potential impact of each issue
4. WHEN summarizing risks, THE AI_Service SHALL provide actionable remediation steps
5. THE AI_Service SHALL highlight the most critical issues requiring immediate attention
6. THE AI_Service SHALL generate summaries within 10 seconds
7. THE System SHALL display AI-generated summaries on the Security Audit page

### Requirement 8: IAM Policy Explainer

**User Story:** As a user, I want AI to explain complex IAM policies, so that I can understand permissions and identify over-permissive access.

#### Acceptance Criteria

1. WHEN a user selects an IAM policy, THE AI_Service SHALL parse the policy JSON
2. WHEN explaining policies, THE AI_Service SHALL describe each statement in plain English
3. WHEN explaining policies, THE AI_Service SHALL identify overly permissive statements (e.g., Action: "*")
4. WHEN explaining policies, THE AI_Service SHALL highlight security risks in policy statements
5. WHEN explaining policies, THE AI_Service SHALL suggest least-privilege alternatives
6. THE AI_Service SHALL support inline policies, managed policies, and assume role policies
7. THE System SHALL display explanations on the IAM Explainer page with highlighted risk sections

### Requirement 9: Cloud Copilot Chat Interface

**User Story:** As a user, I want to ask questions about my AWS resources in natural language, so that I can get instant answers without searching documentation.

#### Acceptance Criteria

1. THE System SHALL provide a chat interface for natural language queries
2. WHEN a user asks a question, THE AI_Service SHALL receive the question and current scan results as context
3. WHEN answering questions, THE AI_Service SHALL provide accurate answers based on the user's actual AWS resources
4. WHEN answering questions, THE AI_Service SHALL cite specific resources in responses
5. THE AI_Service SHALL support questions about costs, security, resource counts, and configurations
6. THE AI_Service SHALL maintain conversation context for follow-up questions
7. THE System SHALL display chat history for the current session
8. THE System SHALL implement streaming responses for better user experience
9. THE System SHALL limit chat history to the last 10 messages to control AI API costs

### Requirement 10: Scheduled Scans and Alerts

**User Story:** As a user, I want automated scheduled scans and alerts, so that I'm notified of issues without manual intervention.

#### Acceptance Criteria

1. THE Scheduler SHALL use AWS EventBridge to trigger scans on a schedule
2. THE System SHALL support daily, weekly, and custom cron schedule configurations
3. WHEN a scheduled scan completes, THE System SHALL compare results with the previous scan
4. WHEN new security issues are detected, THE Alert_System SHALL send notifications
5. WHEN hygiene score drops below a threshold, THE Alert_System SHALL send notifications
6. WHEN cost increases exceed a threshold percentage, THE Alert_System SHALL send notifications
7. THE Alert_System SHALL support email notifications via AWS SES
8. THE Alert_System SHALL support Slack webhook notifications
9. THE System SHALL allow users to configure alert thresholds and notification preferences
10. THE System SHALL store alert configurations in DynamoDB per user
11. THE System SHALL include a summary of changes in alert notifications
12. THE System SHALL implement alert deduplication to prevent notification spam

### Requirement 11: Security Best Practices

**User Story:** As a security engineer, I want the system to follow AWS security best practices, so that the platform itself is secure.

#### Acceptance Criteria

1. THE System SHALL never store AWS credentials in code or version control
2. THE System SHALL use AWS Secrets Manager or Parameter Store for sensitive configuration
3. THE System SHALL encrypt all data at rest using AWS KMS
4. THE System SHALL encrypt all data in transit using TLS 1.2 or higher
5. THE System SHALL implement input validation on all API endpoints
6. THE System SHALL sanitize all user inputs to prevent injection attacks
7. THE System SHALL implement comprehensive CloudWatch logging for all Lambda functions
8. THE System SHALL log all authentication attempts and API access
9. THE System SHALL implement AWS WAF rules on API Gateway to prevent common attacks
10. THE System SHALL use VPC endpoints for private communication between AWS services
11. THE System SHALL implement least privilege IAM policies for all resources
12. THE System SHALL enable AWS CloudTrail for audit logging
13. THE System SHALL implement automated security scanning in CI/CD pipeline

### Requirement 12: PDF Report Export

**User Story:** As a user, I want to export scan results as PDF reports, so that I can share findings with stakeholders.

#### Acceptance Criteria

1. WHEN a user requests a report, THE System SHALL generate a PDF with scan results
2. WHEN generating reports, THE System SHALL include hygiene score and breakdown
3. WHEN generating reports, THE System SHALL include resource inventory by type and region
4. WHEN generating reports, THE System SHALL include security findings with severity levels
5. WHEN generating reports, THE System SHALL include cost breakdown and trends
6. WHEN generating reports, THE System SHALL include AI-generated recommendations
7. THE System SHALL store generated PDFs in S3 with signed URLs for download
8. THE System SHALL expire PDF download URLs after 24 hours
9. THE System SHALL generate reports within 30 seconds
10. THE System SHALL support custom report branding with user logo

### Requirement 13: Architecture Diagram Generation

**User Story:** As a user, I want to visualize my AWS architecture, so that I can understand resource relationships.

#### Acceptance Criteria

1. WHEN a user requests an architecture diagram, THE System SHALL generate a visual representation
2. WHEN generating diagrams, THE System SHALL show VPCs, subnets, and network boundaries
3. WHEN generating diagrams, THE System SHALL show compute resources (EC2, Lambda, ECS)
4. WHEN generating diagrams, THE System SHALL show data stores (RDS, DynamoDB, S3)
5. WHEN generating diagrams, THE System SHALL show network connections and load balancers
6. THE System SHALL use a standard diagram format (PNG or SVG)
7. THE System SHALL store generated diagrams in S3
8. THE System SHALL support exporting diagrams in multiple formats

### Requirement 14: Fix Guide for Issues

**User Story:** As a user, I want step-by-step fix guides for detected issues, so that I can remediate problems quickly.

#### Acceptance Criteria

1. WHEN security issues are detected, THE System SHALL provide a "Fix Guide" button
2. WHEN a user clicks "Fix Guide", THE System SHALL display step-by-step remediation instructions
3. WHEN displaying fix guides, THE System SHALL include AWS CLI commands for automation
4. WHEN displaying fix guides, THE System SHALL include AWS Console navigation steps
5. WHEN displaying fix guides, THE System SHALL include links to relevant AWS documentation
6. THE System SHALL provide fix guides for all common security issues
7. THE System SHALL provide fix guides for all common cost optimization opportunities

### Requirement 15: Real-Time Cost Data Integration

**User Story:** As a user, I want to see my actual AWS costs, so that I can track spending accurately.

#### Acceptance Criteria

1. THE System SHALL integrate with AWS Cost Explorer API
2. WHEN fetching cost data, THE System SHALL retrieve costs for the last 30 days
3. WHEN fetching cost data, THE System SHALL break down costs by service
4. WHEN fetching cost data, THE System SHALL break down costs by region
5. WHEN fetching cost data, THE System SHALL break down costs by tag
6. THE System SHALL calculate month-over-month cost trends
7. THE System SHALL identify the top 10 cost drivers
8. THE System SHALL display cost forecasts for the current month
9. THE System SHALL cache cost data for 6 hours to reduce API calls

### Requirement 16: Infrastructure as Code Deployment

**User Story:** As a DevOps engineer, I want to deploy the entire infrastructure using IaC, so that deployments are repeatable and version-controlled.

#### Acceptance Criteria

1. THE System SHALL provide AWS SAM, CDK, or Serverless Framework templates
2. THE System SHALL define all Lambda functions in IaC templates
3. THE System SHALL define API Gateway configuration in IaC templates
4. THE System SHALL define DynamoDB tables with appropriate indexes in IaC templates
5. THE System SHALL define S3 buckets with encryption and lifecycle policies in IaC templates
6. THE System SHALL define IAM roles and policies in IaC templates
7. THE System SHALL define EventBridge rules in IaC templates
8. THE System SHALL define Cognito user pool configuration in IaC templates
9. THE System SHALL support multi-environment deployments (dev, staging, prod)
10. THE System SHALL include deployment documentation in README

### Requirement 17: Frontend Production Improvements

**User Story:** As a user, I want a polished production-ready UI, so that the application is professional and easy to use.

#### Acceptance Criteria

1. THE Frontend SHALL display loading states with skeleton screens for all async operations
2. THE Frontend SHALL implement error boundaries to catch and display errors gracefully
3. THE Frontend SHALL display user-friendly error messages for all error conditions
4. THE Frontend SHALL implement retry logic for failed API requests
5. THE Frontend SHALL display toast notifications for user actions
6. THE Frontend SHALL implement responsive design for mobile and tablet devices
7. THE Frontend SHALL optimize bundle size and implement code splitting
8. THE Frontend SHALL implement lazy loading for route components
9. THE Frontend SHALL achieve Lighthouse performance score above 90
10. THE Frontend SHALL implement accessibility features (ARIA labels, keyboard navigation)

### Requirement 18: Monitoring and Observability

**User Story:** As a platform operator, I want comprehensive monitoring and observability, so that I can detect and resolve issues quickly.

#### Acceptance Criteria

1. THE System SHALL log all Lambda function invocations to CloudWatch
2. THE System SHALL log all API Gateway requests with response times
3. THE System SHALL create CloudWatch metrics for scan duration
4. THE System SHALL create CloudWatch metrics for API error rates
5. THE System SHALL create CloudWatch metrics for AI API latency
6. THE System SHALL create CloudWatch alarms for Lambda function errors
7. THE System SHALL create CloudWatch alarms for API Gateway 5xx errors
8. THE System SHALL create CloudWatch alarms for DynamoDB throttling
9. THE System SHALL implement distributed tracing with AWS X-Ray
10. THE System SHALL create a CloudWatch dashboard for key metrics

### Requirement 19: Data Persistence and History

**User Story:** As a user, I want to track changes over time, so that I can see trends and historical data.

#### Acceptance Criteria

1. THE System SHALL store all scan results in DynamoDB with timestamps
2. THE System SHALL retain scan history for 90 days
3. WHEN displaying trends, THE System SHALL compare current scan with previous scans
4. WHEN displaying trends, THE System SHALL show hygiene score changes over time
5. WHEN displaying trends, THE System SHALL show resource count changes over time
6. WHEN displaying trends, THE System SHALL show cost changes over time
7. THE System SHALL implement DynamoDB TTL for automatic data expiration
8. THE System SHALL support querying historical scan results by date range

### Requirement 20: Competition Submission Readiness

**User Story:** As a competition participant, I want comprehensive documentation and a polished demo, so that the submission is competitive.

#### Acceptance Criteria

1. THE System SHALL include a comprehensive README with project overview
2. THE System SHALL include architecture diagrams in documentation
3. THE System SHALL include setup and deployment instructions
4. THE System SHALL include API documentation with example requests
5. THE System SHALL include a demo video or screenshots
6. THE System SHALL include a list of AWS services used
7. THE System SHALL include security best practices documentation
8. THE System SHALL include cost optimization features documentation
9. THE System SHALL include AI features documentation
10. THE System SHALL include a section on scalability and production readiness
11. THE System SHALL include attribution for all third-party libraries
12. THE System SHALL include a license file
