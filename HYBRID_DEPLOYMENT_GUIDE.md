# Hybrid Deployment Guide - Vercel + AWS

Deploy frontend to Vercel and backend to AWS for optimal performance and cost.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Vercel (Frontend)                        │
│            https://consolesensei.vercel.app              │
│                                                            │
│  • React 18 + TypeScript                                 │
│  • Vite optimized build                                  │
│  • Global CDN distribution                               │
│  • Automatic deployments                                 │
│  • Preview deployments                                   │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS API calls
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   AWS (Backend)                           │
│                                                            │
│  Lambda Functions:                                        │
│  • Scan (Multi-region AWS scanning)                      │
│  • Score (Hygiene scoring)                               │
│  • AI (AWS Bedrock integration)                          │
│  • Report (PDF generation)                               │
│  • Scheduler (EventBridge automation)                    │
│  • Auth (Cognito JWT validation)                         │
│                                                            │
│  Data Layer:                                              │
│  • DynamoDB (NoSQL database)                             │
│  • S3 (Reports, diagrams)                                │
│  • Cognito (User authentication)                         │
│  • API Gateway (REST endpoints)                          │
└──────────────────────────────────────────────────────────┘
```

## 📊 Comparison: Deployment Options

| Aspect | AWS Only | Vercel + AWS | Vercel Only |
|--------|----------|--------------|------------|
| Frontend | S3 + CloudFront | Vercel | Vercel |
| Backend | Lambda | Lambda | ❌ Not possible |
| Cost | ~$55/month | ~$75/month | N/A |
| Performance | Good | Excellent | N/A |
| Scalability | Auto | Auto | N/A |
| Setup Time | 120 min | 30 min | N/A |
| Maintenance | Medium | Low | N/A |

## ✅ Why Vercel + AWS?

### Benefits of Vercel for Frontend
- ✅ **Global CDN** - Fast content delivery worldwide
- ✅ **Automatic Deployments** - Push to GitHub, auto-deploy
- ✅ **Preview Deployments** - Test PRs before merging
- ✅ **Easy Scaling** - No infrastructure management
- ✅ **Free Tier** - Start for free
- ✅ **Analytics** - Built-in performance monitoring
- ✅ **Edge Functions** - Run code at edge

### Benefits of AWS for Backend
- ✅ **Serverless** - Pay only for what you use
- ✅ **Scalable** - Auto-scales with demand
- ✅ **Secure** - Enterprise-grade security
- ✅ **Flexible** - Full control over infrastructure
- ✅ **Integrated** - All AWS services available
- ✅ **Reliable** - 99.99% uptime SLA

## 🚀 Deployment Steps

### Phase 1: Deploy AWS Backend (120 minutes)

```bash
# 1. Build Lambda functions
cd backend-lambda
npm install
npm run build

# 2. Deploy infrastructure
cd infrastructure
npm install
cdk bootstrap
cdk deploy --all

# 3. Save outputs
# User Pool ID, API URL, etc.
```

See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for details.

### Phase 2: Configure for Vercel (10 minutes)

```bash
# 1. Update environment variables
cat > .env.production << EOF
VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/v1
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_COGNITO_DOMAIN=consolesensei-YOUR_ACCOUNT_ID
EOF

# 2. Update Cognito callback URLs
# AWS Console → Cognito → User Pools → App Client Settings
# Add: https://your-domain.vercel.app/callback

# 3. Update API Gateway CORS
# AWS Console → API Gateway → Enable CORS
# Add: https://your-domain.vercel.app
```

### Phase 3: Deploy to Vercel (15 minutes)

**Option A: Using CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Using GitHub**
1. Go to https://vercel.com/new
2. Import GitHub repository
3. Add environment variables
4. Click Deploy

## 📋 Configuration Checklist

### AWS Backend
- [ ] Lambda functions deployed
- [ ] DynamoDB tables created
- [ ] S3 buckets created
- [ ] API Gateway configured
- [ ] Cognito User Pool created
- [ ] IAM roles configured
- [ ] CloudWatch monitoring enabled

### Vercel Frontend
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Build settings configured
- [ ] Deployment successful
- [ ] Application tested

### Integration
- [ ] Cognito callback URLs updated
- [ ] API Gateway CORS configured
- [ ] Frontend API calls working
- [ ] Authentication working
- [ ] Scan functionality working

## 💰 Cost Breakdown

### Vercel Costs
| Component | Cost |
|-----------|------|
| Hobby Plan | Free |
| Pro Plan | $20/month |
| Bandwidth | Included |
| **Total** | **$0-20/month** |

### AWS Costs
| Component | Cost |
|-----------|------|
| Lambda | $20 |
| DynamoDB | $25 |
| S3 | $2 |
| API Gateway | $3.50 |
| Cognito | $0 (free tier) |
| CloudWatch | $5 |
| **Total** | **~$55/month** |

### Combined Monthly Cost
- **Vercel:** $0-20/month
- **AWS:** ~$55/month
- **Total:** ~$55-75/month

## 🔒 Security

### Frontend (Vercel)
- ✅ HTTPS/TLS encryption
- ✅ DDoS protection
- ✅ Automatic SSL certificates
- ✅ Edge security

### Backend (AWS)
- ✅ Encryption at rest & transit
- ✅ Cognito authentication
- ✅ JWT token validation
- ✅ Least privilege IAM
- ✅ CloudTrail audit logging

### Communication
- ✅ HTTPS API calls
- ✅ JWT token authentication
- ✅ CORS validation
- ✅ Rate limiting

## 📈 Performance

### Frontend (Vercel)
- ✅ Global CDN (150+ edge locations)
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Caching strategies
- ✅ ~100ms average response time

### Backend (AWS)
- ✅ Lambda auto-scaling
- ✅ DynamoDB on-demand
- ✅ API Gateway caching
- ✅ X-Ray tracing
- ✅ ~200-500ms average response time

### Total
- ✅ Frontend load: ~1-2 seconds
- ✅ API response: ~200-500ms
- ✅ Scan completion: ~5 minutes
- ✅ Report generation: ~2 minutes

## 🔄 CI/CD Pipeline

### Automatic Deployments

```
GitHub Push
    ↓
Vercel Webhook
    ↓
Build & Test
    ↓
Deploy to Production
    ↓
Live!
```

### Preview Deployments

```
Pull Request
    ↓
Vercel Creates Preview
    ↓
Test Changes
    ↓
Merge to Main
    ↓
Production Deploy
```

## 📊 Monitoring

### Vercel Analytics
- Page load times
- Core Web Vitals
- Error rates
- Traffic patterns

### AWS CloudWatch
- Lambda invocations
- API Gateway requests
- DynamoDB capacity
- Error rates

### Combined Monitoring
- End-to-end performance
- User experience metrics
- Cost tracking
- Security events

## 🚨 Troubleshooting

### CORS Errors
```
Solution:
1. Update API Gateway CORS settings
2. Add Vercel domain to allowed origins
3. Redeploy frontend
```

### Cognito Callback Fails
```
Solution:
1. Update Cognito callback URLs
2. Include Vercel domain
3. Verify HTTPS
```

### API Calls Timeout
```
Solution:
1. Check Lambda timeout settings
2. Check API Gateway throttling
3. Review CloudWatch logs
```

### Build Fails on Vercel
```
Solution:
1. Check build logs
2. Verify dependencies
3. Test locally: npm run build
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) | Detailed Vercel setup |
| [VERCEL_QUICK_DEPLOY.md](VERCEL_QUICK_DEPLOY.md) | Quick 5-minute deploy |
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | AWS backend setup |
| [STEP_BY_STEP_DEPLOYMENT.md](STEP_BY_STEP_DEPLOYMENT.md) | Complete walkthrough |

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] AWS backend deployed
- [ ] Vercel account created
- [ ] GitHub repository ready
- [ ] Environment variables prepared

### Deployment
- [ ] Frontend built locally
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployment successful

### Post-Deployment
- [ ] Application loads
- [ ] Authentication works
- [ ] API calls work
- [ ] Scan functionality works
- [ ] Monitoring configured

## 🎉 You're Done!

Your application is now deployed:

- **Frontend:** https://your-domain.vercel.app (Vercel)
- **Backend:** AWS Lambda + API Gateway
- **Database:** DynamoDB
- **Authentication:** Cognito
- **Monitoring:** CloudWatch + Vercel Analytics

## 🚀 Next Steps

1. ✅ Create production users in Cognito
2. ✅ Configure custom domain
3. ✅ Set up monitoring dashboards
4. ✅ Configure backup and disaster recovery
5. ✅ Document runbooks for operations
6. ✅ Plan scaling strategy

---

**Deployment Type:** Hybrid (Vercel + AWS)  
**Estimated Time:** 150 minutes total  
**Difficulty:** Intermediate  
**Cost:** ~$55-75/month

