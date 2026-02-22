@echo off
REM ConsoleSensei Cloud - Quick AWS Deployment Script (Windows)
REM This script automates the deployment of the entire application to AWS

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo ConsoleSensei Cloud - AWS Deployment
echo ==========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI not found. Please install it first.
    exit /b 1
)

where cdk >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing AWS CDK...
    call npm install -g aws-cdk
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install it first.
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Get AWS Account ID
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
set REGION=us-east-1
if defined AWS_REGION set REGION=%AWS_REGION%

echo AWS Account ID: %ACCOUNT_ID%
echo AWS Region: %REGION%
echo.

REM Step 1: Build Lambda Functions
echo Step 1: Building Lambda functions...
cd backend-lambda
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build Lambda functions
    exit /b 1
)
echo [OK] Lambda functions built
echo.

REM Step 2: Bootstrap CDK
echo Step 2: Bootstrapping CDK...
cd infrastructure
call npm install
call cdk bootstrap aws://%ACCOUNT_ID%/%REGION%
echo [OK] CDK bootstrapped
echo.

REM Step 3: Deploy CDK Stack
echo Step 3: Deploying CDK stack...
call cdk deploy --all --require-approval never
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to deploy CDK stack
    exit /b 1
)
echo [OK] CDK stack deployed
echo.

REM Step 4: Get outputs
echo Step 4: Retrieving deployment outputs...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name ConsoleSenseiStack --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text') do set USER_POOL_ID=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name ConsoleSenseiStack --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text') do set USER_POOL_CLIENT_ID=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name ConsoleSenseiStack --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text') do set API_URL=%%i

echo User Pool ID: %USER_POOL_ID%
echo User Pool Client ID: %USER_POOL_CLIENT_ID%
echo API URL: %API_URL%
echo.

REM Step 5: Create .env file
echo Step 5: Creating environment configuration...
cd ..\..

(
    echo VITE_API_ENDPOINT=%API_URL%
    echo VITE_COGNITO_REGION=%REGION%
    echo VITE_COGNITO_USER_POOL_ID=%USER_POOL_ID%
    echo VITE_COGNITO_CLIENT_ID=%USER_POOL_CLIENT_ID%
    echo VITE_COGNITO_DOMAIN=consolesensei-%ACCOUNT_ID%
) > .env.local

echo [OK] Environment configuration created (.env.local)
echo.

REM Step 6: Build frontend
echo Step 6: Building frontend...
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build frontend
    exit /b 1
)
echo [OK] Frontend built
echo.

REM Step 7: Summary
echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Update your Cognito domain (optional):
echo    aws cognito-idp create-user-pool-domain --domain consolesensei-%ACCOUNT_ID% --user-pool-id %USER_POOL_ID%
echo.
echo 2. Test the API:
echo    curl -X POST %API_URL%/scan -H "Content-Type: application/json" -d "{\"userId\":\"test-user\"}"
echo.
echo 3. Deploy frontend to S3 + CloudFront (optional):
echo    npm run deploy:frontend
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:5173 (local dev)
echo    API: %API_URL%
echo.
echo Configuration saved to: .env.local
echo.

endlocal
