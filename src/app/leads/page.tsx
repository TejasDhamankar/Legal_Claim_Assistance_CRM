import { Suspense } from 'react';
import { Zap } from 'lucide-react';
import ClientLeads from '@/components/clientLeads';

export const metadata = {
  title: 'Leads | Legal Claim Assistance',
  description: 'View and manage your leads.',
};

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
            <Zap className="h-10 w-10 text-primary animate-pulse fill-primary/20" />
          </div>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Loading Leads...
          </p>
        </div>
      }
    >
      <ClientLeads />
    </Suspense>
  );
}