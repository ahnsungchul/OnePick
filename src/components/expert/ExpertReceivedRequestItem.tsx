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
  Send
} from 'lucide-react';
import { formatCategory, calculateDDay } from '@/lib/utils';
import BidEditModal from './BidEditModal';
import ChatPopupModal from '../chat/ChatPopupModal';

export default function ExpertReceivedRequestItem({ bid, expertId }: { bid: any, expertId: number }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasReadChat, setHasReadChat] = useState(false);

  const estimate = bid.estimate;
  const isPreBid = bid.price === 0 && bid.status === 'PENDING';

  const getStatusDisplay = () => {
    if (bid.status === 'ACCEPTED') return { label: '확정 요청', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200', icon: CheckCircle2 };
    if (bid.status === 'REJECTED' || estimate.status === 'CANCELLED') return { label: '거절/취소됨', color: 'bg-red-100 text-red-700 border border-red-200', icon: AlertCircle };
    if (isPreBid) return { label: '견적 작성 대기', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: Clock };
    return { label: '제안 완료 (답변 대기)', color: 'bg-blue-100 text-blue-700 border border-blue-200', icon: CheckCircle2 };
  };

  const statusDisplay = getStatusDisplay();
  const unreadCount = !hasReadChat ? (estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all overflow-hidden flex flex-col lg:flex-row items-stretch">
      {/* 좌측: 고객 요청 정보 */}
      <div className="p-5 sm:p-6 flex-1 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            1:1 다이렉트 요청
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[13px] font-bold text-slate-600 bg-white rounded-xl border border-slate-100 mt-auto p-4 shadow-sm">
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
          <div className="col-span-1 sm:col-span-2 flex items-start gap-2 pt-2 border-t border-slate-50 mt-1">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <span className="text-slate-700">{estimate.serviceDate}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 우측: 나의 제안 정보 및 액션 */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
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

          {isPreBid ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 mb-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-600 mb-1">아직 견적을 보내지 않았습니다.</p>
              <p className="text-xs">상세 내용을 확인하고 견적을 제안해보세요.</p>
            </div>
          ) : (
            <div className="mb-3">
              <div className="flex items-end justify-between mb-3 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 tracking-wider">총 제안 금액</span>
                <div className="text-2xl font-black text-blue-600 leading-none">
                  {bid.price.toLocaleString()}<span className="text-base text-blue-600/60 ml-1 font-bold">원</span>
                </div>
              </div>
              
              {bid.items && bid.items.length > 0 && (
                <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 max-h-36 overflow-y-auto">
                  {bid.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-200/50 last:border-0">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className="font-black text-slate-800 w-16 text-right">{item.amount.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          {isPreBid ? (
            <button 
              onClick={() => setIsEditOpen(true)}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              견적 보내기
            </button>
          ) : bid.status === 'PENDING' ? (
            <button 
              onClick={() => setIsEditOpen(true)}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Edit2 className="w-4 h-4" />
              견적 수정하기
            </button>
          ) : null}

          {!isPreBid && (
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
          )}
        </div>
      </div>

      <BidEditModal 
        bid={bid} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSuccess={() => setIsEditOpen(false)}
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
