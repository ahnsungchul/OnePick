import React from 'react';
import Link from 'next/link';
import { User, Briefcase, Users, Zap, ArrowRight } from 'lucide-react';

export default function RegisterSelectionPage() {
  return (
    <div className="bg-slate-50 flex flex-col pt-20">
      <div className="max-w-4xl mx-auto px-4 w-full">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-500 mb-8 justify-center">
            <Zap className="w-10 h-10 fill-current" />
            <span className="text-3xl font-black tracking-tighter text-slate-900">OnePick</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            어떤 회원으로 가입하시겠어요?
          </h1>
          <p className="text-slate-500 text-lg">
            원픽에서 원하시는 서비스 형태를 선택해주세요.
          </p>
        </div>

        {/* 선택 카드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. 사용자 (고객) */}
          <Link href="/register/auth?role=user" className="group flex flex-col bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden text-center cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="w-20 h-20 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">사용자</h3>
            <p className="text-slate-500 mb-8 flex-1">
              청소, 이사, 레슨 등 맞춤 전문가의 도움이 필요하신가요?
            </p>
            <div className="flex items-center justify-center text-blue-600 font-bold gap-2 group-hover:gap-4 transition-all">
              고객으로 가입하기 <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

          {/* 2. 전문가 (고수) */}
          <Link href="/register/auth?role=expert" className="group flex flex-col bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden text-center cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="w-20 h-20 mx-auto bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">전문가</h3>
            <p className="text-slate-500 mb-8 flex-1">
              나만의 전문 기술과 서비스로 새로운 고객을 만나고 싶으신가요?
            </p>
            <div className="flex items-center justify-center text-indigo-600 font-bold gap-2 group-hover:gap-4 transition-all">
              전문가로 가입하기 <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

          {/* 3. 통합 (사용자+전문가) */}
          <Link href="/register/auth?role=both" className="group flex flex-col bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden text-center cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="w-20 h-20 mx-auto bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">통합<br/>(사용자 및 전문가)</h3>
            <p className="text-slate-500 mb-8 flex-1">
              서비스를 이용하기도 하고, 나의 전문성도 함께 판매하고 싶으신가요?
            </p>
            <div className="flex items-center justify-center text-teal-600 font-bold gap-2 group-hover:gap-4 transition-all">
              통합 회원으로 가입하기 <ArrowRight className="w-5 h-5" />
            </div>
          </Link>

        </div>

        <div className="text-center mt-12 mb-20">
          <p className="text-slate-500 text-sm">
            이미 계정이 있으신가요? <Link href="/login" className="text-blue-600 font-bold hover:underline">로그인하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
