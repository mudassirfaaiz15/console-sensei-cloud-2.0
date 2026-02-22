# ConsoleSensei Cloud - Vercel Deployment Guide

## Overview

This guide walks you through deploying the ConsoleSensei Cloud frontend to Vercel without backend integration. The frontend uses mock data for demonstration purposes.

**Deployment Time:** 5-10 minutes  
**Status:** ✅ Ready for Vercel deployment

---

## Prerequisites

- GitHub account with the repo: `https://github.com/mudassirfaaiz15/console-sensei-cloud-2.0.git`
- Vercel account (free tier available at https://vercel.com)
- Git installed locally

---

## Step 1: Prepare the Repository

### 1.1 Clone the Repository
```bash
git clone https://github.com/mudassirfaaiz15/console-sensei-cloud-2.0.git
cd console-sensei-cloud-2.0
```

### 1.2 Verify Build Works Locally
```bash
npm install --legacy-peer-deps
npm run build
```

Expected output:
```
✓ built in 45.23s
```

### 1.3 Test Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to verify the app works.

---

## Step 2: Push to GitHub

### 2.1 Commit All Changes
```bash
git add .
git commit -m "feat: prepare frontend for Vercel deployment with mock data"
```

### 2.2 Push to Repository
```bash
git push origin main
```

Verify the push succeeded on GitHub.

---

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Search for `console-sensei-cloud-2.0`
5. Click "Import"

### 3.2 Configure Project Settings

**Project Name:** `console-sensei-cloud-2.0` (or your preferred name)

**Framework Preset:** Vite (auto-detected)

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Install Command:** `npm install --legacy-peer-deps`

### 3.3 Environment Variables

Add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_USE_MOCK_DATA` | `true` | Use mock data instead of backend |
| `VITE_API_URL` | `https://api.consolesensei.com/v1` | Backend API URL (for future use) |

### 3.4 Deploy

Click "Deploy" button and wait for deployment to complete.

Expected deployment time: 2-3 minutes

---

## Step 4: Verify Deployment

### 4.1 Check Deployment Status

After deployment completes, you'll see:
- ✅ Production URL (e.g., `https://console-sensei-cloud-2-0.vercel.app`)
- ✅ Deployment logs
- ✅ Build output

### 4.2 Test the Application

1. Visit your production URL
2. Verify all pages load correctly:
   - Dashboard
   - AWS Resources
   - Accounts
   - Cost Breakdown
   - Security Audit
   - Reminders
   - IAM Explainer
   - Cloud Copilot

### 4.3 Check Console for Errors

Open browser DevTools (F12) and check:
- No red errors in console
- Network requests complete successfully
- Mock data loads correctly

---

## Features Available

✅ **Dashboard** - Overview with mock hygiene score and resources  
✅ **AWS Resources** - List of mock AWS resources with filtering  
✅ **Accounts** - Mock AWS account information  
✅ **Cost Breakdown** - Mock cost data and trends  
✅ **Security Audit** - Mock security findings and recommendations  
✅ **Reminders** - Mock alerts and schedule configuration  
✅ **IAM Explainer** - Mock IAM policy explanations  
✅ **Cloud Copilot** - Chat interface (mock responses)  

---

## Features NOT Available (Backend Required)

❌ Real AWS resource scanning  
❌ Real cost data from AWS Cost Explorer  
❌ Real security analysis  
❌ AI-powered recommendations  
❌ Scheduled scans  
❌ Email/Slack alerts  
❌ PDF report generation  
❌ Architecture diagram generation  

---

## Switching to Backend Integration

When you're ready to integrate the backend:

### 1. Update Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Change `VITE_USE_MOCK_DATA` to `false`
3. Update `VITE_API_URL` to your backend URL

### 2. Deploy Backend

Follow the AWS deployment guide to deploy Lambda functions and API Gateway.

### 3. Redeploy Frontend

Vercel will automatically redeploy when you push changes to GitHub.

---

## Troubleshooting

### Build Fails with "npm ERR!"

**Solution:** Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
npm run build
```

### Deployment Fails with "Module not found"

**Solution:** Clear cache and rebuild
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Application Shows Blank Page

**Solution:** Check browser console for errors
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### Mock Data Not Loading

**Solution:** Verify environment variables
1. Go to Vercel dashboard
2. Check Settings → Environment Variables
3. Ensure `VITE_USE_MOCK_DATA=true`
4. Redeploy

---

## Performance Metrics

Expected Lighthouse scores:
- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100

---

## Next Steps

1. ✅ Frontend deployed to Vercel
2. 📋 Deploy backend to AWS (see AWS_DEPLOYMENT_CHECKLIST_DETAILED.md)
3. 🔗 Integrate frontend with backend API
4. 🧪 Run end-to-end tests
5. 🚀 Launch production

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Vercel documentation: https://vercel.com/docs
- Check build logs in Vercel dashboard

---

**Deployment Date:** [Your Date]  
**Status:** ✅ Ready for Production  
**Frontend URL:** [Your Vercel URL]
