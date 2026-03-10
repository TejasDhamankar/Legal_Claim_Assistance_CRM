import { Suspense } from 'react';
import { Zap } from 'lucide-react';
import LoginClient from '@/components/loginClient';

export const metadata = { 
  title: 'Sign In | Legal Claim Assistance',
  description: 'Access your high-performance sales dashboard.' 
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      // Updated to Midnight Indigo background
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          {/* Subtle Electric Violet pulse effect */}
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
          <Zap className="h-10 w-10 text-primary animate-pulse fill-primary/20" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
          Initializing Legal Claim Assistance...
        </p>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
