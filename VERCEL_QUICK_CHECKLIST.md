# Vercel Deployment Quick Checklist

## Pre-Deployment (Local)

- [ ] Clone repository: `git clone https://github.com/mudassirfaaiz15/console-sensei-cloud-2.0.git`
- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Build locally: `npm run build`
- [ ] Test locally: `npm run dev` (visit http://localhost:5173)
- [ ] Verify no console errors
- [ ] Commit changes: `git add . && git commit -m "feat: prepare for Vercel deployment"`
- [ ] Push to GitHub: `git push origin main`

## Vercel Deployment

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Click "Import Git Repository"
- [ ] Select `console-sensei-cloud-2.0`
- [ ] Click "Import"

## Configure Project

- [ ] Project Name: `console-sensei-cloud-2.0`
- [ ] Framework: Vite (auto-detected)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install --legacy-peer-deps`

## Environment Variables

Add these in Vercel dashboard:

| Key | Value |
|-----|-------|
| `VITE_USE_MOCK_DATA` | `true` |
| `VITE_API_URL` | `https://api.consolesensei.com/v1` |

- [ ] Add `VITE_USE_MOCK_DATA=true`
- [ ] Add `VITE_API_URL=https://api.consolesensei.com/v1`

## Deploy

- [ ] Click "Deploy" button
- [ ] Wait for deployment to complete (2-3 minutes)
- [ ] Check deployment status shows ✅

## Post-Deployment Verification

- [ ] Visit production URL
- [ ] Dashboard page loads
- [ ] AWS Resources page loads
- [ ] Cost Breakdown page loads
- [ ] Security Audit page loads
- [ ] No console errors (F12)
- [ ] Mock data displays correctly
- [ ] All navigation links work

## Success Criteria

✅ Application deployed to Vercel  
✅ All pages load without errors  
✅ Mock data displays correctly  
✅ No console errors  
✅ Responsive design works on mobile  

---

**Deployment Status:** Ready  
**Estimated Time:** 10 minutes  
**Difficulty:** Easy
