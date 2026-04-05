'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchX, Calendar } from 'lucide-react';
import ExpertReceivedRequestItem from './ExpertReceivedRequestItem';

type RequestFilterStatus = 'ALL' | 'PRE_BID' | 'SENT_BID' | 'ACCEPTED' | 'REJECTED' | 'UNREAD' | 'COMPLETED';

interface ExpertReceivedRequestListProps {
  bids: any[];
  expertId: number;
}

export default function ExpertReceivedRequestList({ bids, expertId }: ExpertReceivedRequestListProps) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as RequestFilterStatus) || 'ALL';
  const [statusFilter, setStatusFilter] = useState<RequestFilterStatus>(initialFilter);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // URL의 filter 값이 변경될 때마다 statusFilter를 동기화
  React.useEffect(() => {
    const filter = searchParams.get('filter') as RequestFilterStatus;
    if (filter) {
      setStatusFilter(filter);
    }
  }, [searchParams]);

  const stats = useMemo(() => {
    let preBid = 0;
    let sentBid = 0;
    let accepted = 0;
    let rejected = 0;
    let unread = 0;
    let completed = 0;

    bids.forEach(bid => {
      const bidStatus = bid.status;
      const estStatus = bid.estimate?.status;
      
      const unreadCount = bid.estimate?.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0;
      if (unreadCount > 0) unread++;

      if (bidStatus === 'ACCEPTED') {
        if (estStatus === 'COMPLETED') completed++;
        else accepted++;
      } else if (bidStatus === 'REJECTED' || estStatus === 'CANCELLED') {
        rejected++;
      } else if (bidStatus === 'PENDING') {
        if (bid.price === 0) {
          preBid++;
        } else {
          sentBid++;
        }
      }
    });

    return { all: bids.length, preBid, sentBid, accepted, rejected, unread, completed };
  }, [bids, expertId]);

  const filteredBids = useMemo(() => {
    return bids.filter(bid => {
      // Date Filter
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

      // Status Filter
      if (statusFilter === 'ALL') return true;

      const bidStatus = bid.status;
      const estStatus = bid.estimate?.status;
      const unreadCount = bid.estimate?.chats?.filter((c: any) => c.senderId !== expertId && !c.isRead).length || 0;

      if (statusFilter === 'UNREAD') {
        return unreadCount > 0;
      }

      let category: RequestFilterStatus = 'PRE_BID';
      
      if (bidStatus === 'ACCEPTED') {
        if (estStatus === 'COMPLETED') {
          category = 'COMPLETED';
        } else {
          category = 'ACCEPTED';
        }
      } else if (bidStatus === 'REJECTED' || estStatus === 'CANCELLED') {
        category = 'REJECTED'; 
      } else if (bidStatus === 'PENDING') {
        if (bid.price === 0) {
          category = 'PRE_BID';
        } else {
          category = 'SENT_BID';
        }
      }

      return statusFilter === category;
    });
  }, [bids, statusFilter, dateRange]);

  return (
    <div className="space-y-6">
      {/* 상태 필터 탭 */}
      <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-slate-200">
        <div className="flex min-w-max w-full">
          {[
            { id: 'ALL', label: '전체 요청', count: stats.all, activeCls: 'text-slate-900 border-slate-800', badgeActive: 'bg-slate-800 text-white' },
            { id: 'PRE_BID', label: '견적전 요청', count: stats.preBid, activeCls: 'text-emerald-600 border-emerald-500', badgeActive: 'bg-emerald-500 text-white' },
            { id: 'SENT_BID', label: '견적보낸 요청', count: stats.sentBid, activeCls: 'text-blue-600 border-blue-500', badgeActive: 'bg-blue-500 text-white' },
            { id: 'ACCEPTED', label: '확정된 요청', count: stats.accepted, activeCls: 'text-indigo-600 border-indigo-500', badgeActive: 'bg-indigo-500 text-white' },
            { id: 'COMPLETED', label: '서비스 완료', count: stats.completed, activeCls: 'text-purple-600 border-purple-500', badgeActive: 'bg-purple-500 text-white' },
            { id: 'REJECTED', label: '거절/취소', count: stats.rejected, activeCls: 'text-red-500 border-red-500', badgeActive: 'bg-red-500 text-white' },
            { id: 'UNREAD', label: '신규 메시지', count: stats.unread, activeCls: 'text-rose-500 border-rose-500', badgeActive: 'bg-rose-500 text-white', isAlert: true },
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as RequestFilterStatus)}
                className={`flex-1 sm:flex-none py-4 px-3 sm:px-6 border-b-2 font-bold text-[13px] sm:text-sm transition-all flex items-center justify-center gap-2
                  ${isActive ? tab.activeCls : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black transition-colors ${
                  isActive ? tab.badgeActive : (tab.isAlert && tab.count > 0 ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500')
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 목록 렌더링 */}
      {filteredBids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">필터 조건에 맞는 받은 요청이 없습니다.</h3>
          <p className="text-sm text-slate-500">
            상태나 기간 설정을 변경해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 mb-2 px-1">
            총 <span className="text-blue-600">{filteredBids.length}</span>건의 요청
          </div>
          {filteredBids.map((bid: any) => (
            <ExpertReceivedRequestItem 
              key={bid.id} 
              bid={bid} 
              expertId={expertId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
