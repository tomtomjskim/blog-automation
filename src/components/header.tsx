'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, History, Palette, Search, CalendarDays, BarChart3, Settings, Brush } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '글 생성', icon: PenLine },
  { href: '/styles', label: '내 스타일', icon: Palette },
  { href: '/keywords', label: '키워드', icon: Search },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/custom-styles', label: '커스텀', icon: Brush },
  { href: '/history', label: '히스토리', icon: History },
  { href: '/dashboard', label: '대시보드', icon: BarChart3 },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="mr-4 flex shrink-0 items-center gap-2 font-bold">
          <PenLine className="h-5 w-5" />
          <span className="hidden sm:inline">Blog Auto</span>
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent sm:gap-1.5 sm:px-3 sm:text-sm',
                pathname === href ? 'bg-accent font-medium' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
