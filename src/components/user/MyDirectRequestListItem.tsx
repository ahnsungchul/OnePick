'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  MapPin, 
  User,
  CheckCircle2,
  Clock,
  Trash2,
  Star,
  AlertCircle
} from 'lucide-react';
import { formatCategory, calculateDDay } from '@/lib/utils';
import EstimateDetailModal from './EstimateDetailModal';
import BidDetailModal from './BidDetailModal';
import ChatPopupModal from '../chat/ChatPopupModal';
import { cancelEstimateAction } from '@/actions/estimate.action';
import { acceptBidAction, cancelBidSelectionAction } from '@/actions/bid.action';
import { completePaymentAction } from '@/actions/payment.action';
import { useSession } from 'next-auth/react';

interface Bid {
  id: string;
  expert: {
    id: number;
    name: string;
    image?: string;
    specialty?: string;
    grade?: string;
    profile?: {
      rating: number;
      reviewCount: number;
    };
  };
  price: number;
  message?: string;
  availableDate?: string;
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
  isClosed?: boolean;
  selectedDate?: string;
}

export default function MyDirectRequestListItem({ 
  estimate,
  activeFilter,
  onMoveToStatus,
  onMarkChatAsRead
}: { 
  estimate: Estimate;
  activeFilter?: string;
  onMoveToStatus?: (status: string) => void;
  onMarkChatAsRead?: (estimateId: string) => void;
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBidForModal, setSelectedBidForModal] = useState<any>(null);
  const [selectedChatBid, setSelectedChatBid] = useState<any>(null);
  const [readExpertIds, setReadExpertIds] = useState<number[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: session } = useSession();

  // 1:1 요청이므로 bid는 1개입니다.
  const bid = estimate.bids?.[0];
  
  const isPreBid = bid && bid.price === 0 && bid.status === 'PENDING';
  const hasReceivedBid = bid && bid.price > 0 && bid.status === 'PENDING';
  const isCanceledOrRejected = estimate.status === 'CANCELLED' || bid?.status === 'REJECTED';
  const isConfirmed = bid?.status === 'ACCEPTED' || ['SELECTED', 'IN_PROGRESS', 'COMPLETED'].includes(estimate.status);
  
  const getStatusDisplay = () => {
    if (isCanceledOrRejected) return { label: '취소/거절됨', color: 'bg-red-100 text-red-600 border border-red-200', icon: AlertCircle };
    if (isConfirmed) return { label: '전문가확정', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200', icon: CheckCircle2 };
    if (isPreBid) return { label: '견적대기', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: Clock };
    if (hasReceivedBid) return { label: '견적도착', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: MessageCircle };
    return { label: '대기중', color: 'bg-slate-100 text-slate-600', icon: Clock };
  };

  const statusDisplay = getStatusDisplay();
  const currentUnreadCount = Math.max(0, estimate.unreadChatCount - (estimate.unreadChats?.filter(chat => readExpertIds.includes(chat.senderId)).length || 0));

  const handleCancelEstimateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('1:1 요청을 취소하시겠습니까?')) return;
    
    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isCanceling) return;
    setIsCanceling(true);

    const userId = parseInt(session.user.id, 10);
    const result = await cancelEstimateAction(estimate.id, userId);

    if (result.success) {
      alert('요청이 취소되었습니다.');
      window.location.reload();
    } else {
      alert(result.error || '취소 중 오류가 발생했습니다.');
      setIsCanceling(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (isAccepting) return;
    setIsAccepting(true);

    const userId = parseInt(session.user.id, 10);
    // 1:1에서는 날짜 선택을 별도로 받지 않고 estimate.serviceDate를 그대로 확정한다고 가정 (단순화)
    const result = await acceptBidAction(estimate.id, bid.id, userId, estimate.selectedDate || '');

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || '처리 중 오류가 발생했습니다.');
      setIsAccepting(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (isPaying) return;
    setIsPaying(true);

    const userId = parseInt(session.user.id, 10);
    const result = await completePaymentAction(estimate.id, userId);

    if (result?.success) {
      alert('결제가 완료되었습니다.');
      window.location.reload();
    } else {
      alert(result?.error || '결제 처리 중 서버와 통신 오류가 발생했습니다.');
      setIsPaying(false);
    }
  };

  const handleCancelSelection = async () => {
    if (!window.confirm('전문가 선택을 취소하시겠습니까?')) return;
    
    if (!session?.user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (isCanceling) return;
    setIsCanceling(true);

    const userId = parseInt(session.user.id, 10);
    const result = await cancelBidSelectionAction(estimate.id, bid.id, userId);

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || '취소 중 오류가 발생했습니다.');
      setIsCanceling(false);
    }
  };

  if (!bid) return null; // 1:1 요청인데 전문가 정보가 없으면 안됨

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all overflow-hidden flex flex-col md:flex-row items-stretch">
      {/* 1. 전문가 정보 섹션 (좌측) */}
      <div className="p-5 md:p-6 w-full md:w-[280px] bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center justify-center relative">
        <span className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusDisplay.color}`}>
          <statusDisplay.icon className="w-3 h-3" />
          {statusDisplay.label}
        </span>
        
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md mx-auto mt-6 mb-3">
          <img 
            src={bid.expert.image || `https://picsum.photos/seed/${bid.expert.id || bid.expert.name}/150/150`} 
            alt={bid.expert.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            {bid.expert.grade === 'PRO' ? (
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">PRO</span>
            ) : (
              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100">헬퍼</span>
            )}
            <h4 className="font-bold text-slate-900">{bid.expert.name} 전문가</h4>
          </div>
          
          <p className="text-slate-500 text-xs mb-2 line-clamp-1 text-center">{bid.expert.specialty || `${formatCategory(estimate.category)} 전문`}</p>
          
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="font-bold text-xs text-amber-700">{Number(bid.expert.profile?.rating || 0).toFixed(1)}</span>
            <span className="text-amber-600/50 text-[10px]">({bid.expert.profile?.reviewCount || 0})</span>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (bid.expert.id) {
              const width = 1400; const height = 900;
              const left = (window.screen.width / 2) - (width / 2);
              const top = (window.screen.height / 2) - (height / 2);
              window.open(
                `/expert/dashboard?userId=${bid.expert.id}`, 
                'ExpertProfile', 
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
              );
            }
          }}
          className="mt-4 w-full text-xs font-bold py-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          프로필 보기
        </button>
      </div>

      {/* 2. 요청 및 제안 상세 섹션 (중앙~우측) */}
      <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  {estimate.requestNumber || `REQ-${estimate.id.substring(0,6)}`}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {new Date(estimate.updatedAt || estimate.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800">{formatCategory(estimate.category)} 요청</h3>
            </div>
            
            {!isCanceledOrRejected && !isConfirmed && (
              <button 
                onClick={handleCancelEstimateClick}
                disabled={isCanceling}
                className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-colors"
              >
                요청 취소
              </button>
            )}
          </div>

          <div className="text-slate-600 text-sm font-medium line-clamp-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
            {estimate.details}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold mb-4">
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 px-2.5 py-1.5 rounded-lg shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {estimate.location}
            </div>
          </div>

          <div className={`mt-auto p-4 rounded-xl border ${hasReceivedBid ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">제안 금액</span>
                {isPreBid ? (
                  <span className="text-sm font-bold text-slate-400">견적 대기 중</span>
                ) : isCanceledOrRejected ? (
                  <span className="text-lg font-black text-slate-400 line-through">{bid.price.toLocaleString()}원</span>
                ) : (
                  <div className="text-xl font-black text-blue-600">
                    {bid.price.toLocaleString()}<span className="text-sm text-blue-600/60 ml-0.5">원</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {hasReceivedBid && !isConfirmed && !isCanceledOrRejected && (
                  <button 
                    onClick={() => setSelectedBidForModal(bid)}
                    className="px-4 py-2.5 text-xs font-bold bg-white text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    견적 상세보기
                  </button>
                )}

                <button 
                  onClick={() => setIsDetailOpen(true)}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  내원문 보기
                </button>
              </div>
            </div>
          </div>

          {/* 하단 액션 버튼들 */}
          <div className="flex gap-2 mt-4">
            {/* 상담하기 버튼: 취소/거절되지 않았으면 항상 표시 */}
            {!isCanceledOrRejected && (
              <button 
                onClick={() => {
                  setSelectedChatBid(bid);
                  if (bid.expert.id && !readExpertIds.includes(bid.expert.id)) {
                    setReadExpertIds(prev => [...prev, bid.expert.id]);
                  }
                  if (onMarkChatAsRead) {
                    onMarkChatAsRead(estimate.id);
                  }
                  
                  if (currentUnreadCount > 0 && activeFilter === 'NEW_MESSAGE' && onMoveToStatus) {
                    if (isConfirmed) onMoveToStatus('CONFIRMED');
                    else if (hasReceivedBid) onMoveToStatus('RECEIVED_BID');
                    else onMoveToStatus('PRE_BID');
                  }
                }}
                className={`relative flex-1 text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
                  currentUnreadCount > 0 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                상담하기
                {currentUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full font-black shadow-sm border-2 border-white">
                    {currentUnreadCount > 9 ? '9+' : currentUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* 결제 및 확정 버튼 */}
            {!isCanceledOrRejected && hasReceivedBid && !isConfirmed && (
              <button 
                onClick={handleAcceptBid}
                disabled={isAccepting}
                className="flex-1 text-sm font-bold bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:bg-slate-400 disabled:shadow-none"
              >
                {isAccepting ? '처리 중...' : '전문가 선택하기'}
              </button>
            )}

            {estimate.status === 'SELECTED' && bid.status === 'ACCEPTED' && (
              <>
                <button 
                  onClick={handleCancelSelection}
                  disabled={isPaying || isCanceling}
                  className="flex-1 text-sm font-bold bg-slate-500 text-white py-3 rounded-xl hover:bg-slate-600 transition-all disabled:bg-slate-400"
                >
                  {isCanceling ? '처리 중...' : '선택 취소'}
                </button>
                <button 
                  onClick={handleCompletePayment}
                  disabled={isPaying || isCanceling}
                  className="flex-1 text-sm font-bold bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:bg-slate-400"
                >
                  {isPaying ? '처리 중...' : '결제하기'}
                </button>
              </>
            )}
            
            {/* 완료된 경우 */}
            {['IN_PROGRESS', 'COMPLETED'].includes(estimate.status) && (
              <button 
                disabled
                className="flex-1 text-sm font-bold bg-slate-100 text-slate-500 py-3 rounded-xl border border-slate-200 cursor-not-allowed"
              >
                결제 완료
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 각종 모달들 */}
      <BidDetailModal 
        isOpen={!!selectedBidForModal} 
        onClose={() => setSelectedBidForModal(null)} 
        bid={selectedBidForModal} 
        isClosed={estimate.isClosed}
      />

      <ChatPopupModal 
        isOpen={!!selectedChatBid} 
        onClose={() => setSelectedChatBid(null)} 
        bid={selectedChatBid} 
        currentUserId={session?.user?.id ? parseInt(session.user.id, 10) : 0}
        estimateId={estimate.id}
      />

      <EstimateDetailModal 
        estimate={estimate} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </div>
  );
}
