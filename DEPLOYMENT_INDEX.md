# ConsoleSensei Cloud - Deployment Documentation Index

Complete guide to deploying ConsoleSensei Cloud to AWS.

## 📋 Quick Navigation

### For First-Time Deployment
1. **Start here:** [STEP_BY_STEP_DEPLOYMENT.md](STEP_BY_STEP_DEPLOYMENT.md)
   - Complete walkthrough with commands
   - Estimated time: 90 minutes
   - Includes troubleshooting

### For Automated Deployment
1. **Linux/macOS:** Run `./QUICK_DEPLOY.sh`
2. **Windows:** Run `QUICK_DEPLOY.bat`
3. **Estimated time:** 30 minutes

### For Manual Deployment
1. **Reference:** [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
   - Detailed AWS CLI commands
   - CDK deployment instructions
   - Manual setup procedures

### For Verification
1. **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
   - Pre-deployment checks
   - Post-deployment verification
   - Troubleshooting guide

### For Overview
1. **Summary:** [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
   - Architecture overview
   - Cost estimation
   - Security features

---

## 📚 Documentation Files

### Deployment Guides

| File | Purpose | Time | Audience |
|------|---------|------|----------|
| [STEP_BY_STEP_DEPLOYMENT.md](STEP_BY_STEP_DEPLOYMENT.md) | Complete walkthrough with all commands | 90 min | Developers |
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | Detailed AWS CLI and CDK reference | Reference | DevOps/Architects |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Verification and troubleshooting | Reference | QA/Operations |
| [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) | Architecture and overview | 10 min | All |
| [QUICK_DEPLOY.sh](QUICK_DEPLOY.sh) | Automated deployment (Linux/macOS) | 30 min | Developers |
| [QUICK_DEPLOY.bat](QUICK_DEPLOY.bat) | Automated deployment (Windows) | 30 min | Developers |

### Application Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview |
| [docs/SETUP.md](docs/SETUP.md) | Local development setup |
| [docs/API.md](docs/API.md) | API documentation |
| [docs/AWS_INTEGRATION.md](docs/AWS_INTEGRATION.md) | AWS integration details |
| [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) | Test results and verification |

---

## 🚀 Quick Start Paths

### Path 1: Automated Deployment (Recommended)

**For Linux/macOS:**
```bash
chmod +x QUICK_DEPLOY.sh
./QUICK_DEPLOY.sh
```

**For Windows:**
```bash
QUICK_DEPLOY.bat
```

**Time:** ~30 minutes  
**Difficulty:** Easy

### Path 2: Step-by-Step Deployment

1. Read [STEP_BY_STEP_DEPLOYMENT.md](STEP_BY_STEP_DEPLOYMENT.md)
2. Follow each phase in order
3. Verify with [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Time:** ~90 minutes  
**Difficulty:** Intermediate

### Path 3: Manual Deployment

1. Review [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
2. Execute AWS CLI commands manually
3. Deploy CDK stack
4. Configure environment
5. Verify with [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Time:** ~120 minutes  
**Difficulty:** Advanced

---

## 📋 Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] AWS Account with appropriate permissions
- [ ] AWS CLI installed and configured
- [ ] Node.js 18+ installed
- [ ] AWS CDK installed (`npm install -g aws-cdk`)
- [ ] Git repository cloned
- [ ] All tests passing locally (`npm run test -- --run`)

**Verify prerequisites:**
```bash
aws sts get-caller-identity
node --version
cdk --version
```

---

## 🏗️ What Gets Deployed

### Infrastructure
- **5 DynamoDB Tables** - ScanResults, Users, HygieneScores, AlertHistory, AICache
- **2 S3 Buckets** - Reports, Diagrams
- **6 Lambda Functions** - Scan, Score, AI, Report, Scheduler, Auth
- **API Gateway** - REST API with 14 endpoints
- **Cognito User Pool** - User authentication and management
- **EventBridge Rules** - Scheduled scans and automation
- **IAM Roles** - Least privilege access policies

### Application
- **Frontend** - React 18 + TypeScript + Vite
- **Backend** - 6 Lambda functions with 27 property-based tests
- **Monitoring** - CloudWatch Logs, Metrics, Alarms, X-Ray

---

## 📊 Deployment Outputs

After successful deployment, you'll receive:

```
User Pool ID: us-east-1_XXXXXXXXX
User Pool Client ID: XXXXXXXXXXXXXXXXXXXXXXXXXX
API Gateway URL: https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/v1
ScanResults Table: ConsoleSensei-ScanResults
Reports Bucket: consolesensei-reports-123456789
```

**Save these values!** You'll need them for configuration.

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` with deployment outputs:

```env
VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/v1
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_COGNITO_DOMAIN=consolesensei-YOUR_ACCOUNT_ID
```

### AWS Configuration

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output Format
```

---

## ✅ Post-Deployment Verification

### Test Lambda Functions
```bash
aws lambda invoke \
  --function-name ConsoleSensei-Scan \
  --payload '{"userId":"test-user"}' \
  response.json
```

### Test API Gateway
```bash
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

### Test Cognito
```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser@example.com \
  --temporary-password TempPassword123!
```

### Run Application
```bash
npm run dev
# Open http://localhost:5173
```

---

## 🐛 Troubleshooting

### Common Issues

**AWS CLI not found**
- Install from: https://aws.amazon.com/cli/
- Verify: `aws --version`

**CDK bootstrap fails**
- Check credentials: `aws sts get-caller-identity`
- Try again: `cdk bootstrap aws://ACCOUNT_ID/REGION`

**Lambda deployment fails**
- Check build: `ls -la backend-lambda/dist/`
- Check IAM: `aws iam get-user`
- Review logs: `aws logs tail /aws/lambda/consolesensei --follow`

**API returns 403**
- Verify User Pool ID in `.env.local`
- Check JWT token validity
- Review authorizer configuration

**See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed troubleshooting**

---

## 📈 Cost Estimation

### Monthly Costs (Estimated)

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 1M invocations | $20 |
| DynamoDB | On-demand | $25 |
| S3 | 100GB storage | $2 |
| API Gateway | 1M requests | $3.50 |
| Cognito | 50K MAU | $0 (free tier) |
| CloudWatch | Logs & metrics | $5 |
| **Total** | | **~$55/month** |

*Use AWS Cost Explorer for accurate estimates based on your usage.*

---

## 🔒 Security Features

✅ **Encryption**
- At rest: DynamoDB, S3 with AWS-managed keys
- In transit: HTTPS/TLS 1.2+

✅ **Authentication**
- Cognito User Pool with MFA
- JWT token validation
- API Gateway Cognito authorizer

✅ **Access Control**
- Least privilege IAM policies
- Resource-specific permissions
- Cross-account access support

✅ **Audit & Compliance**
- CloudTrail logging
- CloudWatch audit logs
- X-Ray request tracing

---

## 📞 Support & Help

### Documentation
- [API Documentation](docs/API.md)
- [AWS Integration Guide](docs/AWS_INTEGRATION.md)
- [Setup Instructions](docs/SETUP.md)

### Troubleshooting
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Step-by-Step Guide](STEP_BY_STEP_DEPLOYMENT.md)
- [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

---

## 🎯 Next Steps After Deployment

1. ✅ Create production users in Cognito
2. ✅ Configure custom domain (optional)
3. ✅ Set up monitoring dashboards
4. ✅ Configure backup and disaster recovery
5. ✅ Document runbooks for operations
6. ✅ Plan capacity and scaling
7. ✅ Set up CI/CD pipeline
8. ✅ Configure security scanning

---

## 📝 Deployment Checklist

- [ ] Prerequisites installed and verified
- [ ] AWS credentials configured
- [ ] Lambda functions built
- [ ] CDK stack deployed
- [ ] Environment variables configured
- [ ] Frontend built
- [ ] Lambda functions tested
- [ ] API Gateway tested
- [ ] Cognito User Pool tested
- [ ] DynamoDB tables verified
- [ ] Application runs locally
- [ ] Authentication works
- [ ] Scan functionality works
- [ ] Monitoring configured
- [ ] Alarms created

---

## 📊 Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Infrastructure Code | ✅ Ready | CDK stack defined |
| Lambda Functions | ✅ Ready | 6 functions, 27 tests |
| Frontend | ✅ Ready | React 18 + TypeScript |
| Documentation | ✅ Complete | 6 deployment guides |
| Tests | ✅ Passing | 149/149 tests pass |
| Security | ✅ Hardened | Encryption, auth, audit |

---

## 🚀 Ready to Deploy?

**Choose your path:**

1. **Quick & Easy:** Run [QUICK_DEPLOY.sh](QUICK_DEPLOY.sh) or [QUICK_DEPLOY.bat](QUICK_DEPLOY.bat)
2. **Step-by-Step:** Follow [STEP_BY_STEP_DEPLOYMENT.md](STEP_BY_STEP_DEPLOYMENT.md)
3. **Manual:** Use [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

**Estimated time:** 30-120 minutes depending on path

---

**Last Updated:** February 22, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

