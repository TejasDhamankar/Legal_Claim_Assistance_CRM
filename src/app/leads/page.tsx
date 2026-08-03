import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ClientLeads from '@/components/clientLeads';
import { brandTitle } from '@/lib/brand';

export const metadata = {
  title: brandTitle('Leads'),
  description: 'View and manage your leads.',
};

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <Loader2 className="h-7 w-7 animate-spin text-primary/70" />
          <p className="mt-4 text-sm text-muted-foreground">Loading leads…</p>
        </div>
      }
    >
      <ClientLeads />
    </Suspense>
  );
}
