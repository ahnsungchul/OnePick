'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Zap, ShieldCheck, Mail, MessageCircle } from 'lucide-react';

import { signIn } from 'next-auth/react';

export default function SNSAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role'); // user, expert, both

  const getRoleText = () => {
    switch (role) {
      case 'expert': return '전문가 (고수)';
      case 'both': return '통합 (사용자 및 전문가)';
      case 'user':
      default: return '사용자';
    }
  };

  const handleSNSLogin = async (provider: string) => {
    // 로컬 시뮬레이션을 위한 가짜 계정 정보 생성
    const fakeEmail = `${provider}_user_${Math.floor(Math.random() * 10000)}@test.com`;
    const fakeName = fakeEmail.split('@')[0];
    
    // 즉시 로그인을 시도하지 않고, 정보를 들고 약관 동의 페이지로 이동
    // (동의 완료 후 마지막에 유저를 생성하고 로그인 시킴)
    router.push(`/register/terms?role=${role || 'user'}&email=${fakeEmail}&name=${fakeName}`);
  };

  return (
    <div className="bg-slate-50 flex flex-col pt-12 md:pt-20 pb-20">
      <div className="max-w-md mx-auto px-4 w-full">
        
        {/* 상단 로고 & 타이틀 */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-500 mb-6 justify-center">
            <Zap className="w-8 h-8 fill-current" />
            <span className="text-2xl font-black tracking-tighter text-slate-900">OnePick</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
            간편하게 시작하기
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            <span className="font-bold text-blue-600">{getRoleText()}</span> 회원으로 가입합니다.<br/>
            안전한 원픽 서비스 이용을 위해 본인인증을 진행해주세요.
          </p>
        </div>

        {/* 본인인증 & SNS 로그인 카드 */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          
          <div className="flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-500 rounded-full mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-bold text-center text-slate-900 mb-8">
            SNS 간편 인증
          </h2>

          <div className="space-y-4">
            
            {/* 카카오 간편 가입 */}
            <button 
              type="button"
              onClick={() => handleSNSLogin('kakao')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-bold py-4 px-6 rounded-2xl transition-colors"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              카카오로 3초만에 시작하기
            </button>
            
            {/* 네이버 간편 가입 */}
            <button 
              type="button"
              onClick={() => handleSNSLogin('naver')}
              className="w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:bg-[#02b350] text-white font-bold py-4 px-6 rounded-2xl transition-colors"
            >
              <span className="font-black text-lg leading-none">N</span>
              네이버로 계속하기
            </button>

            {/* 구글 간편 가입 */}
            <button 
              type="button"
              onClick={() => handleSNSLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-colors"
            >
              <Mail className="w-5 h-5 text-red-500" />
              구글 계정으로 인증
            </button>
            
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 leading-relaxed">
              가입을 진행하시면 원픽의 <Link href="/terms" className="underline hover:text-slate-600">이용약관</Link> 및 <br className="hidden sm:block"/>
              <Link href="/privacy" className="underline hover:text-slate-600">개인정보 수집 및 이용</Link>에 동의하게 됩니다.
            </p>
          </div>
        </div>

        {/* 뒤로가기 / 기타 링크 */}
        <div className="text-center mt-8">
          <Link href="/register" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            이전 화면으로 돌아가기
          </Link>
        </div>

      </div>
    </div>
  );
}
