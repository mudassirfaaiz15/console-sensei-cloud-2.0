# AWS Deployment Checklist - ConsoleSensei Cloud

Complete checklist for deploying the application to AWS.

## Pre-Deployment

- [ ] AWS Account created and active
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] AWS CDK installed (`npm install -g aws-cdk`)
- [ ] Docker installed (optional, for local testing)
- [ ] Git repository cloned locally
- [ ] All tests passing locally (`npm run test -- --run`)

## AWS Account Setup

- [ ] IAM user created with appropriate permissions
- [ ] Access keys generated and stored securely
- [ ] AWS CLI configured with credentials
- [ ] Default region set (e.g., us-east-1)
- [ ] Billing alerts configured (optional)

## Pre-Deployment Verification

```bash
# Verify AWS CLI
aws sts get-caller-identity

# Verify Node.js
node --version

# Verify CDK
cdk --version

# Run tests
cd backend-lambda
npm run test -- --run
```

## Automated Deployment (Recommended)

### Option 1: Linux/macOS

```bash
chmod +x QUICK_DEPLOY.sh
./QUICK_DEPLOY.sh
```

### Option 2: Windows

```bash
QUICK_DEPLOY.bat
```

## Manual Deployment Steps

### Step 1: Build Lambda Functions

```bash
cd backend-lambda
npm install
npm run build
```

**Verification:**
- [ ] No build errors
- [ ] `dist/` directory created
- [ ] All Lambda handlers present

### Step 2: Bootstrap CDK

```bash
cd infrastructure
npm install
cdk bootstrap aws://ACCOUNT_ID/REGION
```

**Verification:**
- [ ] Bootstrap stack created in CloudFormation
- [ ] S3 bucket for CDK artifacts created

### Step 3: Deploy Infrastructure

```bash
cdk deploy --all --require-approval never
```

**Verification:**
- [ ] CloudFormation stack created successfully
- [ ] All resources deployed:
  - [ ] DynamoDB tables (5 tables)
  - [ ] S3 buckets (2 buckets)
  - [ ] Lambda functions (6 functions)
  - [ ] API Gateway REST API
  - [ ] Cognito User Pool
  - [ ] IAM roles and policies

### Step 4: Retrieve Deployment Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name ConsoleSenseiStack \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Record these values:**
- [ ] User Pool ID: `_________________`
- [ ] User Pool Client ID: `_________________`
- [ ] API Gateway URL: `_________________`
- [ ] ScanResults Table: `_________________`
- [ ] Reports Bucket: `_________________`

### Step 5: Configure Environment Variables

Create `.env.local` in the root directory:

```env
VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/v1
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_COGNITO_DOMAIN=consolesensei-YOUR_ACCOUNT_ID
```

**Verification:**
- [ ] All environment variables set
- [ ] No placeholder values remaining

### Step 6: Build Frontend

```bash
npm install
npm run build
```

**Verification:**
- [ ] No build errors
- [ ] `dist/` directory created
- [ ] All assets bundled

### Step 7: Test Deployment

#### Test Lambda Functions

```bash
# Test Scan Lambda
aws lambda invoke \
  --function-name ConsoleSensei-Scan \
  --payload '{"userId":"test-user"}' \
  response.json

cat response.json
```

**Verification:**
- [ ] Lambda invoked successfully
- [ ] Response contains scanId

#### Test API Gateway

```bash
# Get API URL from CloudFormation outputs
API_URL="https://YOUR_API_ID.execute-api.REGION.amazonaws.com/v1"

# Test /scan endpoint
curl -X POST $API_URL/scan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

**Verification:**
- [ ] API responds with 200 status
- [ ] Response contains expected data

#### Test Cognito

```bash
# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser@example.com \
  --password Password123! \
  --permanent
```

**Verification:**
- [ ] User created successfully
- [ ] User can sign in

#### Test DynamoDB

```bash
# List tables
aws dynamodb list-tables

# Scan a table
aws dynamodb scan --table-name ConsoleSensei-ScanResults
```

**Verification:**
- [ ] All 5 tables exist
- [ ] Tables are accessible

### Step 8: Deploy Frontend (Optional)

#### Option A: S3 + CloudFront

```bash
# Create S3 bucket for frontend
aws s3 mb s3://consolesensei-frontend-$ACCOUNT_ID

# Upload frontend
aws s3 sync dist/ s3://consolesensei-frontend-$ACCOUNT_ID/

# Create CloudFront distribution (manual or via CDK)
```

**Verification:**
- [ ] S3 bucket created
- [ ] Files uploaded
- [ ] CloudFront distribution created
- [ ] Domain accessible

#### Option B: Vercel

```bash
npm install -g vercel
vercel --prod
```

**Verification:**
- [ ] Deployment successful
- [ ] Application accessible at Vercel URL

### Step 9: Configure Custom Domain (Optional)

```bash
# Create Route 53 hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Create ACM certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS

# Update CloudFront distribution with custom domain
# (Manual step in AWS Console or via CDK)
```

**Verification:**
- [ ] Hosted zone created
- [ ] Certificate issued
- [ ] DNS records updated
- [ ] Custom domain accessible

## Post-Deployment

### Monitoring Setup

- [ ] CloudWatch Logs configured
- [ ] CloudWatch Alarms created:
  - [ ] Lambda error rate > 5%
  - [ ] API Gateway 5xx errors > 1%
  - [ ] DynamoDB throttling
- [ ] X-Ray tracing enabled
- [ ] CloudTrail logging enabled

### Security Hardening

- [ ] Enable MFA for AWS account
- [ ] Review IAM policies (least privilege)
- [ ] Enable encryption at rest (DynamoDB, S3)
- [ ] Enable encryption in transit (HTTPS)
- [ ] Configure AWS WAF rules
- [ ] Enable VPC endpoints (optional)
- [ ] Review security group rules

### Backup & Disaster Recovery

- [ ] Enable DynamoDB point-in-time recovery
- [ ] Configure S3 versioning
- [ ] Set up S3 lifecycle policies
- [ ] Test backup restoration
- [ ] Document recovery procedures

### Performance Optimization

- [ ] Enable CloudFront caching
- [ ] Configure Lambda reserved concurrency
- [ ] Set DynamoDB auto-scaling
- [ ] Enable API Gateway caching
- [ ] Run Lighthouse audit (frontend)

### Cost Optimization

- [ ] Review AWS Cost Explorer
- [ ] Set up billing alerts
- [ ] Optimize Lambda memory allocation
- [ ] Review DynamoDB capacity
- [ ] Consider Reserved Instances (if applicable)

## Troubleshooting

### Common Issues

#### Lambda Deployment Fails
- [ ] Check IAM permissions
- [ ] Verify Lambda code is in `dist/` directory
- [ ] Check Lambda timeout and memory settings
- [ ] Review CloudWatch Logs

#### API Gateway Returns 403
- [ ] Verify Cognito authorizer configuration
- [ ] Check JWT token validity
- [ ] Review API Gateway resource policies

#### DynamoDB Throttling
- [ ] Check billing mode (on-demand vs provisioned)
- [ ] Review auto-scaling settings
- [ ] Monitor consumed capacity

#### Cognito Issues
- [ ] Verify User Pool configuration
- [ ] Check App Client settings
- [ ] Review callback URLs
- [ ] Test with AWS CLI

### Rollback Procedure

```bash
# Delete CDK stack
cdk destroy --all

# Or delete CloudFormation stack
aws cloudformation delete-stack --stack-name ConsoleSenseiStack

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name ConsoleSenseiStack
```

## Verification Checklist

### Functional Tests

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can trigger scan
- [ ] Scan results stored in DynamoDB
- [ ] Score calculated correctly
- [ ] AI recommendations generated
- [ ] Report generated and stored in S3
- [ ] Alerts sent on threshold breach
- [ ] Scheduler runs on schedule

### Performance Tests

- [ ] API response time < 2 seconds
- [ ] Scan completes within 5 minutes
- [ ] Report generation < 2 minutes
- [ ] Frontend loads in < 3 seconds

### Security Tests

- [ ] Unauthenticated requests rejected
- [ ] Invalid tokens rejected
- [ ] CORS properly configured
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked

## Documentation

- [ ] API documentation updated
- [ ] Deployment guide created
- [ ] Runbook created for operations
- [ ] Disaster recovery plan documented
- [ ] Cost analysis documented

## Sign-Off

- [ ] Development team: _________________ Date: _______
- [ ] QA team: _________________ Date: _______
- [ ] Operations team: _________________ Date: _______
- [ ] Security team: _________________ Date: _______

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Environment:** Production / Staging / Development  
**Notes:** _________________________________________________________________

