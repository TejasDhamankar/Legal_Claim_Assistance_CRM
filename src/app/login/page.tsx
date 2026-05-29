import { Suspense } from 'react';
import { Zap } from 'lucide-react';
import LoginClient from '@/components/loginClient';

export const metadata = { 
  title: 'Sign In | Legal CRM',
  description: 'Access your legal CRM dashboard.'
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      // Updated to Midnight Indigo background
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          {/* Subtle Electric Violet pulse effect */}
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-[#8b5cf6]/20" />
          <Zap className="h-10 w-10 text-[#8b5cf6] animate-pulse fill-[#8b5cf6]/20" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
          Initializing Legal CRM...
        </p>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
