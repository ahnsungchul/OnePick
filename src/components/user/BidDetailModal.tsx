import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BidItem {
  id: string;
  name: string;
  content: string;
  period: string;
  amount: number;
}

interface BidDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: any;
}

export default function BidDetailModal({ isOpen, onClose, bid }: BidDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !bid) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 flex-shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">제안 상세 내용</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <img 
              src={bid.expert.image || `https://picsum.photos/seed/${bid.expert.id || bid.expert.name}/100/100`} 
              alt={bid.expert.name} 
              className="w-16 h-16 rounded-full object-cover border border-slate-100" 
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm text-slate-500 font-bold">{bid.expert.specialty || '전문가'}</p>
              <h4 className="text-lg font-black text-slate-900">{bid.expert.name} 고수</h4>
            </div>
          </div>

          <div className="space-y-6">
            {bid.message && (
              <div>
                <h5 className="text-sm font-bold text-slate-700 mb-2">전문가 메시지</h5>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {bid.message}
                </div>
              </div>
            )}

            <div>
              <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>상세 견적 항목</span>
                <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-md font-bold">총 {bid.items?.length || 0}건</span>
              </h5>
              
              <div className="space-y-3">
                {bid.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <div className='flex flex-row items-center gap-2'>
                        <p className="font-bold text-slate-800 text-sm mb-1">{item.name}</p>
                        {item.content && <p className="text-slate-500 text-xs mb-1">{item.content}</p>}
                      </div>
                      {item.period && <p className="text-slate-400 text-[10px] font-bold">예상 소요 시간: {item.period}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-blue-600">{item.amount?.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
                {!bid.items || bid.items.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 rounded-xl text-slate-400 text-sm font-bold">
                    등록된 상세 항목이 없습니다.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center shadow-lg shadow-slate-900/20">
            <span className="font-bold text-white/80">총 제안 금액</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{bid.price?.toLocaleString() || 0}</span>
              <span className="text-sm font-bold text-white/60">원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
