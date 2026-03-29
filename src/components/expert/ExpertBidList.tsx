'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ExpertBidListItem from './ExpertBidListItem';
import { Filter, Calendar, SearchX } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

type BidFilterStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'UNREAD';

interface ExpertBidListProps {
  bids: any[];
  expertId: number;
  currentUserName: string;
}

export default function ExpertBidList({ bids, expertId, currentUserName }: ExpertBidListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialBidId = searchParams?.get('bidId') || '';
  const initialFilterParam = searchParams?.get('filter') as string;
  const initialFilter = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'UNREAD'].includes(initialFilterParam) 
    ? (initialFilterParam as BidFilterStatus) 
    : 'ALL';

  const [statusFilter, setStatusFilter] = useState<BidFilterStatus>(initialFilter);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [targetBidId, setTargetBidId] = useState(initialBidId);
  const [readChatsLocally, setReadChatsLocally] = useState<string[]>([]);

  useEffect(() => {
    const bidIdParam = searchParams?.get('bidId');
    if (bidIdParam) {
      setTargetBidId(bidIdParam);
    }
  }, [searchParams]);

  const handleStatusChange = (status: BidFilterStatus) => {
    setStatusFilter(status);
    if (targetBidId) {
      setTargetBidId('');
      router.replace('/expert/bids');
    }
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    if (targetBidId) {
      setTargetBidId('');
      router.replace('/expert/bids');
    }
  };

  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    let unread = 0;

    bids.forEach(bid => {
      const bidStatus = bid.status;
      const estStatus = bid.estimate.status;

      const unreadCount = !readChatsLocally.includes(bid.estimate.id)
        ? bid.estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0
        : 0;
      if (unreadCount > 0) {
        unread++;
      }

      if (bidStatus === 'ACCEPTED') {
        accepted++;
      } else if (
        bidStatus === 'REJECTED' || 
        estStatus === 'CANCELLED' || 
        estStatus === 'SELECTED' || 
        estStatus === 'IN_PROGRESS' || 
        estStatus === 'COMPLETED'
      ) {
        rejected++;
      } else {
        pending++;
      }
    });

    return { all: bids.length, pending, accepted, rejected, unread };
  }, [bids, expertId, readChatsLocally]);

  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      // 0. 대상 견적 고유 ID 필터 (이 값이 있으면 다른 조건 무시하고 해당 견적만 표시)
      if (targetBidId && bid.id === targetBidId) return true;
      if (targetBidId) return false;

      // 1. 기간(Date) 필터
      if (dateRange.start) {
        const bidDate = new Date(bid.createdAt).setHours(0, 0, 0, 0);
        const startDate = new Date(dateRange.start).setHours(0, 0, 0, 0);
        if (bidDate < startDate) return false;
      }
      if (dateRange.end) {
        const bidDate = new Date(bid.createdAt).setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end).setHours(0, 0, 0, 0);
        if (bidDate > endDate) return false;
      }

      // 2. 상태(Status) 필터
      if (statusFilter === 'ALL') return true;

      const unreadCount = !readChatsLocally.includes(bid.estimate.id)
        ? bid.estimate.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0
        : 0;
      if (statusFilter === 'UNREAD') {
        return unreadCount > 0;
      }

      const bidStatus = bid.status;
      const estStatus = bid.estimate.status;

      let category: BidFilterStatus = 'PENDING';
      
      if (bidStatus === 'ACCEPTED') {
        category = 'ACCEPTED';
      } else if (
        bidStatus === 'REJECTED' || 
        estStatus === 'CANCELLED' || 
        estStatus === 'SELECTED' || 
        estStatus === 'IN_PROGRESS' || 
        estStatus === 'COMPLETED'
      ) {
        category = 'REJECTED'; 
        // 채택 안되고 다른 고수가 채택되었거나, 요청이 취소되었거나, 명시적 거절된 경우
      }

      return statusFilter === category;
    });
  }, [bids, statusFilter, dateRange, targetBidId, expertId, readChatsLocally]);

  return (
    <div className="space-y-6">
      {/* 상태 필터 탭 (통계 포함) */}
      <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-slate-200">
        <div className="flex min-w-max w-full">
          {[
            { id: 'ALL', label: '전체 견적', count: stats.all, activeCls: 'text-slate-900 border-slate-800', badgeActive: 'bg-slate-800 text-white' },
            { id: 'PENDING', label: '매칭 대기중', count: stats.pending, activeCls: 'text-emerald-600 border-emerald-500', badgeActive: 'bg-emerald-500 text-white' },
            { id: 'UNREAD', label: '신규 메시지', count: stats.unread, activeCls: 'text-red-500 border-red-500', badgeActive: 'bg-red-500 text-white' },
            { id: 'ACCEPTED', label: '채택된 견적', count: stats.accepted, activeCls: 'text-blue-600 border-blue-500', badgeActive: 'bg-blue-500 text-white' },
            { id: 'REJECTED', label: '거절/취소', count: stats.rejected, activeCls: 'text-slate-500 border-slate-500', badgeActive: 'bg-slate-500 text-white' },
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id as BidFilterStatus)}
                className={`flex-1 sm:flex-none py-4 px-4 sm:px-8 border-b-2 font-bold text-[13px] sm:text-sm transition-all flex items-center justify-center gap-2
                  ${isActive ? tab.activeCls : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black transition-colors ${
                  isActive ? tab.badgeActive : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 기간 필터 영역 */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4">

        {/* 기간 필터 */}
        <div className="flex flex-wrap items-center gap-2 xl:border-l xl:border-slate-200 xl:pl-6">
          <div className="flex items-center gap-2 mr-1 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-bold">기간</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            />
            <span className="text-slate-400 font-bold">~</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
            />
          </div>
          {(dateRange.start || dateRange.end || targetBidId) && (
            <button 
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setTargetBidId('');
                router.replace('/expert/bids');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 목록 렌더링 */}
      {filteredBids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">필터 조건에 맞는 견적이 없습니다.</h3>
          <p className="text-sm text-slate-500">
            상태나 기간 설정을 변경해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 mb-2 px-1">
            총 <span className="text-blue-600">{filteredBids.length}</span>건의 견적
          </div>
          {filteredBids.map((bid: any) => (
            <ExpertBidListItem 
              key={bid.id} 
              bid={bid} 
              expertId={expertId} 
              currentUserName={currentUserName} 
              activeFilter={statusFilter}
              onMoveToStatus={handleStatusChange}
              onMarkChatAsRead={(estimateId: string) => {
                setReadChatsLocally(prev => Array.from(new Set([...prev, estimateId])));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
