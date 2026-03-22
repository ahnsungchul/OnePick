'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    // 로그아웃 후 메인 화면('/')으로 이동하도록 설정합니다.
    await signOut({ callbackUrl: '/' });
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
