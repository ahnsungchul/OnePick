import React, { useState, useEffect } from 'react';
import { X, Zap, CreditCard } from 'lucide-react';
import { upgradeToUrgentAction } from '@/actions/estimate.action';
import { useSession } from 'next-auth/react';

interface UrgentUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
}

export default function UrgentUpgradeModal({ isOpen, onClose, estimateId }: UrgentUpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }
    setIsProcessing(true);
    
    // 긴급업그레이드 비용: 3000원으로 고정 (테스트 환경)
    const result = await upgradeToUrgentAction(estimateId, parseInt(session.user.id, 10), 3000);
    
    if (result.success) {
      alert("결제가 완료되어 요청이 긴급으로 전환되었습니다!");
      window.location.reload();
    } else {
      alert(result.error || "결제 처리 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">긴급 요청 서비스</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-slate-50">
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100 shadow-sm mb-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-red-600 fill-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">요청을 긴급으로 전환하세요!</h3>
            <p className="text-sm text-red-600/80 leading-relaxed font-medium">
              긴급 요청은 상단에 노출되며 전문 서비스 제공자에게 알림이 전송됩니다. 일반 요청보다 3배 더 빠르게 견적을 받을 수 있습니다.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 font-bold text-sm">긴급 적용 비용</span>
              <span className="font-bold text-slate-800">3,000원</span>
            </div>
            <div className="w-full h-px bg-slate-100 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-black">총 결제 금액</span>
              <span className="text-xl font-black text-rose-600">3,000원</span>
            </div>
          </div>

          <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 break-keep">
            ⚠️ 한 번 결제되어 적용된 긴급 요청은 중도 취소 시 환불이 절대 불가합니다.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3.5 text-sm font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 py-3.5 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20 disabled:bg-slate-400 disabled:shadow-none flex justify-center items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isProcessing ? '처리 중...' : '결제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
