'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import { 
  getSubscriptionInfoAction, 
  getPaymentHistoryAction, 
  subscribeToBasicAction, 
  cancelSubscriptionAction 
} from '@/actions/subscription.action';
import { getSystemConfig } from '@/actions/systemConfig.action';
import { CreditCard, CheckCircle2, ShieldAlert, Receipt, Star, AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const expertId = Number(session?.user?.id);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'PLANS' | 'PAYMENT' | 'CANCEL' | 'HISTORY'>('PLANS');
  const [planData, setPlanData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [basicFee, setBasicFee] = useState<number>(11000);

  // 결제 폼 상태
  const [card1, setCard1] = useState('');
  const [card2, setCard2] = useState('');
  const [card3, setCard3] = useState('');
  const [card4, setCard4] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const fetchSubscriptionData = async () => {
    if (!expertId || isNaN(expertId)) return;
    setIsLoading(true);
    const [infoRes, historyRes, feeRes] = await Promise.all([
      getSubscriptionInfoAction(expertId),
      getPaymentHistoryAction(expertId),
      getSystemConfig('BASIC_SUBSCRIPTION_FEE', 11000)
    ]);

    if (typeof feeRes === 'number') {
      setBasicFee(feeRes);
    }

    if (infoRes.success) {
      setPlanData(infoRes.data);
      if (infoRes.data.plan === 'BASIC') setIsEditingCard(false);
      else setIsEditingCard(true);
    }
    if (historyRes.success) setHistory(historyRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [expertId]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cardNumber = card1 + card2 + card3 + card4;
    if (cardNumber.length < 16) {
      showAlert("카드 번호 16자리를 모두 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    if (currentPlan === 'BASIC') {
      await new Promise(resolve => setTimeout(resolve, 500));
      showAlert("정기 결제용 카드 정보가 성공적으로 변경되었습니다.");
      setCard1('');
      setCard2('');
      setCard3('');
      setCard4('');
      setIsSubmitting(false);
      setIsEditingCard(false);
      return;
    }

    const res = await subscribeToBasicAction(expertId);
    if (res.success) {
      showAlert(res.message || "Basic 요금제 결제가 완료되었습니다!");
      setIsEditingCard(false);
      fetchSubscriptionData();
      // 기존: setActiveTab('PLANS'); 해당 탭에 유지되도록 제거함.
    } else {
      showAlert(res.error || "실패했습니다.");
    }
    setIsSubmitting(false);
  };

  const handleCancelSubscription = async () => {
    setIsSubmitting(true);
    const res = await cancelSubscriptionAction(expertId);
    if (res.success) {
      showAlert("구독이 취소되어 Lite 요금제로 변경되었습니다.");
      setIsCancelModalOpen(false);
      fetchSubscriptionData();
      setActiveTab('PLANS');
    } else {
      showAlert(res.error || "실패했습니다.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <ExpertDashboardLayout>
        <div className="flex justify-center items-center py-20 min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
        </div>
      </ExpertDashboardLayout>
    );
  }

  const currentPlan = planData?.plan || 'LITE';

  return (
    <ExpertDashboardLayout>
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[600px]">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">구독관리</h2>
          <p className="text-slate-500 mt-2 font-medium">서비스 이용 요금제를 확인하고 정기 결제를 관리하세요.</p>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-slate-200 mb-8">
          <div className="flex min-w-max w-full">
            {[
              { id: 'PLANS', label: '요금제' },
              { id: 'PAYMENT', label: '결제 및 정기 결제' },
              { id: 'CANCEL', label: '구독 취소' },
              { id: 'HISTORY', label: '결제내역' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 sm:flex-none py-4 px-6 border-b-2 font-bold text-sm transition-all",
                  activeTab === tab.id 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div>
          {/* 요금제 탭 */}
          {activeTab === 'PLANS' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className={cn(
                "p-8 rounded-3xl border-2 transition-all relative overflow-hidden",
                currentPlan === 'LITE' ? "border-slate-800 shadow-md" : "border-slate-200"
              )}>
                {currentPlan === 'LITE' && (
                  <div className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                    CURRENT
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-black text-slate-900">Lite 플랜</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-slate-900">Free</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-2">가입 시 부여되는 기본 상태</p>
                </div>
                <ul className="space-y-4 mt-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">전문가홈 무료</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">1:1견적요청 받기 가능</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700">요청상세 내용 열람 가능</span>
                  </li>
                  <li className="flex items-start gap-3 opacity-60">
                    <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-500">견적서 제안 불가능</span>
                  </li>
                </ul>
              </div>

              <div className={cn(
                "p-8 rounded-3xl border-2 transition-all relative overflow-hidden",
                currentPlan === 'BASIC' ? "border-blue-600 shadow-xl shadow-blue-600/10" : "border-slate-200 bg-slate-50/50 hover:border-blue-300"
              )}>
                {currentPlan === 'BASIC' && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                    CURRENT
                  </div>
                )}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-blue-700 flex items-center gap-2">
                      Basic 플랜 <Star className="w-5 h-5 fill-current" />
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">{basicFee.toLocaleString()}</span>
                      <span className="text-sm font-bold text-slate-500">원 / 월</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500 mt-2">전문가님을 위한 무제한 패스</p>
                
                <ul className="space-y-4 mt-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900">전문가홈 무료</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900">1:1견적요청 받기 가능</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900">요청상세 내용 열람 가능</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900">견적서 무제한 제안</span>
                  </li>
                </ul>

                {currentPlan !== 'BASIC' && (
                  <button 
                    onClick={() => setActiveTab('PAYMENT')}
                    className="w-full mt-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    Basic 요금제로 업그레이드
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 결제 탭 */}
          {activeTab === 'PAYMENT' && (
            <div className="max-w-xl mx-auto">
              {!isEditingCard && currentPlan === 'BASIC' ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-8 text-center animate-in fade-in duration-300">
                  <h3 className="text-xl font-black text-slate-900 mb-6">등록된 정기 결제 카드</h3>
                  
                  {/* 카드 모양 UI */}
                  <div className="w-80 h-48 mx-auto bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl shadow-xl p-6 relative overflow-hidden flex flex-col justify-between text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="flex justify-between items-center relative z-10">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-black text-slate-400 tracking-widest">ONEPICK PAY</span>
                    </div>
                    <div className="relative z-10">
                      <div className="text-xl font-black text-slate-200 tracking-[0.2em] mb-2 font-mono">
                        {card1 || '1234'} - {card2 || '5678'} - **** - {card4 || '9012'}
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Card Holder</p>
                          <p className="text-sm text-slate-200 font-bold uppercase tracking-wider">{session?.user?.name || 'EXPERT'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 inline-block">Expires</p>
                          <p className="text-sm text-slate-200 font-bold tracking-wider inline-block ml-2">12/28</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-8 mb-6 font-medium">정기 결제가 매월 해당 카드로 자동 승인됩니다.</p>
                  <button 
                    onClick={() => setIsEditingCard(true)}
                    className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all shadow-sm"
                  >
                    카드 정보 변경하기
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-black text-slate-900">{currentPlan === 'BASIC' ? '새 결제 수단 등록' : '결제 수단 등록'}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6 font-medium">정기 결제에 사용될 새로운 카드 정보를 안전하게 등록합니다.</p>
                  
                  <form onSubmit={handleSubscribe} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 mb-2">카드 번호</label>
                      <div className="flex items-center gap-2">
                        <input 
                          id="card1"
                          type="text" 
                          maxLength={4}
                          value={card1}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCard1(val);
                            if (val.length === 4) document.getElementById('card2')?.focus();
                          }}
                          placeholder="0000" 
                          className="w-1/4 text-center p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                        />
                        <span className="text-slate-300 font-black">-</span>
                        <input 
                          id="card2"
                          type="text" 
                          maxLength={4}
                          value={card2}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCard2(val);
                            if (val.length === 4) document.getElementById('card3')?.focus();
                          }}
                          placeholder="0000" 
                          className="w-1/4 text-center p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                        />
                        <span className="text-slate-300 font-black">-</span>
                        <input 
                          id="card3"
                          type="password" 
                          maxLength={4}
                          value={card3}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCard3(val);
                            if (val.length === 4) document.getElementById('card4')?.focus();
                          }}
                          placeholder="****" 
                          className="w-1/4 text-center p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium tracking-widest"
                        />
                        <span className="text-slate-300 font-black">-</span>
                        <input 
                          id="card4"
                          type="password" 
                          maxLength={4}
                          value={card4}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCard4(val);
                          }}
                          placeholder="****" 
                          className="w-1/4 text-center p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium tracking-widest"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">유효기간</label>
                        <div className="flex gap-2">
                          <select className="w-1/2 p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700">
                            <option value="" disabled selected>월 (MM)</option>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                              <option key={m} value={m}>{m}월</option>
                            ))}
                          </select>
                          <select className="w-1/2 p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700">
                            <option value="" disabled selected>년도 (YY)</option>
                            {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i).slice(2)).map(y => (
                              <option key={y} value={y}>20{y}년</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">비밀번호 앞 2자리</label>
                        <input 
                          type="password" 
                          placeholder="**" 
                          className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium tracking-widest"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      {currentPlan === 'BASIC' && (
                        <button 
                          type="button"
                          onClick={() => setIsEditingCard(false)}
                          className="w-1/3 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                          편집 취소
                        </button>
                      )}
                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className={cn("py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50",
                          currentPlan === 'BASIC' ? "w-2/3" : "w-full"
                        )}
                      >
                        {isSubmitting ? "처리 중..." : currentPlan === 'BASIC' ? "수정된 카드로 정기결제 변경" : "Basic 구독 결제 승인 확인"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 구독 취소 탭 */}
          {activeTab === 'CANCEL' && (
            <div className="max-w-xl mx-auto text-center py-10">
              {currentPlan === 'BASIC' ? (
                <>
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">구독을 해지하시겠습니까?</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                    해지 시 즉각 Lite 요금제로 전환되며,<br/>
                    상세 요청 조회 등 Basic 혜택이 모두 제한됩니다.
                  </p>
                  <button 
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-6 py-3.5 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all"
                  >
                    Basic 구독 취소 계속하기
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">현재 해지할 구독이 없습니다</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                    회원님은 현재 기본 제공되는 <strong className="text-slate-800">Lite 요금제</strong>를 무상으로 이용 중입니다.<br/>
                    별도의 정기 결제가 진행되지 않으므로 안심하셔도 좋습니다.
                  </p>
                  <button 
                    onClick={() => setActiveTab('PLANS')}
                    className="px-6 py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-xl transition-all"
                  >
                    요금제 확인하러 가기
                  </button>
                </>
              )}
            </div>
          )}

          {/* 결제내역 탭 */}
          {activeTab === 'HISTORY' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold text-slate-600">결제일</th>
                      <th className="p-4 font-bold text-slate-600">사용 마감일</th>
                      <th className="p-4 font-bold text-slate-600">내용</th>
                      <th className="p-4 font-bold text-slate-600 text-right">금액</th>
                      <th className="p-4 font-bold text-slate-600 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 결제 예정 Row (Basic 가입 중일 때) */}
                    {currentPlan === 'BASIC' && history.length > 0 && history[0].nextPaymentDate && (
                      <tr className="border-b border-slate-100 bg-sky-50/30">
                        <td className="p-4 font-medium text-slate-900">
                          {new Date(history[0].nextPaymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {(() => {
                            const d = new Date(history[0].nextPaymentDate);
                            d.setMonth(d.getMonth() + 1);
                            d.setDate(d.getDate() - 1); // 사용 기한은 결제 전날까지
                            return d.toLocaleDateString();
                          })()}
                        </td>
                        <td className="p-4 font-bold text-slate-700">OnePick Basic 정기결제</td>
                        <td className="p-4 font-bold text-slate-900 text-right">{basicFee.toLocaleString()}원</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex bg-white border border-sky-200 text-sky-600 text-xs font-bold px-2 py-1 rounded-md">
                            결제예정
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* 실 결제 내역 */}
                    {history.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="p-4 text-slate-600 font-medium">
                          {new Date(item.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {item.nextPaymentDate ? (() => {
                            const d = new Date(item.nextPaymentDate);
                            d.setDate(d.getDate() - 1); // 사용 기한은 결제 전날까지
                            return d.toLocaleDateString();
                          })() : '-'}
                        </td>
                        <td className="p-4 font-bold text-slate-700">OnePick Basic 정기결제</td>
                        <td className="p-4 font-bold text-slate-900 text-right">{item.amount?.toLocaleString() || basicFee.toLocaleString()}원</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                            결제완료
                          </span>
                        </td>
                      </tr>
                    ))}

                    {history.length === 0 && currentPlan !== 'BASIC' && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                          결제 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 구독 취소 모달 */}
      <CancelModal 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        isSubmitting={isSubmitting}
      />

      {/* 공통 알림 모달 */}
      <AlertModal 
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
      />
    </ExpertDashboardLayout>
  );
}

// 공통 알림 Portal 모달
function AlertModal({ isOpen, onClose, message }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 text-center relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 mt-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">알림</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
        >
          확인
        </button>
      </div>
    </div>,
    document.body
  );
}

// 구독 취소 승인 Portal 모달
function CancelModal({ isOpen, onClose, onConfirm, isSubmitting }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 text-center relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 mt-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">정말 해지하시겠어요?</h3>
        <p className="text-sm text-slate-500 font-medium mb-8">
          해지하시면 즉시 Basic 혜택이 중단됩니다.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            disabled={isSubmitting}
            onClick={onClose}
            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            돌아가기
          </button>
          <button 
            disabled={isSubmitting}
            onClick={onConfirm}
            className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
          >
            {isSubmitting ? "해지 중..." : "해지하기"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
