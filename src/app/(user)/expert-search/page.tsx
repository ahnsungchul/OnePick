'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin, Star, Filter, ChevronDown, ChevronUp,
  Search, Users, AlertCircle, Building2, RefreshCw, Trophy, CheckCircle2, MessageSquare
} from 'lucide-react';
import { getSearchExpertsAction } from '@/actions/expert.action';
import { getCategoriesAction } from '@/actions/category.action';
import { useSession } from 'next-auth/react';

const regionsData: Record<string, string[]> = {
  전국: [],
  서울: ['전체','강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  경기: ['전체','수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','시흥시','파주시','광명시','김포시','군포시','광주시','이천시','양주시','오산시','구리시','안성시','포천시','의왕시','하남시','여주시','동두천시','과천시','가평군','양평군','연천군'],
  인천: ['전체','계양구','미추홀구','남동구','동구','부평구','서구','연수구','중구','강화군','옹진군'],
  강원: ['전체','춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시'],
  충북: ['전체','청주시','충주시','제천시'],
  충남: ['전체','천안시','공주시','아산시','서산시','논산시','당진시'],
  대전: ['전체','동구','중구','서구','유성구','대덕구'],
  세종: ['전체'],
  전북: ['전체','전주시','군산시','익산시','정읍시'],
  전남: ['전체','목포시','여수시','순천시','나주시'],
  광주: ['전체','동구','서구','남구','북구','광산구'],
  경북: ['전체','포항시','경주시','구미시','안동시'],
  경남: ['전체','창원시','진주시','김해시','양산시'],
  부산: ['전체','중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
  대구: ['전체','중구','동구','서구','남구','북구','수성구','달서구','달성군'],
  울산: ['전체','중구','남구','동구','북구','울주군'],
  제주: ['전체','제주시','서귀포시'],
};

const STEP = 12;



export default function ExpertSearchPage() {
  const { data: session } = useSession();

  const [selectedProvince, setSelectedProvince] = useState('전국');
  const [selectedCity, setSelectedCity]         = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [categoriesList, setCategoriesList]     = useState<string[]>(['전체']);
  const [isFilterOpen, setIsFilterOpen]         = useState(true);
  const [experts, setExperts]                   = useState<any[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [visibleCount, setVisibleCount]         = useState(STEP);
  const [hasAutoClosedFilter, setHasAutoClosedFilter] = useState(false);

  /* 화면 로드(초기 데이터 로딩 완료) 후 1초 뒤 필터 자동 닫기 - 최초 1회만 */
  useEffect(() => {
    if (!isLoading && !hasAutoClosedFilter) {
      const timer = setTimeout(() => {
        setIsFilterOpen(false);
        setHasAutoClosedFilter(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasAutoClosedFilter]);

  // 추천 전문가 섹션
  type RecoTab = 'rating' | 'completed' | 'reviews';
  const [activeRecoTab, setActiveRecoTab] = useState<RecoTab>('rating');
  const [recoSeed, setRecoSeed] = useState(0);

  /* 카테고리 */
  useEffect(() => {
    getCategoriesAction().then(res => {
      if (res.success && res.data?.length) {
        setCategoriesList(['전체', ...res.data.map((c: any) => c.name)]);
      }
    });
  }, []);

  /* 전문가 로드 */
  useEffect(() => {
    setIsLoading(true);
    setVisibleCount(STEP);
    getSearchExpertsAction({ province: selectedProvince, city: selectedCity, category: selectedCategory })
      .then(expertRes => {
        setExperts((expertRes.data ?? []) as any[]);
      })
      .finally(() => setIsLoading(false));
  }, [selectedProvince, selectedCity, selectedCategory]);

  const visibleExperts = useMemo(() => experts.slice(0, visibleCount), [experts, visibleCount]);
  const hasMore = experts.length > visibleCount;

  const displayRegion =
    selectedProvince === '전국' ? '전국'
    : selectedCity === '전체' ? selectedProvince
    : `${selectedProvince} ${selectedCity}`;

  // 추천 전문가 계산 (탭별 정렬 후 상위 16명 풀에서 8명 랜덤)
  const recoExperts = useMemo(() => {
    if (experts.length === 0) return [];
    let pool = [...experts];
    if (activeRecoTab === 'rating') {
      pool.sort((a, b) => b.rating - a.rating);
    } else if (activeRecoTab === 'completed') {
      pool.sort((a, b) => b.completedServices - a.completedServices);
    } else {
      pool.sort((a, b) => b.reviews - a.reviews);
    }
    // 상위 16명 풀에서 랜덤 8명 (recoSeed로 재셔플)
    const top = pool.slice(0, Math.min(16, pool.length));
    const shuffled = [...top].sort(() => Math.sin(recoSeed + top.indexOf(top[0])) - 0.5);
    return shuffled.slice(0, 8);
  }, [experts, activeRecoTab, recoSeed]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── 서브 헤더 + 필터 (요청찾기와 동일 구조) ── */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">전문가 찾기</h1>
            <p className="text-slate-500 text-sm mt-1">원하는 지역과 분야의 전문가님을 만나보세요.</p>
          </div>
        </div>

        {/* 필터 슬라이드 */}
        <div className={`max-w-7xl mx-auto px-4 grid transition-all duration-300 ${isFilterOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0 pb-0'}`}>
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 pt-1">

              {/* 지역 탭 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex items-center gap-1 text-slate-500 text-sm font-bold shrink-0 sm:mt-1.5 w-14">
                  <MapPin className="w-4 h-4" /> 지역
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {Object.keys(regionsData).map(prov => (
                    <button
                      key={prov}
                      onClick={() => { setSelectedProvince(prov); setSelectedCity('전체'); }}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                        selectedProvince === prov
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시/군 탭 */}
              {selectedProvince !== '전국' && regionsData[selectedProvince]?.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:pl-[4.5rem]">
                  {regionsData[selectedProvince].map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        selectedCity === city
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}

              {/* 분야 탭 */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex items-center gap-1 text-slate-500 text-sm font-bold shrink-0 sm:mt-1.5 w-14">
                  <Filter className="w-4 h-4" /> 분야
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                        selectedCategory === cat
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 필터 토글 버튼 */}
        <div className="flex justify-center -mt-3 absolute left-0 right-0 pointer-events-none z-10">
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className="pointer-events-auto flex items-center gap-1 text-xs font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            {isFilterOpen
              ? <><ChevronUp className="w-3.5 h-3.5" /> 필터 닫기</>
              : <><ChevronDown className="w-3.5 h-3.5" /> 필터 열기</>}
          </button>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* ── 추천 전문가 섹션 ── */}
        {!isLoading && experts.length > 0 && (
          <section>
            <div className="bg-slate-900 rounded-3xl p-8 shadow-lg">
              {/* 헤더 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                    추천 전문가
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">{displayRegion} · 기준별로 엄선된 전문가님들입니다</p>
                </div>

                {/* 탭 + 다시보기 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                    {([
                      { key: 'rating',    icon: Trophy,        label: '평점 높은' },
                      { key: 'completed', icon: CheckCircle2,  label: '완료 많은' },
                      { key: 'reviews',   icon: MessageSquare, label: '후기 많은' },
                    ] as { key: 'rating'|'completed'|'reviews'; icon: any; label: string }[]).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveRecoTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeRecoTab === tab.key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRecoSeed(s => s + 1)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    다시보기
                  </button>
                </div>
              </div>

              {/* 4열 × 2줄 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recoExperts.map((expert: any) => (
                  <div
                    key={expert.id}
                    className="relative bg-white rounded-2xl p-5 pt-7 hover:shadow-md group flex flex-col text-center transition-all"
                  >
                    {/* 경력 뱃지 */}
                    <div className="absolute top-3 left-3 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 max-w-[55%]">
                      <span className="font-bold text-[10px] text-blue-700 truncate block">{expert.career || '신입'}</span>
                    </div>

                    {/* 평점 */}
                    <div className="absolute top-3 right-3 flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className="font-bold text-[10px] text-amber-700">{Number(expert.rating).toFixed(1)}</span>
                    </div>

                    {/* 프로필 이미지 */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={expert.image}
                        alt={expert.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* 등급 + 이름 */}
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${expert.grade === 'PRO' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {expert.grade === 'PRO' ? 'PRO' : '헬퍼'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{expert.name}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">{expert.specialty}</p>

                    <button
                      onClick={() => {
                        const w = 1400, h = 900;
                        window.open(
                          `/expert/dashboard?userId=${expert.id}`,
                          'ExpertDashboard',
                          `width=${w},height=${h},left=${(window.screen.width - w) / 2},top=${(window.screen.height - h) / 2},resizable=yes,scrollbars=yes`
                        );
                      }}
                      className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      프로필 보기
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* ── 전문가 목록 ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                전문가 목록
              </h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {experts.length}명
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hidden sm:block">
              {displayRegion} · {selectedCategory !== '전체' ? selectedCategory : '전체 분야'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <p className="text-slate-400 font-medium text-sm">전문가 목록을 불러오는 중...</p>
            </div>
          ) : experts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">조건에 맞는 전문가가 없습니다</h3>
              <p className="text-slate-500 text-sm">다른 지역이나 분야를 선택해보세요.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleExperts.map((expert: any) => (
                  <div
                    key={expert.id}
                    className="relative bg-white rounded-2xl border border-slate-100 p-5 pt-7 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center group flex flex-col"
                  >
                    {/* 경력 뱃지 */}
                    <div className="absolute top-3 left-3 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 max-w-[55%]">
                      <span className="font-bold text-[10px] text-blue-700 truncate block">{expert.career || '신입'}</span>
                    </div>

                    {/* 평점 뱃지 */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span className="font-bold text-xs text-amber-700">{Number(expert.rating).toFixed(1)}</span>
                      <span className="text-amber-600/50 text-[10px]">({expert.reviews})</span>
                    </div>

                    {/* 프로필 이미지 */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={expert.image}
                        alt={expert.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* 등급 + 이름 */}
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide ${expert.grade === 'PRO' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {expert.grade === 'PRO' ? 'PRO' : '헬퍼'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{expert.name}</span>
                    </div>

                    {/* 전문 분야 */}
                    <p className="text-xs text-slate-500 mb-1 line-clamp-1">{expert.specialty}</p>

                    {/* 지역 */}
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-4">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[120px]">{expert.regions?.[0] || '지역 미지정'}</span>
                    </div>

                    {/* 프로필 보기 */}
                    <button
                      onClick={() => {
                        const w = 1400, h = 900;
                        window.open(
                          `/expert/dashboard?userId=${expert.id}`,
                          'ExpertDashboard',
                          `width=${w},height=${h},left=${(window.screen.width - w) / 2},top=${(window.screen.height - h) / 2},resizable=yes,scrollbars=yes`
                        );
                      }}
                      className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      프로필 보기
                    </button>
                  </div>
                ))}
              </div>

              {/* 더보기 */}
              {hasMore && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisibleCount(c => c + STEP)}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <ChevronDown className="w-4 h-4" />
                    더보기
                    <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {experts.length - visibleCount}명 더
                    </span>
                  </button>
                  <p className="text-xs text-slate-400">{visibleCount}명 / 총 {experts.length}명</p>
                </div>
              )}

              {!hasMore && experts.length > STEP && (
                <p className="text-center text-xs text-slate-400">모든 전문가를 확인했습니다. (총 {experts.length}명)</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* 비로그인 배너 */}
      {!session?.user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm font-bold text-slate-700">로그인하고 전문가에게 견적을 요청해보세요!</p>
            </div>
            <Link href="/api/auth/signin" className="shrink-0 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
              로그인
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
