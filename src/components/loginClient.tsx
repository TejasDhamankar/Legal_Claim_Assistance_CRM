'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  User,
  Lock,
  AlertCircle,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

function FieldShell({
  icon: Icon,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group flex h-12 items-stretch overflow-hidden rounded-md border border-border/90 bg-background transition-colors',
        'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10',
        className
      )}
    >
      <div className="flex w-12 shrink-0 items-center justify-center border-r border-border/80 bg-muted/50 text-muted-foreground group-focus-within:text-foreground/70">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';

  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login(email, password);
      window.location.href = redirectTo;
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(900px 480px at 50% -8%, oklch(0.93 0.02 240 / 70%), transparent 58%), radial-gradient(700px 360px at 100% 100%, oklch(0.94 0.015 85 / 35%), transparent 50%), oklch(0.965 0.008 240)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(0.3 0.02 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.3 0.02 250) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="rounded-xl border border-border/80 bg-card px-8 py-10 sm:px-10 sm:py-12 shadow-[0_1px_0_oklch(0.3_0.02_250/4%),0_12px_40px_-16px_oklch(0.25_0.03_250/18%)]">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="mb-9 flex flex-col items-center gap-3"
          >
            <Image
              src="/lexora-logo.svg"
              alt={BRAND.name}
              width={200}
              height={54}
              className="h-12 w-auto"
              priority
            />
            <p className="text-xs text-muted-foreground tracking-wide">
              {BRAND.tagline}
            </p>
          </motion.div>

          {searchParams.get('from') && (
            <Alert className="mb-5 bg-primary/5 border-primary/15 py-2.5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs text-foreground/80">
                Sign in to continue to that page.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {(loginError || error) && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {loginError || error}
                </AlertDescription>
              </Alert>
            )}

            <FieldShell icon={User}>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-full border-0 bg-transparent shadow-none rounded-none focus-visible:ring-0 px-3.5 text-[14px] placeholder:text-muted-foreground/70"
                required
              />
            </FieldShell>

            <FieldShell icon={Lock}>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-full border-0 bg-transparent shadow-none rounded-none focus-visible:ring-0 px-3.5 text-[14px] placeholder:text-muted-foreground/70"
                required
              />
            </FieldShell>

            <div className="pt-3 flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="h-11 min-w-[140px] px-8 text-[14px] font-medium tracking-wide shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </motion.div>
    </div>
  );
}
