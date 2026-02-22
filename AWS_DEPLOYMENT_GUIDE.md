# AWS Deployment Guide - ConsoleSensei Cloud

Complete guide to deploy the production-ready application to AWS.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** 18+ installed
4. **AWS CDK** installed: `npm install -g aws-cdk`
5. **Docker** (optional, for local testing)

## Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region (e.g., us-east-1), and output format (json).

## Step 2: Deploy Infrastructure with CDK

### Build the Lambda Functions

```bash
cd backend-lambda
npm install
npm run build
```

### Deploy CDK Stack

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy --all
```

This will create:
- DynamoDB tables (ScanResults, Users, HygieneScores, AlertHistory, AICache)
- S3 buckets (reports, diagrams)
- Lambda functions (Scan, Score, AI, Report, Scheduler, Auth)
- API Gateway REST API
- Cognito User Pool
- IAM roles and policies
- EventBridge rules

## Step 3: Manual Setup (If CDK Not Available)

### 3.1 Create DynamoDB Tables

```bash
# ScanResults Table
aws dynamodb create-table \
  --table-name ScanResults \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --ttl-specification AttributeName=expiresAt,Enabled=true

# Users Table
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# HygieneScores Table
aws dynamodb create-table \
  --table-name HygieneScores \
  --attribute-definitions \
    AttributeName=scanId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=scanId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# AlertHistory Table
aws dynamodb create-table \
  --table-name AlertHistory \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --ttl-specification AttributeName=expiresAt,Enabled=true

# AICache Table
aws dynamodb create-table \
  --table-name AICache \
  --attribute-definitions AttributeName=cacheKey,AttributeType=S \
  --key-schema AttributeName=cacheKey,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --ttl-specification AttributeName=expiresAt,Enabled=true
```

### 3.2 Create S3 Buckets

```bash
# Reports bucket
aws s3 mb s3://consolesensei-reports-$(date +%s) --region us-east-1

# Diagrams bucket
aws s3 mb s3://consolesensei-diagrams-$(date +%s) --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket consolesensei-reports-TIMESTAMP \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket consolesensei-reports-TIMESTAMP \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3.3 Create Cognito User Pool

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name ConsoleSensei-UserPool \
  --policies PasswordPolicy='{
    MinimumLength=12,
    RequireUppercase=true,
    RequireLowercase=true,
    RequireNumbers=true,
    RequireSymbols=true
  }' \
  --mfa-configuration OPTIONAL \
  --schema Name=email,AttributeDataType=String,Required=true,Mutable=false

# Create App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name ConsoleSensei-Client \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --generate-secret
```

### 3.4 Deploy Lambda Functions

```bash
# Package Lambda functions
cd backend-lambda
npm run build
zip -r lambda-functions.zip dist/

# Create IAM role for Lambda
aws iam create-role \
  --role-name ConsoleSensei-Lambda-Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name ConsoleSensei-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name ConsoleSensei-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
  --role-name ConsoleSensei-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name ConsoleSensei-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess

# Deploy Scan Lambda
aws lambda create-function \
  --function-name consolesensei-scan \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/scan/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables='{
    DYNAMODB_TABLE_SCANS=ScanResults,
    S3_BUCKET_REPORTS=consolesensei-reports-TIMESTAMP
  }'

# Deploy Score Lambda
aws lambda create-function \
  --function-name consolesensei-score \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/score/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables='{
    DYNAMODB_TABLE_SCORES=HygieneScores
  }'

# Deploy AI Lambda
aws lambda create-function \
  --function-name consolesensei-ai \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/ai/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables='{
    BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0,
    DYNAMODB_TABLE_CACHE=AICache
  }'

# Deploy Report Lambda
aws lambda create-function \
  --function-name consolesensei-report \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/report/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 120 \
  --memory-size 512 \
  --environment Variables='{
    S3_BUCKET_REPORTS=consolesensei-reports-TIMESTAMP
  }'

# Deploy Scheduler Lambda
aws lambda create-function \
  --function-name consolesensei-scheduler \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/scheduler/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables='{
    DYNAMODB_TABLE_ALERTS=AlertHistory,
    DYNAMODB_TABLE_USERS=Users
  }'

# Deploy Auth Lambda
aws lambda create-function \
  --function-name consolesensei-auth \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-Lambda-Role \
  --handler dist/functions/auth/index.handler \
  --zip-file fileb://lambda-functions.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables='{
    COGNITO_USER_POOL_ID=USER_POOL_ID
  }'
```

### 3.5 Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name ConsoleSensei-API \
  --description "ConsoleSensei Cloud API"

# Get API ID
API_ID=$(aws apigateway get-rest-apis --query 'items[0].id' --output text)

# Create resources and methods
# POST /scan
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id <ROOT_ID> \
  --path-part scan

# Create method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id <RESOURCE_ID> \
  --http-method POST \
  --authorization-type AWS_IAM

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id <RESOURCE_ID> \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:ACCOUNT_ID:function:consolesensei-scan/invocations

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

## Step 4: Configure Environment Variables

Create `.env` file in the root directory:

```env
VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_COGNITO_DOMAIN=YOUR_COGNITO_DOMAIN
```

## Step 5: Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to S3 (if using S3 + CloudFront)
aws s3 sync dist/ s3://consolesensei-frontend-TIMESTAMP/

# Or deploy to Vercel
npm install -g vercel
vercel --prod
```

## Step 6: Configure EventBridge Scheduler

```bash
# Create EventBridge rule for daily scans
aws events put-rule \
  --name consolesensei-daily-scan \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED

# Add Lambda target
aws events put-targets \
  --rule consolesensei-daily-scan \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:ACCOUNT_ID:function:consolesensei-scheduler","RoleArn"="arn:aws:iam::ACCOUNT_ID:role/ConsoleSensei-EventBridge-Role"
```

## Step 7: Enable CloudWatch Monitoring

```bash
# Create CloudWatch Log Group
aws logs create-log-group --log-group-name /aws/lambda/consolesensei

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/lambda/consolesensei \
  --retention-in-days 30

# Create alarms
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

## Step 8: Test the Deployment

```bash
# Test Scan Lambda
aws lambda invoke \
  --function-name consolesensei-scan \
  --payload '{"userId":"test-user"}' \
  response.json

# Check response
cat response.json

# Test API Gateway
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/scan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

## Troubleshooting

### Lambda Execution Errors
- Check CloudWatch Logs: `aws logs tail /aws/lambda/consolesensei --follow`
- Verify IAM permissions
- Check environment variables

### DynamoDB Issues
- Verify table exists: `aws dynamodb list-tables`
- Check billing mode and capacity
- Verify TTL settings

### API Gateway Issues
- Check CORS configuration
- Verify Lambda integration
- Test with curl or Postman

### Cognito Issues
- Verify User Pool ID
- Check App Client configuration
- Verify callback URLs

## Cost Optimization

1. **DynamoDB**: Use on-demand billing for variable workloads
2. **Lambda**: Set appropriate memory and timeout
3. **S3**: Enable lifecycle policies for old reports
4. **CloudWatch**: Set appropriate log retention

## Security Best Practices

1. Enable encryption at rest (DynamoDB, S3)
2. Use VPC endpoints for private access
3. Enable CloudTrail for audit logging
4. Use least privilege IAM policies
5. Enable MFA for Cognito
6. Use AWS Secrets Manager for API keys

## Next Steps

1. Configure custom domain with Route 53
2. Set up CloudFront CDN for frontend
3. Enable AWS WAF for API protection
4. Configure backup and disaster recovery
5. Set up CI/CD pipeline with GitHub Actions

---

For detailed information, see the infrastructure code in `backend-lambda/infrastructure/`
