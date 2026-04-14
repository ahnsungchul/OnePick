'use client';

import React, { useState } from 'react';
import { 
  MessageCircle, 
  MapPin, 
  User,
  CheckCircle2,
  Clock,
  Edit2,
  AlertCircle,
  Phone,
  Calendar,
  Settings,
  Trash2
} from 'lucide-react';
import { formatCategory, calculateDDay } from '@/lib/utils';
import BidEditModal from './BidEditModal';
import ChatPopupModal from '../chat/ChatPopupModal';
import BidCompleteModal from './BidCompleteModal';
import CompletionPhotosModal from './CompletionPhotosModal';
import { cancelExpertBidAction, cancelAcceptedBidAction } from '@/actions/bid.action';
import { Image as ImageIcon } from 'lucide-react';

export default function ExpertBidListItem({ 
  bid, 
  expertId, 
  currentUserName,
  activeFilter,
  onMoveToStatus,
  onMarkChatAsRead
}: { 
  bid: any;
  expertId: number;
  currentUserName: string;
  activeFilter?: string;
  onMoveToStatus?: (status: any) => void;
  onMarkChatAsRead?: (estimateId: string) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasReadChat, setHasReadChat] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelAcceptedModalOpen, setIsCancelAcceptedModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);

  const executeCancelBid = async () => {
    setIsCanceling(true);
    const res = await cancelExpertBidAction(bid.id, expertId);
    if (!res.success) {
      alert(res.error);
      setIsCanceling(false);
      setIsCancelModalOpen(false);
    } else {
      alert('견적 제안이 정상적으로 취소되었습니다.');
      setIsCancelModalOpen(false);
    }
  };

  const executeCancelAcceptedBid = async () => {
    setIsCanceling(true);
    const res = await cancelAcceptedBidAction(estimate.id, expertId);
    if (!res.success) {
      alert(res.error);
      setIsCanceling(false);
      setIsCancelAcceptedModalOpen(false);
    } else {
      alert('견적이 취소되었습니다.');
      setIsCancelAcceptedModalOpen(false);
    }
  };

  const estimate = bid.estimate;

  const getStatusDisplay = () => {
    if (estimate.status === 'INSPECTION') return { label: '검수중', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200', icon: CheckCircle2 };
    if (bid.status === 'ACCEPTED') return { label: '채택됨', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: CheckCircle2 };
    if (bid.status === 'REJECTED') return { label: '거절됨', color: 'bg-red-100 text-red-700 border border-red-200', icon: AlertCircle };
    
    // PENDING state depends on estimate status
    if (estimate.status === 'BIDDING') return { label: '매칭 대기중', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: Clock };
    if (estimate.status === 'SELECTED' || estimate.status === 'IN_PROGRESS' || estimate.status === 'COMPLETED') return { label: '다른 전문가 채택', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: CheckCircle2 };
    if (estimate.status === 'CANCELLED') return { label: '요청 취소됨', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: AlertCircle };

    return { label: '심사중', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: Clock };
  };

  const statusDisplay = getStatusDisplay();
  const unreadCount = !hasReadChat ? (estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0) : 0;
  const isOtherExpertSelected = bid.status !== 'ACCEPTED' && (estimate.status === 'SELECTED' || estimate.status === 'IN_PROGRESS' || estimate.status === 'COMPLETED' || estimate.status === 'INSPECTION');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all overflow-hidden flex flex-col lg:flex-row items-stretch">
      
      {/* 좌측: 요청 정보 */}
      <div className="p-5 sm:p-6 flex-1 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              고객 요청 정보
            </span>
            <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wide">
              {estimate.requestNumber || `REQ-${String(estimate.id).substring(0, 8).toUpperCase()}`}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${
              calculateDDay(estimate.createdAt, estimate.isClosed).isUrgent 
              ? 'bg-red-50 text-red-600 border border-red-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
            {calculateDDay(estimate.createdAt, estimate.isClosed).label}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900 mb-2">{formatCategory(estimate.category)}</h3>
          <p className="text-slate-600 text-sm font-medium line-clamp-2 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm mb-1.5">
            {estimate.details}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[13px] font-bold text-slate-600 bg-white p-4.5 rounded-xl border border-slate-100 mt-auto p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{estimate.customer?.name || '고객'} 고객님</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{estimate.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">요청일: {new Date(estimate.updatedAt || estimate.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate text-slate-500">
              {bid.status === 'ACCEPTED' ? (estimate.customer?.phone || '010-0000-0000') : '010-****-****'}
            </span>
          </div>
          <div className="col-span-1 sm:col-span-2 flex items-start gap-2 pt-2 border-t border-slate-50 mt-1">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <span className="text-slate-700">{estimate.serviceDate} {estimate.serviceTime && `(${estimate.serviceTime})`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 우측: 견적 정보 */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              나의 견적 제안
            </span>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${statusDisplay.color}`}>
              <statusDisplay.icon className="w-3.5 h-3.5" />
              {statusDisplay.label}
            </span>
          </div>

          <div className="mb-3">
            {/* 금액 영역 */}
            <div className="flex items-end justify-between mb-3 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 tracking-wider">총 제안 금액</span>
              <div className="text-2xl font-black text-blue-600 leading-none">
                {bid.price.toLocaleString()}<span className="text-base text-blue-600/60 ml-1 font-bold">원</span>
              </div>
            </div>

            {/* 서비스 가능일 */}
            {bid.availableDate && (
              <div className={`flex items-start gap-2 text-xs font-bold p-3 rounded-xl border mb-4 ${bid.status === 'ACCEPTED' ? 'bg-blue-50/50 border-blue-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <Calendar className={`w-4 h-4 shrink-0 mt-0.5 ${bid.status === 'ACCEPTED' ? 'text-blue-500' : 'text-emerald-500'}`} />
                <span className="leading-snug">
                  <span className={`mr-1 ${bid.status === 'ACCEPTED' ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {bid.status === 'ACCEPTED' ? '서비스 확정일:' : '방문 가능일:'}
                  </span> 
                  <span className={bid.status === 'ACCEPTED' ? 'text-blue-700' : 'text-emerald-700'}>
                    {bid.status === 'ACCEPTED' ? estimate.selectedDate : bid.availableDate}
                  </span>
                </span>
              </div>
            )}

            {/* 상세 항목 내역 */}
            {bid.items && bid.items.length > 0 && (
              <div className="mb-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 max-h-36 overflow-y-auto">
                  {bid.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-200/50 last:border-0">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-100">{item.period} 소요</span>
                        <span className="font-black text-slate-800 w-16 text-right break-keep">{item.amount.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전문가 메시지 */}
            {bid.message && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative text-sm text-slate-600 font-medium leading-relaxed mt-2">
                <div className="absolute -left-1.5 top-5 w-3 h-3 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="italic">"{bid.message}"</span>
                </div>
              </div>
            )}
          </div>
        <div className="flex gap-2 mt-auto">
          {bid.status === 'PENDING' && estimate.status === 'BIDDING' && (
            <>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isCanceling || (estimate.isClosed && !bid.isEditRequested)}
                className={`px-3 sm:px-4 py-3 border font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isCanceling || (estimate.isClosed && !bid.isEditRequested)
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-red-200 text-red-500 hover:bg-red-50 active:scale-95'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">취소하기</span>
              </button>
              <button 
                onClick={() => setIsEditOpen(true)}
                disabled={estimate.isClosed && !bid.isEditRequested}
                className={`flex-1 px-4 py-3 border font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  estimate.isClosed && !bid.isEditRequested
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                수정하기
              </button>
            </>
          )}

          {bid.status === 'ACCEPTED' && !['INSPECTION', 'COMPLETED', 'CANCELLED'].includes(estimate.status) && (
            <>
              <button
                onClick={() => setIsCancelAcceptedModalOpen(true)}
                disabled={isCanceling}
                className="px-3 py-3 border border-red-200 text-red-500 hover:bg-red-50 active:scale-95 font-bold text-sm rounded-xl flex items-center justify-center transition-all bg-white shadow-sm"
              >
                <Trash2 className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">취소</span>
              </button>
              <button
                onClick={() => setIsCompleteModalOpen(true)}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 active:scale-95 shadow-md font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                작업완료
              </button>
            </>
          )}

          {bid.status === 'ACCEPTED' && ['INSPECTION', 'COMPLETED'].includes(estimate.status) && estimate.completionPhotoUrls && estimate.completionPhotoUrls.length > 0 && (
            <button
              onClick={() => setIsPhotosModalOpen(true)}
              className="flex-1 px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 shadow-sm font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">포트폴리오(완료사진)</span> 보기
            </button>
          )}

          <button 
            onClick={() => {
              setIsChatOpen(true);
              
              const currentUnreadCount = !hasReadChat ? (estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0) : 0;
              if (currentUnreadCount > 0) {
                if (onMarkChatAsRead) onMarkChatAsRead(estimate.id);
                window.dispatchEvent(new Event('expertChatRead'));
              }
              setHasReadChat(true);

              if (activeFilter === 'UNREAD' && onMoveToStatus) {
                let category = 'PENDING';
                if (bid.status === 'ACCEPTED') {
                  category = 'ACCEPTED';
                } else if (
                  bid.status === 'REJECTED' || 
                  estimate.status === 'CANCELLED' || 
                  estimate.status === 'SELECTED' || 
                  estimate.status === 'IN_PROGRESS' || 
                  estimate.status === 'COMPLETED'
                ) {
                  category = 'REJECTED'; 
                }
                onMoveToStatus(category);
              }
            }}
            disabled={estimate.status === 'CANCELLED' || estimate.status === 'COMPLETED' || isOtherExpertSelected}
            className={`flex-1 relative px-4 py-3 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
              estimate.status === 'CANCELLED' || estimate.status === 'COMPLETED' || isOtherExpertSelected
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            상담하기
            {unreadCount > 0 && estimate.status !== 'CANCELLED' && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full font-black shadow-sm border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <BidCompleteModal 
        isOpen={isCompleteModalOpen} 
        onClose={() => setIsCompleteModalOpen(false)} 
        onSuccess={() => {
          if (onMoveToStatus) onMoveToStatus('INSPECTION');
        }}
        estimateId={estimate.id} 
        expertId={expertId} 
      />

      <BidEditModal 
        bid={bid} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSuccess={() => {
          setIsEditOpen(false);
          // In real app, we might mutate the cache, but Next.js Server Actions usually handle this via revalidatePath
        }}
      />

      <ChatPopupModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        bid={bid} 
        currentUserId={expertId}
        estimateId={estimate.id}
        otherParty={{
          id: estimate.customerId,
          name: estimate.customer?.name || '고객',
          image: estimate.customer?.image,
          roleLabel: '고객님'
        }}
      />

      <CompletionPhotosModal 
        isOpen={isPhotosModalOpen}
        onClose={() => setIsPhotosModalOpen(false)}
        urls={estimate.completionPhotoUrls || []}
      />

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-6 mt-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2">견적 제안 취소</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  정말로 이 견적 제안을 취소하시겠습니까?<br/>
                  취소 시 고객님께 제안된 견적이 삭제됩니다.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCanceling}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                아니오
              </button>
              <button
                onClick={executeCancelBid}
                disabled={isCanceling}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isCanceling ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '예, 취소합니다'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCancelAcceptedModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-6 mt-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2">작업 취소</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  정말로 이 작업을 취소하시겠습니까?<br/>
                  취소 시 상태가 변경되며 복구할 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsCancelAcceptedModalOpen(false)}
                disabled={isCanceling}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                아니오
              </button>
              <button
                onClick={executeCancelAcceptedBid}
                disabled={isCanceling}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isCanceling ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '예, 취소합니다'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
