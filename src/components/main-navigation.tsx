"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, Settings } from "lucide-react"; // Removed Home icon

const navItems = [
  { href: "/dashboard", title: "Dashboard", icon: LayoutDashboard },
  { href: "/flashcards", title: "Flashcards", icon: BookOpen },
  { href: "/settings", title: "Settings", icon: Settings },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center", // Added flex items-center for icon alignment
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4 mr-1" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}