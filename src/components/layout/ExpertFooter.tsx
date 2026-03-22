'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function ExpertFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
            <Zap className="w-6 h-6 fill-current" />
            <span className="text-xl font-black tracking-tighter text-slate-900">OnePick</span>
          </Link>
          <p className="text-xs font-bold text-slate-400">
            © 2023 OnePick Inc. 전문가/헬퍼 전용 대시보드
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-slate-500">
          <a href="#" className="hover:text-blue-600 transition-colors">서비스 이용약관</a>
          <a href="#" className="text-slate-900 hover:underline transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-blue-600 transition-colors">전문가 운영정책</a>
          <a href="#" className="hover:text-blue-600 transition-colors">고객센터</a>
        </div>
      </div>
    </footer>
  );
}
