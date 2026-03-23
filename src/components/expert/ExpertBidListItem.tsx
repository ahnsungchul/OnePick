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
  Settings
} from 'lucide-react';
import { formatCategory, calculateDDay } from '@/lib/utils';
import BidEditModal from './BidEditModal';
import ChatPopupModal from '../chat/ChatPopupModal';

export default function ExpertBidListItem({ bid, expertId, currentUserName }: { bid: any, expertId: number, currentUserName: string }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasReadChat, setHasReadChat] = useState(false);

  const estimate = bid.estimate;

  const getStatusDisplay = () => {
    if (bid.status === 'ACCEPTED') return { label: '채택됨', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: CheckCircle2 };
    if (bid.status === 'REJECTED') return { label: '거절됨', color: 'bg-red-100 text-red-700 border border-red-200', icon: AlertCircle };
    
    // PENDING state depends on estimate status
    if (estimate.status === 'BIDDING') return { label: '매칭 대기중', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: Clock };
    if (estimate.status === 'IN_PROGRESS' || estimate.status === 'COMPLETED') return { label: '다른 전문가 채택', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: CheckCircle2 };
    if (estimate.status === 'CANCELLED') return { label: '요청 취소됨', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: AlertCircle };

    return { label: '심사중', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: Clock };
  };

  const statusDisplay = getStatusDisplay();
  const unreadCount = !hasReadChat ? (estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all overflow-hidden flex flex-col lg:flex-row items-stretch">
      
      {/* 좌측: 요청 정보 */}
      <div className="p-5 sm:p-6 flex-1 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            고객 요청 정보
          </span>
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
            <span className="truncate">요청일: {new Date(estimate.updatedAt || estimate.createdAt).toLocaleDateString()}</span>
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
              <span className="text-slate-400 mr-1">희망일:</span> 
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
              <div className="flex items-start gap-2 text-xs font-bold bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-4">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <span className="text-blue-500/80 mr-1">방문 가능일:</span> 
                  <span className="text-blue-700">{bid.availableDate}</span>
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
          )}
          <button 
            onClick={() => {
              setIsChatOpen(true);
              setHasReadChat(true);
            }}
            className="flex-1 relative px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-blue-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            상담하기
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full font-black shadow-sm border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

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
    </div>
  );
}
