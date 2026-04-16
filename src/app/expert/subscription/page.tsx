'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import { 
  getSubscriptionInfoAction, 
  getPaymentHistoryAction, 
  subscribeToBasicAction, 
  cancelSubscriptionAction,
  getActiveBillingKeyAction,
  saveBillingKeyAction,
} from '@/actions/subscription.action';
import { getSystemConfig } from '@/actions/systemConfig.action';
import { CreditCard, CheckCircle2, ShieldAlert, Star, AlertCircle, X, Trash2, ShieldCheck } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// ─── 카드사 목록 ───────────────────────────────────────────
const CARD_COMPANIES = ['신한', '국민', '현대', '삼성', '롯데', '하나', '우리', 'BC', '농협', '씨티', '기타'];

// ─── 카드 BIN → 카드사 자동 매핑 (주요 BIN 범위) ──────────
function guessCardCompanyFromBin(bin: string): string {
  if (!bin || bin.length < 1) return '';
  const prefix = bin.slice(0, 1);
  const prefix2 = bin.slice(0, 2);
  const prefix4 = bin.slice(0, 4);
  // 대략적인 매핑 (실제 PG 연동 시 PG사 응답값으로 교체)
  if (['4'].includes(prefix)) return 'Visa';
  if (['51','52','53','54','55'].includes(prefix2)) return '국민';
  if (['36','38'].includes(prefix2)) return '다이너스';
  if (['3528','3529','3534','3535'].includes(prefix4)) return 'JCB';
  if (['34','37'].includes(prefix2)) return 'AMEX';
  return '';
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const expertId = Number(session?.user?.id);

  const [activeTab, setActiveTab] = useState<'PLANS' | 'PAYMENT' | 'CANCEL' | 'HISTORY'>('PLANS');
  const [planData, setPlanData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [basicFee, setBasicFee] = useState<number>(11000);
  const [basicAnnualFee, setBasicAnnualFee] = useState<number>(110000);
  const [basicAnnualMonths, setBasicAnnualMonths] = useState<number>(12);
  // 결제 진행 전 선택한 요금제 타입 (MONTHLY | ANNUAL)
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // ─── 빌링키(카드) 상태 ───────────────────────────────────
  const [billingKey, setBillingKey] = useState<any>(null); // DB에서 조회한 활성 카드
  const [isEditingCard, setIsEditingCard] = useState(false);

  // 결제 폼 상태
  const [card1, setCard1] = useState('');
  const [card2, setCard2] = useState('');
  const [card3, setCard3] = useState('');
  const [card4, setCard4] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState('');
  const [cardCompanyInput, setCardCompanyInput] = useState('');
  const [holderNameInput, setHolderNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteCardModalOpen, setIsDeleteCardModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const fetchAllData = async () => {
    if (!expertId || isNaN(expertId)) return;
    setIsLoading(true);

    const [infoRes, historyRes, feeRes, annualFeeRes, annualMonthsRes, billingRes] = await Promise.all([
      getSubscriptionInfoAction(expertId),
      getPaymentHistoryAction(expertId),
      getSystemConfig('BASIC_SUBSCRIPTION_FEE', 11000),
      getSystemConfig('BASIC_ANNUAL_SUBSCRIPTION_FEE', 110000),
      getSystemConfig('BASIC_ANNUAL_SUBSCRIPTION_MONTHS', 12),
      getActiveBillingKeyAction(expertId),
    ]);

    if (typeof feeRes === 'number') setBasicFee(feeRes);
    if (typeof annualFeeRes === 'number') setBasicAnnualFee(annualFeeRes);
    if (typeof annualMonthsRes === 'number') setBasicAnnualMonths(annualMonthsRes);
    if (infoRes.success) setPlanData(infoRes.data);
    if (historyRes.success) setHistory(historyRes.data as any[]);
    if (billingRes.success) {
      setBillingKey(billingRes.data);
      // 카드가 있고 BASIC 구독 중이면 편집 모드 닫기
      setIsEditingCard(!billingRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchAllData(); }, [expertId]);

  // ─── 카드 등록 핸들러 ────────────────────────────────────
  const handleCardSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cardFull = card1 + card2 + card3 + card4;
    if (cardFull.replace(/\D/g, '').length < 16) {
      showAlert('카드 번호 16자리를 모두 입력해주세요.');
      return;
    }
    if (!expireMonth || !expireYear) {
      showAlert('유효기간을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    // 카드사 자동 추론 (입력값 없을 시)
    const bin = cardFull.replace(/\D/g, '').slice(0, 6);
    const resolvedCompany = cardCompanyInput || guessCardCompanyFromBin(bin);

    const saveRes = await saveBillingKeyAction({
      expertId,
      cardFull: cardFull.replace(/\D/g, ''),
      cardExpireYear: expireYear,
      cardExpireMonth: expireMonth,
      cardCompany: resolvedCompany,
      holderName: holderNameInput || session?.user?.name || '',
    });

    if (!saveRes.success) {
      showAlert(saveRes.error || '카드 등록에 실패했습니다.');
      setIsSubmitting(false);
      return;
    }

    // 신규 구독 결제 처리 (카드 등록과 동시에 BASIC 구독 신청인 경우)
    const currentPlan = planData?.plan || 'LITE';
    let subscribedNow = false;
    if (currentPlan !== 'BASIC') {
      const subRes = await subscribeToBasicAction(expertId, selectedCycle);
      if (subRes.success) {
        subscribedNow = true;
        const defaultMsg = selectedCycle === 'ANNUAL'
          ? `Basic 연간 플랜(${basicAnnualMonths}개월) 결제가 완료되었습니다!`
          : 'Basic 요금제 결제가 완료되었습니다!';
        showAlert(subRes.message || defaultMsg);
      } else {
        // 카드는 저장됐지만 구독 결제 단계에서 실패 - 사용자가 다시 시도할 수 있도록 명확히 안내
        showAlert(
          (subRes.error || '결제 처리에 실패했습니다.')
          + '\n카드는 등록되었습니다. 결제 탭에서 "구독 시작하기" 버튼으로 다시 시도해 주세요.'
        );
      }
    } else {
      showAlert('정기 결제용 카드 정보가 성공적으로 변경되었습니다.');
    }

    // 상태 초기화 및 데이터 갱신
    setCard1(''); setCard2(''); setCard3(''); setCard4('');
    setExpireMonth(''); setExpireYear('');
    setCardCompanyInput(''); setHolderNameInput('');
    setIsEditingCard(false);
    setIsSubmitting(false);
    await fetchAllData();

    // 구독이 방금 시작되었다면 결제내역 탭으로 자동 이동해 최신 내역 확인 유도
    if (subscribedNow) setActiveTab('HISTORY');
  };

  const handleCancelSubscription = async () => {
    setIsSubmitting(true);
    const res = await cancelSubscriptionAction(expertId);
    if (res.success) {
      showAlert('구독이 취소되어 Lite 요금제로 변경되었습니다.');
      setIsCancelModalOpen(false);
      await fetchAllData();
      setActiveTab('PLANS');
    } else {
      showAlert(res.error || '실패했습니다.');
    }
    setIsSubmitting(false);
  };

  /**
   * 등록된 카드가 있지만 아직 BASIC 구독 중이 아닐 때
   * 재입력 없이 기존 카드로 구독을 바로 시작하는 핸들러
   */
  const handleSubscribeWithExistingCard = async (cycle: 'MONTHLY' | 'ANNUAL') => {
    if (!expertId || isNaN(expertId)) return;
    setIsSubmitting(true);
    const subRes = await subscribeToBasicAction(expertId, cycle);
    if (subRes.success) {
      const defaultMsg = cycle === 'ANNUAL'
        ? `Basic 연간 플랜(${basicAnnualMonths}개월) 결제가 완료되었습니다!`
        : 'Basic 요금제 결제가 완료되었습니다!';
      showAlert(subRes.message || defaultMsg);
      await fetchAllData();
      setActiveTab('HISTORY');
    } else {
      showAlert(subRes.error || '결제 처리에 실패했습니다.');
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

  // ─── 카드 UI 표시용 정보 ──────────────────────────────────
  const displayBin = billingKey?.cardBin || '';
  const displayLast4 = billingKey?.cardLast4 || '****';
  const displayCompany = billingKey?.cardCompany || '';
  const displayExpire = billingKey
    ? `${billingKey.cardExpireMonth || '--'}/${billingKey.cardExpireYear || '--'}`
    : '--/--';
  const displayHolder = billingKey?.holderName || session?.user?.name || 'EXPERT';

  // 카드 번호 마스킹 표시: BIN 앞 4자리 | BIN 뒤 2자리 + ** | **** | 끝 4자리
  const maskedLine = billingKey
    ? `${displayBin.slice(0, 4)} ${displayBin.slice(4, 6)}** **** ${displayLast4}`
    : '---- ---- ---- ----';

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

        <div>
          {/* ─── 요금제 탭 ─── */}
          {activeTab === 'PLANS' && (() => {
            const currentCycle = planData?.billingCycle || 'MONTHLY';
            const isCurrentMonthly = currentPlan === 'BASIC' && currentCycle !== 'ANNUAL';
            const isCurrentAnnual  = currentPlan === 'BASIC' && currentCycle === 'ANNUAL';
            // 연간 기준 월 환산 절감율
            const effectiveMonthly = basicAnnualMonths > 0 ? Math.round(basicAnnualFee / basicAnnualMonths) : 0;
            const savingPct = basicFee > 0
              ? Math.max(0, Math.round((1 - effectiveMonthly / basicFee) * 100))
              : 0;

            return (
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Lite */}
                <div className={cn(
                  "p-8 rounded-3xl border-2 transition-all relative overflow-hidden",
                  currentPlan === 'LITE' ? "border-slate-800 shadow-md" : "border-slate-200"
                )}>
                  {currentPlan === 'LITE' && (
                    <div className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">CURRENT</div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-slate-900">Lite 플랜</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-slate-900">Free</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">가입 시 부여되는 기본 상태</p>
                  </div>
                  <ul className="space-y-4 mt-8">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-sm font-bold text-slate-700">전문가홈 무료</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-sm font-bold text-slate-700">1:1견적요청 받기 가능</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-sm font-bold text-slate-700">요청상세 내용 열람 가능</span></li>
                    <li className="flex items-start gap-3 opacity-60"><ShieldAlert className="w-5 h-5 text-slate-400 shrink-0" /><span className="text-sm font-medium text-slate-500">견적서 제안 불가능</span></li>
                  </ul>
                </div>

                {/* Basic 월간 */}
                <div className={cn(
                  "p-8 rounded-3xl border-2 transition-all relative overflow-hidden",
                  isCurrentMonthly ? "border-blue-600 shadow-xl shadow-blue-600/10" : "border-slate-200 bg-slate-50/50 hover:border-blue-300"
                )}>
                  {isCurrentMonthly && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">CURRENT</div>
                  )}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-black text-blue-700 flex items-center gap-2">Basic 플랜 <Star className="w-5 h-5 fill-current" /></h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black text-slate-900">{basicFee.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-500">원 / 월</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-2">매월 결제하는 무제한 패스</p>
                  <ul className="space-y-4 mt-8">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm font-bold text-slate-900">전문가홈 무료</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm font-bold text-slate-900">1:1견적요청 받기 가능</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm font-bold text-slate-900">요청상세 내용 열람 가능</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /><span className="text-sm font-bold text-slate-900">견적서 무제한 제안</span></li>
                  </ul>
                  {!isCurrentMonthly && (
                    <button
                      onClick={() => { setSelectedCycle('MONTHLY'); setActiveTab('PAYMENT'); }}
                      className="w-full mt-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                      Basic 월간으로 업그레이드
                    </button>
                  )}
                </div>

                {/* Basic 연간 (신규) */}
                <div className={cn(
                  "p-8 rounded-3xl border-2 transition-all relative overflow-hidden",
                  isCurrentAnnual
                    ? "border-indigo-600 shadow-xl shadow-indigo-600/10"
                    : "border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white hover:border-indigo-400"
                )}>
                  {isCurrentAnnual ? (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">CURRENT</div>
                  ) : savingPct > 0 && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                      {savingPct}% 절약
                    </div>
                  )}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-black text-indigo-700 flex items-center gap-2">
                        Basic 연간 플랜 <Star className="w-5 h-5 fill-current" />
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black text-slate-900">{basicAnnualFee.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-500">원 / {basicAnnualMonths}개월</span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 mt-1">
                        월 환산 약 {effectiveMonthly.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-2">연간 결제로 {basicAnnualMonths}개월 이용</p>
                  <ul className="space-y-4 mt-8">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /><span className="text-sm font-bold text-slate-900">Basic 월간 플랜의 모든 혜택</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /><span className="text-sm font-bold text-slate-900">{basicAnnualMonths}개월 이용권 일괄 결제</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /><span className="text-sm font-bold text-slate-900">월간 대비 연 결제 할인</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /><span className="text-sm font-bold text-slate-900">이용 기간 내 서비스 제약 없음</span></li>
                  </ul>
                  {!isCurrentAnnual && (
                    <button
                      onClick={() => { setSelectedCycle('ANNUAL'); setActiveTab('PAYMENT'); }}
                      className="w-full mt-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      연간 결제로 시작하기
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ─── 결제 및 정기 결제 탭 ─── */}
          {activeTab === 'PAYMENT' && (
            <div className="max-w-xl mx-auto">

              {/* 결제 진행 요약 (BASIC 아닌 경우에만 노출) */}
              {currentPlan !== 'BASIC' && (
                <div className={cn(
                  "rounded-2xl border-2 p-5 mb-6",
                  selectedCycle === 'ANNUAL'
                    ? "border-indigo-200 bg-indigo-50/40"
                    : "border-blue-200 bg-blue-50/40"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">선택한 요금제</p>
                      <h4 className={cn(
                        "text-lg font-black mt-1",
                        selectedCycle === 'ANNUAL' ? "text-indigo-700" : "text-blue-700"
                      )}>
                        {selectedCycle === 'ANNUAL'
                          ? `Basic 연간 플랜 · ${basicAnnualMonths}개월`
                          : 'Basic 월간 플랜 · 1개월'}
                      </h4>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        결제 금액{' '}
                        <span className={selectedCycle === 'ANNUAL' ? 'text-indigo-700' : 'text-blue-700'}>
                          {(selectedCycle === 'ANNUAL' ? basicAnnualFee : basicFee).toLocaleString()}원
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('PLANS')}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 underline underline-offset-4"
                    >
                      요금제 변경
                    </button>
                  </div>
                </div>
              )}

              {/* 등록된 카드 표시 */}
              {!isEditingCard && billingKey ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-8 text-center animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-900">등록된 정기 결제 카드</h3>
                    {/* 보안 연동 뱃지 */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> DB 저장 완료
                    </span>
                  </div>

                  {/* 카드 UI */}
                  <div className="w-80 h-48 mx-auto bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl shadow-xl p-6 relative overflow-hidden flex flex-col justify-between text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-blue-400 opacity-5 rounded-full blur-xl"></div>
                    <div className="flex justify-between items-center relative z-10">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-black text-slate-400 tracking-widest">
                        {displayCompany || 'ONEPICK PAY'}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <div className="text-lg font-black text-slate-200 tracking-[0.15em] mb-2 font-mono">
                        {maskedLine}
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Card Holder</p>
                          <p className="text-sm text-slate-200 font-bold uppercase tracking-wider">{displayHolder}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Expires</p>
                          <p className="text-sm text-slate-200 font-bold tracking-wider">{displayExpire}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 카드 등록 정보 */}
                  <div className="mt-6 text-left bg-white rounded-xl border border-slate-100 p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">카드번호</span>
                      <span className="text-slate-700 font-black font-mono">{maskedLine}</span>
                    </div>
                    {displayCompany && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">카드사</span>
                        <span className="text-slate-700 font-bold">{displayCompany}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">유효기간</span>
                      <span className="text-slate-700 font-bold">{displayExpire}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">등록일</span>
                      <span className="text-slate-700 font-bold">
                        {billingKey?.issuedAt ? new Date(billingKey.issuedAt).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-6 mb-4 font-medium">
                    {currentPlan === 'BASIC'
                      ? '정기 결제가 해당 카드로 자동 승인됩니다.'
                      : '구독 결제를 시작하면 등록된 카드로 즉시 승인됩니다.'}
                  </p>

                  {/* 카드는 있지만 아직 BASIC 구독 중이 아닐 때: 구독 시작 CTA */}
                  {currentPlan !== 'BASIC' && (
                    <div className="mt-2 mb-6 bg-white rounded-xl border border-blue-100 p-4 text-left">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                        등록된 카드로 구독 시작하기
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleSubscribeWithExistingCard('MONTHLY')}
                          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 text-sm"
                        >
                          {isSubmitting
                            ? '처리 중...'
                            : `월간 ${basicFee.toLocaleString()}원 결제`}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleSubscribeWithExistingCard('ANNUAL')}
                          className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 text-sm"
                        >
                          {isSubmitting
                            ? '처리 중...'
                            : `연간 ${basicAnnualFee.toLocaleString()}원 결제`}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsEditingCard(true)}
                      className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm text-sm"
                    >
                      카드 변경
                    </button>
                    <button
                      onClick={() => setIsDeleteCardModalOpen(true)}
                      className="px-5 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-500 font-bold rounded-xl transition-all text-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> 카드 삭제
                    </button>
                  </div>
                </div>
              ) : (
                /* 카드 입력 폼 */
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-black text-slate-900">
                      {currentPlan === 'BASIC' ? '새 결제 수단 등록' : '결제 수단 등록'}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6 font-medium">정기 결제에 사용될 카드 정보를 등록합니다.</p>

                  <form onSubmit={handleCardSave} className="space-y-5">
                    {/* 카드 번호 */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 mb-2">카드 번호</label>
                      <div className="flex items-center gap-2">
                        {[
                          { val: card1, set: setCard1, id: 'card1', mask: false },
                          { val: card2, set: setCard2, id: 'card2', mask: false },
                          { val: card3, set: setCard3, id: 'card3', mask: true },
                          { val: card4, set: setCard4, id: 'card4', mask: true },
                        ].map((c, idx) => (
                          <React.Fragment key={c.id}>
                            <input
                              id={c.id}
                              type={c.mask ? 'password' : 'text'}
                              maxLength={4}
                              value={c.val}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                c.set(val);
                                if (val.length === 4) {
                                  const nextIds = ['card2', 'card3', 'card4'];
                                  if (nextIds[idx]) document.getElementById(nextIds[idx])?.focus();
                                }
                              }}
                              placeholder={c.mask ? '****' : '0000'}
                              className="w-1/4 text-center p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                            />
                            {idx < 3 && <span className="text-slate-300 font-black">-</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* 유효기간 + 카드사 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">유효기간</label>
                        <div className="flex gap-2">
                          <select
                            value={expireMonth}
                            onChange={e => setExpireMonth(e.target.value)}
                            className="w-1/2 p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700"
                          >
                            <option value="" disabled>월</option>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                              <option key={m} value={m}>{m}월</option>
                            ))}
                          </select>
                          <select
                            value={expireYear}
                            onChange={e => setExpireYear(e.target.value)}
                            className="w-1/2 p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700"
                          >
                            <option value="" disabled>년도</option>
                            {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i).slice(2)).map(y => (
                              <option key={y} value={y}>20{y}년</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 mb-2">카드사 (선택)</label>
                        <select
                          value={cardCompanyInput}
                          onChange={e => setCardCompanyInput(e.target.value)}
                          className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700"
                        >
                          <option value="">자동 탐지</option>
                          {CARD_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* 카드 소유자명 */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 mb-2">카드 소유자명 (선택)</label>
                      <input
                        type="text"
                        value={holderNameInput}
                        onChange={e => setHolderNameInput(e.target.value)}
                        placeholder={session?.user?.name || '이름 입력'}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    {/* PG 연동 안내 */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-600 font-medium leading-relaxed">
                        카드 정보는 암호화되어 안전하게 저장됩니다.<br/>
                        실제 카드번호는 저장되지 않으며, 마스킹 정보만 보관됩니다.
                      </p>
                    </div>

                    <div className="flex gap-3 mt-4">
                      {(billingKey || currentPlan === 'BASIC') && (
                        <button 
                          type="button"
                          onClick={() => setIsEditingCard(false)}
                          className="w-1/3 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                          취소
                        </button>
                      )}
                      <button
                        disabled={isSubmitting}
                        type="submit"
                        className={cn(
                          "py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50",
                          (billingKey || currentPlan === 'BASIC') ? "w-2/3" : "w-full"
                        )}
                      >
                        {isSubmitting
                          ? '처리 중...'
                          : currentPlan === 'BASIC'
                            ? '카드 정보 저장'
                            : selectedCycle === 'ANNUAL'
                              ? `Basic 연간 결제 및 카드 등록 (${basicAnnualFee.toLocaleString()}원)`
                              : `Basic 월간 결제 및 카드 등록 (${basicFee.toLocaleString()}원)`}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ─── 구독 취소 탭 ─── */}
          {activeTab === 'CANCEL' && (
            <div className="max-w-xl mx-auto text-center py-10">
              {currentPlan === 'BASIC' ? (
                <>
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">구독을 해지하시겠습니까?</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                    해지 시 즉각 Lite 요금제로 전환되며,<br/>상세 요청 조회 등 Basic 혜택이 모두 제한됩니다.
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
                    회원님은 현재 기본 제공되는 <strong className="text-slate-800">Lite 요금제</strong>를 무상으로 이용 중입니다.
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

          {/* ─── 결제내역 탭 ─── */}
          {activeTab === 'HISTORY' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold text-slate-600">결제일</th>
                      <th className="p-4 font-bold text-slate-600">사용 마감일</th>
                      <th className="p-4 font-bold text-slate-600">내용</th>
                      <th className="p-4 font-bold text-slate-600">결제 카드</th>
                      <th className="p-4 font-bold text-slate-600 text-right">금액</th>
                      <th className="p-4 font-bold text-slate-600 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 결제 예정 Row */}
                    {currentPlan === 'BASIC' && history.length > 0 && history[0].nextPaymentDate && (() => {
                      const first = history[0];
                      const nextCycle = first.billingCycle || 'MONTHLY';
                      const nextMonths = first.billingMonths || (nextCycle === 'ANNUAL' ? basicAnnualMonths : 1);
                      const nextAmount = nextCycle === 'ANNUAL' ? basicAnnualFee : basicFee;
                      return (
                        <tr className="border-b border-slate-100 bg-sky-50/30">
                          <td className="p-4 font-medium text-slate-900">{new Date(first.nextPaymentDate).toLocaleDateString()}</td>
                          <td className="p-4 font-medium text-slate-500">
                            {(() => {
                              const d = new Date(first.nextPaymentDate);
                              d.setMonth(d.getMonth() + nextMonths);
                              d.setDate(d.getDate() - 1);
                              return d.toLocaleDateString();
                            })()}
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            OnePick Basic {nextCycle === 'ANNUAL' ? `연간(${nextMonths}개월)` : '월간'} 정기결제
                          </td>
                          <td className="p-4 text-slate-500 font-medium">
                            {billingKey ? `**** ${billingKey.cardLast4}` : '-'}
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-right">{nextAmount.toLocaleString()}원</td>
                          <td className="p-4 text-center">
                            <span className="inline-flex bg-white border border-sky-200 text-sky-600 text-xs font-bold px-2 py-1 rounded-md">결제예정</span>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* 실 결제 내역 */}
                    {history.map((item) => {
                      const cycle = item.billingCycle || 'MONTHLY';
                      const months = item.billingMonths || (cycle === 'ANNUAL' ? basicAnnualMonths : 1);
                      return (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="p-4 text-slate-600 font-medium">{new Date(item.paymentDate).toLocaleDateString()}</td>
                          <td className="p-4 text-slate-500 font-medium">
                            {item.nextPaymentDate ? (() => {
                              const d = new Date(item.nextPaymentDate);
                              d.setDate(d.getDate() - 1);
                              return d.toLocaleDateString();
                            })() : '-'}
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            OnePick Basic {cycle === 'ANNUAL' ? `연간(${months}개월)` : '월간'} 정기결제
                          </td>
                          <td className="p-4 text-slate-500 font-medium font-mono">
                            {item.billingKey ? `**** ${item.billingKey.cardLast4}` : '-'}
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-right">
                            {(item.amount ?? (cycle === 'ANNUAL' ? basicAnnualFee : basicFee)).toLocaleString()}원
                          </td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-flex text-xs font-bold px-2 py-1 rounded-md",
                              item.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                              item.status === 'FAILED' ? "bg-red-100 text-red-600" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {item.status === 'PAID' ? '결제완료' :
                               item.status === 'FAILED' ? '결제실패' : item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {history.length === 0 && currentPlan !== 'BASIC' && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center">
                          <p className="text-slate-400 font-medium mb-3">결제 내역이 없습니다.</p>
                          {billingKey && (
                            <button
                              onClick={() => setActiveTab('PAYMENT')}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4"
                            >
                              등록된 카드로 구독 시작하기 →
                            </button>
                          )}
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

      {/* 카드 삭제 확인 모달 */}
      <DeleteCardModal
        isOpen={isDeleteCardModalOpen}
        cardLast4={billingKey?.cardLast4}
        onClose={() => setIsDeleteCardModalOpen(false)}
        onConfirm={async () => {
          setIsSubmitting(true);
          const { deleteBillingKeyAction } = await import('@/actions/subscription.action');
          const res = await deleteBillingKeyAction(expertId);
          if (res.success) {
            showAlert('카드 정보가 삭제되었습니다.');
            setIsDeleteCardModalOpen(false);
            await fetchAllData();
            setIsEditingCard(true);
          } else {
            showAlert(res.error || '카드 삭제에 실패했습니다.');
          }
          setIsSubmitting(false);
        }}
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

// ─── Portal 모달 컴포넌트들 ───────────────────────────────

function AlertModal({ isOpen, onClose, message }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);
  if (!isOpen || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 text-center relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 mt-2"><AlertCircle className="w-8 h-8" /></div>
        <h3 className="text-xl font-black text-slate-900 mb-3">알림</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{message}</p>
        <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">확인</button>
      </div>
    </div>,
    document.body
  );
}

function CancelModal({ isOpen, onClose, onConfirm, isSubmitting }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }
  }, [isOpen]);
  if (!isOpen || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 text-center relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 mt-2"><AlertCircle className="w-8 h-8" /></div>
        <h3 className="text-xl font-black text-slate-900 mb-3">정말 해지하시겠어요?</h3>
        <p className="text-sm text-slate-500 font-medium mb-8">해지하시면 즉시 Basic 혜택이 중단됩니다.</p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button disabled={isSubmitting} onClick={onClose} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">돌아가기</button>
          <button disabled={isSubmitting} onClick={onConfirm} className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20">{isSubmitting ? '해지 중...' : '해지하기'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeleteCardModal({ isOpen, onClose, onConfirm, isSubmitting, cardLast4 }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }
  }, [isOpen]);
  if (!isOpen || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 text-center relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-6 mt-2"><Trash2 className="w-7 h-7" /></div>
        <h3 className="text-xl font-black text-slate-900 mb-3">카드를 삭제하시겠어요?</h3>
        <p className="text-sm text-slate-500 font-medium mb-8">
          등록된 카드 <span className="font-bold text-slate-800">**** {cardLast4}</span>를<br/>삭제하면 정기 결제가 중단됩니다.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button disabled={isSubmitting} onClick={onClose} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">취소</button>
          <button disabled={isSubmitting} onClick={onConfirm} className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors">{isSubmitting ? '삭제 중...' : '삭제하기'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
