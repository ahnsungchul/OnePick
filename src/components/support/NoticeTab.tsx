import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronRight, ChevronLeft } from 'lucide-react';
import { getNoticesAction } from '@/actions/support.action';

export default function NoticeTab() {
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotices() {
      setLoading(true);
      try {
        const result = await getNoticesAction();
        if (result.success && Array.isArray(result.data)) {
          setNotices(result.data);
        } else if (!result.success) {
          setError(result.error || '공지사항을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setError('시스템 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, []);

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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center gap-2 mb-2 ml-1">
        <Megaphone className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-bold text-slate-900">공지사항</h3>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
        {notices.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          notices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => setSelectedNotice(notice)}
              className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                {notice.important && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md whitespace-nowrap">중요</span>
                )}
                <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {notice.title}
                </h4>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\. /g, '.').replace(/\.$/, '')}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        )}
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
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
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
    </div>
  );
}
