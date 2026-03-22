import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  MessageCircle, 
  AlertTriangle, 
  ChevronRight,
  Plus,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { getNoticesAction } from '@/actions/support.action';

export default function UserDashboardSupport() {
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        const result = await getNoticesAction();
        if (result.success && Array.isArray(result.data)) {
          // 대시보드에는 최신 3개만 표시
          setNotices(result.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch notices for dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

  // 모달 오픈 시 배경 스크롤 방지
  useEffect(() => {
    if (selectedNotice) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedNotice]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 h-[240px]" />
        <div className="flex flex-col gap-4 h-[240px]">
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl" />
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notice Mini-Board */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">원픽 공지사항</h3>
            </div>
            <Link href="/user/support" className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                onClick={() => setSelectedNotice(notice)}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  {notice.important && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded shrink-0">중요</span>
                  )}
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors truncate">
                    {notice.title}
                  </span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\. /g, '.').replace(/\.$/, '')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Support Buttons */}
        <div className="flex flex-col gap-4">
          <Link href="/user/support?tab=inquiry" className="flex-1">
            <button className="w-full h-full bg-white border border-slate-100 p-6 rounded-2xl flex flex-row items-center justify-between gap-3 hover:border-blue-100 hover:bg-blue-50/30 transition-all group shadow-sm text-left">
              <div className="flex flex-row items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-slate-800">1:1 문의</p>
                  <p className="text-xs text-slate-400 mt-1">도움이 필요하신가요?</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>
          
          <Link href="/user/support?tab=report" className="flex-1">
            <button className="w-full h-full bg-white border border-slate-100 p-6 rounded-2xl flex flex-row items-center justify-between gap-3 hover:border-red-200 hover:bg-red-50/30 transition-all group shadow-sm text-left">
              <div className="flex flex-row items-center gap-3">
                <div className="p-3 bg-red-50 rounded-xl group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-slate-800">신고센터</p>
                  <p className="text-xs text-slate-400 mt-1">안전한 거래를 위해 제보해주세요.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  {selectedNotice.important && (
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase tracking-tight">중요</span>
                  )}
                  <span>
                    {new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\. /g, '.').replace(/\.$/, '')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight truncate">{selectedNotice.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-all shrink-0"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-left font-medium">
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedNotice.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setSelectedNotice(null)}
                className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
