'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    const pathname = window.location.pathname;
    const isPublicExpertPage = pathname === '/expert/dashboard' || pathname === '/expert/support';
    const hasUserId = window.location.search.includes('userId=');
    
    // 공개 페이지(홈, 고객지원)이고 userId가 있으면 해당 페이지 유지, 그 외(본인 전용 메뉴 등)는 '/' 이동
    let callbackUrl = '/';
    if (isPublicExpertPage && hasUserId) {
      callbackUrl = window.location.pathname + window.location.search;
    }
    
    await signOut({ callbackUrl });
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-xs font-black px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-all rounded-xl text-slate-600"
    >
      로그아웃
    </button>
  );
}
