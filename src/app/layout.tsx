import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import { auth } from '@/auth';
import Providers from '@/components/providers/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OnePick - 당신의 원픽 전문가 매칭',
  description: '최고의 전문가를 가장 빠르게 픽(Pick)하세요.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-white text-slate-900 min-h-screen flex flex-col`}>
        <Providers session={session}>
          {/* Dynamic Header (Switches Content Based on Path) */}
          <Header />

          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1 w-full bg-slate-50">
            {children}
          </main>

          {/* Dynamic Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
