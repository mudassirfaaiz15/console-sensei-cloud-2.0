# Step-by-Step AWS Deployment Guide

Complete step-by-step instructions to deploy ConsoleSensei Cloud to AWS.

## Phase 1: Prerequisites & Setup (15 minutes)

### Step 1.1: Install AWS CLI

**Windows:**
```powershell
# Download and install from
https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

**macOS:**
```bash
brew install awscli

# Verify installation
aws --version
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### Step 1.2: Configure AWS Credentials

```bash
aws configure
```

When prompted, enter:
- AWS Access Key ID: `YOUR_ACCESS_KEY`
- AWS Secret Access Key: `YOUR_SECRET_KEY`
- Default region: `us-east-1`
- Default output format: `json`

**Verify configuration:**
```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-user"
}
```

### Step 1.3: Install Node.js

**Windows/macOS:**
- Download from https://nodejs.org/ (LTS version)
- Run installer and follow prompts

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 9.x or higher
```

### Step 1.4: Install AWS CDK

```bash
npm install -g aws-cdk

# Verify installation
cdk --version
```

### Step 1.5: Clone Repository

```bash
git clone https://github.com/your-org/consolesensei-cloud.git
cd consolesensei-cloud
```

## Phase 2: Build Lambda Functions (10 minutes)

### Step 2.1: Navigate to Backend Directory

```bash
cd backend-lambda
```

### Step 2.2: Install Dependencies

```bash
npm install
```

This will install:
- AWS SDK v3
- TypeScript
- Vitest (testing framework)
- Other dependencies

### Step 2.3: Build TypeScript

```bash
npm run build
```

**Expected output:**
```
> tsc
Exit Code: 0
```

**Verify build:**
```bash
ls -la dist/
```

You should see:
- `dist/functions/` - Lambda handlers
- `dist/scanners/` - Resource scanners
- `dist/utils/` - Utility functions

### Step 2.4: Run Tests (Optional)

```bash
npm run test -- --run
```

**Expected output:**
```
✓ Test Files  16 passed (16)
      Tests  149 passed (149)
```

## Phase 3: Deploy Infrastructure (20 minutes)

### Step 3.1: Navigate to Infrastructure Directory

```bash
cd infrastructure
```

### Step 3.2: Install CDK Dependencies

```bash
npm install
```

### Step 3.3: Bootstrap CDK (First Time Only)

```bash
# Get your AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Bootstrap CDK
cdk bootstrap aws://$ACCOUNT_ID/$REGION
```

**Expected output:**
```
 ✓ Environment aws://123456789012/us-east-1 bootstrapped.
```

### Step 3.4: Review CDK Stack

```bash
cdk synth
```

This generates the CloudFormation template. Review the output to ensure all resources are defined.

### Step 3.5: Deploy CDK Stack

```bash
cdk deploy --all --require-approval never
```

**This will create:**
- 5 DynamoDB tables
- 2 S3 buckets
- 6 Lambda functions
- API Gateway REST API
- Cognito User Pool
- IAM roles and policies
- EventBridge rules

**Expected output:**
```
ConsoleSenseiStack: deploying...
ConsoleSenseiStack: creating CloudFormation changeset...
[████████████████████████████████] (X/X)

 ✓ ConsoleSenseiStack

Outputs:
ConsoleSenseiStack.UserPoolId = us-east-1_XXXXXXXXX
ConsoleSenseiStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
ConsoleSenseiStack.ApiUrl = https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/v1
```

**Save these outputs!** You'll need them for configuration.

### Step 3.6: Verify Deployment

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `ConsoleSensei`)].FunctionName'

# List DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `ConsoleSensei`)]'

# List S3 buckets
aws s3 ls | grep consolesensei
```

## Phase 4: Configure Environment (5 minutes)

### Step 4.1: Navigate to Root Directory

```bash
cd ../..
```

### Step 4.2: Create Environment File

Create `.env.local` file:

```bash
cat > .env.local << 'EOF'
VITE_API_ENDPOINT=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/v1
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=consolesensei-123456789012
EOF
```

Replace the X's with values from CDK deployment outputs.

### Step 4.3: Verify Configuration

```bash
cat .env.local
```

Ensure all values are filled in (no X's remaining).

## Phase 5: Build Frontend (10 minutes)

### Step 5.1: Install Frontend Dependencies

```bash
npm install
```

### Step 5.2: Build Frontend

```bash
npm run build
```

**Expected output:**
```
✓ 1234 modules transformed.
dist/index.html                   0.50 kB │ gzip:   0.30 kB
dist/assets/index-XXXXXX.js     234.56 kB │ gzip:  78.90 kB
```

### Step 5.3: Verify Build

```bash
ls -la dist/
```

You should see:
- `index.html`
- `assets/` directory with bundled files

## Phase 6: Test Deployment (15 minutes)

### Step 6.1: Test Lambda Functions

```bash
# Test Scan Lambda
aws lambda invoke \
  --function-name ConsoleSensei-Scan \
  --payload '{"userId":"test-user"}' \
  response.json

cat response.json
```

**Expected response:**
```json
{
  "statusCode": 200,
  "body": "{\"scanId\":\"scan_20260222_XXXXXX\",\"status\":\"completed\"}"
}
```

### Step 6.2: Test API Gateway

```bash
# Get API URL from .env.local
API_URL="https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/v1"

# Test /scan endpoint
curl -X POST $API_URL/scan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

**Expected response:**
```json
{
  "scanId": "scan_20260222_XXXXXX",
  "status": "completed"
}
```

### Step 6.3: Test Cognito

```bash
# Get User Pool ID from .env.local
USER_POOL_ID="us-east-1_XXXXXXXXX"

# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --password Password123! \
  --permanent
```

**Expected output:**
```json
{
  "User": {
    "Username": "testuser@example.com",
    "Attributes": [...],
    "UserCreateDate": "2026-02-22T...",
    "UserStatus": "CONFIRMED"
  }
}
```

### Step 6.4: Test DynamoDB

```bash
# List tables
aws dynamodb list-tables

# Scan ScanResults table
aws dynamodb scan --table-name ConsoleSensei-ScanResults
```

**Expected output:**
```json
{
  "Items": [],
  "Count": 0,
  "ScannedCount": 0
}
```

## Phase 7: Run Application Locally (5 minutes)

### Step 7.1: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.4.1  ready in 1121 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 7.2: Access Application

Open browser and navigate to:
```
http://localhost:5173/
```

### Step 7.3: Test Authentication

1. Click "Sign Up"
2. Enter email: `testuser@example.com`
3. Enter password: `Password123!`
4. Click "Sign Up"
5. Verify email (check spam folder)
6. Sign in with credentials

### Step 7.4: Test Scan

1. Click "Dashboard"
2. Click "Start Scan"
3. Wait for scan to complete
4. Verify results displayed

## Phase 8: Deploy Frontend (Optional - 10 minutes)

### Option A: Deploy to S3 + CloudFront

```bash
# Create S3 bucket
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3 mb s3://consolesensei-frontend-$ACCOUNT_ID

# Upload frontend
aws s3 sync dist/ s3://consolesensei-frontend-$ACCOUNT_ID/

# Create CloudFront distribution (manual in AWS Console)
```

### Option B: Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## Phase 9: Post-Deployment Setup (10 minutes)

### Step 9.1: Configure Monitoring

```bash
# Create CloudWatch Log Group
aws logs create-log-group --log-group-name /aws/lambda/consolesensei

# Set retention to 30 days
aws logs put-retention-policy \
  --log-group-name /aws/lambda/consolesensei \
  --retention-in-days 30
```

### Step 9.2: Create Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name consolesensei-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Step 9.3: Enable CloudTrail

```bash
# Create S3 bucket for CloudTrail
aws s3 mb s3://consolesensei-cloudtrail-$ACCOUNT_ID

# Enable CloudTrail
aws cloudtrail create-trail \
  --name ConsoleSensei-Trail \
  --s3-bucket-name consolesensei-cloudtrail-$ACCOUNT_ID

# Start logging
aws cloudtrail start-logging --trail-name ConsoleSensei-Trail
```

## Phase 10: Verification Checklist

- [ ] AWS CLI configured and working
- [ ] Node.js 18+ installed
- [ ] AWS CDK installed
- [ ] Lambda functions built successfully
- [ ] CDK stack deployed successfully
- [ ] Environment variables configured
- [ ] Frontend built successfully
- [ ] Lambda functions tested
- [ ] API Gateway tested
- [ ] Cognito User Pool tested
- [ ] DynamoDB tables verified
- [ ] Application runs locally
- [ ] Authentication works
- [ ] Scan functionality works
- [ ] Monitoring configured

## Troubleshooting

### Issue: AWS CLI not found
```bash
# Reinstall AWS CLI
pip install --upgrade awscli
```

### Issue: CDK bootstrap fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Try bootstrap again with explicit region
cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

### Issue: Lambda deployment fails
```bash
# Check build output
ls -la backend-lambda/dist/

# Check IAM permissions
aws iam get-user
```

### Issue: API returns 403
```bash
# Verify Cognito User Pool ID
echo $VITE_COGNITO_USER_POOL_ID

# Check authorizer configuration
aws apigateway get-authorizers --rest-api-id YOUR_API_ID
```

## Success!

If you've completed all steps and verified the checklist, your deployment is complete!

**Next steps:**
1. Create production users in Cognito
2. Configure custom domain (optional)
3. Set up monitoring dashboards
4. Document runbooks for operations
5. Plan backup and disaster recovery

---

**Estimated Total Time:** 90 minutes  
**Difficulty Level:** Intermediate  
**Support:** See DEPLOYMENT_CHECKLIST.md for detailed troubleshooting

