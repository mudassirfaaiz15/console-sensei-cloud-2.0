# Deployment Guide

This guide walks through deploying the ConsoleSensei backend infrastructure to AWS.

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure with your credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Version 18 or later
4. **AWS CDK**: Install globally
   ```bash
   npm install -g aws-cdk
   ```

## Step 1: Install Dependencies

```bash
cd backend-lambda
npm install
```

## Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your AWS account details:
   ```
   AWS_REGION=us-east-1
   AWS_ACCOUNT_ID=your-account-id
   CDK_DEFAULT_ACCOUNT=your-account-id
   CDK_DEFAULT_REGION=us-east-1
   ```

## Step 3: Bootstrap CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

Example:
```bash
cdk bootstrap aws://123456789012/us-east-1
```

## Step 4: Build TypeScript

```bash
npm run build
```

## Step 5: Review Infrastructure

Synthesize the CloudFormation template to review what will be created:

```bash
npm run synth
```

This generates a CloudFormation template in `cdk.out/`.

## Step 6: Deploy Infrastructure

Deploy the stack to AWS:

```bash
npm run deploy
```

Or with CDK directly:
```bash
cdk deploy
```

You'll be prompted to approve security-related changes. Type `y` to proceed.

## Step 7: Note the Outputs

After deployment, CDK will output important values:

```
Outputs:
ConsoleSenseiStack.UserPoolId = us-east-1_xxxxxxxxx
ConsoleSenseiStack.UserPoolClientId = xxxxxxxxxxxxxxxxxxxxxxxxxx
ConsoleSenseiStack.ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/v1/
ConsoleSenseiStack.ScanResultsTableName = ConsoleSensei-ScanResults
ConsoleSenseiStack.ReportsBucketName = consolesensei-reports-123456789012
```

**Save these values!** You'll need them to configure the frontend.

## Step 8: Update Environment File

Update your `.env` file with the deployment outputs:

```bash
API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/v1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
SCAN_RESULTS_TABLE=ConsoleSensei-ScanResults
USERS_TABLE=ConsoleSensei-Users
HYGIENE_SCORES_TABLE=ConsoleSensei-HygieneScores
ALERT_HISTORY_TABLE=ConsoleSensei-AlertHistory
AI_CACHE_TABLE=ConsoleSensei-AICache
REPORTS_BUCKET=consolesensei-reports-123456789012
DIAGRAMS_BUCKET=consolesensei-diagrams-123456789012
```

## Step 9: Verify Deployment

Check that resources were created:

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `ConsoleSensei`)].FunctionName'

# List DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `ConsoleSensei`)]'

# List S3 buckets
aws s3 ls | grep consolesensei

# Get API Gateway URL
aws cloudformation describe-stacks \
  --stack-name ConsoleSenseiStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

## Step 10: Test API

Test the API Gateway endpoint:

```bash
# Health check (should return 501 - not implemented yet)
curl https://your-api-url/v1/scan
```

## Step 11: Configure SES (Optional)

If you want email notifications:

1. Verify your sender email in SES:
   ```bash
   aws ses verify-email-identity --email-address noreply@yourdomain.com
   ```

2. Check verification status:
   ```bash
   aws ses get-identity-verification-attributes \
     --identities noreply@yourdomain.com
   ```

3. Click the verification link in the email AWS sends

## Step 12: Create First User

Create a test user in Cognito:

```bash
aws cognito-idp sign-up \
  --client-id YOUR_CLIENT_ID \
  --username test@example.com \
  --password "YourSecurePassword123!" \
  --user-attributes Name=email,Value=test@example.com
```

Confirm the user (for testing):
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com
```

## Updating the Stack

To update the infrastructure after making changes:

```bash
# Build TypeScript
npm run build

# Review changes
cdk diff

# Deploy updates
npm run deploy
```

## Destroying the Stack

To remove all resources (WARNING: This deletes all data):

```bash
cdk destroy
```

Note: Some resources like DynamoDB tables and S3 buckets have `RETAIN` policies and won't be automatically deleted. You'll need to delete them manually if desired.

## Troubleshooting

### CDK Bootstrap Issues

If you get bootstrap errors:
```bash
cdk bootstrap --force
```

### Permission Errors

Ensure your AWS credentials have these permissions:
- CloudFormation full access
- Lambda full access
- DynamoDB full access
- S3 full access
- API Gateway full access
- Cognito full access
- IAM role creation
- CloudWatch Logs

### Lambda Deployment Issues

If Lambda functions fail to deploy:
1. Check that TypeScript compiled successfully: `npm run build`
2. Check CloudWatch Logs for errors
3. Verify IAM roles have correct permissions

### API Gateway 403 Errors

If you get 403 errors:
1. Verify Cognito user pool is created
2. Check that JWT token is valid
3. Verify API Gateway authorizer is configured correctly

## Multi-Environment Deployment

To deploy to multiple environments (dev, staging, prod):

1. Create environment-specific context in `cdk.json`:
   ```json
   {
     "context": {
       "dev": {
         "account": "111111111111",
         "region": "us-east-1"
       },
       "prod": {
         "account": "222222222222",
         "region": "us-west-2"
       }
     }
   }
   ```

2. Deploy with context:
   ```bash
   cdk deploy --context env=dev
   cdk deploy --context env=prod
   ```

## Cost Estimation

Estimated monthly costs (assuming moderate usage):

- **Lambda**: ~$5-20 (pay per invocation)
- **DynamoDB**: ~$5-15 (pay per request)
- **S3**: ~$1-5 (storage + requests)
- **API Gateway**: ~$3-10 (per million requests)
- **CloudWatch**: ~$5-10 (logs + metrics)
- **Cognito**: Free tier covers most use cases

**Total**: ~$20-60/month for moderate usage

Costs scale with usage. Monitor with AWS Cost Explorer.

## Security Checklist

- [ ] Enable MFA on AWS root account
- [ ] Use IAM roles, not access keys
- [ ] Enable CloudTrail for audit logging
- [ ] Review IAM policies for least privilege
- [ ] Enable AWS Config for compliance
- [ ] Set up billing alerts
- [ ] Enable GuardDuty for threat detection
- [ ] Review security group rules
- [ ] Enable VPC Flow Logs (if using VPC)
- [ ] Rotate credentials regularly

## Next Steps

1. Implement Lambda function logic (Tasks 2-7)
2. Write comprehensive tests
3. Set up CI/CD pipeline
4. Configure monitoring and alerts
5. Update frontend to use deployed API
6. Perform security audit
7. Load test the API
8. Document API endpoints

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Review CDK deployment logs
3. Check AWS service quotas
4. Review IAM permissions
5. Consult AWS documentation

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Cognito Documentation](https://docs.aws.amazon.com/cognito/)
