'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { PenLine, History, Palette, Search, CalendarDays, BarChart3, Settings, Brush, MoreHorizontal, ChevronUp } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

// 모바일 바텀 네비에 표시될 핵심 5개
const primaryLinks = [
  { href: '/', label: '글생성', icon: PenLine },
  { href: '/keywords', label: '키워드', icon: Search },
  { href: '/history', label: '히스토리', icon: History },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
];

// 더보기 드롭업에 표시될 나머지 메뉴
const secondaryLinks = [
  { href: '/styles', label: '내 스타일', icon: Palette },
  { href: '/custom-styles', label: '커스텀', icon: Brush },
  { href: '/dashboard', label: '대시보드', icon: BarChart3 },
  { href: '/settings', label: '설정', icon: Settings },
];

// 데스크톱 top nav에 표시될 전체 메뉴
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
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* 데스크톱: sticky top nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="mr-4 flex shrink-0 items-center gap-2 font-bold">
            <PenLine className="h-5 w-5" />
            <span className="hidden sm:inline">Blog Auto</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-0.5 overflow-x-auto sm:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent sm:gap-1.5',
                  pathname === href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* 모바일: fixed bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur flex sm:hidden justify-around py-2">
        {primaryLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors',
              pathname === href
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}

        {/* 더보기 버튼 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors',
              secondaryLinks.some(l => l.href === pathname)
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="더보기 메뉴"
            aria-expanded={moreOpen}
          >
            {moreOpen ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            <span>더보기</span>
          </button>

          {/* 드롭업 메뉴 */}
          {moreOpen && (
            <>
              {/* 배경 오버레이 */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMoreOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full right-0 z-50 mb-2 w-40 rounded-lg border bg-background/95 backdrop-blur shadow-lg py-1">
                {secondaryLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                      pathname === href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
