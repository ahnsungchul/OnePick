'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoginButton() {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  
  // 현재 전체 URL 생성 (쿼리 스트링 포함)
  const currentUrl = searchParams.toString() 
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  return (
    <Link href={`/login?callbackUrl=${encodeURIComponent(currentUrl)}`}>
      <button className="text-sm font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all">
        로그인
      </button>
    </Link>
  );
}
