'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getMyRequestsAction } from '@/actions/estimate.action';
import MyRequestListItem from '@/components/user/MyRequestListItem';
import { useSearchParams } from 'next/navigation';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export default function UserRequestsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [readBids, setReadBids] = useState<string[]>([]);
  const [readChatsLocally, setReadChatsLocally] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('read_bids');
    if (stored) setReadBids(JSON.parse(stored));
  }, []);

  const handleMarkBidsAsRead = (bidIds: string[]) => {
    setReadBids(prev => {
      const updated = Array.from(new Set([...prev, ...bidIds]));
      localStorage.setItem('read_bids', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkChatAsRead = (estimateId: string) => {
    setReadChatsLocally(prev => Array.from(new Set([...prev, estimateId])));
  };

  // URL 파라미터에서 필터 상태 가져오기
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

      getMyRequestsAction(userId)
        .then(res => {
          if (res.success && res.data) {
            setRequests(res.data);
          } else {
            setError(res.error || "데이터를 불러오는 데 실패했습니다.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch requests:", err);
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
    let newBids = 0;
    let newMessage = 0;

    requests.forEach(r => {
      const isChatRead = readChatsLocally.includes(r.id);
      if (r.unreadChatCount > 0 && !isChatRead) newMessage++;
      
      const hasNewBid = r.bids && r.bids.some((b: any) => !readBids.includes(b.id));
      if ((r.status === 'PENDING' || r.status === 'BIDDING') && hasNewBid) {
        newBids++;
      }
    });

    return {
      ALL: requests.length,
      DRAFT: requests.filter(r => r.status === 'DRAFT').length,
      NEW_BIDS: newBids,
      NEW_MESSAGE: newMessage,
      MATCHING: requests.filter(r => r.status === 'PENDING' || r.status === 'BIDDING' || r.status === 'SELECTED').length,
      FINISHED: requests.filter(r => r.status === 'IN_PROGRESS').length,
      INSPECTION: requests.filter(r => r.status === 'INSPECTION').length,
      COMPLETED: requests.filter(r => r.status === 'COMPLETED').length,
      CANCELLED: requests.filter(r => r.status === 'CANCELLED').length,
    };
  }, [requests, readBids, readChatsLocally]);

  const filteredRequests = React.useMemo(() => {
    if (activeFilter === 'ALL') return requests;
    if (activeFilter === 'DRAFT') return requests.filter(r => r.status === 'DRAFT');
    
    if (activeFilter === 'NEW_BIDS') {
      return requests.filter(r => (r.status === 'PENDING' || r.status === 'BIDDING') && r.bids?.some((b: any) => !readBids.includes(b.id)));
    }
    if (activeFilter === 'NEW_MESSAGE') {
      return requests.filter(r => r.unreadChatCount > 0 && !readChatsLocally.includes(r.id));
    }

    if (activeFilter === 'MATCHING') return requests.filter(r => r.status === 'PENDING' || r.status === 'BIDDING' || r.status === 'SELECTED');
    if (activeFilter === 'FINISHED') return requests.filter(r => r.status === 'IN_PROGRESS');
    if (activeFilter === 'INSPECTION') return requests.filter(r => r.status === 'INSPECTION');
    if (activeFilter === 'COMPLETED') return requests.filter(r => r.status === 'COMPLETED');
    if (activeFilter === 'CANCELLED') return requests.filter(r => r.status === 'CANCELLED');
    return requests;
  }, [requests, activeFilter, readBids, readChatsLocally]);

  const filters = [
    { label: '전체', value: 'ALL', count: counts.ALL, activeCls: 'text-slate-900 border-slate-800', badgeActive: 'bg-slate-800 text-white' },
    { label: '작성중', value: 'DRAFT', count: counts.DRAFT, activeCls: 'text-amber-600 border-amber-500', badgeActive: 'bg-amber-500 text-white' },
    { label: '신규견적', value: 'NEW_BIDS', count: counts.NEW_BIDS, activeCls: 'text-emerald-600 border-emerald-500', badgeActive: 'bg-emerald-500 text-white' },
    { label: '매칭중', value: 'MATCHING', count: counts.MATCHING, activeCls: 'text-blue-600 border-blue-500', badgeActive: 'bg-blue-500 text-white' },
    { label: '전문가확정', value: 'FINISHED', count: counts.FINISHED, activeCls: 'text-indigo-600 border-indigo-500', badgeActive: 'bg-indigo-500 text-white' },
    { label: '검수요청', value: 'INSPECTION', count: counts.INSPECTION, activeCls: 'text-fuchsia-600 border-fuchsia-500', badgeActive: 'bg-fuchsia-500 text-white' },
    { label: '서비스완료', value: 'COMPLETED', count: counts.COMPLETED, activeCls: 'text-slate-600 border-slate-600', badgeActive: 'bg-slate-600 text-white' },
    { label: '취소', value: 'CANCELLED', count: counts.CANCELLED, activeCls: 'text-red-600 border-red-500', badgeActive: 'bg-red-500 text-white' },
    { label: '신규메시지', value: 'NEW_MESSAGE', count: counts.NEW_MESSAGE, activeCls: 'text-red-500 border-red-500', badgeActive: 'bg-red-500 text-white' },
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
        <p className="text-slate-500 mb-6">내 요청 내역을 확인하시려면 먼저 로그인해 주세요.</p>
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
        <h2 className="text-2xl font-black text-slate-900">내 요청 내역</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">작성하신 서비스 요청에 대한 진행 상황을 확인해보세요.</p>
        
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
            <MyRequestListItem 
              key={request.id} 
              estimate={request} 
              activeFilter={activeFilter}
              onMoveToStatus={(status) => setActiveFilter(status)}
              onMarkBidsAsRead={handleMarkBidsAsRead}
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
            {activeFilter === 'ALL' ? '진행 중인 요청이 없습니다' : '해당하는 요청이 없습니다'}
          </h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">생활 속 도움이 필요한 순간, 원픽 전문가님들께 견적을 요청해보세요!</p>
          <a href="/estimate/new">
            <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              새 견적 요청하기
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
