'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  ClipboardList, 
  CreditCard, 
  Headset,
  UserCircle
} from 'lucide-react';

interface UserMyPageLayoutProps {
  children: React.ReactNode;
}

export default function UserMyPageLayout({ children }: UserMyPageLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    { name: '홈', href: '/user/my-estimates', icon: BarChart3 },
    { name: '내요청', href: '/user/my-requests', icon: ClipboardList },
    { name: '1:1요청', href: '/user/my-direct-requests', icon: UserCircle },
    { name: '결제내역', href: '/user/payments', icon: CreditCard },
    { name: '고객지원', href: '/user/support', icon: Headset },
  ];

  return (
    <div className="bg-slate-50">
      {/* My Page Header & Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="pt-8 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
          </div>
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-all",
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
