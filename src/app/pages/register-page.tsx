import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Cloud, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { registerSchema, type RegisterFormData } from '@/types';

const BENEFITS = [
  { id: 'benefit-scans', text: 'Unlimited AWS resource scans' },
  { id: 'benefit-cost', text: 'Real-time cost monitoring' },
  { id: 'benefit-iam', text: 'IAM policy analysis' },
  { id: 'benefit-timeline', text: 'Activity timeline tracking' },
  { id: 'benefit-alerts', text: 'Smart alerts and reminders' },
  { id: 'benefit-score', text: 'Cloud hygiene scoring' },
  { id: 'benefit-api', text: 'API access' },
  { id: 'benefit-support', text: '24/7 email support' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser(data);
      navigate('/app', { replace: true });
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-8"
          aria-label="Go to ConsoleSensei homepage"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <Cloud className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold">ConsoleSensei</span>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Register Card */}
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Start monitoring your AWS infrastructure
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="bg-input"
                    aria-label="Full name"
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="bg-input"
                    aria-label="Email address"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-input"
                    aria-label="Password"
                    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                    {...register('password')}
                  />
                  <p id="password-hint" className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                  {errors.password && (
                    <p id="password-error" className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-input"
                    aria-label="Confirm password"
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p id="confirm-password-error" className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    We never ask for your AWS password
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  aria-label="Create your account"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Sign up with Google"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Sign up with GitHub"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:underline"
                  aria-label="Sign in to existing account"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Benefits */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">What's Included</h3>
              <div className="space-y-3">
                {BENEFITS.map((benefit) => (
                  <div key={benefit.id} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h4 className="font-semibold mb-2">Security First</h4>
                  <p className="text-sm text-muted-foreground">
                    We use read-only IAM credentials and never store your AWS
                    passwords. Your data is encrypted at rest and in transit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
