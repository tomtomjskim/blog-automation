'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, History } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '글 생성', icon: PenLine },
  { href: '/history', label: '히스토리', icon: History },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold">
          <PenLine className="h-5 w-5" />
          <span>Blog Auto</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                pathname === href ? 'bg-accent font-medium' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
