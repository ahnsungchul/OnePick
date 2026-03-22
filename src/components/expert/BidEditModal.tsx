'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, CheckCircle2, Edit3 } from 'lucide-react';
import { updateBidAction } from '@/actions/expert.action';
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

  // Reset form when bid changes or modal opens
  useEffect(() => {
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
      setError('');
    }
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
    const baseAmount = bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0);
    const vat = userGrade === 'PRO' ? Math.floor(baseAmount * 0.1) : 0;
    return baseAmount + vat;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // 유효성 검사
    const isValid = bidItems.every(item => item.name && item.amount && parseInt(item.amount) > 0);
    if (!isValid) {
      setError("모든 항목의 명칭과 올바른 금액을 입력해 주세요.");
      return;
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
        items: itemsToSubmit
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || '견적 수정 중 오류가 발생했습니다.');
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
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">견적 제안 수정</h3>
            <p className="text-slate-500 text-sm mt-1">항목별로 상세한 견적 내용을 수정해 주세요.</p>
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
                <p className="font-bold mb-1">견적 수정 안내</p>
                <p className="text-blue-600/80 leading-relaxed">고객이 다른 전문가를 채택하거나 견적이 마감되기 전까지만 수정할 수 있습니다. 이미 작성된 항목을 변경하거나 새 작업을 추가하실 수 있습니다.</p>
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

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-900 ml-1 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" /> 전문가 메시지 (선택)
              </label>
              <textarea 
                placeholder="고객님께 전달할 추가 제안이나 고수님만의 차별점을 2줄 이상 상세히 입력해 주세요."
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
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> 예상 정산 내역 확인
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    플랫폼 수수료는 합리적인 상한제 적용 (최대 1만원)
                  </span>
                </h4>
                
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">총 항목 합계</span>
                    <span className="text-slate-900 font-black">
                      {(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0)).toLocaleString()}원
                    </span>
                  </div>

                  {userGrade === 'PRO' && (
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-slate-500 font-medium">부가세 (10%)</span>
                      <span className="text-blue-600 font-black">
                        + {(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.1)).toLocaleString()}원
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-slate-100 mt-3" />

                  <div className="flex justify-between items-center text-sm mt-[5px]">
                    <span className="text-slate-500 font-medium">PG 수수료 (3%)</span>
                    <span className="text-red-500 font-bold">
                      - {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03).toLocaleString()}원
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-[5px]">
                    <span className="text-slate-500 font-medium">플랫폼 이용료 (2%, 최대 1만)</span>
                    <div className="flex items-center gap-2">
                      {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02) > 10000 && (
                        <span className="text-slate-400 line-through text-[11px]">
                          - {Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02).toLocaleString()}원
                        </span>
                      )}
                      <span className="text-red-500 font-bold">
                        - {Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-[5px]">
                    <span className="text-slate-500 font-medium">이용료 부가세 (10%)</span>
                    <span className="text-red-500 font-bold">
                      - {Math.floor((
                        Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + 
                        Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000)
                      ) * 0.1).toLocaleString()}원
                    </span>
                  </div>

                  {userGrade === 'HELPER' && (
                    <div className="flex justify-between items-center text-sm text-slate-400 mt-[5px]">
                      <span className="font-medium">원천세 (3.3%)</span>
                      <span className="font-bold">
                        - {(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.033)).toLocaleString()}원
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">최종 예상 입금액</p>
                      <p className="text-[10px] text-slate-400">수수료 및 세금 공제 후</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600">
                        {(
                          getTotalAmount() - 
                          (
                            Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + // PG (3%)
                            Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000) // Platform (2% cap 10k)
                          ) -
                          Math.floor((
                            Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.03) + 
                            Math.min(Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.02), 10000)
                          ) * 0.1) - // Fee VAT (10%)
                          (userGrade === 'HELPER' ? Math.floor(bidItems.reduce((sum, item) => sum + (parseInt(item.amount) || 0) * 10000, 0) * 0.033) : 0) // Tax
                        ).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-600 ml-0.5">원</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden group h-full flex flex-col min-h-[160px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all" />
                <p className="text-white/70 text-sm font-bold mb-1 relative z-10">
                  총 견적 금액 {userGrade === 'PRO' && <span className="text-blue-400 text-[10px] ml-1">(VAT 포함)</span>}
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
                      수정 완료
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
        
      </div>
    </div>
  );
}
