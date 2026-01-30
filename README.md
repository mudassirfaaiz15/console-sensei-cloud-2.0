# ConsoleSensei Cloud

<div align="center">

![ConsoleSensei Cloud](https://img.shields.io/badge/ConsoleSensei-Cloud-6366f1?style=for-the-badge&logo=amazon-aws&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Your Intelligent Co-Pilot for AWS Cloud Management**

[View Demo](http://localhost:5173) · [Report Bug](https://github.com/yourusername/consolesensei-cloud/issues) · [Request Feature](https://github.com/yourusername/consolesensei-cloud/issues)

</div>

---

## 🚀 Overview

ConsoleSensei Cloud is a modern, production-ready dashboard for monitoring AWS infrastructure, detecting security risks, and preventing cost leaks. Built with React 18, TypeScript, and Tailwind CSS 4, it provides real-time insights into your cloud environment.

### ✨ Key Features

- **🔍 AWS Resource Scanner** - Automatically discover resources across all regions
- **💰 Cost Monitoring** - Track spending and identify unused resources
- **🛡️ IAM Policy Explainer** - Understand complex policies in plain English
- **📊 Cloud Hygiene Score** - Security and efficiency scoring with actionable insights
- **⏰ Smart Reminders** - Custom alerts for running instances and cost thresholds
- **📈 Activity Timeline** - Track CloudTrail events in real-time

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, React Router 7 |
| **Styling** | Tailwind CSS 4, Radix UI Primitives |
| **State** | React Context, React Hook Form |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Build** | Vite 6 |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (48 components)
│   │   ├── __tests__/       # Component tests
│   │   ├── dashboard-layout.tsx
│   │   ├── error-boundary.tsx
│   │   ├── protected-route.tsx
│   │   └── theme-toggle.tsx
│   ├── context/
│   │   └── auth-context.tsx  # Authentication state management
│   ├── pages/
│   │   ├── __tests__/        # Page tests
│   │   ├── landing-page.tsx
│   │   ├── dashboard-page.tsx
│   │   ├── multi-account-page.tsx   # NEW: Multi-account management
│   │   ├── cost-breakdown-page.tsx  # NEW: Cost analysis
│   │   ├── security-audit-page.tsx  # NEW: Security audit
│   │   ├── team-management-page.tsx # NEW: Team management
│   │   └── ...
│   ├── App.tsx
│   └── routes.ts             # React Router with lazy loading
├── lib/
│   ├── api/                  # Backend API services
│   │   ├── accounts.ts
│   │   ├── costs.ts
│   │   ├── security.ts
│   │   └── team.ts
│   ├── hooks/                # React Query hooks
│   │   ├── use-accounts.ts
│   │   ├── use-costs.ts
│   │   ├── use-security.ts
│   │   └── use-team.ts
│   ├── supabase.ts           # Supabase client
│   └── notifications.ts      # Toast notifications
├── test/
│   └── test-utils.tsx        # Testing utilities
├── styles/
│   └── index.css
└── main.tsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/consolesensei-cloud.git

# Navigate to project directory
cd consolesensei-cloud

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Authentication

The app includes a complete authentication system with:

- **Login/Register** with form validation
- **Protected routes** for dashboard pages
- **LocalStorage persistence** for session management
- **Logout functionality** from dashboard

> **Note:** This is a frontend demo. In production, integrate with your authentication backend (AWS Cognito, Auth0, etc.)

---

## 🎨 Theming

ConsoleSensei supports **dark and light themes** with:

- CSS custom properties for all colors
- Theme toggle in the dashboard header
- Preference persistence in localStorage
- System preference detection

---

## ♿ Accessibility

Built with accessibility in mind:

- Semantic HTML structure
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatible
- Focus indicators
- Role attributes

---

## 📊 Why This Project?

This project demonstrates:

| Skill | Implementation |
|-------|---------------|
| **Modern React** | Hooks, Context, Suspense, lazy loading |
| **TypeScript** | Strict typing, interfaces, generics |
| **Form Handling** | React Hook Form + Zod validation |
| **Routing** | Protected routes, code splitting |
| **State Management** | Context API, localStorage persistence |
| **UI/UX** | Responsive design, loading states, error handling |
| **Accessibility** | ARIA, semantic HTML, keyboard support |
| **Performance** | Lazy loading, optimized bundle |
| **Code Quality** | Clean architecture, reusable components |

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Recharts](https://recharts.org/) - Composable charting library

---

<div align="center">

**Built with ❤️ for the cloud community**

</div>