'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Zap, ArrowRight, UserCheck, Briefcase } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function RegisterCompletePage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const { data: session } = useSession();

  const getRoleContent = () => {
    switch (role) {
      case 'expert':
        return {
          title: '전문가 가입이 완료되었습니다!',
          desc: '작성해주신 프로필과 서류는 검토 후 영업일 기준 1~2일 내에 전문가님께 안내해 드립니다.',
          icon: <Briefcase className="w-12 h-12" />,
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-100',
          nextText: '전문가 센터 이동',
          nextLink: '/'
        };
      case 'both':
        return {
          title: '통합 회원 가입이 완료되었습니다!',
          desc: '도움이 필요할 땐 사용자로, 전문 지식을 제공할 땐 프로필을 전환해 고수님으로 활동해 보세요.',
          icon: <UserCheck className="w-12 h-12" />,
          bgColor: 'bg-teal-50',
          textColor: 'text-teal-600',
          borderColor: 'border-teal-100',
          nextText: '원픽 시작하기',
          nextLink: '/'
        };
      case 'user':
      default:
        return {
          title: '회원 가입이 완료되었습니다!',
          desc: '지금 바로 원픽에서 뛰어난 실력을 갖춘 맞춤 전문가들을 만나보세요.',
          icon: <CheckCircle2 className="w-12 h-12" />,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-100',
          nextText: '전문가 찾아보기',
          nextLink: '/'
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16 md:pt-24 pb-20 items-center">
      <div className="max-w-md w-full px-4 text-center">
        
        {/* 상단 로고 */}
        <Link href="/" className="inline-flex items-center gap-1 text-blue-500 mb-10 justify-center">
          <Zap className="w-8 h-8 fill-current" />
          <span className="text-2xl font-black tracking-tighter text-slate-900">OnePick</span>
        </Link>
        
        {/* 성공 메시지 컨테이너 */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          
          <div className={`w-24 h-24 mx-auto ${content.bgColor} ${content.textColor} rounded-full flex items-center justify-center mb-6`}>
            {content.icon}
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-4 whitespace-pre-line">
            {session?.user?.name ? `${session.user.name}님,` : ''} {content.title}
          </h1>
          
          <div className={`p-4 rounded-xl ${content.bgColor} ${content.borderColor} border mb-8`}>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              {content.desc}
            </p>
          </div>

          <div className="space-y-3">
            {role === 'user' || !role ? (
              <div className="flex items-center justify-center gap-6 pt-2">
                <Link
                  href="/"
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  홈으로
                </Link>
                <Link
                  href={content.nextLink}
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  전문가찾기
                </Link>
                <Link
                  href="/estimate"
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  요청찾기
                </Link>
              </div>
            ) : (
              <Link 
                href={content.nextLink}
                className={`w-full flex items-center justify-center gap-2 ${content.textColor} ${content.bgColor} border ${content.borderColor} font-bold py-4 px-6 rounded-2xl hover:opacity-80 transition-opacity`}
              >
                {content.nextText} <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            
            {(role === 'expert' || role === 'both') && (
              <p className="text-xs text-slate-400 mt-4 text-center">
                ※ 제출 서류 심사 상황은 카카오톡 알림톡으로 발송해 드립니다.
              </p>
            )}
          </div>

        </div>
        
      </div>
    </div>
  );
}
