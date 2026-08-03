'use client';

import { ReactNode, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children, hideSidebar }: { children: ReactNode, hideSidebar?: boolean }) {
  const { user, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && authChecked && !user) {
      const target = `/login?from=${encodeURIComponent(pathname)}`;
      router.replace(target);
    }
  }, [authLoading, authChecked, user, pathname, router]);

  if (authLoading || (authChecked && !user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        <p className="mt-4 text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {!hideSidebar && <AppSidebar />}

        <SidebarInset className="flex flex-col bg-transparent overflow-x-hidden">
          <SiteHeader />

          <main className="flex flex-1 flex-col w-full min-w-0 h-full overflow-y-auto overflow-x-hidden">
            <div className="p-5 md:p-8 lg:p-10 w-full max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
