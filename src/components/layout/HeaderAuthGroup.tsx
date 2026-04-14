'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import LoginButton from '@/components/auth/LoginButton';
import LogoutButton from '@/components/auth/LogoutButton';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

export default function HeaderAuthGroup() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '';

  return (
    <div className="flex items-center gap-4 flex-1 justify-between ml-10">
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-6 font-bold text-sm">
          <Link href="/estimate" className={cn("hover:text-blue-500 transition-colors", pathname.startsWith('/estimate') && !pathname.startsWith('/estimate-map') && "text-blue-600")}>요청 찾기</Link>
          <Link href="/estimate-map" className={cn("hover:text-blue-500 transition-colors", pathname.startsWith('/estimate-map') && "text-blue-600")}>요청찾기2</Link>
          <Link href="/expert-search" className={cn("hover:text-blue-500 transition-colors", pathname === '/expert-search' && "text-blue-600")}>전문가 찾기</Link>
          <Link href="/market" className={cn("hover:text-blue-500 transition-colors", pathname === '/market' && "text-blue-600")}>원픽 마켓</Link>
          
          {((session?.user as any)?.role === 'EXPERT' || (session?.user as any)?.role === 'BOTH') && (
            <>
              <div className="w-px h-3 bg-slate-200 mx-1" />
              
              {/* 전문가홈 - 누구나 접근 가능 (팝업) */}
              <button 
                onClick={() => {
                  const width = 1400;
                  const height = 900;
                  const left = Math.max(0, (window.screen.width / 2) - (width / 2));
                  const top = Math.max(0, (window.screen.height / 2) - (height / 2));
                  const userId = (session?.user as any)?.id || 0;
                  const popup = window.open(
                    `/expert/dashboard?userId=${userId}`, 
                    'ExpertDashboard', 
                    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                  );
                  if (popup) {
                    popup.focus();
                  } else {
                    alert('팝업 차단이 설정되어 있습니다. 브라우저 설정에서 팝업을 허용해주세요.');
                  }
                }}
                className={cn(
                  "hover:text-blue-600 transition-colors font-bold", 
                  pathname.startsWith('/expert') ? "text-blue-600" : "text-slate-500"
                )}
              >
                전문가홈
              </button>
            </>
          )}

          {session?.user && (
            <div className="flex items-center gap-3">
              {((session.user as any)?.role === 'USER' || (session.user as any)?.role === 'BOTH') && (
                <Link 
                  href="/user/my-estimates" 
                  className={cn("hover:text-blue-600 transition-colors", pathname.startsWith('/user') ? "text-blue-600" : "text-slate-500")}
                >
                  마이페이지
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {status === 'loading' ? (
          <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-xl" />
        ) : session?.user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {(() => {
                  const role = (session.user as any).role;
                  const grade = (session.user as any).grade;
                  if (role === 'ADMIN') return '관리자';
                  if (role === 'USER') return '사용자';
                  if (role === 'BOTH') {
                    return grade === 'PRO' ? '통합(전문가)' : grade === 'HELPER' ? '통합(헬퍼)' : '통합(심사중)';
                  }
                  if (role === 'EXPERT') {
                    return grade === 'PRO' ? '전문가' : grade === 'HELPER' ? '헬퍼' : '심사중';
                  }
                  return role;
                })()}
              </span>
              <span className="text-xs font-bold text-slate-700">{session.user.name} 님</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
              <img 
                src={session.user.image || "https://picsum.photos/seed/user/100/100"} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <LogoutButton />
          </div>
        ) : (
          <>
            <Suspense fallback={<div className="text-sm font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all">로그인</div>}>
              <LoginButton />
            </Suspense>
            <Link href="/register">
              <button className="text-sm font-bold px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                회원가입
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
