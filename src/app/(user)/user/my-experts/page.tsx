'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, HeartOff } from 'lucide-react';
import { getMyFavoriteExpertsAction, toggleFavoriteExpertAction } from '@/actions/favoriteExpert.action';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function MyExpertsPage() {
  const { data: session } = useSession();
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('전체');

  // 추출된 모든 카테고리 목록 생성
  const categories = ['전체', ...Array.from(new Set(
    experts.flatMap(exp => exp.specialties?.map((s: any) => s.name) || [])
  ))];

  const fetchExperts = async () => {
    setLoading(true);
    const res = await getMyFavoriteExpertsAction();
    if (res.success) {
      setExperts(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchExperts();
    }
  }, [session]);

  const handleToggleFavorite = async (expertId: number) => {
    // Optimistic UI Update
    setExperts(prev => prev.filter(exp => exp.id !== expertId));
    
    const res = await toggleFavoriteExpertAction(expertId);
    if (!res.success) {
      // Revert if failed
      alert(res.error || '즐겨찾기 처리 중 오류가 발생했습니다.');
      fetchExperts();
    }
  };

  const filteredExperts = activeTab === '전체' 
    ? experts 
    : experts.filter(exp => exp.specialties?.some((s: any) => s.name === activeTab));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">MY 전문가</h2>
          <p className="text-sm text-slate-500 mt-1">내가 즐겨찾기(찜)한 전문가 목록입니다.</p>
        </div>
      </div>

      {experts.length > 0 && (
        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide border-b border-slate-200">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={cn(
                "px-5 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition-colors relative",
                activeTab === category 
                  ? "text-blue-600 bg-blue-50/50" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {category}
              {activeTab === category && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {experts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">즐겨찾기한 전문가가 없습니다</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            마음에 드는 전문가의 프로필이나 홈에서 우측 상단의 <br/>
            별 아이콘을 눌러 나만의 전문가를 추가해 보세요.
          </p>
          <Link 
            href="/expert-search" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
          >
            추천 전문가 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredExperts.map((expert) => (
            <div 
              key={expert.id} 
              className="relative bg-white rounded-2xl border border-slate-100 p-5 pt-7 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center group flex flex-col"
            >
              {/* 상단 뱃지 & 즐겨찾기 삭제 버튼 */}
              <div className="absolute top-3 left-3 flex items-center bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 max-w-[50%]">
                <span className="font-bold text-[10px] text-blue-700 truncate">{expert.career || '경력 미입력'}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleFavorite(expert.id);
                }}
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 hover:bg-red-50 text-amber-500 hover:text-red-500 transition-colors z-10"
                title="즐겨찾기 해제"
              >
                <Star className="w-4 h-4 fill-current group-hover:hidden" />
                <HeartOff className="w-4 h-4 hidden group-hover:block" />
              </button>

              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={expert.image || `https://picsum.photos/seed/${expert.name}/100/100`} 
                  alt={expert.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-1.5 mt-auto">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide",
                  expert.grade === 'PRO' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                )}>
                  {expert.grade === 'PRO' ? 'PRO' : '헬퍼'}
                </span>
                <span className="font-bold text-slate-900">{expert.name}</span>
              </div>

              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-4">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{expert.regions?.[0] || '지역 미지정'}</span>
              </div>

              <Link 
                href={`/expert/dashboard?userId=${expert.id}`}
                className="block w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                자세히 보기
              </Link>
            </div>
          ))}
          
          {filteredExperts.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              해당 카테고리에 즐겨찾기한 전문가가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
