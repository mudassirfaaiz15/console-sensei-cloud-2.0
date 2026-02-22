# Implementation Plan: Production AWS SaaS Transformation

## Overview

This implementation plan transforms ConsoleSensei Cloud from a Flask demo into a production-ready AWS serverless SaaS platform. The implementation uses TypeScript for Lambda functions, integrates AWS services (API Gateway, DynamoDB, S3, EventBridge, Cognito, Bedrock), removes all mock data, implements real hygiene scoring, and adds AI-powered features.

The plan follows an incremental approach: infrastructure setup → backend Lambda functions → data persistence → AI integration → frontend updates → scheduling and alerts → production polish.

## Tasks

- [x] 1. Set up AWS infrastructure and project structure
  - Create backend-lambda/ directory for Lambda functions
  - Set up AWS SAM or CDK template for infrastructure as code
  - Define DynamoDB table schemas (ScanResults, Users, HygieneScores, AlertHistory, AICache)
  - Define S3 bucket configurations (reports-bucket, diagrams-bucket)
  - Define API Gateway REST API structure
  - Define Cognito User Pool configuration
  - Define IAM roles and policies for Lambda functions
  - Set up TypeScript configuration for Lambda functions
  - Install dependencies (aws-sdk, @aws-sdk/client-*, typescript, etc.)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

- [ ] 2. Implement Scan Lambda function
  - [x] 2.1 Create scan Lambda handler and AWS session management
    - Implement handler function with event/context parameters
    - Implement AssumeRole for cross-account access
    - Implement region discovery using EC2 DescribeRegions
    - Set up AWS SDK clients for all services
    - _Requirements: 2.5, 3.1_
  
  - [x] 2.2 Implement EC2 resource scanning
    - Scan EC2 instances with metadata (instance type, state, tags, IPs)
    - Scan EBS volumes with metadata (size, type, encryption, attachments)
    - Scan Elastic IPs with association status
    - Scan security groups with ingress/egress rules
    - Scan VPCs and subnets
    - _Requirements: 3.2_
  
  - [x] 2.3 Implement S3 resource scanning
    - Scan S3 buckets (global service)
    - Get bucket region, size, encryption status
    - Check public access configuration
    - Get bucket tags
    - _Requirements: 3.3_
  
  - [x] 2.4 Implement RDS and database scanning
    - Scan RDS instances with metadata (engine, class, storage, multi-AZ)
    - Scan Aurora clusters
    - Scan DynamoDB tables
    - _Requirements: 3.4_
  
  - [x] 2.5 Implement Lambda and compute scanning
    - Scan Lambda functions with metadata (runtime, memory, timeout)
    - Scan ECS tasks and services
    - Scan EKS clusters
    - _Requirements: 3.5_
  
  - [x] 2.6 Implement networking resource scanning
    - Scan load balancers (ALB, NLB, CLB)
    - Scan NAT gateways
    - Scan VPN connections
    - Scan Transit Gateways
    - _Requirements: 3.6_
  
  - [x] 2.7 Implement IAM scanning
    - Scan IAM users with MFA status
    - Scan IAM roles
    - Scan IAM policies
    - Check for overly permissive policies
    - _Requirements: 3.7_
  
  - [x] 2.8 Implement CloudWatch scanning
    - Scan CloudWatch log groups
    - Scan CloudWatch alarms
    - Scan CloudWatch metrics
    - _Requirements: 3.8_
  
  - [x] 2.9 Implement Cost Explorer integration
    - Fetch cost data for last 30 days
    - Break down costs by service, region, and tag
    - Calculate month-over-month trends
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 2.10 Implement multi-region concurrent scanning
    - Use Promise.all for parallel region scanning
    - Implement error isolation (continue on region failure)
    - Aggregate results from all regions
    - _Requirements: 3.10, 3.12_
  
  - [x] 2.11 Implement scan result persistence to DynamoDB
    - Store scan results in ScanResults table
    - Include scanId, userId, timestamp, resources, summary
    - Set TTL for 90-day retention
    - _Requirements: 3.9, 19.1, 19.2_
  
  - [x] 2.12 Write property test for region discovery
    - **Property 1: Region Discovery Completeness**
    - **Validates: Requirements 3.1**
  
  - [x] 2.13 Write property test for resource type coverage
    - **Property 2: Resource Type Coverage**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
  
  - [x] 2.14 Write property test for scan persistence round trip
    - **Property 3: Scan Result Persistence Round Trip**
    - **Validates: Requirements 3.9, 19.1**
  
  - [x] 2.15 Write property test for error isolation
    - **Property 4: Error Isolation in Multi-Region Scanning**
    - **Validates: Requirements 3.10**



- [ ] 3. Implement Score Lambda function
  - [x] 3.1 Create score calculation handler
    - Implement handler to retrieve scan results from DynamoDB
    - Set up score calculation framework
    - _Requirements: 4.1_
  
  - [x] 3.2 Implement security score calculation (40% weight)
    - Check for public S3 buckets without encryption
    - Check for security groups with 0.0.0.0/0 on sensitive ports (22, 3389, 3306, 5432)
    - Check for unencrypted EBS volumes
    - Check for IAM users without MFA
    - Check for overly permissive IAM policies (Action: "*", Resource: "*")
    - Calculate security score with deductions for each issue
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 3.3 Implement cost efficiency score calculation (30% weight)
    - Check for stopped EC2 instances older than 7 days
    - Check for unattached EBS volumes
    - Check for oversized instances with low CPU utilization
    - Check for unassociated Elastic IPs
    - Calculate cost efficiency score with deductions
    - _Requirements: 4.8, 4.9, 4.10, 4.11, 4.12_
  
  - [x] 3.4 Implement best practices score calculation (30% weight)
    - Check for resources without required tags (Environment, Owner, Project)
    - Check for missing backup policies on RDS and EBS
    - Check for disabled CloudWatch monitoring
    - Calculate best practices score with deductions
    - _Requirements: 4.13, 4.14, 4.15, 4.16_
  
  - [x] 3.5 Implement score aggregation and breakdown
    - Combine weighted scores (security 40%, cost 30%, best practices 30%)
    - Generate detailed breakdown with issues array
    - Include fix guides for each issue
    - Store score in HygieneScores table
    - _Requirements: 4.1, 4.18_
  
  - [x] 3.6 Write property test for hygiene score bounds
    - **Property 5: Hygiene Score Bounds**
    - **Validates: Requirements 4.1**
  
  - [x] 3.7 Write property test for security score weighting
    - **Property 6: Security Score Weighting**
    - **Validates: Requirements 4.2**
  
  - [x] 3.8 Write property test for security issues reducing score
    - **Property 7: Security Issues Reduce Security Score**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7**
  
  - [x] 3.9 Write property test for cost score weighting
    - **Property 8: Cost Efficiency Score Weighting**
    - **Validates: Requirements 4.8**
  
  - [x] 3.10 Write property test for cost issues reducing score
    - **Property 9: Cost Issues Reduce Cost Efficiency Score**
    - **Validates: Requirements 4.9, 4.10, 4.11, 4.12**
  
  - [x] 3.11 Write property test for best practices score weighting
    - **Property 10: Best Practices Score Weighting**
    - **Validates: Requirements 4.13**
  
  - [x] 3.12 Write property test for best practice violations reducing score
    - **Property 11: Best Practice Violations Reduce Best Practices Score**
    - **Validates: Requirements 4.14, 4.15, 4.16**
  
  - [x] 3.13 Write property test for score breakdown completeness
    - **Property 12: Score Breakdown Completeness**
    - **Validates: Requirements 4.18**

- [x] 4. Checkpoint - Ensure scanning and scoring work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement AI Lambda function
  - [x] 5.1 Create AI service handler with action routing
    - Implement handler with action parameter (cost_advisor, risk_summary, iam_explainer, chat)
    - Set up AWS Bedrock client (Claude 3 Sonnet)
    - Set up OpenAI client as fallback
    - Implement caching layer with AICache table
    - _Requirements: 6.1, 6.10_
  
  - [x] 5.2 Implement cost advisor functionality
    - Format prompt with scan results and cost data
    - Request AI to identify unused resources
    - Request AI to suggest right-sizing opportunities
    - Request AI to recommend Reserved Instances/Savings Plans
    - Parse AI response into structured recommendations
    - Include estimated savings for each recommendation
    - Sort recommendations by savings amount
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [x] 5.3 Implement risk summary functionality
    - Format prompt with security issues from scan
    - Request AI to categorize by severity
    - Request AI to explain impact and remediation
    - Parse AI response into structured summary
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 5.4 Implement IAM policy explainer functionality
    - Format prompt with IAM policy JSON
    - Request AI to explain each statement
    - Request AI to identify overly permissive statements
    - Request AI to suggest least-privilege alternatives
    - Parse AI response with highlighted risks
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 5.5 Implement Cloud Copilot chat functionality
    - Format prompt with user question and scan context
    - Maintain conversation history (last 10 messages)
    - Request AI to answer based on actual resources
    - Implement streaming responses
    - Parse AI response with resource citations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_
  
  - [x] 5.6 Implement AI caching and retry logic
    - Check AICache table before calling AI API
    - Store responses in cache with 24-hour TTL
    - Implement exponential backoff retry (max 3 attempts)
    - Implement circuit breaker for repeated failures
    - _Requirements: 6.10, 6.11_
  
  - [x] 5.7 Write property test for cost recommendations including savings
    - **Property 13: Cost Recommendations Include Savings**
    - **Validates: Requirements 6.3, 6.7**
  
  - [x] 5.8 Write property test for right-sizing recommendations
    - **Property 14: Right-Sizing Recommendations for Oversized Instances**
    - **Validates: Requirements 6.4**
  
  - [x] 5.9 Write property test for recommendations sorted by savings
    - **Property 15: Recommendations Sorted by Savings**
    - **Validates: Requirements 6.8**
  
  - [x] 5.10 Write property test for AI recommendation caching
    - **Property 16: AI Recommendation Caching**
    - **Validates: Requirements 6.10**

- [x] 6. Implement Report Lambda function
  - [x] 6.1 Create report generation handler
    - Implement handler with reportType parameter (pdf, diagram)
    - Set up PDF generation library (Puppeteer or PDFKit)
    - Set up diagram generation library (D3 or Graphviz)
    - _Requirements: 12.1, 13.1_
  
  - [x] 6.2 Implement PDF report generation
    - Create PDF template with branding
    - Include hygiene score and breakdown section
    - Include resource inventory by type and region
    - Include security findings with severity levels
    - Include cost breakdown and trends
    - Include AI-generated recommendations
    - Generate PDF from template
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 6.3 Implement architecture diagram generation
    - Parse scan results to identify VPCs, subnets, resources
    - Generate diagram showing network topology
    - Show compute resources (EC2, Lambda, ECS)
    - Show data stores (RDS, DynamoDB, S3)
    - Show network connections and load balancers
    - Export as PNG and SVG
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [x] 6.4 Implement S3 upload and signed URL generation
    - Upload PDF/diagram to S3 bucket
    - Generate signed URL with 24-hour expiration
    - Return URL in response
    - _Requirements: 12.7, 12.8_
  
  - [x] 6.5 Write property test for PDF report completeness
    - **Property 24: PDF Report Completeness**
    - **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6**
  
  - [x] 6.6 Write property test for PDF storage with signed URL
    - **Property 25: PDF Storage with Signed URL**
    - **Validates: Requirements 12.7**

- [ ] 7. Implement Scheduler Lambda function
  - [x] 7.1 Create scheduler handler for EventBridge triggers
    - Implement handler to receive EventBridge events
    - Parse user configuration from event
    - _Requirements: 10.1, 10.2_
  
  - [x] 7.2 Implement scan triggering and comparison
    - Invoke Scan Lambda for user
    - Retrieve previous scan from DynamoDB
    - Compare current scan with previous scan
    - Identify new resources, deleted resources, changed states
    - Identify new security issues
    - Calculate hygiene score change
    - Calculate cost change
    - _Requirements: 10.3_
  
  - [x] 7.3 Implement alert threshold evaluation
    - Check if new security issues detected
    - Check if hygiene score dropped below threshold
    - Check if cost increased above threshold percentage
    - Generate alerts for triggered conditions
    - _Requirements: 10.4, 10.5, 10.6_
  
  - [x] 7.4 Implement alert deduplication
    - Generate deduplication key from alert type and user
    - Check AlertHistory table for recent alerts with same key
    - Skip sending if duplicate within 24 hours
    - _Requirements: 10.12_
  
  - [x] 7.5 Implement email notifications via SES
    - Format email with alert summary
    - Include changes summary
    - Send via AWS SES
    - _Requirements: 10.7, 10.11_
  
  - [x] 7.6 Implement Slack notifications
    - Format Slack message with alert summary
    - Include changes summary
    - Send to webhook URL from user config
    - _Requirements: 10.8, 10.11_
  
  - [x] 7.7 Store alert history in DynamoDB
    - Store alert in AlertHistory table
    - Include deduplication key
    - Set 30-day TTL
    - _Requirements: 10.12_
  
  - [x] 7.8 Write property test for scan comparison
    - **Property 17: Scan Comparison Identifies Differences**
    - **Validates: Requirements 10.3**
  
  - [x] 7.9 Write property test for alert generation on new security issues
    - **Property 18: Alert Generation for New Security Issues**
    - **Validates: Requirements 10.4**
  
  - [x] 7.10 Write property test for alert generation on score drop
    - **Property 19: Alert Generation for Score Drop**
    - **Validates: Requirements 10.5**
  
  - [x] 7.11 Write property test for alert generation on cost increase
    - **Property 20: Alert Generation for Cost Increase**
    - **Validates: Requirements 10.6**
  
  - [x] 7.12 Write property test for alert config persistence
    - **Property 21: Alert Configuration Persistence Round Trip**
    - **Validates: Requirements 10.10**
  
  - [x] 7.13 Write property test for alert includes change summary
    - **Property 22: Alert Includes Change Summary**
    - **Validates: Requirements 10.11**
  
  - [x] 7.14 Write property test for alert deduplication
    - **Property 23: Alert Deduplication**
    - **Validates: Requirements 10.12**

- [x] 8. Checkpoint - Ensure AI and scheduling work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement API Gateway endpoints
  - [x] 9.1 Create API Gateway REST API definition
    - Define API Gateway resource structure
    - Configure CORS
    - Configure request validation
    - Configure throttling (10 requests/second per user)
    - _Requirements: 1.2, 1.9_
  
  - [x] 9.2 Implement Cognito JWT authorizer
    - Create Lambda authorizer function
    - Validate JWT tokens from Cognito
    - Extract userId from token claims
    - Return IAM policy for API Gateway
    - _Requirements: 2.3, 2.4_
  
  - [x] 9.3 Create POST /scan endpoint
    - Integrate with Scan Lambda
    - Accept optional roleArn parameter
    - Return scanId and status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 9.4 Create GET /scan/{scanId} endpoint
    - Retrieve scan result from DynamoDB
    - Verify user owns scan
    - Return scan result
    - _Requirements: 3.9_
  
  - [x] 9.5 Create GET /scan/latest endpoint
    - Query DynamoDB GSI by userId
    - Sort by timestamp descending
    - Return latest scan
    - _Requirements: 19.1_
  
  - [x] 9.6 Create GET /score/{scanId} endpoint
    - Integrate with Score Lambda
    - Return hygiene score and breakdown
    - _Requirements: 4.1, 4.18_
  
  - [x] 9.7 Create POST /ai/cost-advisor endpoint
    - Integrate with AI Lambda (action: cost_advisor)
    - Return cost recommendations
    - _Requirements: 6.3, 6.4, 6.7, 6.8_
  
  - [x] 9.8 Create POST /ai/risk-summary endpoint
    - Integrate with AI Lambda (action: risk_summary)
    - Return security risk summary
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 9.9 Create POST /ai/iam-explainer endpoint
    - Integrate with AI Lambda (action: iam_explainer)
    - Return IAM policy explanation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 9.10 Create POST /ai/chat endpoint
    - Integrate with AI Lambda (action: chat)
    - Return chat response
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 9.11 Create POST /report/generate endpoint
    - Integrate with Report Lambda
    - Return signed S3 URL
    - _Requirements: 12.1, 12.7_
  
  - [x] 9.12 Create GET /schedule endpoint
    - Retrieve user schedule config from Users table
    - Return schedule configuration
    - _Requirements: 10.2, 10.9_
  
  - [x] 9.13 Create PUT /schedule endpoint
    - Update user schedule config in Users table
    - Create/update EventBridge rule
    - Return success
    - _Requirements: 10.2, 10.9_
  
  - [x] 9.14 Create GET /alerts endpoint
    - Query AlertHistory table by userId
    - Return alert history
    - _Requirements: 10.12_

- [x] 10. Implement Cognito authentication
  - [x] 10.1 Create Cognito User Pool
    - Configure user pool with email sign-in
    - Configure password policy
    - Configure MFA settings
    - _Requirements: 2.1, 2.2, 2.7_
  
  - [x] 10.2 Configure Cognito App Client
    - Create app client for frontend
    - Configure OAuth flows
    - Configure token expiration (24 hours)
    - _Requirements: 2.3, 2.8_
  
  - [x] 10.3 Implement user registration flow
    - Create sign-up endpoint
    - Send verification email
    - _Requirements: 2.2_
  
  - [x] 10.4 Implement user login flow
    - Create sign-in endpoint
    - Return JWT tokens
    - _Requirements: 2.2, 2.3_
  
  - [x] 10.5 Implement password reset flow
    - Create forgot-password endpoint
    - Create confirm-password endpoint
    - _Requirements: 2.2_



- [ ] 11. Update frontend to remove mock data and integrate with backend
  - [x] 11.1 Update authentication service for Cognito
    - Replace mock auth with AWS Amplify or Cognito SDK
    - Implement signUp, signIn, signOut, resetPassword functions
    - Implement JWT token management
    - Store tokens in secure storage
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 11.2 Update AWS service layer for real API calls
    - Replace all mock data with real API calls
    - Implement scanResources() calling POST /scan
    - Implement getLatestScan() calling GET /scan/latest
    - Implement getHygieneScore() calling GET /score/{scanId}
    - Implement getCostRecommendations() calling POST /ai/cost-advisor
    - Implement getRiskSummary() calling POST /ai/risk-summary
    - Implement explainIAMPolicy() calling POST /ai/iam-explainer
    - Implement chatQuery() calling POST /ai/chat
    - Implement generateReport() calling POST /report/generate
    - Implement getScheduleConfig() calling GET /schedule
    - Implement updateScheduleConfig() calling PUT /schedule
    - Add JWT token to all requests
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x] 11.3 Update Dashboard page to use real data
    - Remove mock data
    - Fetch latest scan on mount
    - Display real hygiene score
    - Display real resource counts
    - Display real cost data
    - Show loading states
    - Show error states
    - _Requirements: 5.1, 5.9, 5.10_
  
  - [x] 11.4 Update AWS Resources page to use real data
    - Remove mock data
    - Fetch resources from latest scan
    - Display real resource list with filters
    - Show loading states
    - Show error states
    - _Requirements: 5.2, 5.9, 5.10_
  
  - [x] 11.5 Update Accounts page to use real data
    - Remove mock data
    - Fetch user account info
    - Display real AWS account details
    - Show loading states
    - Show error states
    - _Requirements: 5.3, 5.9, 5.10_
  
  - [x] 11.6 Update Cost Breakdown page to use real data
    - Remove mock data
    - Fetch cost data from latest scan
    - Display real cost breakdown by service and region
    - Display cost trends
    - Show AI cost recommendations
    - Show loading states
    - Show error states
    - _Requirements: 5.4, 5.9, 5.10, 15.6, 15.7, 15.8_
  
  - [x] 11.7 Update Security Audit page to use real data
    - Remove mock data
    - Fetch security issues from latest scan
    - Display real security findings
    - Display AI risk summary
    - Add "Fix Guide" buttons for each issue
    - Show loading states
    - Show error states
    - _Requirements: 5.5, 5.9, 5.10, 14.1, 14.2_
  
  - [x] 11.8 Update Reminders page to use real data
    - Remove mock data
    - Fetch schedule config
    - Display real schedule settings
    - Allow editing schedule
    - Fetch alert history
    - Display real alerts
    - Show loading states
    - Show error states
    - _Requirements: 5.6, 5.9, 5.10_
  
  - [x] 11.9 Update IAM Explainer page to use real data
    - Remove mock data
    - Allow user to select IAM policy from scan
    - Call AI explainer API
    - Display AI-generated explanation
    - Highlight risky statements
    - Show loading states
    - Show error states
    - _Requirements: 5.7, 5.9, 5.10_
  
  - [x] 11.10 Implement Cloud Copilot chat interface
    - Create new chat component
    - Implement message input
    - Implement chat history display
    - Call AI chat API
    - Display streaming responses
    - Show loading states
    - Show error states
    - _Requirements: 9.1, 9.7, 9.8_
  
  - [x] 11.11 Implement error boundaries
    - Create ErrorBoundary component
    - Wrap all route components
    - Display user-friendly error messages
    - Log errors to monitoring service
    - _Requirements: 5.11, 17.2, 17.3_
  
  - [x] 11.12 Implement loading states with skeleton screens
    - Create skeleton components for each page
    - Show skeletons during data loading
    - _Requirements: 5.10, 17.1_
  
  - [x] 11.13 Implement retry logic for failed requests
    - Add automatic retry with exponential backoff
    - Show retry status to user
    - _Requirements: 17.4_
  
  - [x] 11.14 Implement toast notifications
    - Add toast library (react-hot-toast or similar)
    - Show success/error toasts for user actions
    - _Requirements: 17.5_
  
  - [x] 11.15 Implement PDF report download
    - Add "Export PDF" button to Dashboard
    - Call report generation API
    - Download PDF from signed URL
    - Show progress indicator
    - _Requirements: 12.1, 12.7_
  
  - [x] 11.16 Implement architecture diagram view
    - Add "View Architecture" button to Dashboard
    - Call diagram generation API
    - Display diagram in modal or new page
    - Allow download
    - _Requirements: 13.1, 13.8_

- [x] 12. Checkpoint - Ensure frontend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement monitoring and observability
  - [x] 13.1 Configure CloudWatch Logs for all Lambda functions
    - Enable CloudWatch Logs for each Lambda
    - Set log retention to 30 days
    - _Requirements: 1.6, 18.1_
  
  - [x] 13.2 Implement structured logging
    - Add structured logging to all Lambda functions
    - Log request IDs, user IDs, timestamps
    - Log errors with stack traces
    - _Requirements: 11.7, 18.2_
  
  - [x] 13.3 Create CloudWatch metrics
    - Create custom metric for scan duration
    - Create custom metric for API error rates
    - Create custom metric for AI API latency
    - _Requirements: 18.3, 18.4, 18.5_
  
  - [x] 13.4 Create CloudWatch alarms
    - Create alarm for Lambda function errors > 5%
    - Create alarm for API Gateway 5xx errors > 1%
    - Create alarm for DynamoDB throttling
    - Configure SNS notifications
    - _Requirements: 18.6, 18.7, 18.8_
  
  - [x] 13.5 Enable AWS X-Ray tracing
    - Enable X-Ray for all Lambda functions
    - Enable X-Ray for API Gateway
    - Add X-Ray SDK to Lambda code
    - _Requirements: 18.9_
  
  - [x] 13.6 Create CloudWatch Dashboard
    - Add widgets for scan metrics
    - Add widgets for API metrics
    - Add widgets for error rates
    - Add widgets for cost metrics
    - _Requirements: 18.10_

- [ ] 14. Implement security best practices
  - [x] 14.1 Configure encryption at rest
    - Enable DynamoDB encryption with KMS
    - Enable S3 bucket encryption
    - _Requirements: 2.9, 11.3_
  
  - [x] 14.2 Configure encryption in transit
    - Enforce HTTPS on API Gateway
    - Use TLS 1.2+ for all connections
    - _Requirements: 11.4_
  
  - [x] 14.3 Implement input validation
    - Add request validation schemas to API Gateway
    - Validate all Lambda function inputs
    - Sanitize user inputs
    - _Requirements: 11.5, 11.6_
  
  - [x] 14.4 Configure AWS WAF
    - Create WAF web ACL
    - Add rules for SQL injection prevention
    - Add rules for XSS prevention
    - Add rate limiting rules
    - Attach to API Gateway
    - _Requirements: 11.9_
  
  - [x] 14.5 Implement least privilege IAM policies
    - Review all Lambda IAM roles
    - Remove unnecessary permissions
    - Use resource-specific permissions
    - _Requirements: 1.7, 11.11_
  
  - [x] 14.6 Enable CloudTrail
    - Enable CloudTrail for audit logging
    - Log all API calls
    - Store logs in S3
    - _Requirements: 11.12_
  
  - [x] 14.7 Implement secrets management
    - Store AI API keys in Secrets Manager
    - Store Slack webhook URLs in Secrets Manager
    - Retrieve secrets in Lambda functions
    - _Requirements: 11.2_
  
  - [x] 14.8 Add security scanning to CI/CD
    - Add npm audit to GitHub Actions
    - Add Snyk scanning
    - Add git-secrets scanning
    - _Requirements: 11.13_

- [ ] 15. Implement historical data and trends
  - [x] 15.1 Implement scan history query
    - Create function to query scans by date range
    - Use DynamoDB GSI on userId and timestamp
    - _Requirements: 19.8_
  
  - [x] 15.2 Implement trend calculation
    - Compare current scan with previous scans
    - Calculate hygiene score changes over time
    - Calculate resource count changes over time
    - Calculate cost changes over time
    - _Requirements: 19.3, 19.4, 19.5, 19.6_
  
  - [x] 15.3 Add trends to Dashboard
    - Display hygiene score trend chart
    - Display resource count trend chart
    - Display cost trend chart
    - _Requirements: 19.4, 19.5, 19.6_
  
  - [x] 15.4 Write property test for historical scan query
    - **Property 26: Historical Scan Query by Date Range**
    - **Validates: Requirements 19.8**
  
  - [x] 15.5 Write property test for trend data structure
    - **Property 27: Trend Data Structure Completeness**
    - **Validates: Requirements 19.3, 19.4, 19.5, 19.6**

- [ ] 16. Implement fix guides for security issues
  - [x] 16.1 Create fix guide content for common issues
    - Write fix guide for public S3 buckets
    - Write fix guide for open security groups
    - Write fix guide for unencrypted volumes
    - Write fix guide for IAM users without MFA
    - Write fix guide for overly permissive policies
    - Include AWS CLI commands
    - Include AWS Console steps
    - Include documentation links
    - _Requirements: 14.3, 14.4, 14.5, 14.6_
  
  - [x] 16.2 Add fix guides to score calculation
    - Attach fix guide to each issue in breakdown
    - _Requirements: 14.1, 14.2_
  
  - [x] 16.3 Display fix guides in frontend
    - Add "Fix Guide" button to each issue
    - Show fix guide in modal or expandable section
    - _Requirements: 14.1, 14.2, 14.7_

- [ ] 17. Optimize frontend performance
  - [x] 17.1 Implement code splitting
    - Use React.lazy for route components
    - Implement Suspense boundaries
    - _Requirements: 17.8_
  
  - [x] 17.2 Optimize bundle size
    - Analyze bundle with webpack-bundle-analyzer
    - Remove unused dependencies
    - Use tree-shaking
    - _Requirements: 17.7_
  
  - [x] 17.3 Implement caching
    - Cache API responses for 5 minutes
    - Use TanStack Query cache
    - _Requirements: 5.12_
  
  - [x] 17.4 Optimize images and assets
    - Compress images
    - Use WebP format
    - Lazy load images
    - _Requirements: 17.7_
  
  - [x] 17.5 Run Lighthouse audit
    - Achieve performance score > 90
    - Achieve accessibility score > 90
    - Fix identified issues
    - _Requirements: 17.9_

- [ ] 18. Create deployment documentation
  - [x] 18.1 Write comprehensive README
    - Add project overview
    - Add architecture diagram
    - Add AWS services used
    - Add features list
    - _Requirements: 20.1, 20.2, 20.6_
  
  - [x] 18.2 Write setup and deployment instructions
    - Add prerequisites
    - Add AWS account setup steps
    - Add deployment commands
    - Add environment variable configuration
    - _Requirements: 20.3, 16.10_
  
  - [x] 18.3 Write API documentation
    - Document all API endpoints
    - Add example requests and responses
    - Add authentication instructions
    - _Requirements: 20.4_
  
  - [x] 18.4 Create demo materials
    - Add screenshots of key features
    - Create demo video or GIF
    - _Requirements: 20.5_
  
  - [x] 18.5 Document security best practices
    - Document IAM role setup
    - Document cross-account access
    - Document encryption configuration
    - _Requirements: 20.7_
  
  - [x] 18.6 Document cost optimization features
    - Document hygiene score algorithm
    - Document AI cost advisor
    - Document cost tracking
    - _Requirements: 20.8_
  
  - [x] 18.7 Document AI features
    - Document AWS Bedrock integration
    - Document cost advisor
    - Document risk summary
    - Document IAM explainer
    - Document Cloud Copilot
    - _Requirements: 20.9_
  
  - [x] 18.8 Document scalability and production readiness
    - Document serverless architecture benefits
    - Document auto-scaling capabilities
    - Document monitoring and alerting
    - _Requirements: 20.10_
  
  - [x] 18.9 Add attributions and license
    - List all third-party libraries
    - Add license file (MIT or Apache 2.0)
    - _Requirements: 20.11, 20.12_

- [x] 19. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript for all Lambda functions
- AWS SAM or CDK will be used for Infrastructure as Code
- Frontend remains React 18 + TypeScript with Vite
