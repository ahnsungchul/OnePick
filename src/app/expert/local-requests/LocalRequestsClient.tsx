'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Zap,
  Search,
  ChevronRight,
  Building2,
  Calendar,
  Users,
  Tag,
  LayoutGrid,
} from 'lucide-react';
import MapEstimateFullModal from '@/components/expert/MapEstimateFullModal';
import { calculateDDay, formatCategory } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface LocalRequestsClientProps {
  estimates: any[];
  regions: string[];
  specialties: string[];
  expertId: number;
}

export default function LocalRequestsClient({
  estimates,
  regions,
  specialties,
  expertId,
}: LocalRequestsClientProps) {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [modalEstimateId, setModalEstimateId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 지역 탭 상태 ('전체' 또는 regions[n])
  const [activeRegion, setActiveRegion] = useState('전체');
  // 카테고리 탭 상태 ('전체' 또는 specialties[n])
  const [activeCategory, setActiveCategory] = useState('전체');

  const handleCardClick = (id: string) => {
    setModalEstimateId(id);
    setIsModalOpen(true);
  };

  // 지역 탭 목록: 전체 + regions
  const regionTabs = ['전체', ...regions];
  // 카테고리 탭 목록: 전체 + specialties (실제 데이터에 존재하는 것만)
  const categoryTabs = useMemo(() => {
    const existingCats = new Set(estimates.map((e) => e.category));
    const filtered = specialties.filter((s) => existingCats.has(s));
    return ['전체', ...filtered];
  }, [estimates, specialties]);

  // 지역 필터 적용
  const afterRegionFilter = useMemo(() => {
    if (activeRegion === '전체') return estimates;
    return estimates.filter(
      (e) => e.location && e.location.includes(activeRegion)
    );
  }, [estimates, activeRegion]);

  // 카테고리 필터 적용 (지역 필터 결과에 추가 적용)
  const filtered = useMemo(() => {
    if (activeCategory === '전체') return afterRegionFilter;
    return afterRegionFilter.filter((e) => e.category === activeCategory);
  }, [afterRegionFilter, activeCategory]);

  // 특정 지역 탭에서 카테고리별 건수 계산
  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    afterRegionFilter.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + 1;
    });
    return map;
  }, [afterRegionFilter]);

  // 특정 카테고리 탭에서 지역별 건수 계산
  const countByRegion = useMemo(() => {
    const base =
      activeCategory === '전체'
        ? estimates
        : estimates.filter((e) => e.category === activeCategory);
    const map: Record<string, number> = { 전체: base.length };
    regions.forEach((r) => {
      map[r] = base.filter((e) => e.location && e.location.includes(r)).length;
    });
    return map;
  }, [estimates, regions, activeCategory]);

  const hasNoSetup = regions.length === 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[500px]">
      {/* ─── 헤더 ─── */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-500" />
          우리동네 요청
        </h2>
        <p className="text-slate-500 mt-2 font-medium text-sm">
          내가 설정한 서비스 지역 · 카테고리의 최신 견적 요청 목록입니다.
        </p>
      </div>

      {/* ─── 지역/카테고리 미설정 안내 ─── */}
      {hasNoSetup && (
        <div className="mt-2 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-xl">
            📍
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">
              서비스 지역이 설정되지 않았습니다
            </h4>
            <p className="text-amber-700 text-xs mt-1 font-medium">
              프로필 편집에서 서비스 지역과 카테고리를 설정하면 해당 지역의
              요청 목록을 확인할 수 있습니다.
            </p>
            <Link
              href={`/expert/dashboard?userId=${userId}`}
              className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-amber-700 underline underline-offset-4 hover:text-amber-900 transition-colors"
            >
              프로필 편집 바로가기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {!hasNoSetup && (
        <>
          {/* ─── 지역 탭 ─── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                서비스 지역
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {regionTabs.map((r) => {
                const count = countByRegion[r] ?? 0;
                const isActive = activeRegion === r;
                return (
                  <button
                    key={r}
                    onClick={() => setActiveRegion(r)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-105'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {r !== '전체' && (
                      <Building2
                        className={`w-3 h-3 ${isActive ? 'text-white/80' : 'text-slate-400'}`}
                      />
                    )}
                    {r === '전체' ? (
                      <LayoutGrid
                        className={`w-3 h-3 ${isActive ? 'text-white/80' : 'text-slate-400'}`}
                      />
                    ) : null}
                    {r}
                    <span
                      className={`text-[10px] font-black ${
                        isActive ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      {r === '전체' ? estimates.length : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── 카테고리 탭 ─── */}
          {categoryTabs.length > 1 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  서비스 카테고리
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryTabs.map((cat) => {
                  const count =
                    cat === '전체'
                      ? afterRegionFilter.length
                      : countByCategory[cat] || 0;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-105'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {formatCategory(cat)}
                      <span
                        className={`text-[10px] font-black ${
                          isActive ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 구분선 */}
          <div className="h-px bg-slate-100 mb-6" />

          {/* ─── 결과 헤더 ─── */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500">
              <span className="text-blue-600 font-black text-base">{filtered.length}</span>건의 요청
              {activeRegion !== '전체' && (
                <span className="ml-1 text-blue-500">· {activeRegion}</span>
              )}
              {activeCategory !== '전체' && (
                <span className="ml-1 text-emerald-500">· {formatCategory(activeCategory)}</span>
              )}
            </p>
            {(activeRegion !== '전체' || activeCategory !== '전체') && (
              <button
                onClick={() => { setActiveRegion('전체'); setActiveCategory('전체'); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                초기화
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">✕</span>
              </button>
            )}
          </div>

          {/* ─── 카드 리스트 ─── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                {activeCategory !== '전체'
                  ? `${formatCategory(activeCategory)} 카테고리의 요청이 없습니다.`
                  : activeRegion !== '전체'
                  ? `${activeRegion} 지역의 요청이 없습니다.`
                  : '현재 우리동네 요청이 없습니다.'}
              </h3>
              <p className="text-sm text-slate-500">새로운 요청이 등록되면 이곳에 표시됩니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((est) => {
                const dday = calculateDDay(est.createdAt, est.isClosed, est.extendedDays);
                const isExpired = dday.label === '요청 마감';

                return (
                  <button
                    key={est.id}
                    onClick={() => handleCardClick(est.id)}
                    className="group text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col gap-2"
                  >
                    {/* 호버 좌측 액센트 */}
                    <div className="absolute left-0 top-0 w-[3px] h-full bg-blue-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />

                    {/* 배지 영역 */}
                    <div className="flex items-center gap-1.5 flex-wrap pl-1">
                      {est.isUrgent && (
                        <span className="inline-flex items-center gap-0.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Zap className="w-3 h-3 fill-white" /> 긴급
                        </span>
                      )}
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {formatCategory(est.category)}
                      </span>
                      {isExpired ? (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          요청 마감
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dday.isUrgent
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {dday.label}
                        </span>
                      )}
                    </div>

                    {/* 요청 제목 */}
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 pl-1">
                      {formatCategory(est.category)} 요청
                    </h4>

                    {/* 요청 내용 요약 */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pl-1">
                      {est.details || '상세 내용을 확인하려면 클릭하세요.'}
                    </p>

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 pl-1">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[110px]">
                          {est.location
                            ? est.location.split(' ').slice(0, 3).join(' ')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {est.bidCount > 0 && (
                          <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            <Users className="w-2.5 h-2.5" />
                            {est.bidCount}
                          </div>
                        )}
                        {est.serviceDate && (
                          <div className="flex items-center gap-0.5 text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                            <Calendar className="w-2.5 h-2.5" />
                            희망일
                          </div>
                        )}
                        <span className="text-[10px] text-slate-300 font-bold">
                          {est.createdAt
                            ? new Date(est.createdAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 요청 상세 모달 */}
      <MapEstimateFullModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalEstimateId(null);
        }}
        estimateId={modalEstimateId}
      />
    </div>
  );
}
