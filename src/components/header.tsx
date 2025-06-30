"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react"; // Import Menu icon and new panel icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components
import { Sidebar } from "@/components/sidebar"; // Import Sidebar
import { useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HeaderProps {
  toggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
}

export function Header({ toggleSidebarCollapse, isSidebarCollapsed }: HeaderProps) {
  const { setTheme } = useTheme();
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out: " + error.message);
    } else {
      toast.success("Logged out successfully!");
      router.push('/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between px-4 border-b">
      <div className="flex items-center gap-2">
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden" // Only show on small screens
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64"> {/* Adjust width as needed */}
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapse}
          className="hidden lg:inline-flex" // Only show on large screens
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <h1 className="text-xl font-semibold ml-2">Productivity Hub</h1> {/* Adjust margin */}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("cozy")}>
              Cozy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}