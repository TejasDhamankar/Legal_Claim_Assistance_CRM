import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Legal CRM',
  description:
    'Enterprise-grade CRM for legal teams, consultants, and claim management companies.',

  icons: {
    icon: '/legal-crm-icon.svg',
  },

  openGraph: {
    title: 'Legal CRM',
    description:
      'Enterprise-grade CRM for legal teams, consultants, and claim management companies.',
    images: ['/logo.png'],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Legal CRM',
    description:
      'Enterprise-grade CRM for legal teams, consultants, and claim management companies.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We keep the "dark" class here so your midnight indigo theme 
    // is active on the Landing and Login pages too.
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-background text-foreground antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
