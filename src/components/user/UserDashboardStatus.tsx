'use client';

import React from 'react';
import { 
  FileText,
  Send,
  PencilLine, 
  Search, 
  Handshake, 
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDashboardStatus({ stats, directStats }: { stats?: any, directStats?: any }) {
  const router = useRouter();

  const generalTabs = [
    { id: 'DRAFT', label: '작성중', count: stats?.DRAFT || 0, isAlert: false },
    { id: 'MATCHING', label: '매칭중', count: stats?.MATCHING || 0, isAlert: (stats?.MATCHING || 0) > 0 },
    { id: 'FINISHED', label: '전문가확정', count: stats?.FINISHED || 0, isAlert: false },
    { id: 'INSPECTION', label: '검수요청', count: stats?.INSPECTION || 0, isAlert: false },
    { id: 'COMPLETED', label: '서비스완료', count: stats?.COMPLETED || 0, isAlert: false },
    { id: 'CANCELLED', label: '취소', count: stats?.CANCELLED || 0, isAlert: false },
  ];

  const directTabs = [
    { id: 'DRAFT', label: '작성중', count: directStats?.DRAFT || 0, isAlert: false },
    { id: 'MATCHING', label: '상담중', count: directStats?.MATCHING || 0, isAlert: (directStats?.MATCHING || 0) > 0 },
    { id: 'FINISHED', label: '전문가확정', count: directStats?.FINISHED || 0, isAlert: false },
    { id: 'INSPECTION', label: '검수요청', count: directStats?.INSPECTION || 0, isAlert: false },
    { id: 'COMPLETED', label: '서비스완료', count: directStats?.COMPLETED || 0, isAlert: false },
    { id: 'CANCELLED', label: '거절/취소', count: directStats?.CANCELLED || 0, isAlert: false },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 mb-8 w-full">
      {/* 일반 견적요청 */}
      <div className="flex-1 bg-white border border-blue-100 p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10 transition-colors"></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-0.5">내가 올린</p>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              일반 견적요청
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-auto">
          {generalTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => router.push(`/user/my-requests?status=${tab.id}`)} 
              className="relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm active:scale-95 group"
            >
               <span className="text-[11px] font-bold text-slate-500 mb-1 tracking-tight group-hover:text-slate-700 break-keep">{tab.label}</span>
               <span className={`text-lg font-black ${tab.isAlert && tab.count > 0 ? 'text-rose-500' : 'text-blue-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1:1 다이렉트 요청 */}
      <div className="flex-1 bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -z-10 transition-colors"></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-0.5">전문가에게 직접</p>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              1:1 견적요청
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-auto">
          {directTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => router.push(`/user/my-direct-requests?status=${tab.id}`)} 
              className="relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm active:scale-95 group"
            >
               <span className="text-[11px] font-bold text-slate-500 mb-1 tracking-tight group-hover:text-slate-700 break-keep">{tab.label}</span>
               <span className={`text-lg font-black ${tab.isAlert && tab.count > 0 ? 'text-emerald-600' : 'text-emerald-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
