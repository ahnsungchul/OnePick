'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Users, X, ArrowRight, ShieldCheck, MessageCircle, Mail, Zap, Check, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerUserAction } from '@/actions/register.action';
import { regionData, getDongs } from '@/lib/regions';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {
  const router = useRouter();
  
  // Steps: 1: Role, 2: SNS Auth, 3: Terms, 4: Expert Data
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<'user' | 'expert' | 'both'>('user');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // Terms state
  const [allAgreed, setAllAgreed] = useState(false);
  const [agreements, setAgreements] = useState({
    termsOfService: false,
    privacyPolicy: false,
    ageConfirmed: false,
    marketing: false,
  });
  const [termsPopupContent, setTermsPopupContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

  // Expert Data state
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');
  const [selectedDong, setSelectedDong] = useState<string>('');
  
  const [idCard, setIdCard] = useState<{ id: number; name: string } | null>(null);
  const [businessLicenses, setBusinessLicenses] = useState<{ id: number; name: string }[]>([]);
  const [newCertName, setNewCertName] = useState('');
  const [certifications, setCertifications] = useState<{ id: number; name: string; file: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Refs
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);

  const categoriesList = ['도배/장판', '욕실/주방', '전기/조명', '청소/이사', '가전/에어컨', '자동차 수리', '베이비/펫시터', '과외/레슨', '디자인/IT', '기타 서비스'];

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      // Reset state on open
      setStep(1);
      setRole('user');
      setEmail('');
      setName('');
      setAllAgreed(false);
      setAgreements({ termsOfService: false, privacyPolicy: false, ageConfirmed: false, marketing: false });
      setSelectedSpecialties([]);
      setSelectedRegions([]);
      setTermsPopupContent(null);
      setIdCard(null);
      setBusinessLicenses([]);
      setCertifications([]);
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSNSLogin = (provider: string) => {
    const fakeEmail = `${provider}_user_${Math.floor(Math.random() * 10000)}@test.com`;
    const fakeName = fakeEmail.split('@')[0];
    setEmail(fakeEmail);
    setName(fakeName);
    setStep(3);
  };

  const handleTermsNext = () => {
    if (role === 'expert' || role === 'both') {
      setStep(4);
    } else {
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    if ((role === 'expert' || role === 'both')) {
      if (selectedSpecialties.length === 0) {
        alert("하나 이상의 전문 분야를 선택해주세요.");
        return;
      }
      if (selectedRegions.length === 0) {
        alert("하나 이상의 서비스 지역을 선택해주세요.");
        return;
      }
    }

    setIsSubmitting(true);
    const res = await registerUserAction({
      email,
      name,
      role,
      specialties: selectedSpecialties,
      regions: selectedRegions,
      idCardUrl: idCard?.name || null,
      businessLicenseUrls: businessLicenses.map(b => b.name),
      certificationUrls: certifications.map(c => c.name),
    });

    if (res.success) {
      const loginRes = await signIn('credentials', {
        email,
        password: 'mock_password',
        redirect: false,
      });

      setIsSubmitting(false);

      if (loginRes?.error) {
        alert("가입은 완료되었으나 로그인 중 오류가 발생했습니다.");
      } else {
        alert("회원가입이 완료되었습니다!");
        router.refresh();
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    } else {
      setIsSubmitting(false);
      alert(res.error || "회원가입 중 오류가 발생했습니다.");
    }
  };

  // Sub-renders
  const renderStep1Role = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">회원가입</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium">원픽에서 원하시는 서비스 형태를 선택해주세요.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'user', icon: User, title: '사용자', desc: '청소, 이사, 레슨 등 전문가의 도움이 필요하신가요?', color: 'blue' },
          { id: 'expert', icon: Briefcase, title: '전문가', desc: '나만의 전문 기술로 새로운 고객을 만나고 싶으신가요?', color: 'indigo' },
          { id: 'both', icon: Users, title: '통합', desc: '이용도 하고 나의 전문성도 함께 판매하고 싶으신가요?', color: 'teal' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => { setRole(item.id as any); setStep(2); }} 
            className={`group flex flex-col items-center bg-slate-50 rounded-2xl p-6 border-2 border-transparent hover:border-${item.color}-500 hover:bg-white hover:shadow-xl hover:shadow-${item.color}-500/10 transition-all duration-300 text-center`}
          >
            <div className={`w-14 h-14 bg-${item.color}-100 text-${item.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-500 text-xs mb-4 flex-1">{item.desc}</p>
            <div className={`flex items-center text-${item.color}-600 text-xs font-bold gap-1 mt-auto group-hover:gap-2 transition-all`}>
              선택하기 <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2SNS = () => (
    <div className="flex flex-col h-full justify-center">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">SNS 간편 인증</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium">안전한 원픽 서비스 이용을 위해 본인인증을 진행해주세요.</p>
      </div>
      <div className="space-y-4 max-w-sm mx-auto w-full">
        <button onClick={() => handleSNSLogin('kakao')} className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-bold py-4 px-6 rounded-2xl transition-colors">
          <MessageCircle className="w-5 h-5 fill-current" /> 카카오로 3초만에 시작하기
        </button>
        <button onClick={() => handleSNSLogin('naver')} className="w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:bg-[#02b350] text-white font-bold py-4 px-6 rounded-2xl transition-colors">
          <span className="font-black text-lg leading-none">N</span> 네이버로 계속하기
        </button>
        <button onClick={() => handleSNSLogin('google')} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-colors">
          <Mail className="w-5 h-5 text-red-500" /> 구글 계정으로 인증
        </button>
      </div>
      <div className="mt-8 text-center">
         <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">이전 화면으로 돌아가기</button>
      </div>
    </div>
  );

  const renderStep3Terms = () => {
    const isFormValid = agreements.termsOfService && agreements.privacyPolicy && agreements.ageConfirmed;
    
    return (
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="mb-6 text-center shrink-0">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">약관 동의</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">원픽 서비스 이용을 위해 약관에 동의해주세요.</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors mb-6 group">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${allAgreed ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
              <Check className={`w-4 h-4 ${allAgreed ? 'text-white' : 'text-transparent'}`} strokeWidth={3} />
            </div>
            <input type="checkbox" className="hidden" checked={allAgreed} onChange={(e) => {
              const checked = e.target.checked;
              setAllAgreed(checked);
              setAgreements({ termsOfService: checked, privacyPolicy: checked, ageConfirmed: checked, marketing: checked });
            }} />
            <span className={`font-bold transition-colors ${allAgreed ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'}`}>네, 모두 동의합니다.</span>
          </label>
          <div className="space-y-4 px-1">
            <label className="flex items-center justify-between group cursor-pointer py-1">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${agreements.ageConfirmed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.ageConfirmed} onChange={e => {
                  setAgreements(p => { const next = {...p, ageConfirmed: e.target.checked}; setAllAgreed(Object.values(next).every(Boolean)); return next; });
                }} />
                <span className="text-sm font-bold text-slate-700"><span className="text-blue-500 mr-1">[필수]</span>만 14세 이상입니다</span>
              </div>
            </label>
            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 w-full cursor-pointer py-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${agreements.termsOfService ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.termsOfService} onChange={e => {
                  setAgreements(p => { const next = {...p, termsOfService: e.target.checked}; setAllAgreed(Object.values(next).every(Boolean)); return next; });
                }} />
                <span className="text-sm font-bold text-slate-700 flex-1"><span className="text-blue-500 mr-1">[필수]</span>서비스 이용약관 동의</span>
              </label>
            </div>
            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 w-full cursor-pointer py-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${agreements.privacyPolicy ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.privacyPolicy} onChange={e => {
                  setAgreements(p => { const next = {...p, privacyPolicy: e.target.checked}; setAllAgreed(Object.values(next).every(Boolean)); return next; });
                }} />
                <span className="text-sm font-bold text-slate-700 flex-1"><span className="text-blue-500 mr-1">[필수]</span>개인정보 수집 및 이용 동의</span>
              </label>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={() => setStep(2)} className="flex-1 font-bold py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">이전 화면</button>
          <button onClick={handleTermsNext} disabled={!isFormValid} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl disabled:bg-slate-300 transition-colors">
            {role === 'user' ? '가입 완료' : '다음으로'}
          </button>
        </div>
      </div>
    );
  };

  const renderStep4Expert = () => (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="mb-4 text-center shrink-0">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">전문가 정보 등록</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium">활동하실 지역과 분야를 등록해주세요.</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6">
        <div className="space-y-3">
          <label className="font-bold text-slate-900 block text-sm">전문 분야 선택 <span className="text-slate-400 font-normal text-xs">(다중 선택 가능)</span></label>
          <div className="flex flex-wrap gap-2">
            {categoriesList.map(cat => (
              <button key={cat} onClick={() => setSelectedSpecialties(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])}
                className={`px-3 py-2 text-sm font-bold rounded-xl border transition-colors ${selectedSpecialties.includes(cat) ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="font-bold text-slate-900 block text-sm">서비스 지역 추가</label>
          <div className="flex gap-2">
            <select value={selectedSido} onChange={(e) => { setSelectedSido(e.target.value); setSelectedSigungu(''); setSelectedDong(''); }} className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm">
              <option value="" disabled>시/도</option>
              {Object.keys(regionData).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={selectedSigungu} onChange={e => { setSelectedSigungu(e.target.value); setSelectedDong(''); }} disabled={!selectedSido} className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm">
              <option value="" disabled>시/군/구</option>
              {selectedSido && regionData[selectedSido].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => {
              const regionStr = selectedSido === '전국' ? '전국 전체' : (selectedSigungu === '전체' ? `${selectedSido} 전체` : `${selectedSido} ${selectedSigungu}`);
              if (!selectedRegions.includes(regionStr)) setSelectedRegions([...selectedRegions, regionStr]);
              setSelectedSido(''); setSelectedSigungu('');
            }} disabled={!selectedSido || !selectedSigungu} className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:bg-slate-300">
              추가
            </button>
          </div>
          {selectedRegions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedRegions.map(r => (
                <div key={r} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 font-bold border border-blue-100">
                  {r} <button onClick={() => setSelectedRegions(p => p.filter(x => x !== r))}><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100 flex gap-3 shrink-0">
        <button onClick={() => setStep(3)} className="flex-1 font-bold py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">이전 화면</button>
        <button onClick={handleCompleteRegistration} disabled={isSubmitting || selectedSpecialties.length === 0 || selectedRegions.length === 0} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl disabled:bg-slate-300 transition-colors">
          {isSubmitting ? '가입 중...' : '전문가 가입 완료'}
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl w-full ${step === 4 ? 'max-w-xl' : 'max-w-2xl'} border border-slate-100 flex flex-col relative`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 z-10 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && renderStep1Role()}
        {step === 2 && renderStep2SNS()}
        {step === 3 && renderStep3Terms()}
        {step === 4 && renderStep4Expert()}

      </div>
    </div>
  );
}
