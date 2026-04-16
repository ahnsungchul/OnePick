'use client';

import React, { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import HeaderAuthGroup from './HeaderAuthGroup';
import ExpertHeaderContent from './ExpertHeaderContent';
import Link from 'next/link';
import { Zap } from 'lucide-react';

function HeaderContent() {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isExpertPath = pathname.startsWith('/expert') && !pathname.startsWith('/expert-search');
  const paramUserId = searchParams.get('userId');

  let isOwner = true;
  if (paramUserId) {
    isOwner = session?.user?.id === paramUserId;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
        {isExpertPath ? (
          <ExpertHeaderContent isOwner={isOwner} />
        ) : (
          <>
            <Link href="/" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors shrink-0">
              <Zap className="w-10 h-10 fill-current" />
              <span className="text-2xl font-black tracking-tighter">OnePick</span>
            </Link>
            <HeaderAuthGroup />
          </>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-slate-100" />}>
      <HeaderContent />
    </Suspense>
  );
}
