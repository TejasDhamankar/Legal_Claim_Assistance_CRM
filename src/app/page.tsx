'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, BarChart3, Users2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-foreground font-sans">
      <main className="flex-1 relative">
        {/* Background Glow Effect Removed */}

        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container relative z-10 mx-auto px-4 text-center">
            
            <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:leading-[1.1] text-gray-900">
              Accelerate your sales pipeline with{' '}
              {/* Gradient updated to your Electric Violet & Emerald theme */}
              <span className="text-gray-900">
                Legal Claim Assistance
              </span>
            </h1>
            
            <p className="mt-8 max-w-2xl mx-auto text-base text-gray-600 md:text-xl leading-relaxed">
              The high-performance platform for tracking, managing, and converting leads. 
              Built for speed, engineered for conversion.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/login">
                {/* Button updated to Violet with a custom glow */}
                <Button size="lg" className="h-14 px-10 bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold rounded-xl transition-all duration-300">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Subtle grid background to add texture */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>
        </section>
      </main>
    </div>
  );
}