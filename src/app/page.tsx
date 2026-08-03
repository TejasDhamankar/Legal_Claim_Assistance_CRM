'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1000px 500px at 50% -10%, oklch(0.93 0.02 240 / 70%), transparent 55%), oklch(0.975 0.006 240)',
        }}
      />

      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Image src="/lexora-logo.svg" alt={BRAND.name} width={140} height={40} className="h-8 w-auto" priority />
        <Link href="/login">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground mb-4">
          {BRAND.tagline}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.1]">
          Pipeline control for modern claims teams
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg leading-relaxed">
          {BRAND.description}
        </p>
        <div className="mt-10">
          <Link href="/login">
            <Button size="lg" className="h-11 px-7 gap-2 shadow-sm">
              Open workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
