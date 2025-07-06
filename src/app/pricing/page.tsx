"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Linkedin, ChevronDown } from 'lucide-react';
import { PricingContent } from '@/components/pricing-content';
import { useSupabase } from '@/integrations/supabase/auth';
import { useRouter } from 'next/navigation';

const UpgradeBox = ({ onUpgrade }: { onUpgrade: (cycle?: any) => void }) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div className="relative mx-auto mt-16">
      <Button onClick={() => setIsHover(!isHover)}>Upgrade</Button>
      {isHover && (
        <div className="absolute w-[350px] bg-white border rounded-lg shadow-md top-14">
          <div className="p-4 text-center">
            <h3 className="text-xl mb-4">Upgrade your experience!</h3>
            <div className="flex justify-center gap-2 mb-2">
              <Button onClick={() => onUpgrade('weekly')}>Weekly</Button>
              <Button onClick={() => onUpgrade('monthly')}>Monthly</Button>
              <Button onClick={() => onUpgrade('annually')}>Annually</Button>
            </div>
            <Button onClick={() => { setIsHover(false); onUpgrade(); }}>Choose Plan</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PricingPage() {
  const { session } = useSupabase();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) router.push('/dashboard');
    else router.push('/login');
  };

  const handleUpgrade = (cycle?: any) => {
    console.log(`Upgrade: ${cycle ? cycle : 'Unknown Cycle'}`);
    handleGetStarted();
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900">
      <header className="py-4 flex justify-between border-b">
        <Link href="/" className="text-xl font-bold">MyApp</Link>
        <nav>
          <Link href="/pricing" className="ml-6 text-sm font-medium">Pricing</Link>
        </nav>
      </header>

      <main className="py-12 px-4 max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Pricing Plans</h1>
          <p className="text-lg mt-2">Find the best plan for your productivity journey</p>
        </div>

        <PricingContent onUpgrade={handleUpgrade} />
        <UpgradeBox onUpgrade={handleUpgrade} />
      </main>

      <footer className="py-6 border-t">
        <p className="text-center text-gray-600">Copyright (C) 2024 My Productivity Hub</p>
      </footer>
    </div>
  );
}