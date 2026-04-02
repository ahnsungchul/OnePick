'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Send } from 'lucide-react';

interface ExpertHomeStatsBadgesProps {
  userId: number;
  directRequests: any[];
  sentBids: any[];
}

export default function ExpertHomeStatsBadges({ 
  userId,
  directRequests, 
  sentBids 
}: ExpertHomeStatsBadgesProps) {
  const router = useRouter();
  const [showReqTabN, setShowReqTabN] = useState<Record<string, boolean>>({});
  const [showBidTabN, setShowBidTabN] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Compute Stats
  const requestStats = useMemo(() => {
    let preBid = 0, sentBid = 0, accepted = 0, rejected = 0, unread = 0;
    directRequests.forEach(bid => {
      const bidStatus = bid.status;
      const estStatus = bid.estimate?.status;
      
      const unreadCount = bid.estimate?.chats?.filter((c: any) => c.senderId !== userId && !c.isRead).length || 0;
      if (unreadCount > 0) unread++;

      if (bidStatus === 'ACCEPTED') accepted++;
      else if (bidStatus === 'REJECTED' || estStatus === 'CANCELLED') rejected++;
      else if (bidStatus === 'PENDING') {
        if (bid.price === 0) preBid++;
        else sentBid++;
      }
    });
    return { all: directRequests.length, preBid, sentBid, accepted, rejected, unread };
  }, [directRequests, userId]);

  const bidStats = useMemo(() => {
    let pending = 0, accepted = 0, inspection = 0, completed = 0, rejected = 0, unread = 0;
    sentBids.forEach(bid => {
      const bidStatus = bid.status;
      const estStatus = bid.estimate?.status;
      const unreadCount = bid.estimate?.chats?.filter((c: any) => c.senderId !== userId && !c.isRead).length || 0;
      if (unreadCount > 0) unread++;
      
      if (estStatus === 'COMPLETED') completed++;
      else if (estStatus === 'INSPECTION') inspection++;
      else if (bidStatus === 'ACCEPTED') accepted++;
      else if (bidStatus === 'REJECTED' || estStatus === 'CANCELLED' || estStatus === 'SELECTED' || estStatus === 'IN_PROGRESS') rejected++;
      else pending++;
    });
    return { all: sentBids.length, pending, accepted, inspection, completed, rejected, unread };
  }, [sentBids, userId]);

  const requestTabs = useMemo(() => [
    { id: 'ALL', label: '전체 요청', count: requestStats.all },
    { id: 'PRE_BID', label: '견적전', count: requestStats.preBid },
    { id: 'SENT_BID', label: '견적보냄', count: requestStats.sentBid },
    { id: 'UNREAD', label: '신규 메시지', count: requestStats.unread, isAlert: true },
    { id: 'ACCEPTED', label: '확정됨', count: requestStats.accepted },
    { id: 'REJECTED', label: '거절/취소', count: requestStats.rejected },
  ], [requestStats]);

  const bidTabs = useMemo(() => [
    { id: 'ALL', label: '전체 견적', count: bidStats.all },
    { id: 'PENDING', label: '대기중', count: bidStats.pending },
    { id: 'ACCEPTED', label: '채택됨', count: bidStats.accepted },
    { id: 'INSPECTION', label: '검수중', count: bidStats.inspection },
    { id: 'COMPLETED', label: '서비스완료', count: bidStats.completed },
    { id: 'REJECTED', label: '거절/취소', count: bidStats.rejected },
    { id: 'UNREAD', label: '신규 메시지', count: bidStats.unread, isAlert: true },
  ], [bidStats]);

  useEffect(() => {
    setIsMounted(true);
    
    // Check local storage for each tab
    const seenReqStr = localStorage.getItem('seen_expert_reqs_tabs');
    const seenReqTabs = seenReqStr ? JSON.parse(seenReqStr) : {};
    const newReqN: Record<string, boolean> = {};
    requestTabs.forEach(tab => {
       if (tab.count > (seenReqTabs[tab.id] || 0)) newReqN[tab.id] = true;
    });
    setShowReqTabN(newReqN);

    const seenBidStr = localStorage.getItem('seen_expert_bids_tabs');
    const seenBidTabs = seenBidStr ? JSON.parse(seenBidStr) : {};
    const newBidN: Record<string, boolean> = {};
    bidTabs.forEach(tab => {
       if (tab.count > (seenBidTabs[tab.id] || 0)) newBidN[tab.id] = true;
    });
    setShowBidTabN(newBidN);
  }, [requestTabs, bidTabs]);

  const handleNavRequest = (filter: string) => {
    const seenReqStr = localStorage.getItem('seen_expert_reqs_tabs');
    const seenReqTabs = seenReqStr ? JSON.parse(seenReqStr) : {};
    
    requestTabs.forEach(t => {
       if (filter === 'ALL' || t.id === filter || t.id === 'ALL') {
           seenReqTabs[t.id] = t.count;
       }
    });
    localStorage.setItem('seen_expert_reqs_tabs', JSON.stringify(seenReqTabs));
    
    router.push(`/expert/requests?userId=${userId}&filter=${filter}`);
  };

  const handleNavBid = (filter: string) => {
    const seenBidStr = localStorage.getItem('seen_expert_bids_tabs');
    const seenBidTabs = seenBidStr ? JSON.parse(seenBidStr) : {};
    
    bidTabs.forEach(t => {
       if (filter === 'ALL' || t.id === filter || t.id === 'ALL') {
           seenBidTabs[t.id] = t.count;
       }
    });
    localStorage.setItem('seen_expert_bids_tabs', JSON.stringify(seenBidTabs));
    
    router.push(`/expert/bids?userId=${userId}&filter=${filter}`);
  };

  if (!isMounted) return null; // Hydration mismatch 방지

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full">
      {/* 1:1 견적요청 */}
      <div className="flex-1 bg-white border border-blue-100 p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10 transition-colors"></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-0.5">고객이 보낸</p>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              1:1 견적요청
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-auto">
          {requestTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => handleNavRequest(tab.id)} 
              className="relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm active:scale-95 group"
            >
               {showReqTabN[tab.id] && (
                 <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-md animate-bounce z-10">N</span>
               )}
               <span className="text-[11px] font-bold text-slate-500 mb-1 tracking-tight group-hover:text-slate-700 break-keep">{tab.label}</span>
               <span className={`text-lg font-black ${tab.isAlert && tab.count > 0 ? 'text-rose-500' : 'text-blue-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 참여한 견적 */}
      <div className="flex-1 bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -z-10 transition-colors"></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-0.5">내가 제안한</p>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              참여한 견적
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 xl:grid-cols-7 sm:grid-cols-4 gap-2 mt-auto">
          {bidTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => handleNavBid(tab.id)} 
              className="relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm active:scale-95 group"
            >
               {showBidTabN[tab.id] && (
                 <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-md animate-bounce z-10">N</span>
               )}
               <span className="text-[11px] font-bold text-slate-500 mb-1 tracking-tight group-hover:text-slate-700 break-keep">{tab.label}</span>
               <span className={`text-lg font-black ${tab.isAlert && tab.count > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
