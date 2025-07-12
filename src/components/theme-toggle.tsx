"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// We will create a simple Button and DropdownMenu using basic HTML and Tailwind/DaisyUI classes
// as the Shadcn/UI components are being replaced.

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </label>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
        <li><a onClick={() => setTheme("light")}>Light</a></li>
        <li><a onClick={() => setTheme("dark")}>Dark</a></li>
        <li><a onClick={() => setTheme("system")}>System</a></li>
        <li><a onClick={() => setTheme("cupcake")}>Cupcake</a></li>
        <li><a onClick={() => setTheme("dracula")}>Dracula</a></li>
      </ul>
    </div>
  );
}