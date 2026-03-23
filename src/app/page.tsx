'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Star, 
  Zap, 
  Hammer, 
  Droplets, 
  Lightbulb, 
  Brush, 
  AirVent, 
  Car, 
  Baby, 
  GraduationCap, 
  Palette, 
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import * as motion from 'motion/react-client';

// --- Mock Data ---

const categories = [
  { id: 1, name: '도배/장판', icon: <Brush className="w-8 h-8" />, color: 'bg-blue-50 text-blue-600' },
  { id: 2, name: '욕실/주방', icon: <Droplets className="w-8 h-8" />, color: 'bg-cyan-50 text-cyan-600' },
  { id: 3, name: '전기/조명', icon: <Lightbulb className="w-8 h-8" />, color: 'bg-amber-50 text-amber-600' },
  { id: 4, name: '청소/이사', icon: <Hammer className="w-8 h-8" />, color: 'bg-emerald-50 text-emerald-600' },
  { id: 5, name: '가전/에어컨', icon: <AirVent className="w-8 h-8" />, color: 'bg-sky-50 text-sky-600' },
  { id: 6, name: '자동차 수리', icon: <Car className="w-8 h-8" />, color: 'bg-slate-50 text-slate-600' },
  { id: 7, name: '베이비/펫시터', icon: <Baby className="w-8 h-8" />, color: 'bg-rose-50 text-rose-600' },
  { id: 8, name: '과외/레슨', icon: <GraduationCap className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-600' },
  { id: 9, name: '디자인/IT', icon: <Palette className="w-8 h-8" />, color: 'bg-violet-50 text-violet-600' },
  { id: 10, name: '기타 서비스', icon: <MoreHorizontal className="w-8 h-8" />, color: 'bg-stone-50 text-stone-600' },
];

const emergencyRequests = [
  { id: 1, tag: '매우 급함', title: '싱크대 배관 누수 수리', location: '강남구 역삼동', time: '오늘 내 해결 희망', price: '견적 협의', urgent: true },
  { id: 2, tag: '오늘 방문', title: '현관 도어락 교체', location: '서초구 서초동', time: '18시 이전 방문 희망', price: '50,000원~', urgent: false },
  { id: 3, tag: '매우 급함', title: '변기 막힘 뚫음', location: '송파구 잠실동', time: '즉시 방문 가능 전문가님', price: '견적 협의', urgent: true },
  { id: 4, tag: '오늘 방문', title: '전기 누전 점검', location: '강남구 논현동', time: '야간 방문 가능 희망', price: '80,000원~', urgent: false },
];

const topExperts = [
  { 
    id: 1, 
    name: '김도준 전문가', 
    specialty: '도배 · 장판 시공 전문', 
    rating: 4.9, 
    reviews: 128, 
    hires: 542, 
    experience: 12,
    image: 'https://picsum.photos/seed/expert1/200/200'
  },
  { 
    id: 2, 
    name: '이지은 디자이너', 
    specialty: '인테리어 조명 기획', 
    rating: 5.0, 
    reviews: 84, 
    hires: 215, 
    experience: 7,
    image: 'https://picsum.photos/seed/expert2/200/200'
  },
  { 
    id: 3, 
    name: '박정호 전문가', 
    specialty: '종합 설비/누수 수리', 
    rating: 4.8, 
    reviews: 310, 
    hires: 1240, 
    experience: 20,
    image: 'https://picsum.photos/seed/expert3/200/200'
  },
  { 
    id: 4, 
    name: '최윤지 전문가', 
    specialty: '친환경 페인트 시공', 
    rating: 4.9, 
    reviews: 95, 
    hires: 312, 
    experience: 5,
    image: 'https://picsum.photos/seed/expert4/200/200'
  },
];

const realTimeRequests = [
  { id: 1, category: '싱크대 수리', title: '싱크대 수전 교체 및 배수구 막힘 해결 부탁드립니다.', location: '강남구 역삼동', time: '5분 전', participants: 5 },
  { id: 2, category: '조명 설치', title: '거실 LED 매립등 6구 설치 및 기존 스위치 교체 원해요.', location: '서초구 서초동', time: '12분 전', participants: 3 },
  { id: 3, category: '도배/장판', title: '방 1개 실크 벽지 부분 도배 및 장판 보수 문의합니다.', location: '송파구 잠실동', time: '20분 전', participants: 8 },
  { id: 4, category: '현관문 수리', title: '현관문 도어클로저 교체 및 번호키 작동 오류 점검', location: '강남구 논현동', time: '35분 전', participants: 2 },
];

const reviews = [
  { 
    id: 1, 
    category: '도배/장판', 
    text: '전문가님 덕분에 칙칙했던 거실이 너무 화사해졌어요! 시간도 잘 지켜주시고 마감도 정말 깔끔해서 감동했습니다. 다음에도 꼭 연락드릴게요!', 
    author: '김*하 고객님', 
    time: '2일 전', 
    image: 'https://picsum.photos/seed/review1/600/400' 
  },
  { 
    id: 2, 
    category: '수전 수리', 
    text: '갑자기 물이 안나와서 당황했는데 요청한지 30분만에 와주셨어요. 부품 설명도 자세히 해주시고 가격도 합리적이어서 정말 만족스럽습니다.', 
    author: '박*우 고객님', 
    time: '방금 전' 
  },
  { 
    id: 3, 
    category: '조명 설치', 
    text: '원하던 느낌대로 조명을 잘 설치해주셨어요. 설치 후 뒷정리까지 깔끔하게 해주셔서 따로 손 갈 데가 없었네요. 추천합니다!', 
    author: '이*영 고객님', 
    time: '5시간 전', 
    image: 'https://picsum.photos/seed/review3/600/400' 
  },
];

// --- Components ---

const SectionHeader = ({ title, subtitle, showAll = true }: { title: string, subtitle?: string, showAll?: boolean }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h3 className="text-2xl font-bold text-blue-500">{title}</h3>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {showAll && (
      <a href="#" className="flex items-center text-blue-500 font-bold hover:underline">
        전체보기 <ChevronRight className="w-5 h-5" />
      </a>
    )}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('전국');
  const [titleIndex, setTitleIndex] = useState(0);

  const rotatingTitles = useMemo(() => [
    "우리 집 수리, 믿을 수 있는 전문가에게",
    "새로운 배움의 시작, 검증된 전문가와",
    "생활의 모든 불편함, 내 손 안의 전문가로"
  ], []);

  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = rotatingTitles[titleIndex];
      
      if (!isDeleting) {
        setDisplayText(fullText.substring(0, displayText.length + 1));
        setTypingSpeed(50);
        
        if (displayText === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
          setTypingSpeed(50);
        }
      } else {
        setDisplayText(fullText.substring(0, displayText.length - 1));
        setTypingSpeed(30);
        
        if (displayText === '') {
          setIsDeleting(false);
          setTitleIndex((prev) => (prev + 1) % rotatingTitles.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, titleIndex, rotatingTitles, typingSpeed]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">


      <main>
        {/* Hero Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-black mb-4 tracking-tight min-h-[3.5rem] md:min-h-[4rem] flex items-center justify-center transition-all"
            >
              <span className="relative">
                {displayText}
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-[3px] h-[35px] md:h-[45px] bg-blue-500 ml-1 align-middle"
                />
              </span>
            </motion.h1>
            <p className="text-slate-500 text-lg mb-12">전국 5만 명의 검증된 전문가가 당신의 요청을 기다리고 있습니다.</p>
            
            <div className="relative max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-2xl shadow-blue-500/10 border border-slate-100 p-2 gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 w-full border-b md:border-b-0 md:border-r border-slate-100 h-14">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="어떤 수리가 필요하신가요? (예: 화장실)" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 w-full h-14">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="지역 입력 (예: 강남구 역삼동)" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <button className="w-full md:w-auto bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all">
                  검색하기
                </button>
              </div>
              
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                <span className="text-slate-400">인기 키워드:</span>
                {['#에어컨세척', '#도배장판', '#싱크대수전', '#입주청소'].map(tag => (
                  <a key={tag} href="#" className="text-blue-500 font-medium hover:underline">{tag}</a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h3 className="text-2xl font-bold">견적 요청 카테고리</h3>
              <p className="text-slate-500 mt-1">필요한 요청 항목을 선택해 주세요</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['전국', '강남구', '서초구', '송파구'].map(city => (
                <button 
                  key={city}
                  onClick={() => setActiveTab(city)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeTab === city 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city} {city === '전국' && <span className="ml-1 text-[10px]">▼</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat, idx) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-center"
              >
                <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <h4 className="font-bold text-slate-800">{cat.name}</h4>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Emergency Requests */}
        <section className="bg-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader 
              title="긴급 요청" 
              subtitle="오늘 바로 해결이 필요한 긴급 수리 요청입니다" 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {emergencyRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${
                      req.urgent ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {req.tag}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-1">{req.title}</h4>
                  <p className="text-slate-400 text-sm mb-6">{req.location} • {req.time}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="font-bold text-blue-500">{req.price}</span>
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Rated Experts */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader 
              title="강남구 최고 평점 전문가" 
              subtitle="실력과 신뢰가 검증된 추천 전문가를 만나보세요" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topExperts.map(expert => (
                <div key={expert.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                      <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">{expert.name}</h5>
                      <p className="text-slate-500 text-sm">{expert.specialty}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        <span className="font-bold text-sm">{expert.rating}</span>
                        <span className="text-slate-400 text-xs">({expert.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6 text-center py-4 bg-white rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">고용 횟수</p>
                      <p className="font-black text-blue-500">{expert.hires}회</p>
                    </div>
                    <div className="border-l border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">경력</p>
                      <p className="font-black">{expert.experience}년</p>
                    </div>
                  </div>
                  <button className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors">
                    무료 견적 받기
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real-time Requests */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader 
              title="실시간 견적 요청 현황" 
              subtitle="지금 바로 전문가님의 손길을 기다리는 요청서들입니다" 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {realTimeRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="mb-4">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-black">
                      {req.category}
                    </span>
                  </div>
                  <p className="font-bold mb-6 line-clamp-2 min-h-[3rem]">{req.title}</p>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
                      <MapPin className="w-3 h-3" />
                      <span>{req.location} | {req.time}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">{req.participants}명의 전문가 참여 중</span>
                      <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-black mb-2">실제 이용 고객 리뷰</h3>
            <p className="text-slate-500 mb-12">원픽과 함께한 고객님들의 생생한 후기를 확인하세요</p>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="break-inside-avoid bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  {review.image && (
                    <div className="h-48 overflow-hidden rounded-xl mb-4">
                      <img src={review.image} alt="Review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{review.category}</span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">&quot;{review.text}&quot;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {review.author[0]}
                    </div>
                    <span className="text-xs font-bold">{review.author}</span>
                    <span className="text-slate-400 text-xs ml-auto">{review.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>


    </div>
  );
}
