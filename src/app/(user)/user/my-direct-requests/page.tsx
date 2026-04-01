'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getMyDirectRequestsAction } from '@/actions/estimate.action';
import MyDirectRequestListItem from '@/components/user/MyDirectRequestListItem';
import { useSearchParams } from 'next/navigation';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export default function UserDirectRequestsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [readChatsLocally, setReadChatsLocally] = useState<string[]>([]);

  const handleMarkChatAsRead = (estimateId: string) => {
    setReadChatsLocally(prev => Array.from(new Set([...prev, estimateId])));
  };

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setActiveFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);
      if (isNaN(userId)) {
        setError("유효하지 않은 사용자 ID입니다.");
        setIsLoading(false);
        return;
      }

      getMyDirectRequestsAction(userId)
        .then(res => {
          if (res.success && res.data) {
            setRequests(res.data);
          } else {
            setError(res.error || "데이터를 불러오는 데 실패했습니다.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch direct requests:", err);
          setError("오류가 발생했습니다.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const counts = React.useMemo(() => {
    let preBid = 0;
    let receivedBid = 0;
    let newMessage = 0;
    let confirmed = 0;
    let rejectedCancelled = 0;

    requests.forEach(r => {
      const bid = r.bids?.[0];
      const isChatRead = readChatsLocally.includes(r.id);
      if (r.unreadChatCount > 0 && !isChatRead) newMessage++;
      
      const isPreBid = bid && bid.price === 0 && bid.status === 'PENDING';
      const hasReceivedBid = bid && bid.price > 0 && bid.status === 'PENDING';
      const isConfirmed = bid?.status === 'ACCEPTED' || ['SELECTED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status);
      const isCanceledOrRejected = r.status === 'CANCELLED' || bid?.status === 'REJECTED';

      if (isPreBid) preBid++;
      if (hasReceivedBid && !isConfirmed && !isCanceledOrRejected) receivedBid++;
      if (isConfirmed) confirmed++;
      if (isCanceledOrRejected) rejectedCancelled++;
    });

    return {
      ALL: requests.length,
      PRE_BID: preBid,
      RECEIVED_BID: receivedBid,
      NEW_MESSAGE: newMessage,
      CONFIRMED: confirmed,
      REJECTED_CANCELLED: rejectedCancelled,
    };
  }, [requests, readChatsLocally]);

  const filteredRequests = React.useMemo(() => {
    if (activeFilter === 'ALL') return requests;
    
    if (activeFilter === 'NEW_MESSAGE') {
      return requests.filter(r => r.unreadChatCount > 0 && !readChatsLocally.includes(r.id));
    }
    
    return requests.filter(r => {
      const bid = r.bids?.[0];
      const isPreBid = bid && bid.price === 0 && bid.status === 'PENDING';
      const hasReceivedBid = bid && bid.price > 0 && bid.status === 'PENDING';
      const isConfirmed = bid?.status === 'ACCEPTED' || ['SELECTED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status);
      const isCanceledOrRejected = r.status === 'CANCELLED' || bid?.status === 'REJECTED';

      if (activeFilter === 'PRE_BID') return isPreBid;
      if (activeFilter === 'RECEIVED_BID') return hasReceivedBid && !isConfirmed && !isCanceledOrRejected;
      if (activeFilter === 'CONFIRMED') return isConfirmed;
      if (activeFilter === 'REJECTED_CANCELLED') return isCanceledOrRejected;
      
      return true;
    });
  }, [requests, activeFilter, readChatsLocally]);

  const filters = [
    { label: '전체', value: 'ALL', count: counts.ALL, activeCls: 'text-slate-900 border-slate-800', badgeActive: 'bg-slate-800 text-white' },
    { label: '견적전', value: 'PRE_BID', count: counts.PRE_BID, activeCls: 'text-amber-600 border-amber-500', badgeActive: 'bg-amber-500 text-white' },
    { label: '받은견적', value: 'RECEIVED_BID', count: counts.RECEIVED_BID, activeCls: 'text-emerald-600 border-emerald-500', badgeActive: 'bg-emerald-500 text-white' },
    { label: '신규메시지', value: 'NEW_MESSAGE', count: counts.NEW_MESSAGE, activeCls: 'text-red-500 border-red-500', badgeActive: 'bg-red-500 text-white' },
    { label: '확정', value: 'CONFIRMED', count: counts.CONFIRMED, activeCls: 'text-blue-600 border-blue-500', badgeActive: 'bg-blue-500 text-white' },
    { label: '거절/취소', value: 'REJECTED_CANCELLED', count: counts.REJECTED_CANCELLED, activeCls: 'text-red-600 border-red-500', badgeActive: 'bg-red-500 text-white' },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">요청 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">로그인이 필요합니다</h2>
        <p className="text-slate-500 mb-6">1:1 요청 내역을 확인하시려면 먼저 로그인해 주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-red-50 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">오류 발생</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">1:1 견적 요청 내역</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">지정된 전문가에게 바로 요청한 다이렉트 견적 진행 상황을 확인해보세요.</p>
        
        <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-slate-200">
          <div className="flex min-w-max w-full">
            {filters.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`flex-1 sm:flex-none py-4 px-4 sm:px-6 border-b-2 font-bold text-[13px] sm:text-sm transition-all flex items-center justify-center gap-2
                    ${isActive ? f.activeCls : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  {f.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black transition-colors ${
                    isActive ? f.badgeActive : 'bg-slate-100 text-slate-500'
                  }`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <div className="flex flex-col">
          {filteredRequests.map((request) => (
            <MyDirectRequestListItem 
              key={request.id} 
              estimate={request} 
              activeFilter={activeFilter}
              onMoveToStatus={(status) => setActiveFilter(status)}
              onMarkChatAsRead={handleMarkChatAsRead}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {activeFilter === 'ALL' ? '진행 중인 1:1 견적 요청이 없습니다' : '해당하는 요청이 없습니다'}
          </h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">더 신속하고 직접적인 소통을 원하신다면,<br/> 전문가 프로필에서 다이렉트 견적을 요청해보세요.</p>
          <a href="/expert/find">
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              전문가 찾기
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
