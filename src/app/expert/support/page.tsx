'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Megaphone, HelpCircle, MessageCircle, AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';
import NoticeTab from '@/components/support/NoticeTab';
import FaqTab from '@/components/support/FaqTab';
import InquiryTab from '@/components/support/InquiryTab';
import ReportTab from '@/components/support/ReportTab';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';

function SupportContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const userIdParam = searchParams.get('userId');
  const [activeTab, setActiveTab] = useState(tabParam || 'notice');

  const isOwner = !userIdParam || (session?.user?.id && Number(session.user.id) === Number(userIdParam));

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (status !== 'loading' && !isOwner && ['inquiry', 'report'].includes(activeTab)) {
      setActiveTab('notice');
    }
  }, [isOwner, activeTab, status]);

  const tabs = [
    { id: 'notice', label: '공지사항', icon: Megaphone },
    { id: 'faq', label: '자주 묻는 질문', icon: HelpCircle },
    ...(isOwner ? [
      { id: 'inquiry', label: '1:1 문의', icon: MessageCircle },
      { id: 'report', label: '신고센터', icon: AlertTriangle },
    ] : []),
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">고객지원</h2>
        <p className="text-slate-500 mt-2 font-medium">궁금하신 점이나 도움이 필요하시면 언제든 문의해 주세요.</p>
      </div>

      {/* Custom Tab Bar */}
      <div className="bg-slate-50 p-2 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex-1 justify-center ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-[400px]">
        {activeTab === 'notice' && <NoticeTab />}
        {activeTab === 'faq' && <FaqTab isExpert={true} />}
        {isOwner && activeTab === 'inquiry' && <InquiryTab userId={session?.user?.id} isExpert={true} />}
        {isOwner && activeTab === 'report' && <ReportTab userId={session?.user?.id} />}
      </div>

      {/* Persistent Info Cards */}
      <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
        <div className="p-6 rounded-[28px] bg-blue-50/50 border border-blue-100/50 flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <PhoneCall className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">고객센터 운영 안내</h4>
            <p className="text-sm text-slate-500 mt-1 font-medium italic">평일 10:00 - 18:00 (점심시간 13:00-14:00)</p>
            <p className="text-2xl font-bold text-blue-600 mt-2 tracking-tight">1544-XXXX</p>
          </div>
        </div>

        <div className="p-6 rounded-[28px] bg-slate-900 text-white flex items-start gap-4 shadow-xl shadow-slate-200">
          <div className="p-3 bg-slate-800 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg">클린 원픽 캠페인</h4>
            <p className="text-sm text-slate-400 mt-1 font-medium leading-relaxed">원픽은 안전하고 투명한 시장 문화를 만들기 위해 노력합니다.</p>
            <button className="text-xs font-bold text-blue-400 mt-3 hover:underline underline-offset-4">안전 가이드 확인하기 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpertSupportPage() {
  return (
    <ExpertDashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[500px] bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SupportContent />
      </Suspense>
    </ExpertDashboardLayout>
  );
}
