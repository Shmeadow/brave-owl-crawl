"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Linkedin, X } from 'lucide-react';
import { PricingContent } from '@/components/pricing-content';
import { useSupabase } from '@/integrations/supabase/auth';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { session } = useSupabase();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground relative">
      <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="absolute top-4 right-4 z-10">
        <X className="h-6 w-6" />
        <span className="sr-only">Close</span>
      </Button>
      <header className="container mx-auto py-4 flex justify-between items-center border-b">
        <Link href="/" className="text-xl font-bold">
          Productivity Hub
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">Blog</Link>
          <Link href="/pricing" className="text-sm font-medium text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button onClick={handleGetStarted} variant="default">Get Started</Button>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Build your cozy workspace for less than a coffee.
          </h1>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="icon"><Twitter className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Facebook className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Linkedin className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <PricingContent onUpgrade={() => { /* Handle upgrade click */ }} />
      </main>

      <footer className="container mx-auto py-6 text-center text-muted-foreground text-sm border-t mt-12">
        <div className="flex justify-center gap-4 mb-4">
            <p>Join our community on <Link href="#" className="font-medium hover:underline">Discord</Link>.</p>
            <p>Creators, <Link href="#" className="font-medium hover:underline">upload your work</Link>.</p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="#" className="hover:underline">Terms of Service</Link>
          <Link href="#" className="hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}