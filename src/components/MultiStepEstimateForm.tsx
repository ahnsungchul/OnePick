'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { submitEstimateAction, saveEstimateDraftAction, getEstimateByIdAction } from '@/actions/estimate.action';
import { ChevronRight, MapPin, X, ChevronLeft, Search, Clock } from 'lucide-react';
import * as motion from 'motion/react-client';
import DaumPostcode from 'react-daum-postcode';

const categories = {
  '도배/장판': {
    label: '도배/장판',
    subcategories: ['도배 시공', '장판 시공', '마루 시공', '타일 시공', '페인트 시공', '부분 보수'],
  },
  '욕실/주방': {
    label: '욕실/주방',
    subcategories: ['욕실 리모델링', '싱크대 교체', '수전/배관 수리', '환풍기/후드 설치', '줄눈 시공'],
  },
  '전기/조명': {
    label: '전기/조명',
    subcategories: ['조명 설치/수리', '스위치/콘센트 교체', '누전 수리', '차단기 교체'],
  },
  '청소/이사': {
    label: '청소/이사',
    subcategories: ['이사청소', '입주청소', '거주청소', '원룸이사', '가정이사', '용달/화물'],
  },
  '가전/에어컨': {
    label: '가전/에어컨',
    subcategories: ['에어컨 수리/설치', '에어컨 분해청소', '냉장고 수리', '세탁기 수리/청소', 'TV 설치'],
  },
  '자동차 수리': {
    label: '자동차 수리',
    subcategories: ['외형 복원/도색', '경정비', '세차/광택', '블랙박스/내비게이션 장착'],
  },
  '베이비/펫시터': {
    label: '베이비/펫시터',
    subcategories: ['베이비시터', '등하원 도우미', '펫시터', '반려견 산책', '가사 도우미'],
  },
  '과외/레슨': {
    label: '과외/레슨',
    subcategories: ['영어/외국어', '수학/과학', '보컬/악기', '피트니스/요가', '프로그래밍/IT'],
  },
  '디자인/IT': {
    label: '디자인/IT',
    subcategories: ['로고 디자인', '웹/앱 개발', '영상 편집', '번역/통역', '마케팅/기획'],
  },
  '기타 서비스': {
    label: '기타 서비스',
    subcategories: ['심부름/대행', '결혼식 하객 대행', '반려동물 장례', '법률/세무 상담', '기타'],
  },
};


export default function MultiStepEstimateForm({ 
  customerId, 
  customerName = '고객',
  initialEstimateId,
  initialStep = 1,
  isEditMode = false,
  onClose,
  onSuccess
}: { 
  customerId: string, 
  customerName?: string,
  initialEstimateId?: string,
  initialStep?: number,
  isEditMode?: boolean,
  onClose?: () => void,
  onSuccess?: () => void
}) {
  const [step, setStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [estimateId, setEstimateId] = useState<string | null>(initialEstimateId || null);

  const [isLoading, setIsLoading] = useState(!!initialEstimateId);

  // 폼 상태 관리
  const [formDataState, setFormDataState] = useState({
    authorName: customerName,
    contact1: '010',
    contact2: '',
    contact3: '',
    category: '', // 대분류 카테고리 (CLEANING, REPAIR 등)
    subcategories: [] as string[], // 상세 메뉴 (다중 선택)

    locationText: '', // 출발지 (또는 일반 주소)
    locationDetailText: '', // 출발지 상세주소
    destinationText: '', // 도착지 (이사/배달인 경우)
    destinationDetailText: '', // 도착지 상세주소
    // 스케줄 관련 (새 Step 3)
    serviceDateType: 'specific' as 'specific' | 'periodic',
    selectedDates: [] as string[],
    periodStart: '',
    periodEnd: '',
    selectedWeekdays: [] as string[],
    serviceTime: '',
    
    details: '', // 상세 설명
    isUrgent: false,
    needsReestimate: false,
    photos: [] as File[],
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState<'origin' | 'destination' | null>(null);

  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // 데이터 복원 로직
  useEffect(() => {
    if (initialEstimateId) {
      setIsLoading(true);
      getEstimateByIdAction(initialEstimateId)
        .then(res => {
          if (res.success && res.data) {
            const est = res.data as any;
            
            // 연락처 파싱 (010-1234-5678 -> 010, 1234, 5678)
            const contactParts = (est.contact || '').split('-');
            
            setFormDataState({
              authorName: est.authorName || customerName,
              contact1: contactParts[0] || '010',
              contact2: contactParts[1] || '',
              contact3: contactParts[2] || '',
              category: est.category || '',
              subcategories: est.subcategories || [],
              locationText: est.location || '', // 우선 location을 통째로 넣음 (상세 UI는 locationText 기반)
              locationDetailText: '', // DB 구조상 상세주소가 분리되어 있지 않으면 빈 값이나 파싱 필요
              destinationText: '',
              destinationDetailText: '',
              serviceDateType: 'specific',
              selectedDates: [],
              periodStart: '',
              periodEnd: '',
              selectedWeekdays: [],
              serviceTime: '',
              details: est.details || '',
              isUrgent: est.isUrgent || false,
              needsReestimate: est.needsReestimate || false,
              photos: [], // 파일 객체는 복원 불가능하므로 URL 기반 UI가 필요하다면 추후 보강
            });
            
            // 신규 스케줄 파싱
            const serviceDateStr = est.serviceDate || '';
            const serviceTime = est.serviceTime || '';
            let serviceDateType: 'specific' | 'periodic' = 'specific';
            let selectedDates: string[] = [];
            let periodStart = '';
            let periodEnd = '';
            let selectedWeekdays: string[] = [];

            if (serviceDateStr.startsWith('정기:')) {
               serviceDateType = 'periodic';
               const parts = serviceDateStr.replace('정기: ', '').split(' (');
               if (parts.length === 2) {
                 const dates = parts[0].split(' ~ ');
                 periodStart = dates[0] || '';
                 periodEnd = dates[1] || '';
                 selectedWeekdays = parts[1].replace(')', '').split(', ');
               }
            } else if (serviceDateStr.startsWith('희망일:')) {
               serviceDateType = 'specific';
               selectedDates = serviceDateStr.replace('희망일: ', '').split(', ').map((str: string) => str.split(' ')[0]);
            }
            
            setFormDataState(prev => ({
              ...prev,
              serviceDateType,
              selectedDates,
              periodStart,
              periodEnd,
              selectedWeekdays,
              serviceTime,
            }));

            // 카테고리가 '청소/이사'이고 location에 '출발:', '도착:' 등이 포함되어 있다면 파싱 (하위호환 유지용)
            if (est.category === '청소/이사' && est.location.includes('출발:')) {
              try {
                const lines = est.location.split('\n');
                const startLine = lines[0]?.replace('출발: ', '').split(' -> 도착: ');
                const arrivalLine = lines[1]?.replace('도착 희망시간: ', '');
                
                setFormDataState(prev => ({
                  ...prev,
                  locationText: startLine[0] || est.location,
                  destinationText: startLine[1] || '',
                  serviceTime: prev.serviceTime ? prev.serviceTime : (arrivalLine && arrivalLine !== '미정' ? arrivalLine : ''),
                }));
              } catch (e) {
                console.warn('Failed to parse complex location:', e);
              }
            }
            
            if (initialStep) setStep(initialStep);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialEstimateId]);

  const contact2Ref = useRef<HTMLInputElement>(null);
  const contact3Ref = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsAutoSaving(true);
    const formData = new FormData();
    formData.set('estimateId', estimateId || '');
    formData.set('customerId', customerId);
    formData.set('currentStep', String(step));
    formData.set('category', formDataState.category);
    formData.set('subcategories', formDataState.subcategories.join(', '));
    formData.set('authorName', formDataState.authorName);
    const finalContact = `${formDataState.contact1}-${formDataState.contact2}-${formDataState.contact3}`;
    formData.set('contact', finalContact);
    formData.set('location', formDataState.locationText);
    formData.set('details', formDataState.details);

    try {
      const result = await saveEstimateDraftAction(formData);
      if (result.success) {
        setEstimateId(result.estimateId!);
      }
    } catch (err) {
      console.error('Auto save failed:', err);
    }
    setIsAutoSaving(false);
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    alert('작성 중인 내용이 임시 저장되었습니다.');
    window.location.href = '/user/my-estimates';
  };

  const handleNextStep = async () => {
    setIsAutoSaving(true);
    
    // 현재 단계까지의 데이터 저장
    const formData = new FormData();
    formData.set('estimateId', estimateId || '');
    formData.set('customerId', customerId);
    formData.set('currentStep', String(step + 1));
    formData.set('category', formDataState.category);
    formData.set('subcategories', formDataState.subcategories.join(', '));
    formData.set('authorName', formDataState.authorName);
    const finalContact = `${formDataState.contact1}-${formDataState.contact2}-${formDataState.contact3}`;
    formData.set('contact', finalContact);
    formData.set('location', formDataState.locationText);
    formData.set('details', formDataState.details);

    let finalServiceDate = '';
    if (formDataState.serviceDateType === 'specific') {
      finalServiceDate = formDataState.selectedDates.length > 0 
        ? `가능일: ${formDataState.selectedDates.map(date => {
            const d = new Date(date);
            const dayStr = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
            return `${date} (${dayStr})`;
          }).join(', ')}` : '';
    } else {
      finalServiceDate = formDataState.periodStart && formDataState.periodEnd && formDataState.selectedWeekdays.length > 0 
        ? `정기: ${formDataState.periodStart} ~ ${formDataState.periodEnd} (${formDataState.selectedWeekdays.join(', ')})`
        : '';
    }
    formData.set('serviceDate', finalServiceDate);
    formData.set('serviceTime', formDataState.serviceTime);

    try {
      const result = await saveEstimateDraftAction(formData);
      if (result.success) {
        setEstimateId(result.estimateId!);
      }
    } catch (err) {
      console.error('Draft saving error:', err);
    }

    setTimeout(() => {
      setIsAutoSaving(false);
      setStep((r) => Math.min(r + 1, 5));
    }, 800);
  };

  const prevStep = () => setStep((r) => Math.max(r - 1, 1));

  const toggleSubcategory = (sub: string) => {
    setFormDataState(prev => {
      const current = prev.subcategories;
      if (current.includes(sub)) {
        return { ...prev, subcategories: current.filter(s => s !== sub) };
      } else {
        return { ...prev, subcategories: [...current, sub] };
      }
    });
  };

  const handleCategoryChange = (cat: string) => {
    setFormDataState(prev => ({
      ...prev,
      category: cat,
      subcategories: [] 
    }));
  };

  const handleContact1Change = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 3) {
      setFormDataState(p => ({ ...p, contact1: val }));
      if (val.length === 3) contact2Ref.current?.focus();
    }
  };

  const handleContact2Change = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 4) {
      setFormDataState(p => ({ ...p, contact2: val }));
      if (val.length === 4) contact3Ref.current?.focus();
    }
  };

  const handleContact3Change = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 4) {
      setFormDataState(p => ({ ...p, contact3: val }));
    }
  };

  const submitFormNow = async () => {
    setShowPaymentModal(false);
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    if (estimateId) formData.set('estimateId', estimateId);
    formData.set('customerId', customerId);
    formData.set('authorName', formDataState.authorName);
    const finalContact = `${formDataState.contact1}-${formDataState.contact2}-${formDataState.contact3}`;
    formData.set('contact', finalContact);
    formData.set('category', formDataState.category);
    formData.set('subcategories', formDataState.subcategories.join(', '));

    const finalLocation = formDataState.category === 'MOVING' 
      ? `출발: ${formDataState.locationText} ${formDataState.locationDetailText} -> 도착: ${formDataState.destinationText} ${formDataState.destinationDetailText}`
      : `${formDataState.locationText} ${formDataState.locationDetailText}`;
    formData.set('location', finalLocation);
    formData.set('details', formDataState.details);

    let finalServiceDate = '';
    if (formDataState.serviceDateType === 'specific') {
      finalServiceDate = formDataState.selectedDates.length > 0 
        ? `희망일: ${formDataState.selectedDates.map(date => {
            const d = new Date(date);
            const dayStr = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
            return `${date} (${dayStr})`;
          }).join(', ')}` : '';
    } else {
      finalServiceDate = formDataState.periodStart && formDataState.periodEnd && formDataState.selectedWeekdays.length > 0 
        ? `정기: ${formDataState.periodStart} ~ ${formDataState.periodEnd} (${formDataState.selectedWeekdays.join(', ')})`
        : '';
    }
    formData.set('serviceDate', finalServiceDate);
    formData.set('serviceTime', formDataState.serviceTime);

    formData.set('isUrgent', String(formDataState.isUrgent));
    formData.set('needsReestimate', String(formDataState.needsReestimate));

    formDataState.photos.forEach((file) => {
      formData.append('photo', file);
    });

    try {
      console.log('Submitting estimate...', Object.fromEntries(formData.entries()));
      const result = await submitEstimateAction(formData);
      console.log('Submission result:', result);
      
      setIsSubmitting(false);
      
      if (!result) {
        setMessage('서버로부터 응답을 받지 못했습니다. 네트워크 연결을 확인해주세요.');
        return;
      }

      if (result.success) {
        if (isEditMode && onSuccess) {
          onSuccess();
          return;
        }
        setStep(6);
        setMessage(`견적 요청 성공! ID: ${result.estimate?.id}`);
      } else {
        setMessage(`오류 발생: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (err: any) {
      console.error('Submit execution error:', err);
      setIsSubmitting(false);
      setMessage(`통신 중 오류가 발생했습니다: ${err.message || '알 수 없는 에러'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 5 && formDataState.isUrgent) {
      setShowPaymentModal(true);
    } else if (step === 5) {
      await submitFormNow();
    }
  };

  const handleNextOrPayment = () => {
    if (step === 5 && formDataState.isUrgent) {
      setShowPaymentModal(true);
    } else {
      // 폼 제출 트리거 처리는 버튼의 type="submit"에서 함
    }
  };

  if (step === 6) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">요청이 완료되었습니다!</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition" onClick={() => window.location.href='/'}>
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const isStep1Valid = formDataState.category !== '' && formDataState.subcategories.length > 0;
  const isStep2Valid = formDataState.category === 'MOVING' 
    ? (formDataState.locationText.trim() !== '' && formDataState.locationDetailText.trim() !== '' && formDataState.destinationText.trim() !== '' && formDataState.destinationDetailText.trim() !== '')
    : (formDataState.locationText.trim() !== '' && formDataState.locationDetailText.trim() !== '');
  const isStep3Valid = formDataState.serviceDateType === 'specific'
    ? formDataState.selectedDates.length > 0
    : (formDataState.periodStart !== '' && formDataState.periodEnd !== '' && formDataState.selectedWeekdays.length > 0);

  return (
    <div className={`mx-auto p-4 sm:p-8 bg-white relative ${isEditMode ? 'border-none shadow-none' : 'border border-slate-200 rounded-2xl shadow-sm'}`}>
      {/* 자동 저장 토스트 */}
      {isAutoSaving && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-semibold flex items-center gap-3 animate-in slide-in-from-top-10 fade-in zoom-in-95 duration-200">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
          자동 저장되었습니다.
        </div>
      )}

      {/* 취소 안내 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">작성을 취소하시겠습니까?</h3>
              <p className="text-slate-500 text-sm mb-6">지금까지 작성하신 내용은 임시 저장할 수 있습니다.</p>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  계속 작성하기
                </button>
                <button 
                  type="button"
                  onClick={handleSaveAndExit}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  임시 저장 후 종료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주소 검색 모달 API */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">주소 검색</h3>
              <button type="button" onClick={() => setShowAddressModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[520px]">
              <DaumPostcode 
                style={{ height: '520px' }}
                onComplete={(data) => {
                  let fullAddress = data.address;
                  let extraAddress = '';

                  if (data.addressType === 'R') {
                    if (data.bname !== '') extraAddress += data.bname;
                    if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
                    fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
                  }

                  setFormDataState(prev => ({
                    ...prev,
                    [showAddressModal === 'origin' ? 'locationText' : 'destinationText']: fullAddress
                  }));
                  setShowAddressModal(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 긴급요청 결제 모달 (Step 3-2) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">긴급 요청 결제 ⚡</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-500 text-sm mb-6">결제 시 전문가들에게 긴급 푸시 알림이 발송되어 가장 빠르게 견적을 받아보실 수 있습니다.</p>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 font-medium">긴급 요청 수수료</span>
                  <span className="text-slate-900 font-bold">5,000원</span>
                </div>
                <div className="flex justify-between items-center text-sm text-blue-600 font-semibold border-t border-slate-200 pt-2 mt-2">
                  <span>총 결제금액</span>
                  <span>5,000원</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={submitFormNow}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:bg-slate-400"
              >
                {isSubmitting ? '처리 중...' : '5,000원 결제하고 긴급 요청하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button 
              type="button" 
              onClick={prevStep}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              title="이전으로"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-900">{isEditMode ? '요청 수정하기' : '새로운 견적 요청'}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Step {step} of 5
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold">기존 내용을 불러오는 중...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1단계: 카테고리 및 하위 메뉴, 지역 다중 선택 (CC-01-03-01-00) */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">어떤 서비스가 필요하신가요? <span className="text-red-500">*</span></h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(categories).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key)}
                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                      formDataState.category === key 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-semibold ${formDataState.category === key ? 'text-blue-700' : 'text-slate-700'}`}>
                      {data.label}
                    </span>
                    {formDataState.category === key && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
                  </button>
                ))}
              </div>
            </div>

            {formDataState.category && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">상세 서비스를 모두 선택해주세요 <span className="text-red-500">*</span></h3>
                <div className="flex flex-wrap gap-2">
                  {categories[formDataState.category as keyof typeof categories].subcategories.map(sub => {
                    const isSelected = formDataState.subcategories.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubcategory(sub)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          isSelected 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 2단계: 위치 입력 폼 구성 (CC-01-03-02-00) */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {formDataState.category === '청소/이사' && formDataState.subcategories.some(s => s.includes('이사') || s.includes('용달') || s.includes('화물')) ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">이사/배달 위치를 알려주세요. <span className="text-red-500">*</span></h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">출발지</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={formDataState.locationText}
                        onChange={(e) => setFormDataState({...formDataState, locationText: e.target.value})}
                        placeholder="예) 서울시 강남구 역삼동" 
                        required 
                        readOnly
                        onClick={() => setShowAddressModal('origin')}
                        className="w-full pl-10 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddressModal('origin')}
                      className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl shrink-0 flex items-center gap-1 hover:bg-slate-700 transition"
                    >
                      <Search className="w-4 h-4" /> 검색
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formDataState.locationDetailText}
                    onChange={(e) => setFormDataState({...formDataState, locationDetailText: e.target.value})}
                    placeholder="상세주소를 입력해주세요 (예: 101동 202호)" 
                    className="w-full mt-2 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">도착지</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-blue-500" />
                      <input 
                        type="text" 
                        value={formDataState.destinationText}
                        onChange={(e) => setFormDataState({...formDataState, destinationText: e.target.value})}
                        placeholder="예) 서울시 서초구 서초동" 
                        required={formDataState.category === '청소/이사'}
                        readOnly
                        onClick={() => setShowAddressModal('destination')}
                        className="w-full pl-10 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddressModal('destination')}
                      className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl shrink-0 flex items-center gap-1 hover:bg-slate-700 transition"
                    >
                      <Search className="w-4 h-4" /> 검색
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formDataState.destinationDetailText}
                    onChange={(e) => setFormDataState({...formDataState, destinationDetailText: e.target.value})}
                    placeholder="상세주소를 입력해주세요 (예: 101동 202호)" 
                    className="w-full mt-2 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">서비스를 받으실 위치는 어디인가요? <span className="text-red-500">*</span></h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={formDataState.locationText}
                      onChange={(e) => setFormDataState({...formDataState, locationText: e.target.value})}
                      placeholder="예) 서울특별시 강남구 테헤란로" 
                      required 
                      readOnly
                      onClick={() => setShowAddressModal('origin')}
                      className="w-full pl-10 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowAddressModal('origin')}
                    className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl shrink-0 flex items-center gap-1 hover:bg-slate-700 transition"
                  >
                    <Search className="w-4 h-4" /> 검색
                  </button>
                </div>
                <input 
                  type="text" 
                  value={formDataState.locationDetailText}
                  onChange={(e) => setFormDataState({...formDataState, locationDetailText: e.target.value})}
                  placeholder="상세주소를 입력해주세요 (예: 101동 202호)" 
                  className="w-full mt-2 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* 3단계: 서비스 희망일 선택 */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">서비스 일정을 알려주세요 <span className="text-red-500">*</span></h3>
            
            <div className="flex gap-4 mb-6">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="scheduleType" value="specific" checked={formDataState.serviceDateType === 'specific'} onChange={() => setFormDataState({...formDataState, serviceDateType: 'specific'})} className="sr-only peer" />
                <div className="border border-slate-200 rounded-xl p-4 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all font-semibold text-slate-700 peer-checked:text-blue-700">특정 날짜 선택</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="scheduleType" value="periodic" checked={formDataState.serviceDateType === 'periodic'} onChange={() => setFormDataState({...formDataState, serviceDateType: 'periodic'})} className="sr-only peer" />
                <div className="border border-slate-200 rounded-xl p-4 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all font-semibold text-slate-700 peer-checked:text-blue-700">기간 및 요일 선택</div>
              </label>
            </div>

            {formDataState.serviceDateType === 'specific' ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">희망 날짜 추가</label>
                <div className="flex gap-2 mb-4">
                  <input type="date" id="date-picker-input" className="flex-1 border border-slate-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => {
                    const el = document.getElementById('date-picker-input') as HTMLInputElement;
                    if (el && el.value && !formDataState.selectedDates.includes(el.value)) {
                      setFormDataState({...formDataState, selectedDates: [...formDataState.selectedDates, el.value].sort()});
                      el.value = '';
                    }
                  }} className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition">추가</button>
                </div>
                {formDataState.selectedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formDataState.selectedDates.map(date => (
                      <div key={date} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-slate-700 shadow-sm">
                        {`${date} (${['일', '월', '화', '수', '목', '금', '토'][new Date(date).getDay()]})`}
                        <button type="button" onClick={() => setFormDataState({...formDataState, selectedDates: formDataState.selectedDates.filter(d => d !== date)})} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">선택된 날짜가 없습니다.</p>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">서비스 기간</label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input type="date" value={formDataState.periodStart} onChange={(e) => setFormDataState({...formDataState, periodStart: e.target.value})} className="w-full sm:flex-1 border border-slate-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-slate-400 font-bold hidden sm:block">~</span>
                    <input type="date" value={formDataState.periodEnd} onChange={(e) => setFormDataState({...formDataState, periodEnd: e.target.value})} className="w-full sm:flex-1 border border-slate-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">원하시는 요일 (다중 선택 가능)</label>
                  <div className="flex gap-2 flex-wrap">
                    {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                      <label key={day} className="cursor-pointer">
                        <input type="checkbox" checked={formDataState.selectedWeekdays.includes(day)} onChange={(e) => {
                          if (e.target.checked) setFormDataState({...formDataState, selectedWeekdays: [...formDataState.selectedWeekdays, day]});
                          else setFormDataState({...formDataState, selectedWeekdays: formDataState.selectedWeekdays.filter(d => d !== day)});
                        }} className="sr-only peer" />
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 font-bold text-slate-600 transition-all select-none shadow-sm">{day}</div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formDataState.category === '청소/이사' && formDataState.subcategories.some(s => s.includes('이사') || s.includes('용달') || s.includes('화물')) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">희망 도착 시간 (선택사항)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-5 h-5 text-blue-500" />
                  <input type="time" value={formDataState.serviceTime || ''} onChange={(e) => setFormDataState({...formDataState, serviceTime: e.target.value})} className="w-full pl-10 border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <p className="text-xs text-slate-400 mt-2">시간에 구애받지 않거나 미정이라면 비워두셔도 좋습니다.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* 4단계: 상세 내용 + 사진 + 옵션 */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">작성자 <span className="text-red-500">*</span></h3>
            <input 
              type="text" 
              value={formDataState.authorName}
              onChange={(e) => setFormDataState({...formDataState, authorName: e.target.value})}
              placeholder="예) 홍길동" 
              required 
              className="w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6"
            />

            <h3 className="text-lg font-semibold text-slate-800 mb-4">연락처 <span className="text-red-500">*</span></h3>
            <div className="flex items-center gap-2 mb-8">
              <input 
                type="text" 
                value={formDataState.contact1}
                onChange={handleContact1Change}
                placeholder="010" 
                required 
                className="w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="text" 
                ref={contact2Ref}
                value={formDataState.contact2}
                onChange={handleContact2Change}
                placeholder="1234" 
                required 
                className="w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="text" 
                ref={contact3Ref}
                value={formDataState.contact3}
                onChange={handleContact3Change}
                placeholder="5678" 
                required 
                className="w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
              />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-4">상세한 요청 내용과 추가 정보를 입력해주세요 <span className="text-red-500">*</span></h3>
            <p className="text-sm text-slate-500 mb-4">이 내용은 AI 기술로 분석되어 전문가에게 전달됩니다.</p>
            <textarea 
              name="details" 
              value={formDataState.details}
              onChange={(e) => setFormDataState({...formDataState, details: e.target.value})}
              placeholder="예) 30평대 아파트 이사 청소입니다. 창틀 청소를 특히 꼼꼼하게 부탁드리고 싶습니다." 
              required 
              rows={4}
              className="w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-6"
            />

            <h3 className="text-lg font-semibold text-slate-800 mb-4">현장 사진 첨부 (선택, 최대 5장)</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition duration-200 mb-6 relative">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const selected = Array.from(e.target.files);
                    if (selected.length + formDataState.photos.length > 5) {
                      setMessage('사진은 최대 5장까지만 첨부할 수 있습니다.');
                      return;
                    }
                    setMessage('');
                    setFormDataState(prev => ({ ...prev, photos: [...prev.photos, ...selected].slice(0, 5) }));
                  }
                }}
                className="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm">
                사진 파일 선택
              </span>
              <p className="text-sm text-slate-500 mt-4">전문가가 견적을 산출하는 데 큰 도움이 됩니다.</p>
            </div>
            {formDataState.photos.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {formDataState.photos.map((file, idx) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={imageUrl} 
                        alt={`첨부사진 ${idx + 1}`} 
                        className="w-24 h-24 object-cover"
                        onLoad={() => URL.revokeObjectURL(imageUrl)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          type="button" 
                          onClick={() => {
                            setFormDataState(prev => ({
                              ...prev,
                              photos: prev.photos.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="bg-white/90 text-red-500 hover:text-red-600 hover:bg-white p-2 rounded-full shadow-sm transition-all transform hover:scale-105"
                          title="삭제하기"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h3 className="text-lg font-semibold text-slate-800 mb-4">추가 옵션</h3>
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formDataState.isUrgent}
                  onChange={(e) => setFormDataState({...formDataState, isUrgent: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">긴급 요청 🚀</div>
                  <div className="text-xs text-slate-500">가장 먼저 전문가의 견적을 받아보세요. (유료)</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formDataState.needsReestimate}
                  onChange={(e) => setFormDataState({...formDataState, needsReestimate: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-slate-800">방문 후 재견적 희망</div>
                  <div className="text-xs text-slate-500">정확한 금액 산출을 위해 방문을 원합니다.</div>
                </div>
              </label>
            </div>
            
            {message && (
              <div className="mt-6 p-4 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span> 
                {message}
              </div>
            )}
          </motion.div>
        )}

        {/* 5단계: 최종 미리보기 */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">마지막으로 확인해주세요 👀</h3>
            <p className="text-sm text-slate-500 mb-6">입력하신 내용을 바탕으로 전문가에게 알림이 발송됩니다.</p>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
              
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">서비스 종류</div>
                  <div className="text-slate-900 font-medium">
                    {categories[formDataState.category as keyof typeof categories]?.label} 
                    <span className="text-slate-400 mx-2">|</span> 
                    {formDataState.subcategories.join(', ')}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-lg">수정</button>
              </div>

              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">서비스 위치</div>
                  <div className="text-slate-900 font-medium whitespace-pre-line">
                    {formDataState.category === '청소/이사' && formDataState.subcategories.some(s => s.includes('이사') || s.includes('용달') || s.includes('화물'))
                      ? `출발: ${formDataState.locationText} ${formDataState.locationDetailText}\n도착: ${formDataState.destinationText} ${formDataState.destinationDetailText}`
                      : `${formDataState.locationText} ${formDataState.locationDetailText}`}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-sm text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-lg">수정</button>
              </div>

              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">서비스 희망일</div>
                  <div className="text-slate-900 font-medium whitespace-pre-line">
                    {formDataState.serviceDateType === 'specific' 
                      ? formDataState.selectedDates.length > 0 
                        ? `희망일: ${formDataState.selectedDates.map(date => {
                            const d = new Date(date);
                            const dayStr = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
                            return `${date} (${dayStr})`;
                          }).join(', ')}`
                        : '미정'
                      : formDataState.periodStart && formDataState.periodEnd && formDataState.selectedWeekdays.length > 0
                        ? `정기: ${formDataState.periodStart} ~ ${formDataState.periodEnd} (${formDataState.selectedWeekdays.join(', ')})`
                        : '미정'}
                    {formDataState.serviceTime ? `\n희망/도착 시간: ${formDataState.serviceTime}` : ''}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(3)} className="text-sm text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-lg">수정</button>
              </div>

              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="w-full pr-4">
                  <div className="text-xs font-semibold text-slate-400 mb-1">작성자</div>
                  <div className="text-slate-900 font-medium mb-4">{formDataState.authorName}</div>
                  
                  <div className="text-xs font-semibold text-slate-400 mb-1">연락처</div>
                  <div className="text-slate-900 font-medium mb-4">{`${formDataState.contact1}-${formDataState.contact2}-${formDataState.contact3}`}</div>
                  
                  <div className="text-xs font-semibold text-slate-400 mb-1">상세 내용 및 옵션</div>
                  <p className="text-slate-700 text-sm bg-white p-3 rounded-xl border border-slate-100 mt-2 mb-3">
                    {formDataState.details}
                  </p>
                  
                  {formDataState.photos.length > 0 && (
                    <div className="flex flex-col gap-1 text-sm text-slate-600 mb-3 ml-1">
                      <span className="text-slate-400">📎 첨부된 사진 ({formDataState.photos.length}장):</span>
                      {formDataState.photos.map((file, idx) => (
                        <span key={idx} className="text-slate-700">- {file.name}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {formDataState.isUrgent && <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">🚀 긴급 요청</span>}
                    {formDataState.needsReestimate && <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md">방문 견적 희망</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setStep(4)} className="text-sm text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-lg shrink-0">수정</button>
              </div>

            </div>

            {message && (
              <div className="mt-6 p-4 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span> 
                {message}
              </div>
            )}
          </motion.div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4 pt-4 border-t border-slate-100 mt-8">
          <button 
            type="button"
            onClick={() => {
              if (isEditMode && onClose) {
                onClose();
              } else if (step === 1) {
                window.location.href = '/estimate';
              } else {
                setShowCancelModal(true);
              }
            }}
            className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>



          {step < 5 ? (
            <button 
              type="button" 
              onClick={handleNextStep}
              disabled={
                isAutoSaving ||
                (step === 1 && !isStep1Valid) || 
                (step === 2 && !isStep2Valid) ||
                (step === 3 && !isStep3Valid) ||
                (step === 4 && formDataState.details.trim() === '')
              }
              className="flex-1 py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {isAutoSaving ? '저장 중...' : (
                <>다음 단계 <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                if (formDataState.isUrgent) {
                  setShowPaymentModal(true);
                } else {
                  submitFormNow();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md text-lg"
            >
              {isSubmitting ? '진행 중...' : (isEditMode ? '수정 저장하기' : (formDataState.isUrgent ? '결제 및 최종 발행' : '최종 발행'))}
            </button>
          )}
        </div>
      </form>
      )}
    </div>
  );
}
