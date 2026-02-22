# AWS Backend Deployment Checklist - ConsoleSensei Cloud

**Total Time:** 2-3 hours | **Difficulty:** Intermediate | **Account:** Root Account

---

## 📋 PHASE 1: AWS Account Setup (10 minutes)

### ✅ Step 1.1: Log into AWS Console
- [ ] Go to https://aws.amazon.com
- [ ] Click "Sign In to the Console"
- [ ] Enter root account email
- [ ] Enter password
- [ ] Complete MFA if enabled

### ✅ Step 1.2: Get Your AWS Account ID
- [ ] Click account name (top-right corner)
- [ ] Click "Account"
- [ ] Copy **Account ID** (12-digit number)
- [ ] **Save:** `ACCOUNT_ID = _______________`
- [ ] Note your **Region** (default: us-east-1)
- [ ] **Save:** `REGION = _______________`

### ✅ Step 1.3: Verify AWS Limits
- [ ] Search "Service Quotas" in AWS Console
- [ ] Search for "Lambda"
- [ ] Verify: Concurrent executions ≥ 1000
- [ ] Search for "DynamoDB"
- [ ] Verify: On-demand billing available

---

## 📊 PHASE 2: Create DynamoDB Tables (15 minutes)

### ✅ Step 2.1: Navigate to DynamoDB
- [ ] Search "DynamoDB" in AWS Console
- [ ] Click "DynamoDB" service
- [ ] Click "Tables" (left sidebar)

### ✅ Step 2.2: Create ScanResults Table
- [ ] Click "Create table"
- [ ] **Table name:** `ConsoleSensei-ScanResults`
- [ ] **Partition key:** `scanId` (String)
- [ ] **Sort key:** `timestamp` (Number)
- [ ] **Billing mode:** "Pay-per-request"
- [ ] Check "Enable point-in-time recovery"
- [ ] Click "Create table"
- [ ] Wait for status: "Active" ✓

### ✅ Step 2.3: Create Users Table
- [ ] Click "Create table"
- [ ] **Table name:** `ConsoleSensei-Users`
- [ ] **Partition key:** `userId` (String)
- [ ] **Billing mode:** "Pay-per-request"
- [ ] Check "Enable point-in-time recovery"
- [ ] Click "Create table"
- [ ] Wait for status: "Active" ✓

### ✅ Step 2.4: Create HygieneScores Table
- [ ] Click "Create table"
- [ ] **Table name:** `ConsoleSensei-HygieneScores`
- [ ] **Partition key:** `scanId` (String)
- [ ] **Sort key:** `timestamp` (Number)
- [ ] **Billing mode:** "Pay-per-request"
- [ ] Check "Enable point-in-time recovery"
- [ ] Click "Create table"
- [ ] Wait for status: "Active" ✓

### ✅ Step 2.5: Create AlertHistory Table
- [ ] Click "Create table"
- [ ] **Table name:** `ConsoleSensei-AlertHistory`
- [ ] **Partition key:** `alertId` (String)
- [ ] **Billing mode:** "Pay-per-request"
- [ ] Check "Enable point-in-time recovery"
- [ ] Click "Create table"
- [ ] Wait for status: "Active" ✓

### ✅ Step 2.6: Create AICache Table
- [ ] Click "Create table"
- [ ] **Table name:** `ConsoleSensei-AICache`
- [ ] **Partition key:** `cacheKey` (String)
- [ ] **Billing mode:** "Pay-per-request"
- [ ] Click "Create table"
- [ ] Wait for status: "Active" ✓

### ✅ Verification
- [ ] All 5 tables show "Active" status

---

## 🪣 PHASE 3: Create S3 Buckets (10 minutes)

### ✅ Step 3.1: Navigate to S3
- [ ] Search "S3" in AWS Console
- [ ] Click "S3" service
- [ ] Click "Buckets" (left sidebar)

### ✅ Step 3.2: Create Reports Bucket
- [ ] Click "Create bucket"
- [ ] **Bucket name:** `consolesensei-reports-ACCOUNT_ID`
  - Replace `ACCOUNT_ID` with your 12-digit account ID
- [ ] **Region:** us-east-1
- [ ] Uncheck "Block all public access"
- [ ] Check "I acknowledge..." checkbox
- [ ] Click "Create bucket"
- [ ] **Save:** `REPORTS_BUCKET = consolesensei-reports-_______________`

### ✅ Step 3.3: Enable Encryption on Reports Bucket
- [ ] Click the bucket name
- [ ] Click "Properties" tab
- [ ] Scroll to "Default encryption"
- [ ] Click "Edit"
- [ ] Select "SSE-S3"
- [ ] Click "Save changes"

### ✅ Step 3.4: Create Diagrams Bucket
- [ ] Go back to Buckets list
- [ ] Click "Create bucket"
- [ ] **Bucket name:** `consolesensei-diagrams-ACCOUNT_ID`
- [ ] **Region:** us-east-1
- [ ] Uncheck "Block all public access"
- [ ] Check "I acknowledge..." checkbox
- [ ] Click "Create bucket"
- [ ] **Save:** `DIAGRAMS_BUCKET = consolesensei-diagrams-_______________`

### ✅ Step 3.5: Enable Encryption on Diagrams Bucket
- [ ] Click the bucket name
- [ ] Click "Properties" tab
- [ ] Scroll to "Default encryption"
- [ ] Click "Edit"
- [ ] Select "SSE-S3"
- [ ] Click "Save changes"

### ✅ Verification
- [ ] Both buckets created
- [ ] Encryption enabled on both

---

## 🔐 PHASE 4: Create Cognito User Pool (15 minutes)

### ✅ Step 4.1: Navigate to Cognito
- [ ] Search "Cognito" in AWS Console
- [ ] Click "Cognito" service
- [ ] Click "User pools" (left sidebar)

### ✅ Step 4.2: Create User Pool
- [ ] Click "Create user pool"
- [ ] **Authentication providers:** Select "Email"
- [ ] Click "Next"

### ✅ Step 4.3: Configure Password Policy
- [ ] **Password minimum length:** 12
- [ ] Check "Require uppercase"
- [ ] Check "Require lowercase"
- [ ] Check "Require numbers"
- [ ] Check "Require special characters"
- [ ] Click "Next"

### ✅ Step 4.4: Configure MFA
- [ ] **MFA enforcement:** "Optional"
- [ ] Check "TOTP"
- [ ] Click "Next"

### ✅ Step 4.5: Configure Account Recovery
- [ ] **Account recovery:** "Email only"
- [ ] Click "Next"

### ✅ Step 4.6: Configure Sign-up
- [ ] **Self-service sign-up:** Enable
- [ ] Check "Allow users to sign themselves up"
- [ ] Click "Next"

### ✅ Step 4.7: Configure Email
- [ ] **Email provider:** "Send email with Cognito"
- [ ] Click "Next"

### ✅ Step 4.8: Review and Create
- [ ] **User pool name:** `ConsoleSensei-Users`
- [ ] Review all settings
- [ ] Click "Create user pool"
- [ ] Wait for creation (1-2 minutes)

### ✅ Step 4.9: Create App Client
- [ ] Click your new user pool
- [ ] Click "App integration" (left sidebar)
- [ ] Click "App clients and analytics"
- [ ] Click "Create app client"
- [ ] **App client name:** `ConsoleSensei-WebClient`
- [ ] **Authentication flows:**
  - [ ] Check "ALLOW_USER_PASSWORD_AUTH"
  - [ ] Check "ALLOW_REFRESH_TOKEN_AUTH"
- [ ] **Token expiration:**
  - [ ] Access token: 24 hours
  - [ ] ID token: 24 hours
  - [ ] Refresh token: 30 days
- [ ] Click "Create app client"

### ✅ Save Cognito Values
- [ ] **Save:** `USER_POOL_ID = us-east-1________________`
- [ ] **Save:** `APP_CLIENT_ID = _______________`

---

## 👤 PHASE 5: Create IAM Role for Lambda (10 minutes)

### ✅ Step 5.1: Navigate to IAM
- [ ] Search "IAM" in AWS Console
- [ ] Click "IAM" service
- [ ] Click "Roles" (left sidebar)

### ✅ Step 5.2: Create Lambda Execution Role
- [ ] Click "Create role"
- [ ] **Trusted entity type:** "AWS service"
- [ ] **Service:** "Lambda"
- [ ] Click "Next"

### ✅ Step 5.3: Add Permissions
- [ ] Search "AWSLambdaBasicExecutionRole"
- [ ] Check the checkbox
- [ ] Click "Next"

### ✅ Step 5.4: Add More Permissions
- [ ] Click "Add permissions" → "Attach policies"
- [ ] Search and add each:
  - [ ] `AmazonDynamoDBFullAccess`
  - [ ] `AmazonS3FullAccess`
  - [ ] `AmazonEC2ReadOnlyAccess`
  - [ ] `AWSXRayDaemonWriteAccess`
- [ ] Click "Next"

### ✅ Step 5.5: Name and Create
- [ ] **Role name:** `ConsoleSensei-Lambda-Role`
- [ ] Click "Create role"

### ✅ Save IAM Role
- [ ] **Save:** `LAMBDA_ROLE_ARN = arn:aws:iam::_______________:role/ConsoleSensei-Lambda-Role`

---

## ⚡ PHASE 6: Create Lambda Functions (30 minutes)

### ✅ Step 6.1: Navigate to Lambda
- [ ] Search "Lambda" in AWS Console
- [ ] Click "Lambda" service
- [ ] Click "Functions" (left sidebar)

### ✅ Step 6.2: Create Scan Lambda
- [ ] Click "Create function"
- [ ] **Function name:** `ConsoleSensei-Scan`
- [ ] **Runtime:** Node.js 18.x
- [ ] **Architecture:** x86_64
- [ ] **Execution role:** "Use an existing role"
- [ ] **Existing role:** `ConsoleSensei-Lambda-Role`
- [ ] Click "Create function"

#### Configure Scan Lambda
- [ ] Scroll to "General configuration" → Click "Edit"
- [ ] **Memory:** 1024 MB
- [ ] **Timeout:** 5 minutes (300 seconds)
- [ ] Click "Save"

#### Add Environment Variables
- [ ] Scroll to "Environment variables" → Click "Edit"
- [ ] Add:
  - [ ] Key: `SCAN_RESULTS_TABLE` → Value: `ConsoleSensei-ScanResults`
  - [ ] Key: `USERS_TABLE` → Value: `ConsoleSensei-Users`
- [ ] Click "Save"

#### Upload Code
- [ ] Build locally:
  ```bash
  cd backend-lambda
  npm run build
  zip -r lambda-scan.zip dist/functions/scan/
  ```
- [ ] In Lambda console, scroll to "Code"
- [ ] Click "Upload from" → ".zip file"
- [ ] Upload the zip file
- [ ] Click "Save"

### ✅ Step 6.3: Create Score Lambda
- [ ] Click "Create function"
- [ ] **Function name:** `ConsoleSensei-Score`
- [ ] **Runtime:** Node.js 18.x
- [ ] **Execution role:** `ConsoleSensei-Lambda-Role`
- [ ] Click "Create function"

#### Configure Score Lambda
- [ ] **Memory:** 512 MB
- [ ] **Timeout:** 1 minute (60 seconds)
- [ ] **Environment variables:**
  - [ ] `SCAN_RESULTS_TABLE`: `ConsoleSensei-ScanResults`
  - [ ] `HYGIENE_SCORES_TABLE`: `ConsoleSensei-HygieneScores`
- [ ] Upload code: `dist/functions/score/`

### ✅ Step 6.4: Create AI Lambda
- [ ] **Function name:** `ConsoleSensei-AI`
- [ ] **Memory:** 512 MB
- [ ] **Timeout:** 30 seconds
- [ ] **Environment variables:**
  - [ ] `SCAN_RESULTS_TABLE`: `ConsoleSensei-ScanResults`
  - [ ] `HYGIENE_SCORES_TABLE`: `ConsoleSensei-HygieneScores`
  - [ ] `AI_CACHE_TABLE`: `ConsoleSensei-AICache`
- [ ] Upload code: `dist/functions/ai/`

### ✅ Step 6.5: Create Report Lambda
- [ ] **Function name:** `ConsoleSensei-Report`
- [ ] **Memory:** 1024 MB
- [ ] **Timeout:** 2 minutes (120 seconds)
- [ ] **Environment variables:**
  - [ ] `SCAN_RESULTS_TABLE`: `ConsoleSensei-ScanResults`
  - [ ] `HYGIENE_SCORES_TABLE`: `ConsoleSensei-HygieneScores`
  - [ ] `REPORTS_BUCKET`: `consolesensei-reports-ACCOUNT_ID`
  - [ ] `DIAGRAMS_BUCKET`: `consolesensei-diagrams-ACCOUNT_ID`
- [ ] Upload code: `dist/functions/report/`

### ✅ Step 6.6: Create Scheduler Lambda
- [ ] **Function name:** `ConsoleSensei-Scheduler`
- [ ] **Memory:** 512 MB
- [ ] **Timeout:** 5 minutes (300 seconds)
- [ ] **Environment variables:**
  - [ ] `SCAN_RESULTS_TABLE`: `ConsoleSensei-ScanResults`
  - [ ] `USERS_TABLE`: `ConsoleSensei-Users`
  - [ ] `ALERT_HISTORY_TABLE`: `ConsoleSensei-AlertHistory`
- [ ] Upload code: `dist/functions/scheduler/`

### ✅ Step 6.7: Create Auth Lambda
- [ ] **Function name:** `ConsoleSensei-Auth`
- [ ] **Memory:** 256 MB
- [ ] **Timeout:** 10 seconds
- [ ] **Environment variables:**
  - [ ] `USERS_TABLE`: `ConsoleSensei-Users`
- [ ] Upload code: `dist/functions/auth/`

### ✅ Verification
- [ ] All 6 Lambda functions created
- [ ] All configured with correct memory/timeout
- [ ] All have environment variables set
- [ ] All have code uploaded

---

## 🌐 PHASE 7: Create API Gateway (20 minutes)

### ✅ Step 7.1: Navigate to API Gateway
- [ ] Search "API Gateway" in AWS Console
- [ ] Click "API Gateway" service
- [ ] Click "Create API"

### ✅ Step 7.2: Create REST API
- [ ] Click "REST API"
- [ ] Click "Build"
- [ ] **API name:** `ConsoleSensei-API`
- [ ] **Description:** "ConsoleSensei Cloud REST API"
- [ ] Click "Create API"

### ✅ Step 7.3: Create Resources and Methods

#### Create /scan Resource
- [ ] Click "Resources" (left sidebar)
- [ ] Right-click "/" → "Create resource"
- [ ] **Resource name:** `scan`
- [ ] Click "Create resource"

#### Create POST /scan
- [ ] Select `/scan` resource
- [ ] Click "Create method" → "POST"
- [ ] **Integration type:** "Lambda function"
- [ ] **Lambda function:** `ConsoleSensei-Scan`
- [ ] Click "Create method"

#### Create GET /scan/latest
- [ ] Right-click `/scan` → "Create resource"
- [ ] **Resource name:** `latest`
- [ ] Click "Create resource"
- [ ] Select `/scan/latest`
- [ ] Click "Create method" → "GET"
- [ ] **Lambda function:** `ConsoleSensei-Scan`
- [ ] Click "Create method"

#### Create GET /score/{scanId}
- [ ] Right-click "/" → "Create resource"
- [ ] **Resource name:** `score`
- [ ] Click "Create resource"
- [ ] Right-click `/score` → "Create resource"
- [ ] **Resource name:** `{scanId}`
- [ ] Click "Create resource"
- [ ] Select `/score/{scanId}`
- [ ] Click "Create method" → "GET"
- [ ] **Lambda function:** `ConsoleSensei-Score`
- [ ] Click "Create method"

#### Create AI Endpoints
- [ ] Create `/ai` resource
- [ ] Create `/ai/cost-advisor` → POST → `ConsoleSensei-AI`
- [ ] Create `/ai/risk-summary` → POST → `ConsoleSensei-AI`
- [ ] Create `/ai/iam-explainer` → POST → `ConsoleSensei-AI`
- [ ] Create `/ai/chat` → POST → `ConsoleSensei-AI`

#### Create Report Endpoint
- [ ] Create `/report` resource
- [ ] Create `/report/generate` → POST → `ConsoleSensei-Report`

#### Create Schedule Endpoints
- [ ] Create `/schedule` resource
- [ ] Create `/schedule` → GET → `ConsoleSensei-Scheduler`
- [ ] Create `/schedule` → PUT → `ConsoleSensei-Scheduler`

#### Create Alerts Endpoint
- [ ] Create `/alerts` resource
- [ ] Create `/alerts` → GET → `ConsoleSensei-Scheduler`

### ✅ Step 7.4: Enable CORS
- [ ] Select "/" resource
- [ ] Click "Enable CORS"
- [ ] Check all HTTP methods
- [ ] Click "Enable CORS and replace existing CORS headers"

### ✅ Step 7.5: Deploy API
- [ ] Click "Deploy API"
- [ ] **Stage:** "prod"
- [ ] Click "Deploy"

### ✅ Save API Gateway URL
- [ ] **Save:** `API_GATEWAY_URL = https://_______________execute-api.us-east-1.amazonaws.com/prod`

---

## ⏰ PHASE 8: Create EventBridge Rules (10 minutes)

### ✅ Step 8.1: Navigate to EventBridge
- [ ] Search "EventBridge" in AWS Console
- [ ] Click "EventBridge" service
- [ ] Click "Rules" (left sidebar)

### ✅ Step 8.2: Create Scheduler Rule
- [ ] Click "Create rule"
- [ ] **Name:** `ConsoleSensei-DailyScan`
- [ ] **Description:** "Daily scan at 9 AM UTC"
- [ ] **Rule type:** "Schedule"
- [ ] **Schedule pattern:** `cron(0 9 * * ? *)`
- [ ] Click "Next"

### ✅ Step 8.3: Select Target
- [ ] **Target 1:** "Lambda function"
- [ ] **Function:** `ConsoleSensei-Scheduler`
- [ ] Click "Next"

### ✅ Step 8.4: Create Rule
- [ ] Review settings
- [ ] Click "Create rule"

---

## 📊 PHASE 9: Enable CloudWatch Monitoring (10 minutes)

### ✅ Step 9.1: Navigate to CloudWatch
- [ ] Search "CloudWatch" in AWS Console
- [ ] Click "CloudWatch" service

### ✅ Step 9.2: Create Log Group
- [ ] Click "Log groups" (left sidebar)
- [ ] Click "Create log group"
- [ ] **Log group name:** `/aws/lambda/consolesensei`
- [ ] Click "Create"

### ✅ Step 9.3: Set Log Retention
- [ ] Click the log group
- [ ] Click "Edit retention"
- [ ] **Retention:** 30 days
- [ ] Click "Save"

### ✅ Step 9.4: Create Alarms
- [ ] Click "Alarms" (left sidebar)
- [ ] Click "Create alarm"
- [ ] **Metric:** Lambda → Errors
- [ ] **Threshold:** > 5 errors in 5 minutes
- [ ] Click "Create alarm"

---

## ✅ PHASE 10: Verify Deployment (15 minutes)

### ✅ Step 10.1: Test Lambda Functions
- [ ] Go to Lambda console
- [ ] Select `ConsoleSensei-Scan`
- [ ] Click "Test"
- [ ] **Event name:** "test"
- [ ] **Event JSON:**
  ```json
  {
    "userId": "test-user"
  }
  ```
- [ ] Click "Test"
- [ ] Verify: Response shows `scanId` ✓

### ✅ Step 10.2: Test API Gateway
- [ ] Go to API Gateway console
- [ ] Select your API
- [ ] Click "Stages" → "prod"
- [ ] Copy the **Invoke URL**
- [ ] Open terminal and run:
  ```bash
  curl -X POST https://YOUR_API_URL/scan \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-user"}'
  ```
- [ ] Verify: Returns `scanId` ✓

### ✅ Step 10.3: Test DynamoDB
- [ ] Go to DynamoDB console
- [ ] Click "Tables"
- [ ] Select `ConsoleSensei-ScanResults`
- [ ] Click "Explore table items"
- [ ] Verify: Test scan appears ✓

### ✅ Step 10.4: Test Cognito
- [ ] Go to Cognito console
- [ ] Click your user pool
- [ ] Click "Users"
- [ ] Click "Create user"
- [ ] **Username:** `testuser@example.com`
- [ ] **Temporary password:** `TempPassword123!`
- [ ] Click "Create user"
- [ ] Verify: User created ✓

---

## 📝 PHASE 11: Save All Configuration (5 minutes)

### ✅ Configuration Summary

```
═══════════════════════════════════════════════════════════
                    AWS CONFIGURATION
═══════════════════════════════════════════════════════════

ACCOUNT INFORMATION
├─ Account ID: _______________
├─ Region: us-east-1
└─ Root Account: Yes

DYNAMODB TABLES
├─ ConsoleSensei-ScanResults ✓
├─ ConsoleSensei-Users ✓
├─ ConsoleSensei-HygieneScores ✓
├─ ConsoleSensei-AlertHistory ✓
└─ ConsoleSensei-AICache ✓

S3 BUCKETS
├─ consolesensei-reports-_______________ ✓
└─ consolesensei-diagrams-_______________ ✓

LAMBDA FUNCTIONS
├─ ConsoleSensei-Scan ✓
├─ ConsoleSensei-Score ✓
├─ ConsoleSensei-AI ✓
├─ ConsoleSensei-Report ✓
├─ ConsoleSensei-Scheduler ✓
└─ ConsoleSensei-Auth ✓

API GATEWAY
├─ API Name: ConsoleSensei-API ✓
├─ URL: https://_______________execute-api.us-east-1.amazonaws.com/prod
└─ Endpoints: 14 ✓

COGNITO
├─ User Pool: ConsoleSensei-Users ✓
├─ User Pool ID: us-east-1________________
├─ App Client: ConsoleSensei-WebClient ✓
└─ App Client ID: _______________

IAM ROLE
├─ Role Name: ConsoleSensei-Lambda-Role ✓
└─ Role ARN: arn:aws:iam::_______________:role/ConsoleSensei-Lambda-Role

EVENTBRIDGE
├─ Rule: ConsoleSensei-DailyScan ✓
└─ Schedule: 9 AM UTC daily

CLOUDWATCH
├─ Log Group: /aws/lambda/consolesensei ✓
├─ Retention: 30 days ✓
└─ Alarms: Configured ✓

═══════════════════════════════════════════════════════════
```

---

## 🎉 DEPLOYMENT COMPLETE!

### ✅ Final Checklist
- [ ] All 5 DynamoDB tables created
- [ ] Both S3 buckets created with encryption
- [ ] Cognito User Pool configured
- [ ] IAM role created
- [ ] All 6 Lambda functions deployed
- [ ] API Gateway configured with 14 endpoints
- [ ] EventBridge rule created
- [ ] CloudWatch monitoring enabled
- [ ] All tests passed
- [ ] Configuration saved

### 📊 Summary
- **Total Time:** 2-3 hours
- **Services Created:** 25+
- **Lambda Functions:** 6
- **API Endpoints:** 14
- **DynamoDB Tables:** 5
- **S3 Buckets:** 2
- **Status:** ✅ PRODUCTION READY

### 🚀 Next Steps
1. Deploy frontend to Vercel (see VERCEL_QUICK_DEPLOY.md)
2. Configure custom domain (optional)
3. Set up monitoring dashboards
4. Create production users in Cognito
5. Test end-to-end functionality

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** ✅ Complete

