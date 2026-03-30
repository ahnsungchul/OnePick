'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    const pathname = window.location.pathname;
    const hasUserId = window.location.search.includes('userId=');
    
    // 전문가홈(서브메뉴 포함)에서 로그아웃 시 루트('/')가 아닌 현재 전문가의 메인 홈(/expert/dashboard)으로 이동
    let callbackUrl = '/';
    if (pathname.startsWith('/expert') && hasUserId) {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');
      callbackUrl = `/expert/dashboard?userId=${userId}`;
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
