'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  LayoutGrid, 
  ClipboardList, 
  Send, 
  CreditCard, 
  Headset,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpertSidebarProps {
  grade: 'PRO' | 'HELPER';
  isApproved: boolean;
}

export default function ExpertSidebar({ grade, isApproved }: ExpertSidebarProps) {
  const pathname = usePathname();
  
  const menuItems = [
    { name: '홈', href: '/expert/dashboard', icon: Home, requiresApproval: false },
    { name: '통합 갤러리', href: '/expert/gallery', icon: LayoutGrid, requiresApproval: true },
    { name: '받은 요청', href: '/expert/requests', icon: ClipboardList, requiresApproval: true },
    { name: '보낸 견적', href: '/expert/bids', icon: Send, requiresApproval: true },
    { name: '수익/정산', href: '/expert/earnings', icon: CreditCard, requiresApproval: true },
    { name: '고객지원', href: '/expert/support', icon: Headset, requiresApproval: false },
  ];

  const homeTitle = grade === 'PRO' ? '전문가홈' : '헬퍼홈';

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-800">{homeTitle}</h2>
        <div className="mt-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-md font-bold uppercase",
            grade === 'PRO' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
          )}>
            {grade === 'PRO' ? 'PRO 전문가' : '헬퍼'}
          </span>
          {!isApproved && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">
              승인 대기중
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isDisabled = item.requiresApproval && !isApproved;
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <div key={item.name} className="relative group">
              {isDisabled ? (
                <div className="flex items-center justify-between px-3 py-3 text-slate-400 cursor-not-allowed rounded-xl">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{item.name}</span>
                  </div>
                  <Lock className="w-4 h-4 opacity-60" />
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-blue-50 text-blue-600 shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-500"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} />
                  <span className="font-semibold text-sm">{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {!isApproved 
              ? "관리자의 승인 후에 모든 기능을 이용하실 수 있습니다. 서류 검토는 평균 1~3일이 소요됩니다."
              : "성실하게 견적에 참여하여 신뢰를 쌓고 더 많은 고객을 만나보세요!"}
          </p>
        </div>
      </div>
    </div>
  );
}
