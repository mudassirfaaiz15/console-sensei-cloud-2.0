import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class ConsoleSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // ScanResults Table
    const scanResultsTable = new dynamodb.Table(this, 'ScanResultsTable', {
      tableName: 'ConsoleSensei-ScanResults',
      partitionKey: { name: 'scanId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying by userId and timestamp
    scanResultsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdTimestampIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'ConsoleSensei-Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // HygieneScores Table
    const hygieneScoresTable = new dynamodb.Table(this, 'HygieneScoresTable', {
      tableName: 'ConsoleSensei-HygieneScores',
      partitionKey: { name: 'scanId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // AlertHistory Table
    const alertHistoryTable = new dynamodb.Table(this, 'AlertHistoryTable', {
      tableName: 'ConsoleSensei-AlertHistory',
      partitionKey: { name: 'alertId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying alerts by userId
    alertHistoryTable.addGlobalSecondaryIndex({
      indexName: 'UserIdTimestampIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // AICache Table
    const aiCacheTable = new dynamodb.Table(this, 'AICacheTable', {
      tableName: 'ConsoleSensei-AICache',
      partitionKey: { name: 'cacheKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Cache can be destroyed
    });

    // ========================================
    // S3 Buckets
    // ========================================

    // Reports Bucket
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      bucketName: `consolesensei-reports-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteOldReports',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Diagrams Bucket
    const diagramsBucket = new s3.Bucket(this, 'DiagramsBucket', {
      bucketName: `consolesensei-diagrams-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteOldDiagrams',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ========================================
    // Cognito User Pool
    // ========================================

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'ConsoleSensei-Users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'ConsoleSensei-WebClient',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
      accessTokenValidity: cdk.Duration.hours(24),
      idTokenValidity: cdk.Duration.hours(24),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // ========================================
    // IAM Roles for Lambda Functions
    // ========================================

    // Scan Lambda Role
    const scanLambdaRole = new iam.Role(this, 'ScanLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Scan Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant permissions to scan AWS resources
    scanLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:Describe*',
          's3:ListAllMyBuckets',
          's3:GetBucketLocation',
          's3:GetBucketEncryption',
          's3:GetBucketPublicAccessBlock',
          's3:GetBucketTagging',
          'rds:Describe*',
          'lambda:List*',
          'lambda:Get*',
          'ecs:Describe*',
          'ecs:List*',
          'eks:Describe*',
          'eks:List*',
          'elasticloadbalancing:Describe*',
          'iam:List*',
          'iam:Get*',
          'cloudwatch:Describe*',
          'cloudwatch:List*',
          'ce:GetCostAndUsage',
          'ce:GetCostForecast',
          'sts:AssumeRole',
        ],
        resources: ['*'],
      })
    );

    // Grant DynamoDB permissions
    scanResultsTable.grantReadWriteData(scanLambdaRole);

    // Score Lambda Role
    const scoreLambdaRole = new iam.Role(this, 'ScoreLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Score Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    scanResultsTable.grantReadData(scoreLambdaRole);
    hygieneScoresTable.grantReadWriteData(scoreLambdaRole);

    // AI Lambda Role
    const aiLambdaRole = new iam.Role(this, 'AILambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for AI Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant Bedrock permissions
    aiLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      })
    );

    scanResultsTable.grantReadData(aiLambdaRole);
    hygieneScoresTable.grantReadData(aiLambdaRole);
    aiCacheTable.grantReadWriteData(aiLambdaRole);

    // Report Lambda Role
    const reportLambdaRole = new iam.Role(this, 'ReportLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Report Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    scanResultsTable.grantReadData(reportLambdaRole);
    hygieneScoresTable.grantReadData(reportLambdaRole);
    reportsBucket.grantReadWrite(reportLambdaRole);
    diagramsBucket.grantReadWrite(reportLambdaRole);

    // Scheduler Lambda Role
    const schedulerLambdaRole = new iam.Role(this, 'SchedulerLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Scheduler Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant permissions to invoke other Lambdas
    schedulerLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: ['*'], // Will be restricted after Lambda functions are created
      })
    );

    // Grant SES permissions
    schedulerLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    scanResultsTable.grantReadData(schedulerLambdaRole);
    usersTable.grantReadData(schedulerLambdaRole);
    alertHistoryTable.grantReadWriteData(schedulerLambdaRole);

    // Auth Lambda Role
    const authLambdaRole = new iam.Role(this, 'AuthLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Auth Lambda authorizer',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    usersTable.grantReadData(authLambdaRole);

    // ========================================
    // Lambda Functions (Placeholders)
    // ========================================
    // Note: These will be implemented in subsequent tasks
    // For now, we create placeholder functions

    const scanLambda = new lambda.Function(this, 'ScanLambda', {
      functionName: 'ConsoleSensei-Scan',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/scan/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: scanLambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        SCAN_RESULTS_TABLE: scanResultsTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const scoreLambda = new lambda.Function(this, 'ScoreLambda', {
      functionName: 'ConsoleSensei-Score',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/score/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: scoreLambdaRole,
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      environment: {
        SCAN_RESULTS_TABLE: scanResultsTable.tableName,
        HYGIENE_SCORES_TABLE: hygieneScoresTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const aiLambda = new lambda.Function(this, 'AILambda', {
      functionName: 'ConsoleSensei-AI',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/ai/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: aiLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        SCAN_RESULTS_TABLE: scanResultsTable.tableName,
        HYGIENE_SCORES_TABLE: hygieneScoresTable.tableName,
        AI_CACHE_TABLE: aiCacheTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const reportLambda = new lambda.Function(this, 'ReportLambda', {
      functionName: 'ConsoleSensei-Report',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/report/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: reportLambdaRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        SCAN_RESULTS_TABLE: scanResultsTable.tableName,
        HYGIENE_SCORES_TABLE: hygieneScoresTable.tableName,
        REPORTS_BUCKET: reportsBucket.bucketName,
        DIAGRAMS_BUCKET: diagramsBucket.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const schedulerLambda = new lambda.Function(this, 'SchedulerLambda', {
      functionName: 'ConsoleSensei-Scheduler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/scheduler/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: schedulerLambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        SCAN_RESULTS_TABLE: scanResultsTable.tableName,
        USERS_TABLE: usersTable.tableName,
        ALERT_HISTORY_TABLE: alertHistoryTable.tableName,
        SCAN_LAMBDA_ARN: scanLambda.functionArn,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant scheduler permission to invoke scan lambda
    scanLambda.grantInvoke(schedulerLambdaRole);

    // Auth Lambda for Cognito authorizer
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      functionName: 'ConsoleSensei-Auth',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'functions/auth/index.handler',
      code: lambda.Code.fromAsset('dist'),
      role: authLambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // ========================================
    // API Gateway
    // ========================================

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'ConsoleSenseiAuthorizer',
    });

    // REST API
    const api = new apigateway.RestApi(this, 'ConsoleSenseiAPI', {
      restApiName: 'ConsoleSensei API',
      description: 'ConsoleSensei Cloud REST API',
      deployOptions: {
        stageName: 'v1',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingRateLimit: 10,
        throttlingBurstLimit: 20,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // API Resources and Methods

    // /scan
    const scanResource = api.root.addResource('scan');
    scanResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(scanLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /scan/latest
    const scanLatestResource = scanResource.addResource('latest');
    scanLatestResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(scanLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /scan/{scanId}
    const scanIdResource = scanResource.addResource('{scanId}');
    scanIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(scanLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /score/{scanId}
    const scoreResource = api.root.addResource('score');
    const scoreIdResource = scoreResource.addResource('{scanId}');
    scoreIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(scoreLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /ai
    const aiResource = api.root.addResource('ai');

    // /ai/cost-advisor
    const costAdvisorResource = aiResource.addResource('cost-advisor');
    costAdvisorResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(aiLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /ai/risk-summary
    const riskSummaryResource = aiResource.addResource('risk-summary');
    riskSummaryResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(aiLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /ai/iam-explainer
    const iamExplainerResource = aiResource.addResource('iam-explainer');
    iamExplainerResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(aiLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /ai/chat
    const chatResource = aiResource.addResource('chat');
    chatResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(aiLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /report/generate
    const reportResource = api.root.addResource('report');
    const generateResource = reportResource.addResource('generate');
    generateResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(reportLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /schedule
    const scheduleResource = api.root.addResource('schedule');
    scheduleResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(schedulerLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    scheduleResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(schedulerLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /alerts
    const alertsResource = api.root.addResource('alerts');
    alertsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(schedulerLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // ========================================
    // EventBridge Rules (Placeholder)
    // ========================================
    // Note: Actual rules will be created dynamically per user
    // This is just an example rule

    const exampleScheduleRule = new events.Rule(this, 'ExampleScheduleRule', {
      ruleName: 'ConsoleSensei-ExampleSchedule',
      description: 'Example scheduled scan rule',
      schedule: events.Schedule.cron({ minute: '0', hour: '9' }), // Daily at 9 AM UTC
      enabled: false, // Disabled by default
    });

    exampleScheduleRule.addTarget(new targets.LambdaFunction(schedulerLambda));

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'ConsoleSensei-UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'ConsoleSensei-UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'ConsoleSensei-ApiUrl',
    });

    new cdk.CfnOutput(this, 'ScanResultsTableName', {
      value: scanResultsTable.tableName,
      description: 'ScanResults DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ReportsBucketName', {
      value: reportsBucket.bucketName,
      description: 'Reports S3 Bucket Name',
    });
  }
}
