'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Zap, Share2, Star, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShareButton from '@/components/expert/ShareButton';
import { getExpertUnreadMessageCountAction } from '@/actions/expert.action';
import { checkIsFavoriteExpertAction, toggleFavoriteExpertAction } from '@/actions/favoriteExpert.action';
import LoginModal from '@/components/auth/LoginModal';

interface ExpertHeaderContentProps {
  isOwner?: boolean;
}

export default function ExpertHeaderContent({ isOwner = true }: ExpertHeaderContentProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const user = session?.user as any;
  const grade = user?.grade || 'HELPER';
  const isLoggedIn = !!session?.user;

  // 메인 창에서 로그아웃 시 팝업(본 창)도 새로고침하여 리다이렉트되도록 하되, 무한루프 방지
  useEffect(() => {
    if (status === 'unauthenticated') {
      const isReloaded = sessionStorage.getItem('loggedOutReloaded');
      if (!isReloaded) {
        sessionStorage.setItem('loggedOutReloaded', 'true');
        if (pathname !== '/expert/dashboard') {
          window.location.href = `/expert/dashboard${userIdParam ? `?userId=${userIdParam}` : ''}`;
        } else {
          window.location.reload();
        }
      }
    } else if (status === 'authenticated') {
      sessionStorage.removeItem('loggedOutReloaded');
    }
  }, [status, pathname, userIdParam]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  useEffect(() => {
    if (userIdParam && isOwner) {
      getExpertUnreadMessageCountAction(Number(userIdParam)).then(res => {
        if (res.success && typeof res.data === 'number') setUnreadCount(res.data);
      });
    }

    if (userIdParam && isLoggedIn) {
      checkIsFavoriteExpertAction(Number(userIdParam)).then(res => {
        if (res.success) {
          setIsFavorited(res.isFavorited);
        }
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
    { name: '블로그', href: '/expert/portfolio', showAlways: true },
    { name: '통합스케줄', href: '/expert/gallery', showAlways: false },
    { name: '우리동네요청', href: '/expert/local-requests', showAlways: false },
    { name: '받은요청', href: '/expert/requests', showAlways: false },
    { name: '참여한견적', href: '/expert/bids', showAlways: false },
    { name: '구독관리', href: '/expert/subscription', showAlways: false },
    { name: '고객지원', href: '/expert/support', showAlways: false },
  ];

  return (
    <div className="flex items-center justify-between w-full">
      {/* 로고 영역 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-blue-500 shrink-0 select-none cursor-default pointer-events-none">
          <Zap className="w-8 h-8 fill-current" />
          <span className="text-2xl font-black tracking-tighter">OnePick</span>
        </div>
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
        {/* 1. 공유하기 */}
        {userIdParam && <ShareButton />}
        
        {/* 2. 즐겨찾기 (로그인 유저에게만 노출) */}
        {userIdParam && isLoggedIn && (
          <button 
            disabled={isToggleLoading}
            onClick={async () => {
              if (!isLoggedIn) {
                alert("로그인이 필요한 서비스입니다.");
                setIsLoginModalOpen(true);
                return;
              }
              if (Number(session?.user?.id) === Number(userIdParam)) {
                alert("본인은 즐겨찾기에 등록할 수 없습니다.");
                return;
              }
              setIsToggleLoading(true);
              const res = await toggleFavoriteExpertAction(Number(userIdParam));
              if (res.success && typeof res.isFavorited === 'boolean') {
                setIsFavorited(res.isFavorited);
              } else {
                alert(res.error || "처리 중 오류가 발생했습니다.");
              }
              setIsToggleLoading(false);
            }}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50",
              isFavorited ? "text-amber-500 bg-amber-50" : "text-slate-500"
            )}
            title="전문가 즐겨찾기"
          >
            <Star className={cn("w-5 h-5", isFavorited && "fill-current text-amber-500")} />
          </button>
        )}

        {/* 3. 로그인 (비로그인 시에만 노출) */}
        {!isLoggedIn && (
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="text-sm font-bold px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all shrink-0 active:scale-95"
          >
            로그인
          </button>
        )}
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        redirectUrl={`${pathname}${userIdParam ? `?userId=${userIdParam}` : ''}`}
      />
    </div>
  );
}
