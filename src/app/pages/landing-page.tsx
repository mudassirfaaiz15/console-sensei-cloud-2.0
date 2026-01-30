import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import {
  Cloud,
  ShieldCheck,
  DollarSign,
  Shield,
  Activity,
  Zap,
  ArrowRight,
} from 'lucide-react';

// Features with stable IDs
const FEATURES = [
  {
    id: 'feature-scanner',
    icon: Cloud,
    title: 'AWS Resource Scanner',
    description:
      'Automatically scan and discover all your AWS resources across regions with one click.',
  },
  {
    id: 'feature-cost',
    icon: DollarSign,
    title: 'Cost & Risk Detection',
    description:
      'Identify unused resources, unattached volumes, and potential cost leaks before they happen.',
  },
  {
    id: 'feature-iam',
    icon: Shield,
    title: 'IAM Policy Explainer',
    description:
      'Understand complex IAM policies with plain English explanations and security recommendations.',
  },
  {
    id: 'feature-timeline',
    icon: Activity,
    title: 'Activity Timeline',
    description:
      'Track all CloudTrail events in a clean, searchable interface with real-time updates.',
  },
  {
    id: 'feature-hygiene',
    icon: ShieldCheck,
    title: 'Cloud Hygiene Score',
    description:
      'Get an instant security and efficiency score for your AWS environment with actionable insights.',
  },
  {
    id: 'feature-reminders',
    icon: Zap,
    title: 'Smart Reminders',
    description:
      'Set custom alerts for running instances, cost thresholds, and resource limits.',
  },
];

// Stats with stable IDs
const STATS = [
  { id: 'stat-resources', value: '10K+', label: 'AWS Resources Scanned' },
  { id: 'stat-uptime', value: '99.9%', label: 'Uptime SLA' },
  { id: 'stat-savings', value: '$50K+', label: 'Costs Saved' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="ConsoleSensei Cloud Home"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <Cloud className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-xl font-semibold">ConsoleSensei Cloud</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" aria-label="Sign in to your account">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button aria-label="Create a free account">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="container mx-auto px-6 py-24 md:py-32"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">
              Your Intelligent Co-Pilot for AWS
            </span>
          </div>

          <h1
            id="hero-heading"
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            Monitor AWS Usage, <br />
            Detect Risks, <br />
            Prevent Cost Leaks
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Understand your cloud in one dashboard. Get real-time insights, IAM
            policy explanations, and smart alerts for your AWS infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8" aria-label="Get started with a free account">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/app">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                aria-label="View the demo dashboard"
              >
                View Demo
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free tier available
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section
        className="container mx-auto px-6 py-20 border-t border-border"
        aria-labelledby="features-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage AWS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for cloud engineers, DevOps teams, and developers who want
              to stay in control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="container mx-auto px-6 py-20 border-t border-border"
        aria-labelledby="stats-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="stats-heading" className="sr-only">Our Impact</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-8">
              Trusted by developers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STATS.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="container mx-auto px-6 py-20 border-t border-border"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Take Control of Your AWS?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Start monitoring your cloud infrastructure today. No credit card
            required.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8" aria-label="Get started with your free account">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50" role="contentinfo">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="ConsoleSensei Cloud Home"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Cloud className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="font-semibold">ConsoleSensei Cloud</span>
            </Link>

            <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
                aria-label="Privacy Policy"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
                aria-label="Terms of Service"
              >
                Terms
              </Link>
              <Link
                to="/docs"
                className="hover:text-foreground transition-colors"
                aria-label="Documentation"
              >
                Documentation
              </Link>
              <Link
                to="/support"
                className="hover:text-foreground transition-colors"
                aria-label="Support"
              >
                Support
              </Link>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} ConsoleSensei Cloud. We never ask for your AWS password.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
