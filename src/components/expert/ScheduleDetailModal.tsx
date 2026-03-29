'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getScheduleDetailAction } from '@/actions/schedule.action';

interface ScheduleDetailModalProps {
  estimateId: string;
  expertId: number;
  onClose: () => void;
}

export default function ScheduleDetailModal({ estimateId, expertId, onClose }: ScheduleDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{estimate: any, bid: any} | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Fetch detail data
    const fetchDetail = async () => {
      setLoading(true);
      const res = await getScheduleDetailAction(estimateId, expertId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || '정보를 불러오지 못했습니다.');
      }
      setLoading(false);
    };
    
    fetchDetail();

    return () => {
      // Re-enable body scroll when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [estimateId, expertId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 flex items-center justify-center shadow-2xl">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800">일정 상세내용</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content Body - Scrollable */}
        <div className="p-6 overflow-y-auto min-h-0 space-y-6">
          {error ? (
            <div className="text-center py-8 text-red-500 font-bold">{error}</div>
          ) : data ? (
            <>
              {/* Request Info Section */}
              <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-blue-50/50 px-5 py-3 border-b border-slate-200">
                  <h4 className="font-bold text-blue-700">참여한 요청 내용</h4>
                </div>
                <div className="p-5 space-y-4">
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <div className="text-xs text-slate-500 mb-1">고객명</div>
                      <div className="font-bold text-slate-800">{data.estimate.customer?.name || '알 수 없음'}</div>
                    </div>
                    <div className='flex-1'>
                      <div className="text-xs text-slate-500 mb-1">카테고리</div>
                      <div className="font-bold text-slate-800">{data.estimate.category}</div>
                    </div>
                  {data.estimate.subcategories && data.estimate.subcategories.length > 0 && (
                    <div className='flex-1'>
                      <div className="text-xs text-slate-500 mb-1">상세 카테고리</div>
                      <div className="font-bold text-slate-800">{data.estimate.subcategories.join(', ')}</div>
                    </div>
                  )}
                  </div>
                  <div>
                     <div className="text-xs text-slate-500 mb-1">서비스 위치</div>
                     <div className="font-bold text-slate-800">{data.estimate.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">요청 상세 내용</div>
                    <div className="font-medium text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{data.estimate.details}</div>
                  </div>
                </div>
              </div>

              {/* Estimate Info Section */}
              <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-200">
                  <h4 className="font-bold text-emerald-700">내가 지원한 견적 내용</h4>
                </div>
                <div className="p-5 space-y-4">
                  <div className='flex gap-2'>
                  <div className='flex-1'>
                    <div className="text-xs text-slate-500 mb-1">총 견적 금액</div>
                    <div className="font-black text-lg text-emerald-600">{data.bid.price.toLocaleString()}원</div>
                  </div>
                  <div className='flex-1'>
                     <div className="text-xs text-slate-500 mb-1">시공 가능일</div>
                     <div className="font-bold text-slate-800">{data.bid.availableDate || '-'}</div>
                  </div>
                  </div>
                  {data.bid.message && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">추가 제안 메시지</div>
                      <div className="font-medium text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{data.bid.message}</div>
                    </div>
                  )}
                  
                  {data.bid.items && data.bid.items.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-2">견적 항목 상세</div>
                      <div className="space-y-2">
                        {data.bid.items.map((item: any) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-xl gap-2">
                            <div className="font-bold text-slate-700">{item.name}</div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-slate-500">{item.content} ({item.period})</span>
                              <span className="font-bold text-emerald-600 w-24 text-right">{item.amount.toLocaleString()}원</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-white">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors w-full sm:w-auto"
           >
             확인
           </button>
        </div>
      </div>
    </div>
  );
}
