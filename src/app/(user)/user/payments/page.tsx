'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ChevronRight, 
  AlertCircle, 
  XOctagon, 
  Calendar,
  User,
  ExternalLink,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  category: string;
  expertName: string;
  expertCompany: string;
  payDate: string;      // 결제일
  startDate: string;    // 서비스 시작일 (작업일)
  isDepositedToExpert: boolean; // 전문가 입금(정산) 여부
  amount: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
  cancelDate?: string;
  cancelFee?: number;
}

export default function UserPaymentsPage() {
  const [payments] = useState<Payment[]>([
    {
      id: 'PAY-20260318-001',
      category: '도배/장판',
      expertName: '김전문가',
      expertCompany: '청춘홈데코',
      payDate: '2026-02-18',
      startDate: '2026-03-25',
      isDepositedToExpert: false,
      amount: 450000,
      status: 'IN_PROGRESS',
    },
    {
      id: 'PAY-20260315-002',
      category: '이사/입주청소',
      expertName: '이클린',
      expertCompany: '슈퍼클린',
      payDate: '2026-03-15',
      startDate: '2026-03-16',
      isDepositedToExpert: true,
      amount: 320000,
      status: 'COMPLETED',
    },
    {
      id: 'PAY-20240410-003',
      category: '조립/수리',
      expertName: '박수리',
      expertCompany: '원픽핸디맨',
      payDate: '2024-04-10',
      startDate: '2024-04-28',
      isDepositedToExpert: false,
      amount: 85000,
      status: 'CANCELLED',
      cancelDate: '2024-04-20',
      cancelFee: 12750,
    },
  ]);

  const [selectedPayment, setSelectedPayment] = useState<(Payment & { calculatedFee: number }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 오픈 시 배경 스크롤 방지
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // 취소 위약금 동적 계산 함수
  const getDynamicCancelFee = (amount: number, startDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 10) return 0;
    if (diffDays <= 0) return amount; // 당일 또는 경과 시 100%

    // 10일 전(5%) ~ 1일 전(50%) : 하루당 5%씩 증가
    const penaltyRate = (11 - diffDays) * 0.05;
    return Math.floor(amount * penaltyRate);
  };

  const handleCancelClick = (payment: Payment, calculatedFee: number) => {
    setSelectedPayment({ ...payment, calculatedFee });
    setIsModalOpen(true);
  };

  const confirmCancellation = () => {
    alert('취소 처리가 완료되었습니다.');
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">결제 내역</h2>
          <p className="text-slate-500 text-lg font-medium">이용하신 서비스의 결제 내역 및 전문가 지급 현황을 확인할 수 있습니다.</p>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-sm font-bold text-slate-500">요청명(카테고리)</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500">전문가/업체</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500">결제일</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500">서비스 예정일</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 text-center">지급 현황</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 text-right">결제비용</th>
                  <th className="px-8 py-5 text-sm font-bold text-slate-500 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((payment) => {
                  const calculatedFee = getDynamicCancelFee(payment.amount, payment.startDate);
                  
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {payment.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">
                            {payment.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-row gap-2 items-center">
                          <div className="size-10 rounded-full overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-300 shrink-0">
                            <img src={`https://picsum.photos/seed/${payment.id}/100/100`} alt={payment.expertName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col justify-center text-left">
                            <div className="flex items-center gap-2">
                              <div className="bg-emerald-50 text-emerald-600 px-1.5 rounded-lg border border-emerald-100 flex items-center">
                                <span className="font-bold text-[10px]">헬퍼</span>
                              </div>
                              <p className="text-slate-500 text-xs line-clamp-1">{payment.expertCompany}</p>
                            </div>
                            <h5 className="font-bold text-slate-900">{payment.expertName} 전문가</h5>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-slate-600 font-medium italic">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {payment.payDate}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-blue-600 font-bold">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-blue-400" />
                            {payment.startDate}
                          </div>
                          {payment.status === 'CANCELLED' && payment.cancelDate && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                              <XOctagon className="w-3.5 h-3.5 text-slate-300" />
                              취소일: {payment.cancelDate}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-lg tracking-tight",
                          payment.isDepositedToExpert 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : payment.status === 'CANCELLED'
                              ? "bg-slate-100 text-slate-500 border border-slate-200"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          {payment.isDepositedToExpert 
                            ? '지급완료' 
                            : payment.status === 'CANCELLED'
                              ? '미지급'
                              : '지급대기'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "text-lg font-black leading-tight",
                            payment.status === 'CANCELLED' ? "text-slate-400 line-through decoration-slate-300" : "text-slate-900"
                          )}>
                            {payment.amount.toLocaleString()} <span className="text-sm font-bold ml-0.5">원</span>
                          </span>
                          {payment.status === 'IN_PROGRESS' && (
                            <span className="text-[11px] font-bold text-red-500 tracking-tight underline underline-offset-2">
                              취소 시 위약금: {calculatedFee.toLocaleString()}원
                            </span>
                          )}
                          {payment.status === 'CANCELLED' && (
                            <div className="flex flex-col items-end mt-1 space-y-0.5">
                              {payment.cancelFee !== undefined && payment.cancelFee > 0 && (
                                <span className="text-[11px] font-bold text-red-500 tracking-tight">
                                  위약금: -{payment.cancelFee.toLocaleString()}원
                                </span>
                              )}
                              <span className="text-xs font-black text-blue-600 tracking-tight">
                                환불 금액: {(payment.amount - (payment.cancelFee || 0)).toLocaleString()}원
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleCancelClick(payment, calculatedFee)}
                            disabled={payment.status === 'COMPLETED' || payment.status === 'CANCELLED'}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                              payment.status === 'IN_PROGRESS'
                                ? "bg-red-50 text-red-600 hover:bg-red-100 active:scale-95"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                          >
                            <XOctagon className="w-3.5 h-3.5" />
                            {payment.status === 'COMPLETED' ? '서비스완료' : payment.status === 'CANCELLED' ? '취소완료' : '결제취소'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-[28px] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-amber-900">상세 취소 수수료 안내</h3>
            </div>
            <span className="text-sm font-medium text-amber-600 bg-white px-4 py-1 rounded-full border border-amber-100">
              결제 당일 및 서비스 11일 전: 100% 환불
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { day: '서비스 11일 전 까지', rate: '0%', free: true },
              { day: '서비스 10일 전', rate: '5%' },
              { day: '서비스 9일 전', rate: '10%' },
              { day: '서비스 8일 전', rate: '15%' },
              { day: '서비스 7일 전', rate: '20%' },
              { day: '서비스 6일 전', rate: '25%' },
              { day: '서비스 5일 전', rate: '30%' },
              { day: '서비스 4일 전', rate: '35%' },
              { day: '서비스 3일 전', rate: '40%' },
              { day: '서비스 2일 전', rate: '45%' },
              { day: '서비스 1일 전', rate: '50%' },
              { day: '서비스 당일', rate: '100%', highlight: true },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center justify-between px-4 py-1 rounded-2xl border transition-all group",
                  item.free 
                    ? "bg-emerald-50 border-emerald-100" 
                    : item.highlight 
                      ? "bg-red-50 border-red-100 shadow-sm" 
                      : "bg-white border-amber-80 hover:border-amber-100"
                )}
              >
                <div className="flex gap-1 items-center">
                  <span className={cn(
                    "text-sm font-bold mb-0.5", 
                    item.free ? "text-emerald-500" : item.highlight ? "text-red-400" : "text-amber-500"
                  )}>
                    {item.day}
                  </span>
                  <span className={cn(
                    "text-xs font-medium uppercase tracking-tighter opacity-70",
                    item.free ? "text-emerald-400" : "text-slate-400"
                  )}>
                    {item.free ? 'Refund 100%' : 'Penalty Fee'}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className={cn(
                    "text-md font-black italic", 
                    item.free ? "text-emerald-700" : item.highlight ? "text-red-600" : "text-amber-900 group-hover:text-amber-600 transition-colors"
                  )}>
                    {item.rate}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-amber-200/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
              * <strong>결제 당일</strong> 또는 <strong>서비스 11일 전</strong>까지 취소 시에는 위약금이 발생하지 않습니다. <br />
              * 위약금은 서비스 예정일을 기준으로 정산되며, 카드사 환불 정책에 따라 실제 입금까지는 영업일 기준 3~5일이 소요될 수 있습니다.
            </p>
            <button className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline shrink-0">
              운영 정책 전문 보기 <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">결제 취소 확인</h3>
                  <p className="text-sm text-slate-500 font-medium">결제 취소 전 내용을 꼭 확인해 주세요.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold tracking-tight">요청 서비스</span>
                  <span className="text-slate-900 font-bold">{selectedPayment.category}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold tracking-tight">결제 금액</span>
                  <span className="text-slate-900 font-bold">{selectedPayment.amount.toLocaleString()} 원</span>
                </div>
                <div className="h-px bg-slate-200/50" />
                <div className="flex justify-between items-start">
                  <span className="text-red-500 font-bold text-sm pt-1">위약금 정보</span>
                  <div className="flex flex-col items-end">
                    <span className="text-red-600 font-black text-lg">
                      - {selectedPayment.calculatedFee.toLocaleString()} 원
                    </span>
                    <span className="text-[10px] text-red-400 font-bold">서비스 예정일 기준 {((selectedPayment.calculatedFee / selectedPayment.amount) * 100).toFixed(0)}% 발생</span>
                  </div>
                </div>
                <div className="h-px bg-slate-200/50" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-700 font-black text-base">환불 예정 금액</span>
                  <span className="text-blue-600 font-black text-2xl tracking-tight">
                    {(selectedPayment.amount - selectedPayment.calculatedFee).toLocaleString()} 원
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 font-bold leading-relaxed">
                  서비스 예정일({selectedPayment.startDate})을 기준으로 계산된 금액입니다. 확인 버튼 클릭 시 즉시 취소 처리가 진행됩니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                >
                  닫기
                </button>
                <button 
                  onClick={confirmCancellation}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                >
                  결제 취소하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
