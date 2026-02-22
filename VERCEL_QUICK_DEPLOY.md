# Quick Vercel Deployment (5 Minutes)

Fast track to deploy frontend to Vercel.

## Prerequisites

✅ AWS backend already deployed  
✅ Vercel account created (https://vercel.com)  
✅ GitHub account with repository  

## Quick Steps

### Step 1: Get AWS Outputs

From your AWS deployment, save these values:

```
VITE_API_ENDPOINT=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/v1
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=consolesensei-123456789012
```

### Step 2: Update Cognito Callback URLs

In AWS Cognito Console:
1. User Pools → Your Pool → App Integration → App Client Settings
2. Add Callback URL: `https://your-domain.vercel.app/callback`
3. Add Sign Out URL: `https://your-domain.vercel.app/`
4. Save

### Step 3: Deploy to Vercel

**Option A: Using CLI (Fastest)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Using GitHub**

1. Go to https://vercel.com/new
2. Select your GitHub repository
3. Configure:
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
4. Add environment variables (from Step 1)
5. Click Deploy

### Step 4: Verify

1. Open your Vercel URL
2. Sign up with test email
3. Verify email
4. Sign in
5. Test scan

## Done! 🎉

Your frontend is now live on Vercel!

**Frontend:** https://your-domain.vercel.app  
**Backend:** AWS Lambda + API Gateway  

---

For detailed setup, see [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)

