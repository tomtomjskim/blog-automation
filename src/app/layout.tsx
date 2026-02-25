import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blog Auto - AI 블로그 글 생성기',
  description: 'Claude AI로 네이버 블로그 글을 자동 생성합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
