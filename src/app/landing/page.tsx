import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginFeatureSection } from '@/components/login-feature-section';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="container mx-auto py-8 px-4 text-center flex flex-col items-center min-h-screen">
      {/* Welcome to CozyHub section */}
      <div className={cn(
        "bg-background/50 backdrop-blur-xl border border-white/20 rounded-lg p-8 mb-12", // Increased mb for more space
        "w-full max-w-2xl"
      )}>
        <h1 className="text-5xl font-bold text-foreground mb-4">Welcome to CozyHub</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your all-in-one productivity and focus sanctuary.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Explore as Guest</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Note: Guest mode features are saved locally and will not sync across devices.
        </p>
      </div>

      {/* Login Feature Section */}
      <LoginFeatureSection className="w-full max-w-4xl" />
    </div>
  );
}