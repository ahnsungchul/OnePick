'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Star, 
  Zap, 
  AlertCircle,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getEstimatesAction } from '@/actions/estimate.action';
import { getRecommendedExpertsAction } from '@/actions/expert.action';
import { maskName, formatCategory, calculateDDay } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toggleBookmarkAction, getMyBookmarkIdsAction } from '@/actions/bookmark.action';
import { getCategoriesAction } from '@/actions/category.action';
import MapEstimateFullModal from '@/components/expert/MapEstimateFullModal';

// --- Mock Data ---

const regionsData: Record<string, string[]> = {
  '전국': [],
  '서울': ['전체', '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '경기': ['전체', '수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '광명시', '김포시', '군포시', '광주시', '이천시', '양주시', '오산시', '구리시', '안성시', '포천시', '의왕시', '하남시', '여주시', '동두천시', '과천시', '가평군', '양평군', '연천군'],
  '인천': ['전체', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
  '강원': ['전체', '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  '충북': ['전체', '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충남': ['전체', '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '대전': ['전체', '동구', '중구', '서구', '유성구', '대덕구'],
  '세종': ['전체'],
  '전북': ['전체', '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전남': ['전체', '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '광주': ['전체', '동구', '서구', '남구', '북구', '광산구'],
  '경북': ['전체', '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경남': ['전체', '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '부산': ['전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '대구': ['전체', '중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  '울산': ['전체', '중구', '남구', '동구', '북구', '울주군'],
  '제주': ['전체', '제주시', '서귀포시']
};


const mockRequests = [
  { id: 1, category: '욕실/주방', title: '싱크대 배관 누수 수리', location: '강남구 역삼동', time: '오늘 내 해결 희망', price: '견적 협의', urgent: true, date: '2023-11-20T10:00:00', author: '김*현 고객님', status: 'PENDING' },
  { id: 2, category: '기타 서비스', title: '현관 도어락 교체', location: '서초구 서초동', time: '18시 이전 방문 희망', price: '50,000원~', urgent: false, date: '2023-11-20T09:30:00', author: '이*진 고객님', status: 'MATCHED' },
  { id: 3, category: '욕실/주방', title: '변기 막힘 뚫음', location: '송파구 잠실동', time: '즉시 방문 가능 전문가님', price: '견적 협의', urgent: true, date: '2023-11-20T09:15:00', author: '박*호 고객님', status: 'COMPLETED' },
  { id: 4, category: '전기/조명', title: '전기 누전 점검', location: '강남구 논현동', time: '야간 방문 가능 희망', price: '80,000원~', urgent: false, date: '2023-11-19T20:00:00', author: '최*영 고객님', status: 'PENDING' },
  { id: 5, category: '도배/장판', title: '방 1개 실크 벽지 부분 도배', location: '송파구 잠실동', time: '이번 주말 희망', price: '견적 협의', urgent: false, date: '2023-11-19T18:45:00', author: '정*우 고객님', status: 'PENDING' },
  { id: 7, category: '청소/이사', title: '30평대 아파트 입주 청소', location: '강남구 삼성동', time: '다음주 수요일', price: '견적 협의', urgent: false, date: '2023-11-18T11:10:00', author: '윤*아 고객님', status: 'MATCHED' },
];

const statusMap: Record<string, { label: string, color: string }> = {
  'PENDING': { label: '매칭중', color: 'bg-blue-100 text-blue-700' },
  'BIDDING': { label: '견적중', color: 'bg-emerald-100 text-emerald-700' },
  'SELECTED': { label: '전문가선택', color: 'bg-emerald-100 text-emerald-700' },
  'IN_PROGRESS': { label: '전문가확정', color: 'bg-emerald-100 text-emerald-700' },
  'MATCHED': { label: '전문가확정', color: 'bg-emerald-100 text-emerald-700' },
  'COMPLETED': { label: '서비스완료', color: 'bg-slate-200 text-slate-600' },
  'CANCELLED': { label: '취소', color: 'bg-red-100 text-red-600' }
};

export default function EstimateListPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedProvince, setSelectedProvince] = useState('전국');
  const [selectedCity, setSelectedCity] = useState('전체');
  const [categoriesList, setCategoriesList] = useState<string[]>(['전체']);
  const [isMounted, setIsMounted] = useState(false);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [topExperts, setTopExperts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [hasAutoClosedFilter, setHasAutoClosedFilter] = useState(false);

  /* 화면 로드(초기 데이터 로딩 완료) 후 1초 뒤 필터 자동 닫기 - 최초 1회만 */
  useEffect(() => {
    if (isPageLoaded && !hasAutoClosedFilter) {
      const timer = setTimeout(() => {
        setIsFilterOpen(false);
        setHasAutoClosedFilter(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPageLoaded, hasAutoClosedFilter]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalEstimateId, setModalEstimateId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 지원가능 요청만 항상 표시 (고정)
  const { data: session } = useSession();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const isExpert = session?.user && ((session.user as any).role === 'EXPERT' || (session.user as any).role === 'BOTH');
  const STEP = 12;

  const handleCardClick = (id: string) => {
    setModalEstimateId(id);
    setIsModalOpen(true);
  };

  useEffect(() => {
    setIsMounted(true);
    Promise.allSettled([
      getEstimatesAction().then(res => {
        if (res.success && res.data) {
          setEstimates(res.data);
        }
      }),
      getRecommendedExpertsAction().then(res => {
        if (res.success && res.data) {
          setTopExperts(res.data);
        }
      }),
      getCategoriesAction().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          const catNames = res.data.map(c => c.name);
          setCategoriesList(['전체', ...catNames]);
        } else {
          setCategoriesList(['전체']); // DB의 데이터에 의존하도록 수정
        }
      }),
      // 북마크 정보 가져오기
      getMyBookmarkIdsAction().then(res => {
        if (res.success && res.data) {
          setBookmarkedIds(res.data);
        }
      }),
    ]).finally(() => {
      setIsPageLoaded(true);
    });
  }, []);

  // 필터링 적용
  const filteredExperts = useMemo(() => {
    return topExperts.filter(expert => {
      const matchCategory = selectedCategory === '전체' || 
        (expert.categories ? expert.categories.includes(selectedCategory) : expert.category === selectedCategory);
      const matchRegion = selectedProvince === '전국' || 
          expert.region.includes(selectedProvince) || 
          (selectedCity !== '전체' && expert.region.includes(selectedCity));
      return matchCategory && matchRegion;
    });
  }, [selectedCategory, selectedProvince, selectedCity, topExperts]);

  const urgentRequests = useMemo(() => {
    // 긴급 요청 중 지역에 맞는 것들을 랜덤으로 일부 노출
    let filtered = estimates.filter(req => req.isUrgent);
    
    if (selectedProvince !== '전국') {
      filtered = filtered.filter(req => req.location.includes(selectedProvince));
      if (selectedCity !== '전체') {
        filtered = filtered.filter(req => req.location.includes(selectedCity));
      }
    }
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(req => formatCategory(req.category) === selectedCategory);
    }
    if (!isMounted) return filtered;
    
    // 단순 무작위 셔플 (클라이언트에서만)
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [selectedCategory, selectedProvince, selectedCity, isMounted, estimates]);

  const normalRequests = useMemo(() => {
    let filtered = estimates;
    
    // 전문가는 항상 지원가능한 요청만 표시
    if (isExpert) {
      filtered = filtered.filter(req => {
        const isBiddableStatus = req.status === 'PENDING' || req.status === 'BIDDING';
        const ddayResult = calculateDDay(req.createdAt, req.isClosed, req.extendedDays);
        const hasNotExpired = ddayResult.label !== '요청 마감';
        const hasParticipated = req.bids?.some((bid: any) => bid.expertId === Number(session?.user?.id));
        return isBiddableStatus && !req.isClosed && hasNotExpired && !hasParticipated;
      });
    }

    if (selectedProvince !== '전국') {
      filtered = filtered.filter(req => req.location.includes(selectedProvince));
      if (selectedCity !== '전체') {
        filtered = filtered.filter(req => req.location.includes(selectedCity));
      }
    }
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(req => formatCategory(req.category) === selectedCategory);
    }

    // 최신순 정렬 (날짜 내림차순)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedCategory, selectedProvince, selectedCity, estimates, isExpert, session]);

  // 더보기 - 보여줄 목록 계산
  const visibleRequests = normalRequests.slice(0, visibleCount);
  const hasMore = normalRequests.length > visibleCount;

  // 필터 변경 시 visibleCount 초기화
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, selectedProvince, selectedCity]);

  // 화면 제목에 쓰일 지역 튜플
  const displayRegionText = selectedProvince === '전국' ? '전국' : (selectedCity === '전체' ? selectedProvince : `${selectedProvince} ${selectedCity}`);

  // ── 긴급 요청 슬라이드 로직 ──
  const ITEMS_PER_PAGE = 8; // 4개 x 2줄
  const SLIDE_THRESHOLD = 9; // 9개 이상일 때 슬라이드 활성화
  const SLIDE_INTERVAL = 3000; // 3초

  const totalUrgentPages = Math.ceil(urgentRequests.length / ITEMS_PER_PAGE);
  const enableUrgentSlide = urgentRequests.length >= SLIDE_THRESHOLD;
  const [urgentPage, setUrgentPage] = useState(0);
  const [isUrgentPaused, setIsUrgentPaused] = useState(false);
  const urgentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const urgentTrackRef = useRef<HTMLDivElement | null>(null);
  const [urgentSlideHeight, setUrgentSlideHeight] = useState<number | undefined>(undefined);

  // 첫 번째 슬라이드(풀 8개) 렌더링 시 높이 측정 → 모든 슬라이드에 동일 적용
  useEffect(() => {
    if (!enableUrgentSlide) { setUrgentSlideHeight(undefined); return; }
    requestAnimationFrame(() => {
      if (urgentTrackRef.current) {
        const firstPage = urgentTrackRef.current.querySelector<HTMLElement>('[data-urgent-page]');
        if (firstPage) {
          const h = firstPage.offsetHeight;
          if (h > 0) setUrgentSlideHeight(h);
        }
      }
    });
  }, [enableUrgentSlide, urgentRequests.length]);

  // 슬라이드 자동 롤링
  useEffect(() => {
    if (!enableUrgentSlide || isUrgentPaused) {
      if (urgentTimerRef.current) clearInterval(urgentTimerRef.current);
      return;
    }
    urgentTimerRef.current = setInterval(() => {
      setUrgentPage(prev => (prev + 1) % totalUrgentPages);
    }, SLIDE_INTERVAL);
    return () => { if (urgentTimerRef.current) clearInterval(urgentTimerRef.current); };
  }, [enableUrgentSlide, isUrgentPaused, totalUrgentPages]);

  // 필터 변경 시 슬라이드 페이지 초기화
  useEffect(() => {
    setUrgentPage(0);
  }, [selectedCategory, selectedProvince, selectedCity]);

  // 페이지별 아이템 분할
  const urgentPages = useMemo(() => {
    if (!enableUrgentSlide) return [urgentRequests];
    const pages: typeof urgentRequests[] = [];
    for (let i = 0; i < urgentRequests.length; i += ITEMS_PER_PAGE) {
      pages.push(urgentRequests.slice(i, i + ITEMS_PER_PAGE));
    }
    return pages;
  }, [urgentRequests, enableUrgentSlide]);

  // ── 마우스 드래그 & 터치 스와이프 ──
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragStart = useCallback((clientX: number) => {
    if (!enableUrgentSlide) return;
    isDragging.current = true;
    dragStartX.current = clientX;
    dragDeltaX.current = 0;
    setIsUrgentPaused(true);
  }, [enableUrgentSlide]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging.current) return;
    dragDeltaX.current = clientX - dragStartX.current;
    setDragOffset(dragDeltaX.current);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = 60;
    if (dragDeltaX.current < -threshold) {
      setUrgentPage(prev => Math.min(prev + 1, totalUrgentPages - 1));
    } else if (dragDeltaX.current > threshold) {
      setUrgentPage(prev => Math.max(prev - 1, 0));
    }
    setDragOffset(0);
    dragDeltaX.current = 0;
    setIsUrgentPaused(false);
  }, [totalUrgentPages]);

  // 마우스 이벤트
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  }, [handleDragStart]);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);
  const onMouseUp = useCallback(() => handleDragEnd(), [handleDragEnd]);
  const onMouseLeave = useCallback(() => {
    if (isDragging.current) handleDragEnd();
    setIsUrgentPaused(false);
  }, [handleDragEnd]);

  // 터치 이벤트
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);
  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd]);

  // 새 견적요청 권한 체크
  const handleNewEstimateClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (session && session.user) {
        window.location.href = '/estimate/new';
      } else {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Session check failed', error);
      setShowAuthModal(true);
    }
  };

  // 즐겨찾기 토글 핸들러
  const handleToggleBookmark = async (e: React.MouseEvent, estimateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    if (!isExpert) {
      alert("전문가 또는 통합 회원만 즐겨찾기 기능을 사용할 수 있습니다.");
      return;
    }

    const res = await toggleBookmarkAction(estimateId);
    if (res.success) {
      if (res.bookmarked) {
        setBookmarkedIds(prev => [...prev, estimateId]);
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== estimateId));
      }
    } else {
      alert(res.error || "즐겨찾기 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 상단 헤더 영역 & 견적요청 버튼 */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">요청 찾기</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">원하는 지역과 분야의 전문가님들을 만나보세요.</p>
          </div>
          <button 
            onClick={handleNewEstimateClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-current" />
            새 견적요청 하기
          </button>
        </div>

        {/* 필터 영역 (슬라이드 애니메이션 적용) */}
        <div 
          className={`max-w-7xl mx-auto px-4 grid transition-all duration-300 ease-in-out ${
            isFilterOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0 pb-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 pb-2">
                <div className="flex items-center gap-1 mr-2 text-slate-500 text-sm font-bold shrink-0 sm:mt-1.5">
                  <MapPin className="w-4 h-4" /> 지역
                </div>
                <div className="flex flex-wrap items-center gap-1 flex-1">
                  {Object.keys(regionsData).map(prov => (
                    <button 
                      key={prov}
                      onClick={() => {
                        setSelectedProvince(prov);
                        setSelectedCity('전체');
                      }}
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

              {selectedProvince !== '전국' && regionsData[selectedProvince].length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pb-2 sm:pl-[4.5rem]">
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

              <div className="flex flex-col sm:flex-row sm:items-start gap-2 pb-2">
                <div className="flex items-center gap-1 mr-2 text-slate-500 text-sm font-bold shrink-0 sm:mt-1.5">
                  <Filter className="w-4 h-4" /> 분야
                </div>
                <div className="flex flex-wrap items-center gap-1 flex-1">
                  {categoriesList.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                        selectedCategory === cat 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
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

        {/* 필터 닫기/열기 하단 버튼 */}
        <div className="flex justify-center -mt-3 absolute left-0 right-0 z-10 pointer-events-none">
          <button 
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="pointer-events-auto flex items-center justify-center gap-1 text-xs font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-1.5 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            {isFilterOpen ? (
              <>필터 닫기 <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>필터 열기 <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        

        <section>
          {/* 긴급 요청 (슬라이드) */}
          {urgentRequests.length > 0 && (
            <div
              className="mb-10 bg-slate-900 rounded-3xl p-6 sm:p-8 -mx-4 sm:mx-0 shadow-lg select-none"
              onMouseEnter={() => { if (!isDragging.current) setIsUrgentPaused(true); }}
              onMouseLeave={onMouseLeave}
              onMouseDown={enableUrgentSlide ? onMouseDown : undefined}
              onMouseMove={enableUrgentSlide ? onMouseMove : undefined}
              onMouseUp={enableUrgentSlide ? onMouseUp : undefined}
              onTouchStart={enableUrgentSlide ? onTouchStart : undefined}
              onTouchMove={enableUrgentSlide ? onTouchMove : undefined}
              onTouchEnd={enableUrgentSlide ? onTouchEnd : undefined}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    긴급 견적 요청
                  </h2>
                  <div className="hidden sm:block w-px h-4 bg-white/20" />
                  <p className="text-slate-400">오늘 바로 해결이 필요한 긴급 수리 요청입니다</p>
                </div>
              </div>
              {/* 슬라이드 트랙 */}
              <div className="overflow-hidden" ref={urgentTrackRef}>
                <div
                  className="flex"
                  style={{
                    transform: enableUrgentSlide
                      ? `translateX(calc(-${urgentPage * 100}% + ${dragOffset}px))`
                      : undefined,
                    transition: dragOffset !== 0 ? 'none' : 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {urgentPages.map((pageItems, pageIdx) => (
                    <div
                      key={pageIdx}
                      data-urgent-page
                      className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 content-start"
                      style={enableUrgentSlide && urgentSlideHeight ? { minHeight: urgentSlideHeight } : undefined}
                    >
                      {pageItems.map(req => (
                        <div
                          key={req.id}
                          onClick={() => { if (Math.abs(dragDeltaX.current) < 5) handleCardClick(req.id); }}
                          className="cursor-pointer"
                        >
                          <div className={`relative ${calculateDDay(req.createdAt, req.isClosed, req.extendedDays).label === '요청 마감' ? 'bg-slate-100' : 'bg-white'} p-4 rounded-2xl shadow-sm transition-all flex flex-col justify-between group h-full overflow-hidden`}>
                            <span className="text-[10px] px-8 pt-2 pb-1 font-bold uppercase bg-orange-500 text-white absolute top-0 left-0 rotate-[-45deg] translate-x-[-28px] translate-y-[0px]">
                              긴급
                            </span>
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusMap[req.status]?.color || statusMap['PENDING'].color}`}>
                                {statusMap[req.status]?.label || '매칭중'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {req.bids?.length || 0}명 참여
                              </span>
                              {(req.status === 'PENDING' || req.status === 'BIDDING') && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${calculateDDay(req.createdAt, req.isClosed, req.extendedDays).isUrgent ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'}`}>
                                  {calculateDDay(req.createdAt, req.isClosed, req.extendedDays).label}
                                </span>
                              )}
                              {isExpert && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleBookmark(e, req.id); }}
                                  className={`p-1 rounded-full transition-all border ${
                                    bookmarkedIds.includes(req.id)
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                                  }`}
                                  title="즐겨찾기"
                                >
                                  <Star className={`w-3 h-3 ${bookmarkedIds.includes(req.id) ? 'fill-current' : ''}`} />
                                </button>
                              )}
                            </div>
                            <div className="mt-6 text-left">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-50 text-slate-400 border border-slate-100">
                                  No. {req.requestNumber}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                                  {formatCategory(req.category)}
                                </span>
                              </div>
                              <h4 className="text-base font-bold mb-1 group-hover:text-blue-600 transition-colors text-slate-900 line-clamp-1">
                                {formatCategory(req.category)} 요청
                              </h4>
                              <p className="text-slate-500 text-sm mb-3 line-clamp-1">{req.details}</p>
                              <p className="text-slate-400 text-xs mb-4 flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location.split(' ').slice(0, 3).join(' ')} • 빠른 방문 요망</p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {(req.authorName || req.customer?.name || "고객").charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-slate-500">{maskName(req.authorName || req.customer?.name)}님</span>
                              </div>
                              <span className="font-bold text-sm text-blue-500">견적 협의</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* 페이징 도트 (슬라이드 활성화 시에만 표시) */}
              {enableUrgentSlide && totalUrgentPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {Array.from({ length: totalUrgentPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUrgentPage(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        idx === urgentPage
                          ? 'bg-white scale-110'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 일반 요청 (최신순) */}
          <div className="pt-8 sm:pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  최신 견적 요청
                </h2>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {normalRequests.length}건
                </span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hidden sm:block">
                {displayRegionText} · {selectedCategory !== '전체' ? selectedCategory : '전체 분야'}
              </span>
            </div>
            
            {normalRequests.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleRequests.map(req => {
                    const dday = calculateDDay(req.createdAt, req.isClosed, req.extendedDays);
                    const isExpired = dday.label === '요청 마감';
                    return (
                      <div
                        key={req.id}
                        onClick={() => handleCardClick(req.id)}
                        className="cursor-pointer"
                      >
                        <div className={`group text-left border rounded-2xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col gap-2 h-full ${isExpired ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                          {/* 호버 좌측 액센트 */}
                          <div className="absolute left-0 top-0 w-[3px] h-full bg-blue-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />

                          {/* 배지 영역 */}
                          <div className="flex items-center gap-1.5 flex-wrap pl-1 pr-10">
                            {req.isUrgent && (
                              <span className="inline-flex items-center gap-0.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Zap className="w-3 h-3 fill-white" /> 긴급
                              </span>
                            )}
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {formatCategory(req.category)}
                            </span>
                            {isExpired ? (
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">요청 마감</span>
                            ) : (
                              (req.status === 'PENDING' || req.status === 'BIDDING') && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dday.isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-white'}`}>
                                  {dday.label}
                                </span>
                              )
                            )}
                          </div>

                          {/* 북마크 버튼 */}
                          {isExpert && (
                            <button
                              onClick={(e) => handleToggleBookmark(e, req.id)}
                              className={`absolute top-3 right-3 p-1.5 rounded-full transition-all border z-10 ${bookmarkedIds.includes(req.id) ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-slate-300 hover:text-slate-400'}`}
                              title="즐겨찾기"
                            >
                              <Star className={`w-3.5 h-3.5 ${bookmarkedIds.includes(req.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          {/* 요청 제목 */}
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 pl-1">
                            {formatCategory(req.category)} 요청
                          </h4>

                          {/* 요청 내용 요약 */}
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pl-1 flex-1">
                            {req.details || '상세 내용을 확인하려면 클릭하세요.'}
                          </p>

                          {/* 하단 정보 */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 pl-1">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[110px]">
                                {req.location ? req.location.split(' ').slice(0, 3).join(' ') : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {(req.bids?.length > 0) && (
                                <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                  <ChevronRight className="w-2.5 h-2.5" />
                                  {req.bids.length}명
                                </div>
                              )}
                              <span className="text-[10px] text-slate-300 font-bold">
                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 더보기 버튼 */}
                {hasMore && (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      onClick={() => setVisibleCount(c => c + STEP)}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-[0.98] shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 rotate-90" />
                      더보기
                      <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {normalRequests.length - visibleCount}건 남음
                      </span>
                    </button>
                    <p className="text-xs text-slate-400 font-medium">
                      {visibleCount}건 / 총 {normalRequests.length}건
                    </p>
                  </div>
                )}

                {/* 모두 로드됐을 때 */}
                {!hasMore && normalRequests.length > STEP && (
                  <p className="text-center text-xs text-slate-400 font-medium pt-2">
                    모든 요청을 확인했습니다. (총 {normalRequests.length}건)
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                선택한 조건에 맞는 견적 요청이 없습니다.<br/>
                다른 지역이나 분야를 선택해보세요.
              </div>
            )}
          </div>
        </section>

      </div>


      {/* 요청 상세 모달 */}
      <MapEstimateFullModal
        isOpen={isModalOpen}
        estimateId={modalEstimateId}
        onClose={() => {
          setIsModalOpen(false);
          setModalEstimateId(null);
        }}
      />

      {/* 로그인/회원가입 유도 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <div className="flex justify-center mb-6 text-blue-500">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2">로그인이 필요합니다</h3>
            <p className="text-center text-slate-500 text-sm mb-8 leading-relaxed">
              견적요청을 등록하려면 먼저<br/>로그인이나 회원가입을 진행해주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/api/auth/signin">
                <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors">
                  로그인하기
                </button>
              </Link>
              <Link href="/register">
                <button className="w-full bg-white text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  회원가입하기
                </button>
              </Link>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-full text-slate-400 text-sm font-bold py-2 mt-2 hover:text-slate-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
