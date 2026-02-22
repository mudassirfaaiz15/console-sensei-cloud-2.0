#!/bin/bash

# ConsoleSensei Cloud - Quick AWS Deployment Script
# This script automates the deployment of the entire application to AWS

set -e

echo "=========================================="
echo "ConsoleSensei Cloud - AWS Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}AWS CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

echo "AWS Account ID: $ACCOUNT_ID"
echo "AWS Region: $REGION"
echo ""

# Step 1: Build Lambda Functions
echo -e "${YELLOW}Step 1: Building Lambda functions...${NC}"
cd backend-lambda
npm install
npm run build
echo -e "${GREEN}✓ Lambda functions built${NC}"
echo ""

# Step 2: Bootstrap CDK (first time only)
echo -e "${YELLOW}Step 2: Bootstrapping CDK...${NC}"
cd infrastructure
npm install
cdk bootstrap aws://$ACCOUNT_ID/$REGION || true
echo -e "${GREEN}✓ CDK bootstrapped${NC}"
echo ""

# Step 3: Deploy CDK Stack
echo -e "${YELLOW}Step 3: Deploying CDK stack...${NC}"
cdk deploy --all --require-approval never
echo -e "${GREEN}✓ CDK stack deployed${NC}"
echo ""

# Step 4: Get outputs
echo -e "${YELLOW}Step 4: Retrieving deployment outputs...${NC}"
STACK_NAME=$(cdk list | head -1)
OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs' --output json)

USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')

echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "API URL: $API_URL"
echo ""

# Step 5: Create .env file
echo -e "${YELLOW}Step 5: Creating environment configuration...${NC}"
cd ../..

cat > .env.local << EOF
VITE_API_ENDPOINT=$API_URL
VITE_COGNITO_REGION=$REGION
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_COGNITO_DOMAIN=consolesensei-$ACCOUNT_ID
EOF

echo -e "${GREEN}✓ Environment configuration created (.env.local)${NC}"
echo ""

# Step 6: Build frontend
echo -e "${YELLOW}Step 6: Building frontend...${NC}"
npm install
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 7: Summary
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update your Cognito domain (optional):"
echo "   aws cognito-idp create-user-pool-domain --domain consolesensei-$ACCOUNT_ID --user-pool-id $USER_POOL_ID"
echo ""
echo "2. Test the API:"
echo "   curl -X POST $API_URL/scan -H 'Content-Type: application/json' -d '{\"userId\":\"test-user\"}'"
echo ""
echo "3. Deploy frontend to S3 + CloudFront (optional):"
echo "   npm run deploy:frontend"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:5173 (local dev)"
echo "   API: $API_URL"
echo ""
echo "Configuration saved to: .env.local"
echo ""
