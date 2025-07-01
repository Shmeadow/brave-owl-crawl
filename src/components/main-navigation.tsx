"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, BookOpen, Goal, User, Settings } from "lucide-react"; // Removed Timer
import { cn } from "@/lib/utils";
import { useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase

const navItems = [
  { href: "/time-tracker", icon: Clock, label: "Time Tracker" },
  { href: "/flash-cards", icon: BookOpen, label: "Flash Cards" },
  { href: "/goal-focus", icon: Goal, label: "Goal Focus" },
  { href: "/account", icon: User, label: "Account" },
];

export function MainNavigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { session, loading } = useSupabase();
  const isAdmin = session?.user?.user_metadata?.role === 'admin';

  const filteredNavItems = isAdmin
    ? [...navItems, { href: "/admin-settings", icon: Settings, label: "Admin Settings" }]
    : navItems;

  return (
    <nav className="hidden sm:flex items-center justify-center gap-6 text-sm font-medium lg:gap-8">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group flex flex-col items-center p-2 rounded-md transition-colors",
            "text-muted-foreground hover:text-primary hover:bg-accent",
            isActive(item.href) && "text-primary bg-accent"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}