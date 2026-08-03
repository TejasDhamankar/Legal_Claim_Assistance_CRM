import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND } from '@/lib/brand';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,

  icons: {
    icon: '/lexora-icon.svg',
  },

  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    images: ['/lexora-logo.svg'],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: BRAND.name,
    description: BRAND.description,
    images: ['/lexora-logo.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(jakarta.variable, "font-sans bg-background text-foreground antialiased")}>
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
