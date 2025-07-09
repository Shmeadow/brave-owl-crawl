import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold text-foreground mb-4">Welcome to CozyHub</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Your all-in-one productivity and focus sanctuary.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
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
  );
}