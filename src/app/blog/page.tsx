import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BlogPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="text-muted-foreground mt-4">Content coming soon...</p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}