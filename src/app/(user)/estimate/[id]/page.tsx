'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Star
} from 'lucide-react';
import { 
  getEstimateByIdAction, 
  deleteEstimateAction, 
  getAdjacentEstimateIdsAction 
} from '@/actions/estimate.action';
import { submitBidAction } from '@/actions/bid.action';
import { checkDateAvailabilityAction } from '@/actions/expert.action';
import { maskName, maskContact, maskAddress, formatCategory, calculateDDay } from '@/lib/utils';
import Link from 'next/link';
import BidDetailModal from '@/components/user/BidDetailModal';
import EstimateEditModal from '@/components/user/EstimateEditModal';

export default function EstimateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 필터 정보 추출
  const cat = searchParams.get('cat') || '전체';
  const prv = searchParams.get('prv') || '전국';
  const cit = searchParams.get('cit') || '전체';
  const filterParams = `?cat=${cat}&prv=${prv}&cit=${cit}`;

  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userGrade, setUserGrade] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidDetailModal, setShowBidDetailModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [adjacentPosts, setAdjacentPosts] = useState<{ prev: any, next: any }>({ prev: null, next: null });
  const [bidForm, setBidForm] = useState({ price: '', message: '' });
  const [hasParticipated, setHasParticipated] = useState(false);
  const [bidItems, setBidItems] = useState([
    { name: '', content: '', periodValue: '1', periodUnit: '일', amount: '' }
  ]);
  const [bidMessage, setBidMessage] = useState('');
  const [selectedAvailableDates, setSelectedAvailableDates] = useState<string[]>([]);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const addBidItem = () => {
    setBidItems([...bidItems, { name: '', content: '', periodValue: '1', periodUnit: '일', amount: '' }]);
  };

  const removeBidItem = (index: number) => {
    if (bidItems.length === 1) return;
    setBidItems(bidItems.filter((_, i) => i !== index));
  };

  const updateBidItem = (index: number, field: string, value: string) => {
    const newItems = [...bidItems];
    
    // 금액 항목일 경우 마이너스 입력 방지
    if (field === 'amount') {
      const numericValue = parseInt(value);
      if (numericValue < 0) {
        (newItems[index] as any)[field] = '0';
      } else {
        (newItems[index] as any)[field] = value;
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    setBidItems(newItems);
  };

  const getTotalAmount = () => {
    const baseAmount = bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0);
    const vat = userGrade === 'PRO' ? Math.floor(baseAmount * 0.1) : 0;
    return baseAmount + vat;
  };

  // 키보드 이벤트 처리 (내비게이션용)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      
      if (e.key === 'Escape') setSelectedImageIndex(null);
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !estimate?.photoUrls) return;
    setSelectedImageIndex((selectedImageIndex - 1 + estimate.photoUrls.length) % estimate.photoUrls.length);
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null || !estimate?.photoUrls) return;
    setSelectedImageIndex((selectedImageIndex + 1) % estimate.photoUrls.length);
  };

  // 배경 스크롤 방지 (팝업 오픈 시)
  useEffect(() => {
    if (selectedImageIndex !== null || showDeleteModal || showBidModal || showBidDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImageIndex, showDeleteModal, showBidModal, showBidDetailModal]);

  useEffect(() => {
    async function fetchData() {
      // 세션 정보 가져오기 (작성자 확인용)
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user?.id) {
          setUserId(parseInt(session.user.id, 10));
          const role = session.user.role || 'USER';
          setUserRole(role);
          setUserGrade((session.user as any).grade);
        }
      } catch (err) {
        console.error("Session fetch failed", err);
      }

      const res = await getEstimateByIdAction(id);
      if (res.success && res.data) {
        setEstimate(res.data);
        
        // 사용자가 이미 참여했는지 확인
        if (userId && (res.data as any).bids) {
          const contributed = (res.data as any).bids.some((bid: any) => bid.expertId === userId);
          setHasParticipated(contributed);
        }

        // 이전/다음글 정보 가져오기 (필터 적용)
        const adjRes = await getAdjacentEstimateIdsAction(id, { 
          category: cat, 
          province: prv, 
          city: cit 
        });
        if (adjRes.success && adjRes.data) {
          setAdjacentPosts(adjRes.data);
        }
      } else {
        alert(res.error || "데이터를 불러오는데 실패했습니다.");
        router.push(`/estimate${filterParams}`);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, router, cat, prv, cit, userId]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userId) return;
    setIsDeleting(true);

    const res = await deleteEstimateAction(id, userId);
    setIsDeleting(false);
    setShowDeleteModal(false);

    if (res.success) {
      router.push('/estimate');
    } else {
      console.error(res.error || "삭제에 실패했습니다.");
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || isSubmittingBid) return;

    // 유효성 검사
    const isValid = bidItems.every(item => item.name && item.amount && parseInt(item.amount) > 0);
    if (!isValid) {
      setErrorModalMessage("모든 항목의 명칭과 올바른 금액을 입력해 주세요.");
      return;
    }

    // 서비스 가능일 파싱
    let parsedDates: string[] = [];
    if (estimate?.serviceDate) {
      if (estimate.serviceDate.startsWith('희망일:')) {
        parsedDates = estimate.serviceDate.replace('희망일: ', '').split(', ');
      } else if (estimate.serviceDate.startsWith('정기:')) {
        const match = estimate.serviceDate.match(/\((.*?)\)/);
        if (match && match[1]) {
          parsedDates = match[1].split(', ').map((day: string) => `${day}요일`);
        }
      } else if (estimate.serviceDate.startsWith('가능일:')) {
        parsedDates = estimate.serviceDate.replace('가능일: ', '').split(', ');
      } else if (estimate.serviceDate.includes(',')) {
        parsedDates = estimate.serviceDate.split(',').map((d: string) => d.trim());
      } else {
        parsedDates = [estimate.serviceDate];
      }
    }

    if (parsedDates.length > 0 && selectedAvailableDates.length === 0) {
      setErrorModalMessage("서비스 가능일을 확인하고 선택해 주세요.");
      return;
    }

    // 일정 중복 검증
    if (selectedAvailableDates.length > 0) {
      setIsSubmittingBid(true);
      const conflictRes = await checkDateAvailabilityAction(userId, selectedAvailableDates);
      setIsSubmittingBid(false);
      if (conflictRes.success && conflictRes.hasConflict) {
        setErrorModalMessage(`이미 달력에 다른 일정이 등록된 날짜(${conflictRes.conflicts?.join(', ')})가 포함되어 있습니다. 다른 서비스 가능일을 선택해 주세요.`);
        return;
      }
    }

    setIsSubmittingBid(true);
    const res = await submitBidAction({
      estimateId: id,
      expertId: userId,
      items: bidItems.map(item => ({
        name: item.name,
        content: item.content,
        period: `${item.periodValue}${item.periodUnit}`,
        amount: (parseInt(item.amount) || 0) * 10000
      })),
      message: bidMessage,
      availableDate: selectedAvailableDates.length > 0 ? selectedAvailableDates.join(', ') : '',
    });

    setIsSubmittingBid(false);
    if (res.success) {
      // 폼 초기화 및 데이터 새로고침
      setBidItems([{ name: '', content: '', periodValue: '1', periodUnit: '일', amount: '' }]);
      setBidMessage('');
      setSelectedAvailableDates([]);
      
      const refreshRes = await getEstimateByIdAction(id);
      if (refreshRes.success) {
        setEstimate(refreshRes.data);
        setHasParticipated(true);
        // 하단 견적서 목록으로 스크롤
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    } else {
      setErrorModalMessage(res.error || "견적 제출에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!estimate) return null;

  const isAuthor = estimate && userId === estimate.customerId;
  const isExpert = userRole === 'EXPERT' || userRole === 'BOTH';
  const isExpired = estimate && calculateDDay(estimate.createdAt, estimate.isClosed).label === '요청 마감';
  const canBid = isExpert && userGrade && !isAuthor && !hasParticipated && (estimate?.status === 'PENDING' || estimate?.status === 'BIDDING') && !isExpired && !estimate?.isClosed;

  return (
    <div className="bg-slate-50">
      {/* 상단 네비게이션 */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => router.push(`/estimate${filterParams}`)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> 목록으로
          </button>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-slate-200">
              {adjacentPosts.prev ? (
                <Link 
                  href={`/estimate/${adjacentPosts.prev.id}${filterParams}`}
                  className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> 이전 요청
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-sm font-bold text-slate-200 cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" /> 이전 요청
                </span>
              )}
              
              {adjacentPosts.next ? (
                <Link 
                  href={`/estimate/${adjacentPosts.next.id}${filterParams}`}
                  className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  다음 요청 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="flex items-center gap-1 text-sm font-bold text-slate-200 cursor-not-allowed">
                  다음 요청 <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {isAuthor && (
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit3 className="w-4 h-4" /> 수정
                </button>
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 font-bold text-xs transition-colors"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 견적 메인 정보 헤더 */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-slate-900">{formatCategory(estimate.category)} 요청</h1>
            <div className="flex flex-wrap items-center gap-3">
              {estimate.requestNumber && (
                <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-md shadow-sm">
                  No. {estimate.requestNumber}
                </span>
              )}
              {estimate.isUrgent && (
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 긴급
                </span>
              )}
              <span className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> {formatCategory(estimate.category)}
              </span>
              <span className={`text-xs font-bold px-4 py-1 rounded-full shadow-md ${
                estimate.status === 'PENDING' ? 'bg-blue-600 text-white' :
                estimate.status === 'BIDDING' ? 'bg-emerald-500 text-white' :
                estimate.status === 'SELECTED' ? 'bg-emerald-500 text-white' :
                estimate.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white' :
                'bg-slate-500 text-white'
              }`}>
                {estimate.status === 'PENDING' ? '매칭중' :
                 estimate.status === 'BIDDING' ? '견적중' :
                 estimate.status === 'SELECTED' ? '전문가선택' :
                 estimate.status === 'IN_PROGRESS' ? '전문가확정' :
                 estimate.status === 'COMPLETED' ? '서비스완료' : '취소'}
              </span>
              {(estimate.status === 'PENDING' || estimate.status === 'BIDDING') && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-md ${calculateDDay(estimate.createdAt, estimate.isClosed).isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-white'}`}>
                  {calculateDDay(estimate.createdAt, estimate.isClosed).label}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-50">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">지역 정보</p>
                  <p className="text-sm font-bold text-slate-700">{maskAddress(estimate.location)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">요청 일시</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(estimate.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {estimate.serviceDate && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase mb-0.5">서비스 희망 일</p>
                    <p className="text-sm font-bold text-slate-700">
                      {estimate.serviceDate}
                      {estimate.serviceTime && ` (${estimate.serviceTime})`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">요청자</p>
                  <p className="text-sm font-bold text-slate-700">{maskName(estimate.authorName || estimate.customer?.name)}님</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">연락처</p>
                  <p className="text-sm font-bold text-slate-700">{maskContact(estimate.contact)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> 상세 요청 내용
            </h3>
            <div className="bg-slate-50 rounded-2xl p-6 text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
              {estimate.details}
            </div>
          </div>

          {estimate.photoUrls && estimate.photoUrls.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4">첨부 사진 ({estimate.photoUrls.length})</h3>
              <div className="flex flex-wrap gap-4">
                {estimate.photoUrls.map((url: string, index: number) => (
                  <div 
                    key={index} 
                    onClick={() => setSelectedImageIndex(index)}
                    className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group relative"
                  >
                    <img 
                      src={url} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전문가용: 견적서 작성 폼 (인라인) */}
          {isExpired && isExpert && !isAuthor && !hasParticipated ? (
            <div className="mt-12 p-10 bg-slate-100 rounded-3xl border border-slate-200 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-sm">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">마감된 요청입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                해당 요청의 견적 참여 기간이 종료되어<br/>
                더 이상 견적서를 제출할 수 없습니다.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 text-slate-600 rounded-full text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> 다른 견적 요청을 확인해 보시는 건 어떨까요?
              </div>
            </div>
          ) : canBid ? (
            <div id="bid-form" className="mt-12 pt-12 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">견적서 작성하기</h3>
                  <p className="text-slate-500 text-sm mt-1">항목별로 상세한 견적 내용을 입력해 주세요.</p>
                </div>
                <button 
                  type="button"
                  onClick={addBidItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> 항목 추가
                </button>
              </div>

              {/* 서비스 가능일 선택기 */}
              {estimate?.serviceDate && (
                <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" /> 서비스 가능일 선택
                    <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-slate-500 text-xs mb-4">고객님이 희망하는 서비스 일정 중, 방문 가능한 날짜를 모두 선택해 주세요.</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      let parsedDates: string[] = [];
                      if (estimate.serviceDate.startsWith('희망일:')) {
                        parsedDates = estimate.serviceDate.replace('희망일: ', '').split(', ');
                      } else if (estimate.serviceDate.startsWith('정기:')) {
                        const match = estimate.serviceDate.match(/\((.*?)\)/);
                        if (match && match[1]) {
                          parsedDates = match[1].split(', ').map((day: string) => `${day}요일`);
                        }
                      } else if (estimate.serviceDate.startsWith('가능일:')) {
                        parsedDates = estimate.serviceDate.replace('가능일: ', '').split(', ');
                      } else if (estimate.serviceDate.includes(',')) {
                        parsedDates = estimate.serviceDate.split(',').map((d: string) => d.trim());
                      } else {
                        parsedDates = [estimate.serviceDate];
                      }

                      return parsedDates.map((dateStr, idx) => {
                        const isSelected = selectedAvailableDates.includes(dateStr);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedAvailableDates(prev => 
                                isSelected ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                              );
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            {dateStr}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {bidItems.map((item, index) => (
                  <div key={index} className="group relative bg-slate-50 rounded-2xl p-6 border border-transparent hover:border-blue-200 transition-all">
                    {bidItems.length > 1 && (
                      <button 
                        onClick={() => removeBidItem(index)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 ml-1">항목명</label>
                        <input 
                          type="text"
                          placeholder="예: 자재비"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                          value={item.name}
                          onChange={(e) => updateBidItem(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-4">
                        <label className="text-xs font-bold text-slate-400 ml-1">내용</label>
                        <input 
                          type="text"
                          placeholder="예: 친환경 벽지"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                          value={item.content}
                          onChange={(e) => updateBidItem(index, 'content', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-slate-400 ml-1">예상 소요기간</label>
                        <div className="flex gap-1">
                          <select 
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={item.periodValue}
                            onChange={(e) => updateBidItem(index, 'periodValue', e.target.value)}
                          >
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                          <select 
                            className="w-auto shrink-0 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={item.periodUnit}
                            onChange={(e) => updateBidItem(index, 'periodUnit', e.target.value)}
                          >
                            <option value="일">일</option>
                            <option value="주">주</option>
                            <option value="월">월</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold text-slate-400 ml-1">예상 금액(만원)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            placeholder="0"
                            min="0"
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xl font-black text-blue-600 text-right leading-none"
                            value={item.amount}
                            onChange={(e) => updateBidItem(index, 'amount', e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">만원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 추가 메시지 (항목 하단에 배치) */}
              <div className="mt-8 space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" /> 전문가 메시지 (선택)
                </label>
                <textarea 
                  placeholder="고객님께 전달할 추가 제안이나 전문가님만의 차별점을 2줄 이상 상세히 입력해 주세요."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-28 text-base resize-none leading-relaxed"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                />
              </div>

              {/* 정산 상세 내역 및 최종 금액 */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" /> 예상 정산 내역 확인
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      플랫폼 수수료는 합리적인 상한제 적용 (최대 1만원)
                    </span>
                  </h4>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">총 항목 합계</span>
                      <span className="text-slate-900 font-black">
                        {(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0)).toLocaleString()}원
                      </span>
                    </div>

                    {userGrade === 'PRO' && (
                      <div className="flex justify-between items-center text-sm mt-3">
                        <span className="text-slate-500 font-medium">부가세 (10%)</span>
                        <span className="text-blue-600 font-black">
                          + {(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.1)).toLocaleString()}원
                        </span>
                      </div>
                    )}

                    <div className="h-px bg-slate-50 mt-3" />

                    <div className="flex justify-between items-center text-sm mt-[5px]">
                      <span className="text-slate-500 font-medium">PG 수수료 (3%)</span>
                      <span className="text-red-500 font-bold">
                        - {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03).toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm mt-[5px]">
                      <span className="text-slate-500 font-medium">플랫폼 이용료 (2%, 최대 1만)</span>
                      <div className="flex items-center gap-2">
                        {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02) > 10000 && (
                          <span className="text-slate-400 line-through text-[11px]">
                            - {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02).toLocaleString()}원
                          </span>
                        )}
                        <span className="text-red-500 font-bold">
                          - {Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000).toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm mt-[5px]">
                      <span className="text-slate-500 font-medium">이용료 부가세 (10%)</span>
                      <span className="text-red-500 font-bold">
                        - {Math.floor((
                          Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + 
                          Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000)
                        ) * 0.1).toLocaleString()}원
                      </span>
                    </div>

                    {userGrade === 'HELPER' && (
                      <div className="flex justify-between items-center text-sm text-slate-400 mt-[5px]">
                        <span className="font-medium">원천세 (3.3%)</span>
                        <span className="font-bold">
                          - {(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.033)).toLocaleString()}원
                        </span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">최종 예상 입금액</p>
                        <p className="text-xs text-slate-400">수수료 및 세금 공제 후</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-blue-600">
                          {(
                            getTotalAmount() - 
                            (
                              Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + // PG (3%)
                              Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000) // Platform (2% cap 10k)
                            ) -
                            Math.floor((
                              Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + 
                              Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000)
                            ) * 0.1) - // Fee VAT (10%)
                            (userGrade === 'HELPER' ? Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.033) : 0) // Tax
                          ).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-600 ml-0.5">원</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden group h-full flex flex-col min-h-[160px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all" />
                  <p className="text-white/70 text-sm font-bold mb-1 relative z-10">
                    총 견적 금액 {userGrade === 'PRO' && <span className="text-blue-400 text-[10px] ml-1">(VAT 포함)</span>}
                  </p>
                  <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">{getTotalAmount().toLocaleString()}</span>
                      <span className="text-lg font-bold text-white/60">원</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleBidSubmit}
                    disabled={isSubmittingBid}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:bg-slate-700 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isSubmittingBid ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        견적 보내기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : estimate?.isClosed || (estimate?.status !== 'PENDING' && estimate?.status !== 'BIDDING') ? (
            <div className="mt-12 p-10 bg-slate-50 rounded-3xl border border-slate-100 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-500 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">마감된 요청입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                해당 견적 요청이 마감되었거나 이미 전문가가 선택되어<br/>더 이상 제안을 작성할 수 없습니다.
              </p>
            </div>
          ) : isAuthor ? (
            <div className="mt-12 p-10 bg-slate-50 rounded-3xl border border-slate-100 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-500 shadow-sm">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">본인이 작성한 요청입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                고객으로서 직접 등록하신 견적 요청에는 스스로 견적서를 작성할 수 없습니다.
              </p>
            </div>
          ) : hasParticipated ? (
            <div className="mt-12 p-10 bg-blue-50 rounded-3xl border border-blue-100 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">이미 참여한 견적입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                전문가님께서 이미 이 요청에 대한 견적서를 제출 완료하셨습니다.<br/>
                상단의 제출된 견적 목록을 확인해주세요.
              </p>
            </div>
          ) : (userId && isExpert && !userGrade) ? (
            <div className="mt-12 p-10 bg-amber-50 rounded-3xl border border-amber-100 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-sm">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">전문가 승인 진행 중입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                관리자가 제출하신 서류를 확인하고 있습니다.<br/>
                승인이 완료되면(PRO 또는 HELPER 등급 부여) 견적 참여가 가능합니다.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-100/50 text-amber-700 rounded-full text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> 대개 영업일 기준 1~2일 내에 승인됩니다.
              </div>
            </div>
          ) : (userId && !isExpert && !isAuthor) ? (
            <div className="mt-12 p-10 bg-slate-50 rounded-3xl border border-slate-100 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">전문가 전용 영역입니다</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                견적 요청에 참여하려면 전문가 회원으로 전환이 필요합니다.<br/>
                전문가님들의 소중한 견적을 기다리고 있습니다.
              </p>
              <button 
                onClick={() => alert("전문가 전환 서비스 준비 중입니다.")}
                className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95"
              >
                전문가 신청하기
              </button>
            </div>
          ) : null}

        </section>

        {/* 이미지 라이트박스 팝업 */}
        {selectedImageIndex !== null && estimate.photoUrls && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 sm:p-20 animate-in fade-in duration-300 !m-0">
            <button 
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full z-50"
            >
              <X className="w-10 h-10" />
            </button>

            {estimate.photoUrls.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute left-4 sm:left-10 text-white/50 hover:text-white transition-all p-3 hover:bg-white/10 rounded-full z-10 translate-y-[-50%] top-1/2"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute right-4 sm:right-10 text-white/50 hover:text-white transition-all p-3 hover:bg-white/10 rounded-full z-10 translate-y-[-50%] top-1/2"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center">
                <img 
                  src={estimate.photoUrls[selectedImageIndex]} 
                  alt={`Selected photo ${selectedImageIndex + 1}`} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-8 flex items-center gap-2">
                {estimate.photoUrls.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === selectedImageIndex ? 'bg-blue-500 w-8' : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/40 text-sm mt-4 font-medium">
                {selectedImageIndex + 1} / {estimate.photoUrls.length}
              </p>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">정말 삭제하시겠습니까?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  삭제된 견적 요청은 복구할 수 없습니다.<br/>신중하게 결정해 주세요.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    아니오
                  </button>
                  <button 
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:bg-red-300"
                  >
                    {isDeleting ? '삭제 중...' : '네, 삭제합니다'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 오류 안내 모달 */}
        {errorModalMessage && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">안내</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed whitespace-pre-wrap">
                  {errorModalMessage}
                </p>
                
                <div className="flex justify-center">
                  <button 
                    type="button"
                    onClick={() => setErrorModalMessage('')}
                    className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 견적 참여 모달 */}
        {showBidModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <form onSubmit={handleBidSubmit}>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-900">견적 참여하기</h3>
                    <button 
                      type="button"
                      onClick={() => setShowBidModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* 금액 입력 */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        제안 금액 (원)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          required
                          placeholder="예: 150000"
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-lg text-blue-600"
                          value={bidForm.price}
                          onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 메시지 입력 */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        전문가 메시지 (선택사항)
                      </label>
                      <textarea 
                        placeholder="고객님께 전달할 추가 제안 내용을 입력해 주세요."
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px] text-sm resize-none"
                        value={bidForm.message}
                        onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowBidModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      취소
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingBid}
                      className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:bg-blue-300"
                    >
                      {isSubmittingBid ? '제출 중...' : '견적 제출하기'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 참여 전문가 리스트 */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              참여 전문가 <span className="text-blue-600">{estimate.bids?.length || 0}</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {estimate.bids && estimate.bids.length > 0 ? (
              estimate.bids.map((bid: any) => (
                <div 
                  key={bid.id} 
                  className="relative bg-white rounded-2xl border border-slate-100 p-5 pt-7 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-center group flex flex-col items-center justify-center"
                >
                  {bid.status === 'ACCEPTED' ? (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm z-10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black">채택됨</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className="font-bold text-xs text-amber-700">5.0</span>
                      <span className="text-amber-600/50 text-[10px]">(0)</span>
                    </div>
                  )}
                  
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <img 
                      src={bid.expert.image || `https://picsum.photos/seed/${bid.expert.id}/100/100`} 
                      alt={bid.expert.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h5 className="font-bold text-slate-900 mb-1">{bid.expert.name} 전문가</h5>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-1">{bid.expert.specialty || `${formatCategory(estimate.category)} 전문`}</p>

                  {/* 제안 금액 추가 */}
                  <div className="mb-4 text-center">
                    <p className="text-[10px] text-slate-400 mb-0.5">제안 금액</p>
                    <p className="text-sm font-black text-blue-600">{bid.price?.toLocaleString()}원</p>
                  </div>

                  <div className="flex gap-2 w-full mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const width = 1400;
                        const height = 900;
                        const left = (window.screen.width / 2) - (width / 2);
                        const top = (window.screen.height / 2) - (height / 2);
                        window.open(
                          `/expert/dashboard?userId=${bid.expert.id}`, 
                          'ExpertProfile', 
                          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                        );
                      }}
                      className={`${isAuthor ? 'flex-1' : 'w-full'} text-xs font-bold bg-slate-50 text-slate-600 py-2.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200`}
                    >
                      프로필 보기
                    </button>
                    {isAuthor && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBid(bid);
                          setShowBidDetailModal(true);
                        }}
                        className="flex-1 text-xs font-bold bg-blue-50 text-blue-600 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                      >
                        견적 상세보기
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">아직 도착한 견적이 없습니다.</p>
                <p className="text-slate-300 text-sm mt-1">전문가들이 견적을 검토하고 있습니다.</p>
              </div>
            )}
          </div>
        </section>
        {/* 미로그인 시 안내 (선택사항) */}
        {!userId && (
          <div className="sticky bottom-5 z-50 w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-5 shadow-2xl shadow-slate-900/20 flex items-center justify-between gap-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black leading-snug">로그인하시면 견적을 작성 하실수 있습니다.</p>
                  <p className="text-[10px] text-white/50 font-bold mt-0.5">원픽의 모든 서비스를 경험해 보세요</p>
                </div>
              </div>
              <Link href="/api/auth/signin">
                <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0">
                  로그인하기
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 견적 제안 상세 모달 */}
      <BidDetailModal 
        isOpen={showBidDetailModal} 
        onClose={() => setShowBidDetailModal(false)} 
        bid={selectedBid} 
      />

      {/* 수정 모달 */}
      {userId && (
        <EstimateEditModal
          estimateId={estimate.id}
          customerId={userId.toString()}
          customerName={estimate.authorName || '고객'}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialStep={estimate.currentStep}
          onSuccess={() => {
            setIsEditOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
