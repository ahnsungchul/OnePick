'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Zap, Share2, Star, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShareButton from '@/components/expert/ShareButton';
import { getExpertUnreadMessageCountAction } from '@/actions/expert.action';

interface ExpertHeaderContentProps {
  isOwner?: boolean;
}

export default function ExpertHeaderContent({ isOwner = true }: ExpertHeaderContentProps) {
  const { data: session } = useSession();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const user = session?.user as any;
  const grade = user?.grade || 'HELPER';
  const isLoggedIn = !!session?.user;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userIdParam && isOwner) {
      getExpertUnreadMessageCountAction(Number(userIdParam)).then(res => {
        if (res.success && typeof res.data === 'number') setUnreadCount(res.data);
      });
    }

    const handleChatRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    };
    window.addEventListener('expertChatRead', handleChatRead);
    return () => window.removeEventListener('expertChatRead', handleChatRead);
  }, [userIdParam, isOwner]);

  const menuItems = [
    { name: '홈', href: '/expert/dashboard', showAlways: true },
    { name: '통합 갤러리', href: '/expert/gallery', showAlways: false },
    { name: '1:1 견적 요청', href: '/expert/requests', showAlways: false },
    { name: '참여한 견적', href: '/expert/bids', showAlways: false },
    { name: '수익/정산', href: '/expert/earnings', showAlways: false },
    { name: '고객지원', href: '/expert/support', showAlways: true },
  ];

  return (
    <div className="flex items-center justify-between w-full">
      {/* 로고 영역 */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors shrink-0">
          <Zap className="w-8 h-8 fill-current" />
          <span className="text-2xl font-black tracking-tighter">OnePick</span>
        </Link>
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-sm font-base tracking-wider shadow-sm",
          grade === 'PRO' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
        )}>
          {grade === 'PRO' ? '전문가' : '헬퍼'}
        </span>
      </div>

      {/* 메뉴 영역: 본인 전문가홈/방문자 메뉴 차등 노출 */}
      {userIdParam && (
        <nav className="hidden lg:flex items-center gap-8 font-bold text-sm">
          {menuItems.map((item) => (
            (isOwner || item.showAlways) && (
              <Link 
                key={item.href}
                href={`${item.href}?userId=${userIdParam}`} 
                className={cn(
                  "transition-colors",
                  pathname.startsWith(item.href) ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>
      )}

      {/* 우측 기능 (메시지, 공유하기, 즐겨찾기) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isOwner && userIdParam && (
          <Link 
            href={`/expert/bids?userId=${userIdParam}&filter=UNREAD`}
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-500"
            title="신규 메시지"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tracking-tighter text-white shadow-sm border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}
        {userIdParam && <ShareButton />}
        {userIdParam && !isOwner && (
          <button 
            onClick={() => {
              if (!isLoggedIn) {
                alert("로그인이 필요한 서비스입니다.");
                window.location.href = '/login';
                return;
              }
              alert("즐겨찾기 기능은 준비 중입니다.");
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-amber-500"
            title="전문가 즐겨찾기"
          >
            <Star className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
