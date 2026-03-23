'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    // 전문가홈 하위 메뉴에서 로그아웃 시 전문가홈 메인('/expert')으로 이동, 그 외는 '/' 이동
    const isExpertPage = window.location.pathname.startsWith('/expert');
    await signOut({ callbackUrl: isExpertPage ? '/expert' : '/' });
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
