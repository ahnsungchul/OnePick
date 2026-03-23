'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Star, 
  Zap, 
  AlertCircle,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useEffect } from 'react';
import { getEstimatesAction } from '@/actions/estimate.action';
import { getRecommendedExpertsAction } from '@/actions/expert.action';
import { maskName, formatCategory, calculateDDay } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toggleBookmarkAction, getMyBookmarkIdsAction } from '@/actions/bookmark.action';

// --- Mock Data ---


const categoriesList = ['전체', '도배/장판', '욕실/주방', '전기/조명', '청소/이사', '가전/에어컨', '자동차 수리', '베이비/펫시터', '과외/레슨', '디자인/IT', '기타 서비스'];

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
  'IN_PROGRESS': { label: '매칭완료', color: 'bg-emerald-100 text-emerald-700' },
  'MATCHED': { label: '매칭완료', color: 'bg-emerald-100 text-emerald-700' },
  'COMPLETED': { label: '서비스완료', color: 'bg-slate-200 text-slate-600' },
  'CANCELLED': { label: '취소됨', color: 'bg-red-100 text-red-600' }
};

export default function EstimateListPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedProvince, setSelectedProvince] = useState('전국');
  const [selectedCity, setSelectedCity] = useState('전체');
  const [isMounted, setIsMounted] = useState(false);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [topExperts, setTopExperts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session } = useSession();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const isExpert = session?.user && ((session.user as any).role === 'EXPERT' || (session.user as any).role === 'BOTH');
  const itemsPerPage = 5;

  useEffect(() => {
    setIsMounted(true);
    getEstimatesAction().then(res => {
      if (res.success && res.data) {
        setEstimates(res.data);
      }
    });
    
    getRecommendedExpertsAction().then(res => {
      if (res.success && res.data) {
        setTopExperts(res.data);
      }
    });
    
    // 북마크 정보 가져오기
    getMyBookmarkIdsAction().then(res => {
      if (res.success && res.data) {
        setBookmarkedIds(res.data);
      }
    });
  }, []);

  // 필터링 적용
  const filteredExperts = useMemo(() => {
    return topExperts.filter(expert => {
      const matchCategory = selectedCategory === '전체' || expert.category === selectedCategory;
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
  }, [selectedCategory, selectedProvince, selectedCity, estimates]);

  // 페이징 계산
  const totalPages = Math.max(1, Math.ceil(normalRequests.length / itemsPerPage));
  const currentNormalRequests = normalRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 필터 변경시 페이지 1로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedProvince, selectedCity]);

  // 화면 제목에 쓰일 지역 튜플
  const displayRegionText = selectedProvince === '전국' ? '전국' : (selectedCity === '전체' ? selectedProvince : `${selectedProvince} ${selectedCity}`);

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
        
        {/* 추천 전문가 영역 (메인과 유사) */}
        {filteredExperts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  추천 전문가 <Star className="w-5 h-5 text-amber-400 fill-current" />
                </h2>
                <div className="hidden sm:block w-px h-3 bg-slate-200" />
                <p className="text-sm text-slate-500">{displayRegionText} 지역의 평점 높은 전문가님들입니다.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredExperts.slice(0, 4).map(expert => (
                <div key={expert.id} className="relative bg-white rounded-2xl border border-slate-100 p-5 pt-7 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center group">
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="font-bold text-xs text-amber-700">{expert.rating}</span>
                    <span className="text-amber-600/50 text-[10px]">({expert.reviews})</span>
                  </div>
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                    <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h5 className="font-bold text-slate-900 mb-1">{expert.name}</h5>
                  <p className="text-slate-500 text-xs mb-4">{expert.specialty}</p>
                  <button 
                    onClick={() => {
                      const width = 1400;
                      const height = 900;
                      const left = (window.screen.width / 2) - (width / 2);
                      const top = (window.screen.height / 2) - (height / 2);
                      window.open(
                        `/expert/dashboard?userId=${expert.id}`, 
                        'ExpertDashboard', 
                        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                      );
                    }}
                    className="w-full text-xs font-bold bg-blue-50 text-blue-600 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    프로필 보기
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          {/* 긴급 요청 (랜덤 노출) */}
          {urgentRequests.length > 0 && (
            <div className="mb-10 bg-slate-900 rounded-3xl p-8 -mx-4 sm:mx-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    긴급 견적 요청
                  </h2>
                  <div className="hidden sm:block w-px h-4 bg-white/20" />
                  <p className="text-slate-400">오늘 바로 해결이 필요한 긴급 수리 요청입니다</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {urgentRequests.map(req => (
                  <Link 
                    href={`/estimate/${req.id}?cat=${selectedCategory}&prv=${selectedProvince}&cit=${selectedCity}`} 
                    key={req.id}
                  >
                    <div className="relative bg-white p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between group cursor-pointer h-full overflow-hidden">
                      <span className="text-[10px] px-8 pt-2 pb-1 font-bold uppercase bg-orange-500 text-white absolute top-0 left-0 rotate-[-45deg] translate-x-[-28px] translate-y-[0px]">
                        긴급
                      </span>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusMap[req.status]?.color || statusMap['PENDING'].color}`}>
                          {statusMap[req.status]?.label || '매칭중'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                          {req.bids?.length || 0}명 참여
                        </span>
                        {(req.status === 'PENDING' || req.status === 'BIDDING') && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${calculateDDay(req.createdAt).isUrgent ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'}`}>
                            {calculateDDay(req.createdAt).label}
                          </span>
                        )}
                        {isExpert && (
                          <button
                            onClick={(e) => handleToggleBookmark(e, req.id)}
                            className={`p-1.5 rounded-full transition-all border ${
                              bookmarkedIds.includes(req.id)
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                            title="즐겨찾기"
                          >
                            <Star className={`w-3.5 h-3.5 ${bookmarkedIds.includes(req.id) ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                      <div className="mt-8 text-left">
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-1 rounded-md font-bold bg-slate-50 text-slate-400 border border-slate-100">
                            No. {req.requestNumber}
                          </span>
                          <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-slate-100 text-slate-600">
                            {formatCategory(req.category)}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors text-slate-900 line-clamp-1">
                          {formatCategory(req.category)} 요청
                        </h4>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-1">{req.details}</p>
                        <p className="text-slate-400 text-xs mb-6 flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location.split(' ').slice(0, 3).join(' ')} • 빠른 방문 요망</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {(req.authorName || req.customer?.name || "고객").charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-slate-500">{maskName(req.authorName || req.customer?.name)}님</span>
                        </div>
                        <span className="font-bold text-blue-500">견적 협의</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 일반 요청 (최신순) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-slate-900">최신 견적 요청</h2>
              <span className="text-sm font-medium text-slate-500">{normalRequests.length}건의 요청</span>
            </div>
            
            {normalRequests.length > 0 ? (
              <div className="flex flex-col">
                {currentNormalRequests.map(req => (
                  <Link 
                    href={`/estimate/${req.id}?cat=${selectedCategory}&prv=${selectedProvince}&cit=${selectedCity}`} 
                    key={req.id} 
                    className="block my-[5px]"
                  >
                    <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors flex flex-col sm:flex-row justify-between gap-4 group cursor-pointer items-stretch h-full overflow-hidden">
                          {req.isUrgent && (
                            <span className="text-[10px] font-bold text-white bg-orange-500 px-8 py-0.5 uppercase absolute top-0 left-0 rotate-[-45deg] translate-x-[-24px] translate-y-[8px]">
                              긴급
                            </span>
                          )}
                       <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusMap[req.status]?.color || statusMap['PENDING'].color}`}>
                          {statusMap[req.status]?.label || '매칭중'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                          {req.bids?.length || 0}명 참여
                        </span>
                        {(req.status === 'PENDING' || req.status === 'BIDDING') && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${calculateDDay(req.createdAt).isUrgent ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'}`}>
                            {calculateDDay(req.createdAt).label}
                          </span>
                        )}
                        {isExpert && (
                          <button
                            onClick={(e) => handleToggleBookmark(e, req.id)}
                            className={`p-1.5 rounded-full transition-all border ${
                              bookmarkedIds.includes(req.id)
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-slate-300 hover:text-slate-400'
                            }`}
                            title="즐겨찾기"
                          >
                            <Star className={`w-3.5 h-3.5 ${bookmarkedIds.includes(req.id) ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 mt-4 sm:mt-0 text-left">
                        <div className="flex items-center gap-2 mb-2 pr-12">
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-50 text-slate-400 border border-slate-100">
                            No. {req.requestNumber}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {formatCategory(req.category)}
                          </span>
                          <span className="hidden sm:inline-block text-xs text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 pr-12">
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors shrink-0">
                            {formatCategory(req.category)} 요청
                          </h4>
                          <div className="w-px h-3 bg-slate-200 shrink-0 hidden sm:block" />
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {req.details}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location.split(' ').slice(0, 3).join(' ')}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">{(req.authorName || req.customer?.name || "고객").charAt(0)}</div>
                            {maskName(req.authorName || req.customer?.name)}님
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-end shrink-0 border-t sm:border-t-0 mt-3 sm:mt-auto pt-3 sm:pt-0 border-slate-100 h-full gap-2">
                        <div className="text-sm font-bold text-slate-900">견적 협의</div>
                        <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          자세히 보기 <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* 페이징 UI */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                            currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                선택한 조건에 맞는 일반 견적 요청이 없습니다.<br/>
                다른 지역이나 분야를 선택해보세요.
              </div>
            )}
          </div>
        </section>

      </div>

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
