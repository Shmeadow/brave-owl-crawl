import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginFeatureSection } from '@/components/login-feature-section';
import { cn } from '@/lib/utils';
import Image from 'next/image'; // Import Image component

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">
      {/* Animated Background for Hero Section */}
      <div className="absolute inset-0 z-0">
        <video
          src="/animated/ani2.mp4" // Using an animated background
          loop
          muted
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for text readability and visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      </div>

      {/* Hero Section Content */}
      <div className={cn(
        "relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-white w-full", // Increased min-h for more prominent hero
        "bg-transparent"
      )}>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg text-white">
          Welcome to <span className="text-primary-foreground">CozyHub</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl drop-shadow-md text-white/90">
          Your all-in-one productivity and focus sanctuary. Create your ideal workspace,
          track your goals, and collaborate with others.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/20">
            <Link href="/dashboard">Explore as Guest</Link>
          </Button>
        </div>
        <p className="text-sm text-white/80 mt-8 drop-shadow-sm">
          Note: Guest mode features are saved locally and will not sync across devices.
        </p>
      </div>

      {/* Login Feature Section */}
      <div className="relative z-10 w-full bg-transparent py-12 px-4">
        <LoginFeatureSection className="w-full max-w-4xl mx-auto" />
      </div>
    </div>
  );
}