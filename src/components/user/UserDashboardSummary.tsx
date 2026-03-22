'use client';

import React from 'react';
import { MessageSquare, Star, ChevronRight, Bell } from 'lucide-react';

export default function UserDashboardSummary({ summary }: { summary?: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* New Estimate Alerts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group hover:border-purple-200 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Bell className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">신규견적 알림</h3>
            <p className="text-sm text-slate-500 mt-0.5">회원님에게 도착한 새 견적을 확인하세요.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {summary?.newEstimates || 0}
          </span>
        </div>
      </div>

      {/* Unread Chats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group hover:border-blue-200 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <MessageSquare className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">새로운 메시지(1:1상담)</h3>
            <p className="text-sm text-slate-500 mt-0.5">전문가의 메시지가 도착했는지 확인해보세요.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {summary?.unreadChats || 0}
          </span>
        </div>
      </div>

      {/* Unwritten Reviews */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 group hover:border-amber-200 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">미작성 후기</h3>
            <p className="text-sm text-slate-500 mt-0.5">완료된 서비스에 대한 소중한 후기를 남겨주세요.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {summary?.pendingReviews || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
