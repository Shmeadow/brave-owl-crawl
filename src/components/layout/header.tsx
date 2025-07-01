"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Settings } from "lucide-react";
import { Clock } from "@/components/clock";
import { SunProgress } from "@/components/sun-progress";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Home className="h-6 w-6" />
            <span className="font-bold">App Name</span>
          </Link>
          {/* Other nav links */}
        </nav>
        <div className="flex items-center space-x-4">
          <SunProgress />
          <Clock />
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}