import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginClient from '@/components/loginClient';
import { brandTitle, BRAND } from '@/lib/brand';

export const metadata = {
  title: brandTitle('Sign In'),
  description: `Access your ${BRAND.name} workspace.`,
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <Loader2 className="h-7 w-7 animate-spin text-primary/70" />
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
