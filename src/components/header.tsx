import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-primary" />
            <span className="text-3xl font-headline font-bold text-primary tracking-wider">NewsFlash</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
