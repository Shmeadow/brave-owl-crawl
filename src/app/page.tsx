import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
        Welcome back!
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-prose">
        This is your personalized dashboard. Here you can manage your tasks,
        notes, and more.
      </p>
    </div>
  );
}