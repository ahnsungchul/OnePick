'use client';

import React, { useState } from 'react';
import { 
  MessageCircle, 
  MapPin, 
  User,
  CheckCircle2,
  Clock,
  Edit2,
  AlertCircle
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
    if (estimate.status === 'BIDDING') return { label: '결과 대기중', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: Clock };
    if (estimate.status === 'IN_PROGRESS' || estimate.status === 'COMPLETED') return { label: '다른 고수 채택', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: CheckCircle2 };
    if (estimate.status === 'CANCELLED') return { label: '요청 취소됨', color: 'bg-slate-100 text-slate-500 border border-slate-200', icon: AlertCircle };

    return { label: '심사중', color: 'bg-amber-100 text-amber-700 border border-amber-200', icon: Clock };
  };

  const statusDisplay = getStatusDisplay();
  const unreadCount = !hasReadChat ? (estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 hover:border-blue-200 transition-all overflow-hidden flex flex-col md:flex-row">
      <div className="p-5 sm:p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider ${statusDisplay.color}`}>
              <statusDisplay.icon className="w-3.5 h-3.5" />
              {statusDisplay.label}
            </span>
            <span className="text-slate-400 text-xs font-bold">
              요청일: {new Date(estimate.updatedAt || estimate.createdAt).toLocaleDateString()}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider ${
                calculateDDay(estimate.createdAt).isUrgent 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
              {calculateDDay(estimate.createdAt).label}
            </span>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900 mb-1">{formatCategory(estimate.category)} 요청</h3>
            <p className="text-slate-600 text-sm font-medium line-clamp-2 leading-relaxed">
              {estimate.details}
            </p>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400" />
              {estimate.location}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <User className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-2">
                <img 
                  src={estimate.customer?.image || `https://picsum.photos/seed/${estimate.customerId}/100/100`} 
                  alt="Customer" 
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-slate-700">{estimate.customer?.name} 고객님</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 w-full md:w-72 bg-slate-50/50 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">나의 견적 제안</span>
            <div className="text-2xl font-black text-blue-600">
              {bid.price.toLocaleString()}<span className="text-lg text-blue-600/60 ml-1">원</span>
            </div>
          </div>
          {bid.message && (
            <div className="mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative text-sm text-slate-600 font-medium italic">
              <div className="absolute -left-1.5 top-4 w-3 h-3 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
              "{bid.message}"
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {bid.status === 'PENDING' && estimate.status === 'BIDDING' && (
            <button 
              onClick={() => setIsEditOpen(true)}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              견적수정
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
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-black shadow-sm border-2 border-white">
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
