'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, CheckCircle2, Edit3 } from 'lucide-react';
import { updateBidAction, checkDateAvailabilityAction } from '@/actions/expert.action';
import { useSession } from 'next-auth/react';

export default function BidEditModal({ 
  bid, 
  isOpen, 
  onClose,
  onSuccess 
}: { 
  bid: any, 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const { data: session } = useSession();
  const userGrade = (session?.user as any)?.grade;

  const [message, setMessage] = useState('');
  const [bidItems, setBidItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAvailableDates, setSelectedAvailableDates] = useState<string[]>([]);
  const [conflictData, setConflictData] = useState<{ conflicts: string[], events: any[] } | null>(null);

  // Reset form when bid changes or modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (isOpen && bid) {
      setMessage(bid.message || '');
      setBidItems(
        bid.items && bid.items.length > 0
          ? bid.items.map((item: any) => ({
              name: item.name,
              content: item.content,
              periodValue: item.period.replace(/[^0-9]/g, '') || '1',
              periodUnit: item.period.replace(/[0-9]/g, '') || '일',
              amount: String(Math.floor(item.amount / 10000))
            }))
          : [{ name: '', content: '', periodValue: '1', periodUnit: '일', amount: '' }]
      );
      if (bid.availableDate) {
        setSelectedAvailableDates(bid.availableDate.split(',').map((d: string) => d.trim()));
      } else {
        setSelectedAvailableDates([]);
      }
      setError('');
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, bid]);

  if (!isOpen || !bid) return null;

  const addBidItem = () => {
    setBidItems([...bidItems, { name: '', content: '', periodValue: '1', periodUnit: '일', amount: '' }]);
  };

  const removeBidItem = (index: number) => {
    if (bidItems.length === 1) return;
    setBidItems(bidItems.filter((_, i) => i !== index));
  };

  const updateBidItem = (index: number, field: string, value: string) => {
    const newItems = [...bidItems];
    
    if (field === 'amount') {
      const numericValue = parseInt(value);
      if (numericValue < 0) {
        (newItems[index] as any)[field] = '0';
      } else {
        (newItems[index] as any)[field] = value;
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    setBidItems(newItems);
  };

  const getTotalAmount = () => {
    return bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0);
  };

  const handleSubmit = async (e?: React.FormEvent, bypassConflict = false) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    // 유효성 검사
    const isValid = bidItems.every(item => item.name && item.amount && parseInt(item.amount) > 0);
    if (!isValid) {
      setError("모든 항목의 명칭과 올바른 금액을 입력해 주세요.");
      return;
    }

    // 서비스 가능일 파싱 검증
    const estimate = bid.estimate;
    let parsedDates: string[] = [];
    if (estimate?.serviceDate) {
      if (estimate.serviceDate.startsWith('희망일:')) {
        parsedDates = estimate.serviceDate.replace('희망일: ', '').split(', ');
      } else if (estimate.serviceDate.startsWith('정기:')) {
        const match = estimate.serviceDate.match(/\((.*?)\)/);
        if (match && match[1]) {
          parsedDates = match[1].split(', ').map((day: string) => `${day}요일`);
        }
      } else if (estimate.serviceDate.startsWith('가능일:')) {
        parsedDates = estimate.serviceDate.replace('가능일: ', '').split(', ');
      } else if (estimate.serviceDate.includes(',')) {
        parsedDates = estimate.serviceDate.split(',').map((d: string) => d.trim());
      } else {
        parsedDates = [estimate.serviceDate];
      }
    }

    if (parsedDates.length > 0 && selectedAvailableDates.length === 0) {
      setError("서비스 가능일을 확인하고 하나 이상 선택해 주세요.");
      return;
    }

    // 일정 중복 검증
    if (selectedAvailableDates.length > 0 && !bypassConflict) {
      setIsLoading(true);
      const conflictRes = await checkDateAvailabilityAction(bid.expertId, selectedAvailableDates, bid.id);
      setIsLoading(false);
      if (conflictRes.success && conflictRes.hasConflict) {
        setConflictData({ 
          conflicts: conflictRes.conflicts as string[], 
          events: conflictRes.conflictingEvents || [] 
        });
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const itemsToSubmit = bidItems.map(item => ({
        name: item.name,
        content: item.content,
        period: `${item.periodValue}${item.periodUnit}`,
        amount: (parseInt(item.amount) || 0) * 10000
      }));

      const result = await updateBidAction({
        bidId: bid.id,
        price: getTotalAmount(),
        message,
        items: itemsToSubmit,
        availableDate: selectedAvailableDates.length > 0 ? selectedAvailableDates.join(', ') : '',
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || '견적 작성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">견적서 작성</h3>
            <p className="text-slate-500 text-sm mt-1">항목별로 상세한 견적 내용을 작성해 주세요.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50 flex-1">
          <form id="bid-edit-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-blue-800">
                <p className="font-bold mb-1">견적 작성 안내</p>
                <p className="text-blue-600/80 leading-relaxed">고객이 다른 전문가를 채택하거나 견적이 마감되기 전까지만 수정 및 작성이 가능합니다. 정확하고 상세한 내용을 입력해 주세요.</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8" />

            {/* List of bid items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900">상세 항목 내역</h4>
                <button 
                  type="button"
                  onClick={addBidItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> 항목 추가
                </button>
              </div>

              <div className="space-y-4">
                {bidItems.map((item, index) => (
                  <div key={index} className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                    {bidItems.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeBidItem(index)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 ml-1">항목명</label>
                        <input 
                          type="text"
                          placeholder="예: 자재비"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                          value={item.name}
                          onChange={(e) => updateBidItem(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-4">
                        <label className="text-[11px] font-black text-slate-400 ml-1">내용</label>
                        <input 
                          type="text"
                          placeholder="예: 친환경 벽지"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                          value={item.content}
                          onChange={(e) => updateBidItem(index, 'content', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 ml-1">예상 소요기간</label>
                        <div className="flex gap-1">
                          <select 
                            className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={item.periodValue}
                            onChange={(e) => updateBidItem(index, 'periodValue', e.target.value)}
                          >
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                          <select 
                            className="w-auto shrink-0 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={item.periodUnit}
                            onChange={(e) => updateBidItem(index, 'periodUnit', e.target.value)}
                          >
                            <option value="일">일</option>
                            <option value="주">주</option>
                            <option value="월">월</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-black text-slate-400 ml-1">예상 금액(만원)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            placeholder="0"
                            min="0"
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-blue-600 text-right"
                            value={item.amount}
                            onChange={(e) => updateBidItem(index, 'amount', e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">만원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 서비스 가능일 수정 영역 */}
            {bid.estimate?.serviceDate && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  서비스 가능일
                  <span className="text-red-500">*</span>
                </h4>
                <p className="text-slate-500 text-xs mb-4 ml-3.5">고객님이 희망하는 서비스 일정 중, 방문 가능한 날짜를 선택해 주세요.</p>
                <div className="flex flex-wrap gap-2 ml-3.5">
                  {(() => {
                    const estimate = bid.estimate;
                    let parsedDates: string[] = [];
                    if (estimate.serviceDate.startsWith('희망일:')) {
                      parsedDates = estimate.serviceDate.replace('희망일: ', '').split(', ');
                    } else if (estimate.serviceDate.startsWith('정기:')) {
                      const match = estimate.serviceDate.match(/\((.*?)\)/);
                      if (match && match[1]) {
                        parsedDates = match[1].split(', ').map((day: string) => `${day}요일`);
                      }
                    } else if (estimate.serviceDate.startsWith('가능일:')) {
                      parsedDates = estimate.serviceDate.replace('가능일: ', '').split(', ');
                    } else if (estimate.serviceDate.includes(',')) {
                      parsedDates = estimate.serviceDate.split(',').map((d: string) => d.trim());
                    } else {
                      parsedDates = [estimate.serviceDate];
                    }

                    return parsedDates.map((dateStr, idx) => {
                      const isSelected = selectedAvailableDates.includes(dateStr);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedAvailableDates(prev => 
                              isSelected ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                            );
                          }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                            isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {dateStr}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-900 ml-1 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" /> 전문가 메시지 (선택)
              </label>
              <textarea 
                placeholder="고객님께 전달할 추가 제안이나 전문가님만의 차별점을 2줄 이상 상세히 입력해 주세요."
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-28 text-base resize-none leading-relaxed shadow-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Error Area */}
            {error && (
              <p className="text-sm font-bold text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            {/* Calculation & Submit Box */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> 작성한 견적 내용
                  </div>
                </h4>
                
                <div className="space-y-3">
                  {bidItems.map((item, index) => {
                    if (!item.name || !item.amount) return null;
                    return (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">{item.name} <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-400">{item.periodValue}{item.periodUnit}</span></span>
                        <span className="text-slate-900 font-bold">
                          {((parseInt(item.amount) || 0) * 10000).toLocaleString()}원
                        </span>
                      </div>
                    );
                  })}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">총 견적 합계</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600">
                        {getTotalAmount().toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-600 ml-0.5">원</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden group gap-4 h-full flex flex-col min-h-[160px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all" />
                <p className="text-white/70 text-sm font-bold mb-1 relative z-10">
                  총 견적 금액
                </p>
                <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{getTotalAmount().toLocaleString()}</span>
                    <span className="text-lg font-bold text-white/60">원</span>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  form="bid-edit-form"
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:bg-slate-700 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      작성 완료
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
        
      </div>

      {/* 중복 상세 모달 */}
      {conflictData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh] m-auto mt-10 mb-10">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-5">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">선택하신 날짜에 이미 등록된 일정이 있습니다</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                그래도 무시하고 수정 사항을 저장하시겠습니까?<br />(겹치는 날짜: <span className="font-bold text-slate-700">{conflictData.conflicts.join(', ')}</span>)
              </p>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 mb-2">기존 일정 목록</p>
                {conflictData.events.map((event: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                          {event.requestNumber || '요청'}
                        </span>
                        {event.status === 'PENDING' && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded text-[10px] font-bold border border-yellow-200">견적 대기중</span>}
                        {event.status === 'ACCEPTED' && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-200">채택됨(예정)</span>}
                        {event.status === 'COMPLETED' && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold border border-green-200">완료됨</span>}
                        {event.status === 'REJECTED' && <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold border border-slate-200">마감/거절</span>}
                        {event.status === 'CANCELED' && <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[10px] font-bold border border-red-200">취소됨</span>}
                        
                        <h4 className="font-bold text-sm text-slate-800 ml-0.5">{event.category}</h4>
                      </div>
                      <span className="text-lg font-black text-slate-900 shrink-0 ml-2">{event.price.toLocaleString()}원</span>
                    </div>
                    {event.details && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{event.details}</p>
                    )}
                    <div className="mt-2 text-xs font-bold text-slate-600 bg-white inline-block border border-slate-200 px-2 py-1 rounded-md self-start">
                      {event.availableDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setConflictData(null);
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              >
                취소
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setConflictData(null);
                  handleSubmit(undefined, true);
                }}
                disabled={isLoading}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '무시하고 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
