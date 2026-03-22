import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  MapPin, 
  Calendar,
  User,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  Star,
  AlertCircle
} from 'lucide-react';
import { formatCategory, maskName, calculateDDay } from '@/lib/utils';
import Link from 'next/link';
import EstimateDetailModal from './EstimateDetailModal';
import EstimateEditModal from './EstimateEditModal';
import BidDetailModal from './BidDetailModal';
import ChatPopupModal from '../chat/ChatPopupModal';
import { deleteEstimateAction } from '@/actions/estimate.action';
import { acceptBidAction } from '@/actions/bid.action';
import { useSession } from 'next-auth/react';

interface BidItem {
  id: string;
  name: string;
  amount: number;
}

interface Bid {
  id: string;
  expert: {
    id: number;
    name: string;
    image?: string;
    specialty?: string;
    grade?: string;
  };
  price: number;
  message?: string;
  createdAt: string;
  status: string;
}

interface Estimate {
  id: string;
  requestNumber?: string;
  category: string;
  details: string;
  location: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  unreadChatCount: number;
  unreadChats?: { id: string; senderId: number }[];
  bids: Bid[];
}

export default function MyRequestListItem({ estimate }: { estimate: Estimate }) {
  const [isBidsOpen, setIsBidsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBidForModal, setSelectedBidForModal] = useState<any>(null);
  const [selectedChatBid, setSelectedChatBid] = useState<any>(null);
  const [activeBidId, setActiveBidId] = useState<string | null>(null);
  const [pendingBidId, setPendingBidId] = useState<string | null>(null);
  const [readExpertIds, setReadExpertIds] = useState<number[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const { data: session } = useSession();

  // 모달 팝업 시 배경 스크롤 방지
  useEffect(() => {
    if (pendingBidId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [pendingBidId]);

  const handleAcceptBid = async (e: React.MouseEvent, bidId: string) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (isAccepting) return;
    setIsAccepting(true);

    const userId = parseInt(session.user.id, 10);
    const result = await acceptBidAction(estimate.id, bidId, userId);

    if (result.success) {
      alert('매칭이 완료되었습니다.');
      window.location.reload();
    } else {
      alert(result.error || '처리 중 오류가 발생했습니다.');
      setIsAccepting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 요청을 삭제하시겠습니까? 관련 견적 및 대화 내용도 모두 삭제됩니다.')) {
      return;
    }

    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    const userId = parseInt(session.user.id, 10);
    const result = await deleteEstimateAction(estimate.id, userId);

    if (result.success) {
      alert('요청이 삭제되었습니다.');
      window.location.reload();
    } else {
      alert(result.error || '삭제 중 오류가 발생했습니다.');
    }
  };

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    'DRAFT': { label: '작성중', color: 'bg-amber-100 text-amber-700', icon: Clock },
    'PENDING': { label: '매칭중', color: 'bg-blue-100 text-blue-700', icon: Clock },
    'BIDDING': { label: '견적중', color: 'bg-emerald-100 text-emerald-700', icon: MessageCircle },
    'IN_PROGRESS': { label: '매칭완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    'COMPLETED': { label: '서비스완료', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 },
    'CANCELLED': { label: '취소됨', color: 'bg-red-100 text-red-600', icon: Clock }
  };

  const currentStatus = statusConfig[estimate.status] || statusConfig['PENDING'];
  
  const currentUnreadCount = Math.max(0, estimate.unreadChatCount - (estimate.unreadChats?.filter(chat => readExpertIds.includes(chat.senderId)).length || 0));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all">
      {/* Request Header Info */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {estimate.requestNumber && (
                <span className="text-[10px] px-2 py-1 rounded-md font-bold bg-slate-50 text-slate-400 border border-slate-100">
                  No. {estimate.requestNumber}
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStatus.color}`}>
                <currentStatus.icon className="w-3.5 h-3.5" />
                {currentStatus.label}
              </span>
              {(estimate.status === 'PENDING' || estimate.status === 'BIDDING') && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  calculateDDay(estimate.createdAt).isUrgent 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {calculateDDay(estimate.createdAt).label}
                </span>
              )}
              {estimate.status !== 'DRAFT' && (
                <span className="text-slate-400 text-xs">최종 등록일: {new Date(estimate.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
            <div className='flex flex-row gap-2 items-center'>
              <h3 className="text-base font-bold text-slate-800">{formatCategory(estimate.category)} 요청</h3>
              {estimate.status !== 'DRAFT' && (
                <>
                  <span className="text-slate-300 text-xs">|</span>
                  <p className="text-slate-600 text-base flex-1 min-w-0 line-clamp-1">
                    {estimate.details}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between items-end">
            {estimate.status !== 'DRAFT' && (
              <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {estimate.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  받은 견적 <span className="font-bold text-blue-600">{estimate.bids.length}건</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-500 font-bold">
                  <MessageCircle className="w-4 h-4" />
                  신규 메시지 {currentUnreadCount}건
                </div>
              </div>
            )}
            <div className='flex flex-row gap-2 items-center'>
              {estimate.status === 'DRAFT' ? (
                <>
                  <button 
                    onClick={handleDelete}
                    className="w-full md:w-auto px-4 py-1 text-sm font-bold text-red-600 bg-red-50 rounded-full border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="w-full md:w-auto px-4 py-1 text-sm font-bold text-slate-600 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    계속 작성하기
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsDetailOpen(true)}
                  className="w-full md:w-auto px-4 py-1 text-sm font-bold text-slate-600 bg-slate-50 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  상세보기
                </button>
              )}

              {/* Edit and Delete Buttons */}
              {estimate.status !== 'DRAFT' && estimate.status !== 'COMPLETED' && estimate.status !== 'CANCELLED' && (
                <div className="flex flex-row gap-2">
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="w-full md:w-auto px-4 py-1 text-sm font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    수정
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full md:w-auto px-4 py-1 text-sm font-bold text-red-600 bg-red-50 rounded-full border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}

              {/* Action Button */}
              {estimate.status !== 'DRAFT' && (
                <button 
                  onClick={() => setIsBidsOpen(!isBidsOpen)}
                  className={`px-4 py-1 text-sm font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 border ${
                    isBidsOpen 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                    : 'bg-white text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {isBidsOpen ? '견적닫기' : '견적보기'}
                  {isBidsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Expandable Bids List */}
      <div className={`transition-all duration-300 ease-in-out ${isBidsOpen ? 'max-h-[1200px] border-t border-slate-100' : 'max-h-0 overflow-hidden pt-0'}`}>
        <div className="bg-slate-50/50 p-4 sm:p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
            전문가 제안 <span className="text-blue-600">{estimate.bids.length}</span>
          </h4>
          
          {estimate.bids.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {estimate.bids.map((bid) => {
                const isMatched = estimate.status === 'IN_PROGRESS' || estimate.status === 'COMPLETED';
                const isInactive = isMatched && bid.status !== 'ACCEPTED';

                return (
                <div 
                  key={bid.id} 
                  className={`relative bg-white rounded-2xl border p-5 transition-all text-center group flex flex-col items-center justify-center ${
                    isInactive ? 'opacity-50 grayscale select-none' :
                    activeBidId === bid.id 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                      : 'border-slate-100 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5'
                  }`}
                >
                  {isInactive && (
                    <div className="absolute inset-0 z-20 rounded-2xl bg-white/40 cursor-not-allowed"></div>
                  )}
                  <div className='flex justify-end items-center w-full mb-2 relative z-10'>
                    <div className='flex items-center gap-2'>
                    {bid.status === 'ACCEPTED' ? (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm z-10">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black">채택됨</span>
                      </div>
                    ) : isInactive ? (
                      <div className="bg-slate-500 text-white px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm z-10">
                        <span className="text-[10px] font-black">미채택</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="font-bold text-xs text-amber-700">5.0</span>
                        <span className="text-amber-600/50 text-[10px]">(0)</span>
                      </div>
                    )}
                    </div>
                  </div>
                  
                  <div className='flex flex-row gap-2 items-center mb-2'>
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border border-slate-100 group-hover:scale-105 transition-transform duration-300 shrink-0">
                      <img 
                        src={bid.expert.image || `https://picsum.photos/seed/${bid.expert.id || bid.expert.name}/100/100`} 
                        alt={bid.expert.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className='flex flex-col justify-center text-left'>
                      <div className='flex items-center gap-2'>
                        {bid.expert.grade === 'PRO' ? (
                          <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100 flex items-center">
                            <span className="font-bold text-[10px]">PRO</span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100 flex items-center">
                            <span className="font-bold text-[10px]">헬퍼</span>
                          </div>
                        )}
                        <p className="text-slate-500 text-xs line-clamp-1">{bid.expert.specialty || `${formatCategory(estimate.category)} 전문`}</p>
                      </div>
                      <h5 className="font-bold text-slate-900">{bid.expert.name} 고수</h5>
                    </div>
                  </div>

                  {/* 제안 금액 추가 */}
                  <div className="mb-4 text-center">
                    <p className="text-[10px] text-slate-400 mb-0.5">제안 금액</p>
                    <p className="text-sm font-black text-blue-600">{bid.price.toLocaleString()}원</p>
                  </div>

                  <div className="flex gap-1.5 w-full mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bid.expert.id) {
                          const width = 1400;
                          const height = 900;
                          const left = (window.screen.width / 2) - (width / 2);
                          const top = (window.screen.height / 2) - (height / 2);
                          window.open(
                            `/expert/dashboard?userId=${bid.expert.id}`, 
                            'ExpertProfile', 
                            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                          );
                        } else {
                          alert("프로필 정보가 없습니다.");
                        }
                      }}
                      className="flex-1 text-xs font-bold bg-slate-50 text-slate-600 py-2.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      프로필
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBidForModal(bid);
                      }}
                      className="flex-1 text-xs font-bold bg-slate-50 text-slate-600 py-2.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      견적보기
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChatBid(bid);
                        if (bid.expert.id && !readExpertIds.includes(bid.expert.id)) {
                          setReadExpertIds(prev => [...prev, bid.expert.id]);
                        }
                      }}
                      className="relative flex-1 text-xs font-bold bg-blue-50 text-blue-600 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                    >
                      상담하기
                      {(() => {
                        const expertUnreadCount = estimate.unreadChats?.filter(chat => chat.senderId === bid.expert.id && !readExpertIds.includes(bid.expert.id)).length || 0;
                        if (expertUnreadCount > 0) {
                          return (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-black shadow-sm z-10">
                              {expertUnreadCount > 9 ? '9+' : expertUnreadCount}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </button>
                  </div>
                  
                  {(estimate.status === 'PENDING' || estimate.status === 'BIDDING') && (
                    activeBidId === bid.id ? (
                      <div className="flex gap-2 w-full mt-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); setActiveBidId(null); }}
                           className="flex-1 text-sm font-bold bg-slate-500 text-white py-2.5 rounded-xl hover:bg-slate-600 transition-all shadow-md shadow-slate-900/10 active:scale-95"
                         >
                           취소
                         </button>
                         <button 
                           disabled={isAccepting}
                           onClick={(e) => handleAcceptBid(e, bid.id)}
                           className="flex-1 text-sm font-bold bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-900/10 active:scale-95 disabled:bg-slate-400 disabled:shadow-none"
                         >
                           {isAccepting ? '처리 중...' : '채택 확정'}
                         </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPendingBidId(bid.id); }}
                        disabled={activeBidId !== null && activeBidId !== bid.id}
                        className={`w-full mt-2 text-sm font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 ${
                          activeBidId !== null && activeBidId !== bid.id
                            ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-slate-900/10'
                        }`}
                      >
                        선택하기
                      </button>
                    )
                  )}
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">아직 도착한 견적이 없습니다.</p>
              <p className="text-slate-300 text-xs mt-1">전문가들이 견적을 분석 중입니다.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 견적 제안 상세 모달 */}
      <BidDetailModal 
        isOpen={!!selectedBidForModal} 
        onClose={() => setSelectedBidForModal(null)} 
        bid={selectedBidForModal} 
      />

      {/* 채팅 모달 */}
      <ChatPopupModal 
        isOpen={!!selectedChatBid} 
        onClose={() => setSelectedChatBid(null)} 
        bid={selectedChatBid} 
        currentUserId={session?.user?.id ? parseInt(session.user.id, 10) : 0}
        estimateId={estimate.id}
      />

      {/* 상세 보기 모달 */}
      <EstimateDetailModal 
        estimate={estimate} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />

      {/* 수정 모달 */}
      {session?.user?.id && (
        <EstimateEditModal
          estimateId={estimate.id}
          customerId={session.user.id}
          customerName={session.user.name || '고객'}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialStep={estimate.currentStep}
          onSuccess={() => {
            setIsEditOpen(false);
            window.location.reload();
          }}
        />
      )}

      {/* 결제 시간 초과 안내 모달 */}
      {pendingBidId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-300 p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">전문가 선택 확인</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              선택 후 <strong className="text-red-500">24시간 이내에 결제가 완료되지 않으면</strong><br/>자동으로 선택이 취소됩니다.<br/><br/>선택을 진행하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setPendingBidId(null); }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
              >
                닫기
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveBidId(pendingBidId);
                  setPendingBidId(null);
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                진행하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
