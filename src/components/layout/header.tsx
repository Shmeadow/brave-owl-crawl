"use client";

import Link from "next/link";
import { MainNavigation } from "@/components/main-navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react"; // Assuming Home icon is used for the logo/brand

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center space-x-2">
          <Home className="h-6 w-6" />
          <span className="font-bold text-lg">Flashcard App</span>
        </Link>
        <MainNavigation />
        {/* You can add user profile/auth buttons here if needed */}
        <div>
          {/* Example: <Button variant="ghost">Sign Out</Button> */}
        </div>
      </div>
    </header>
  );
}