'use client';

import React from 'react';
import { Zap, Share2, Globe, Smartphone, Play } from 'lucide-react';

export default function MainFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-1 text-white mb-6">
              <Zap className="w-6 h-6 fill-current" />
              <span className="text-xl font-black tracking-tighter">OnePick</span>
            </div>
            <p className="text-sm leading-relaxed mb-8">
              원픽은 당신의 일상을 더 편리하게 만드는 전문가 연결 플랫폼입니다. 집수리부터 레슨, 비즈니스까지 모든 서비스를 만나보세요.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-500 transition-colors">
                <Share2 className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-500 transition-colors">
                <Globe className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h6 className="text-white font-bold mb-6">서비스 이용 가이드</h6>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">이용 안내</a></li>
              <li><a href="#" className="hover:text-white transition-colors">고객 센터</a></li>
              <li><a href="#" className="hover:text-white transition-colors">전문가 가입</a></li>
              <li><a href="#" className="hover:text-white transition-colors">안심 결제 서비스</a></li>
            </ul>
          </div>

          <div>
            <h6 className="text-white font-bold mb-6">비즈니스 정보</h6>
            <ul className="space-y-4 text-sm font-medium">
              <li>(주)브레이브모바일</li>
              <li>대표: 홍길동</li>
              <li>사업자등록번호: 123-45-67890</li>
              <li>통신판매업신고: 제2023-서울강남-1234호</li>
            </ul>
          </div>

          <div>
            <h6 className="text-white font-bold mb-6">앱 다운로드</h6>
            <div className="flex flex-col gap-3">
              <button className="bg-slate-800 px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-700 transition-all text-white">
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-[10px] opacity-60 font-bold uppercase">Download on the</p>
                  <p className="font-bold">App Store</p>
                </div>
              </button>
              <button className="bg-slate-800 px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-700 transition-all text-white">
                <Play className="w-6 h-6 fill-current" />
                <div className="text-left">
                  <p className="text-[10px] opacity-60 font-bold uppercase">Get it on</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs font-bold">
          <p>© 2023 OnePick Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="text-white hover:underline transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">위치기반서비스 이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
