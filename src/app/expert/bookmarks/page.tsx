'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  ChevronRight, 
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { getMyBookmarksAction, toggleBookmarkAction } from '@/actions/bookmark.action';
import { maskName, formatCategory } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const statusMap: Record<string, { label: string, color: string }> = {
  'PENDING': { label: '매칭중', color: 'bg-blue-100 text-blue-700' },
  'MATCHED': { label: '매칭완료', color: 'bg-emerald-100 text-emerald-700' },
  'COMPLETED': { label: '서비스완료', color: 'bg-slate-200 text-slate-600' }
};

export default function ExpertBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  const fetchBookmarks = async () => {
    setIsLoading(true);
    const res = await getMyBookmarksAction();
    if (res.success && res.data) {
      setBookmarks(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (e: React.MouseEvent, estimateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("즐겨찾기에서 삭제하시겠습니까?")) {
      const res = await toggleBookmarkAction(estimateId);
      if (res.success) {
        setBookmarks(prev => prev.filter(b => b.id !== estimateId));
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-slate-500 mb-6">즐겨찾기 목록을 보려면 전문가 계정으로 로그인해주세요.</p>
          <Link href="/api/auth/signin">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
              로그인하기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/expert/dashboard" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">대시보드</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">나의 즐겨찾기</h1>
              <p className="text-slate-500 text-sm mt-1">관심 있는 견적 요청들을 한눈에 모아보세요.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-32 rounded-3xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {bookmarks.map((req) => (
              <Link 
                href={`/estimate/${req.id}`} 
                key={req.id}
                className="group"
              >
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-500/30 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between gap-4 relative">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusMap[req.status]?.color || statusMap['PENDING'].color}`}>
                        {statusMap[req.status]?.label || '매칭중'}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {formatCategory(req.category)}
                      </span>
                      {req.isUrgent && (
                        <span className="text-[10px] font-black text-white bg-orange-500 px-2 py-0.5 rounded-md uppercase">
                          긴급
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {formatCategory(req.category)} 요청
                    </h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-1 leading-relaxed">
                      {req.details}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" /> {req.location.split(' ').slice(0, 3).join(' ')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-300" /> {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                          {(req.authorName || req.customer?.name || "고객").charAt(0)}
                        </div>
                        {maskName(req.authorName || req.customer?.name)}님
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1 font-bold italic">Estimated Price</p>
                      <p className="text-lg font-black text-slate-900">견적 협의</p>
                    </div>
                    <button 
                      onClick={(e) => handleRemoveBookmark(e, req.id)}
                      className="p-2.5 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors border border-amber-100"
                      title="즐겨찾기 삭제"
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 mb-2">즐겨찾기가 없습니다.</h3>
            <p className="text-slate-400 text-sm mb-8">관심 있는 견적 요청에 별표를 눌러 저장해보세요!</p>
            <Link href="/estimate">
              <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm">
                견적 요청 리스트 보기
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
