'use client';

import React from 'react';
import { MessageSquare, Star, ChevronRight, Bell } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboardSummary({ summary }: { summary?: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* New Estimate Alerts */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">신규견적 알림</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">도착한 새 견적과 제안을 확인하세요.</p>
          </div>
        </div>
        <div className="flex flex-row xl:flex-col gap-2 justify-end pl-14 xl:pl-0">
          <Link href="/user/my-requests?status=NEW_BIDS" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-purple-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-purple-700 whitespace-nowrap">일반</span>
            <span className="bg-purple-500 group-hover:bg-purple-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.newEstimates || 0}
            </span>
          </Link>
          <Link href="/user/my-direct-requests?status=MATCHING" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-emerald-700 whitespace-nowrap">1:1지정</span>
            <span className="bg-emerald-500 group-hover:bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.newDirectEstimates || 0}
            </span>
          </Link>
        </div>
      </div>

      {/* Unread Chats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">새로운 메시지</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">전문가의 메시지가 도착했는지 확인해보세요.</p>
          </div>
        </div>
        <div className="flex flex-row xl:flex-col gap-2 justify-end pl-14 xl:pl-0">
          <Link href="/user/my-requests?status=NEW_MESSAGE" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700 whitespace-nowrap">일반</span>
            <span className="bg-blue-500 group-hover:bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.unreadChats || 0}
            </span>
          </Link>
          <Link href="/user/my-direct-requests?status=NEW_MESSAGE" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-cyan-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-cyan-700 whitespace-nowrap">1:1지정</span>
            <span className="bg-cyan-500 group-hover:bg-cyan-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.unreadDirectChats || 0}
            </span>
          </Link>
        </div>
      </div>

      {/* Unwritten Reviews */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">미작성 후기</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">완료된 견적에 대한 소중한 후기를 남겨주세요.</p>
          </div>
        </div>
        <div className="flex flex-row xl:flex-col gap-2 justify-end pl-14 xl:pl-0">
          <Link href="/user/my-requests?status=COMPLETED" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-amber-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-amber-700 whitespace-nowrap">일반</span>
            <span className="bg-amber-500 group-hover:bg-amber-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.pendingReviews || 0}
            </span>
          </Link>
          <Link href="/user/my-direct-requests?status=COMPLETED" className="flex flex-1 w-full items-center justify-between gap-3 bg-slate-50 hover:bg-orange-50 border border-slate-100 px-3 py-1.5 rounded-full transition-colors group">
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-orange-700 whitespace-nowrap">1:1지정</span>
            <span className="bg-orange-500 group-hover:bg-orange-600 text-white text-xs font-black px-2 py-0.5 rounded-full transition-colors">
              {summary?.pendingDirectReviews || 0}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
