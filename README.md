# CONSOLE SENSEI CLOUD OPS

<div align="center">

![AWS](https://img.shields.io/badge/AWS-Cloud%20Operations-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel)
![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway)

# CONSOLE SENSEI CLOUD OPS

### Enterprise-Grade Multi-Cloud Infrastructure Intelligence Platform

Monitor AWS infrastructure, analyze cloud costs, detect security risks, and manage multi-account environments from one intelligent dashboard.

### 🔗 Live Project
https://multi-cloud-infrastructure-intellig-sage.vercel.app/

### 📂 GitHub Repository
https://github.com/mudassirfaaiz15/Multi-Cloud-Infrastructure-Intelligence-Platform

</div>

---

# 📌 Project Overview

**CONSOLE SENSEI CLOUD OPS** is a modern SaaS-based cloud operations platform built for DevOps teams, cloud engineers, and organizations managing complex AWS environments.

The platform delivers:

- Real-time infrastructure monitoring
- Cost intelligence dashboards
- IAM security auditing
- Compliance analysis
- Multi-account AWS management
- CloudTrail activity monitoring
- Automated optimization recommendations
- Real-time AWS activity visibility
- Cloud security posture analysis
- Intelligent resource optimization

The system combines a **React 18 + TypeScript frontend** with a **Flask + boto3 backend**, enabling organizations to gain operational visibility without expensive enterprise cloud management tools.

---

# 🚨 Problem Statement

Engineering and DevOps teams managing AWS environments lack a lightweight, unified tool to simultaneously track costs, audit security, and monitor resources across multiple accounts without expensive enterprise subscriptions or complex setup overhead.

---

# 💡 Proposed Solution

A full-stack dashboard combining a React 18 + TypeScript frontend with a Flask + boto3 backend that auto-scans AWS resources, provides cost intelligence, runs security audits, and delivers real-time CloudTrail-backed activity monitoring — deployable in minutes via Vercel and Railway.

---

# 🏗️ System Architecture

```text
 ┌───────────────────────────────┐
 │        React Frontend         │
 │  React 18 + TypeScript + UI  │
 └──────────────┬────────────────┘
                │ REST API Calls
                ▼
 ┌───────────────────────────────┐
 │         Flask Backend         │
 │   Authentication + boto3 API │
 └──────────────┬────────────────┘
                │
                ▼
 ┌───────────────────────────────┐
 │        AWS Cloud Layer        │
 │ EC2 │ RDS │ S3 │ Lambda │ IAM │
 │ CloudTrail │ Security Hub     │
 └───────────────────────────────┘
```

---

# ⚙️ Functional Requirements

## 🔐 Authentication

- Register, Login, Logout with JWT authentication
- API key authentication support
- Role-based access control
  - Admin
  - Editor
  - Viewer
- Token expiry & refresh handling
- Protected API endpoints
- Secure session management

---

## ☁️ AWS Account Management

- Connect multiple AWS accounts
- Multi-region cloud management
- Add / Edit / Remove AWS accounts
- Centralized infrastructure dashboard
- AWS account switching
- Unified monitoring system

---

## 🔍 Resource Discovery

Automatically scans:

- EC2
- RDS
- S3
- Lambda
- IAM
- CloudTrail
- Security Hub

### Features

- Resource filtering
- Search by region/account/type
- Idle resource detection
- Unused resource identification
- Infrastructure inventory generation
- Service-wise monitoring

---

## 💰 Cost Intelligence

- Real-time cloud cost breakdown
- Service-wise cost analytics
- Budget threshold alerts
- Cost optimization recommendations
- Monthly usage analytics
- Cloud spending visualization

### Export Reports

- PDF
- CSV

---

## 🛡️ Security & Compliance

- IAM policy analysis
- Over-permission detection
- Security audit score (0–100)
- Compliance violation tracking
- Security posture visualization
- Risk identification engine
- Cloud security insights

---

## 📈 Activity Monitoring

- Real-time CloudTrail integration
- Infrastructure activity logs
- User action tracking
- Cloud event monitoring

### Filter Support

- Service
- User
- Time range

---

## 🚨 Alerts & Notifications

- Cost spike alerts
- Utilization alerts
- Security incident alerts
- Email notifications
- In-app notifications
- Automated alert triggers

---

## 👥 Team Management

- Invite team members
- Assign roles
- Remove members
- Role-based permissions
- Collaborative cloud operations

---

## 📄 Reports

- Monthly cost reports
- Security audit reports
- PDF export functionality
- Shareable read-only report links
- Downloadable analytics reports

---

# 🚀 Non-Functional Requirements

| Requirement | Target |
|---|---|
| Bundle Size | Under 150 KB gzipped |
| Page Load Time | Under 2 seconds |
| API Response Time | Under 3 seconds |
| Concurrent Users | 50+ |
| Uptime | 99.5% |
| Encryption | HTTPS/TLS |
| Password Storage | Never stored in plain text |
| Accessibility Score | Lighthouse 90+ |
| Test Coverage | Minimum 70% |

---

# 🛠️ Technologies Used

## Frontend

- React 18
- TypeScript
- Tailwind CSS 4
- Radix UI
- React Query
- React Hook Form
- Zod
- Recharts
- Vite 6

---

## Backend

- Flask
- Python 3.9+
- boto3
- JWT Authentication

---

## Database & Services

- Supabase

---

## DevOps & Deployment

- GitHub Actions
- Vercel
- Railway

---

# 📦 Project Type

## SaaS Web Application

Enterprise-focused cloud operations and AWS intelligence platform.

---

# 📂 GitHub Repository

```bash
git clone https://github.com/mudassirfaaiz15/Multi-Cloud-Infrastructure-Intelligence-Platform.git
```

---

# 🌐 Live Deployment

## Frontend

https://multi-cloud-infrastructure-intellig-sage.vercel.app/

---

# 📋 In Scope

- AWS resource discovery and cataloging
- Real-time cost tracking
- Cost optimization recommendations
- IAM security auditing
- Multi-account AWS management
- CloudTrail monitoring
- Alert systems
- Team collaboration
- Export utilities
- Infrastructure analytics
- AWS operational intelligence

---

# 📊 Key Highlights

- Multi-account AWS intelligence dashboard
- Real-time infrastructure visibility
- Security posture auditing
- Cloud cost optimization engine
- Enterprise-grade architecture
- Production-ready deployment
- Modern responsive UI
- Role-based collaboration system
- Fast API integrations
- Optimized frontend performance

---

# 🧪 Performance Goals

| Metric | Value |
|---|---|
| Lighthouse Score | 90+ |
| API Latency | <3 sec |
| Uptime | 99.5% |
| Concurrent Users | 50+ |
| Bundle Size | <150 KB |

---

# 🔒 Security Features

- JWT Authentication
- HTTPS/TLS Encryption
- Secure credential handling
- Role-based access control
- API key authentication
- Token refresh management
- Input validation with Zod
- Protected backend APIs
- Cloud security audit system

---

# 📈 Future Scalability

Potential enterprise upgrades include:

- Kubernetes monitoring
- AI-based cloud recommendations
- Advanced FinOps analytics
- Multi-cloud support
- Enterprise SSO integration
- Real-time event streaming
- Predictive infrastructure analytics

---

# 🏁 Conclusion

**CONSOLE SENSEI CLOUD OPS** is a well-architected MVP demonstrating strong frontend engineering discipline and meaningful AWS service coverage.

The platform successfully combines:

- Cloud infrastructure intelligence
- Security auditing
- FinOps analytics
- DevOps operational visibility
- Enterprise monitoring systems
- Modern SaaS architecture

Its primary future growth areas include:

- Backend scalability
- Advanced credential hardening
- AI-powered optimization
- Enterprise integrations
- Multi-cloud intelligence systems

---

# 👨‍💻 Developed By

## Mudassir Faaiz Mohammed

### Cloud • DevOps • Full Stack • AWS

---

# ⭐ Support

If you found this project useful:

- Star the repository
- Fork the project
- Share feedback
- Contribute improvements

---

<div align="center">

# CONSOLE SENSEI CLOUD OPS

### Intelligent Cloud Operations Platform for Modern DevOps Teams

<br>

## ❤️ Made With Love By Mudassir Faaiz ❤️

</div>
