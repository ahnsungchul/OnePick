'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Zap, Check, ChevronRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { registerUserAction } from '@/actions/register.action';
import { regionData, getDongs } from '@/lib/regions';

export default function GeneralTermsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role'); // user, expert, both
  const emailFromUrl = searchParams.get('email');
  const nameFromUrl = searchParams.get('name');

  const [allAgreed, setAllAgreed] = useState(false);
  const [agreements, setAgreements] = useState({
    termsOfService: false,
    privacyPolicy: false,
    ageConfirmed: false,
    marketing: false,
  });
  
  // 모달 상태 관리
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  
  // 전문가 등록 팝업 상태
  const [showExpertRegistration, setShowExpertRegistration] = useState(false);
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
  
  // 파일 입력을 위한 ref
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);

  const categoriesList = ['도배/장판', '욕실/주방', '전기/조명', '청소/이사', '가전/에어컨', '자동차 수리', '베이비/펫시터', '과외/레슨', '디자인/IT', '기타 서비스'];
  const regionsList = ['전국', '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '부산', '대구', '울산', '제주'];

  // 실제 파일 선택 이벤트 핸들러
  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.');
        return;
      }
      setIdCard({ id: Date.now(), name: file.name });
    }
  };

  const handleBusinessLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.');
        return;
      }
      setBusinessLicenses(prev => [
        ...prev,
        { id: Date.now(), name: file.name }
      ]);
    }
    // 동일 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  const handleCertificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.');
        return;
      }
      if (!newCertName.trim()) {
        alert('자격증 종류를 먼저 입력해주세요.');
        return;
      }
      setCertifications(prev => [
        ...prev,
        { id: Date.now(), name: newCertName, file: file.name }
      ]);
      setNewCertName('');
    }
    e.target.value = '';
  };

  const handleRemoveIdCard = () => {
    setIdCard(null);
    if (idCardInputRef.current) idCardInputRef.current.value = '';
  };

  const handleRemoveBusinessLicense = (id: number) => {
    setBusinessLicenses(prev => prev.filter(item => item.id !== id));
  };

  const handleRemoveCertification = (id: number) => {
    setCertifications(prev => prev.filter(item => item.id !== id));
  };

  // 모달 오픈 시 바디 스크롤 방지
  useEffect(() => {
    if (modalContent || showExpertRegistration) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalContent, showExpertRegistration]);

  const isFormValid = agreements.termsOfService && agreements.privacyPolicy && agreements.ageConfirmed;

  useEffect(() => {
    const allChecked = Object.values(agreements).every((val) => val === true);
    setAllAgreed(allChecked);
  }, [agreements]);

  const handleAllAgreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAllAgreed(checked);
    setAgreements({
      termsOfService: checked,
      privacyPolicy: checked,
      ageConfirmed: checked,
      marketing: checked,
    });
  };

  const handleSingleAgreeChange = (name: keyof typeof agreements) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreements(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };

  const handleNextSteps = () => {
    if (isFormValid) {
      if (role === 'expert' || role === 'both') {
        setShowExpertRegistration(true);
      } else {
        // 일반 사용자도 최종 가입 액션 호출
        handleCompleteRegistration();
      }
    }
  };

  const handleCompleteRegistration = async () => {
    // 1. 필수 정보 확인
    if (!emailFromUrl || !nameFromUrl || !role) {
      alert("가입 정보가 부족합니다. 다시 시도해주세요.");
      return;
    }
    
    // 전문가용이면 전문분야와 서비스 지역 필수
    if (role === 'expert' || role === 'both') {
      if (selectedSpecialties.length === 0) {
        alert("하나 이상의 전문 분야를 선택해주세요.");
        return;
      }
      if (selectedRegions.length === 0) {
        alert("하나 이상의 서비스 지역을 선택해주세요.");
        return;
      }
    }

    // 신분증 필수 체크 제거 (선택 사항으로 변경)
    /*
    if ((role === 'expert' || role === 'both') && !idCard) {
      alert("본인 확인을 위해 신분증 사본을 필수 첨부해주세요.");
      return;
    }
    */

    setIsSubmitting(true);
    
    // 2. 서버 사이드 회원가입 수행 (User + Account + Specialties)
    const res = await registerUserAction({
      email: emailFromUrl,
      name: nameFromUrl,
      role: role,
      specialties: selectedSpecialties,
      regions: selectedRegions,
      idCardUrl: idCard?.name || null, // 실제 환경에서는 S3 URL 등이 들어갑니다.
      businessLicenseUrls: businessLicenses.map(b => b.name),
      certificationUrls: certifications.map(c => c.name),
    });

    if (res.success) {
      // 3. 가입 성공 시 바로 로그인 수행 (Credentials Provider 활용)
      const loginRes = await signIn('credentials', {
        email: emailFromUrl,
        password: 'mock_password', // auth.ts의 authorize에서 어떤 비밀번호든 허용하도록 시뮬레이션 중
        redirect: false,
      });

      setIsSubmitting(false);
      
      if (loginRes?.error) {
        alert("가입은 완료되었으나 로그인 중 오류가 발생했습니다. 메인에서 다시 로그인해주세요.");
        router.push('/');
      } else {
        router.push(`/register/complete?role=${role}`);
      }
    } else {
      setIsSubmitting(false);
      alert(res.error || "회원가입 중 오류가 발생했습니다.");
    }
  };

  const openTermsModal = (type: 'termsOfService' | 'privacyPolicy' | 'marketing') => {
    const contentMap = {
      termsOfService: {
        title: '서비스 이용약관',
        content: <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>제 1조 (목적) <br/>본 약관은 OnePick 주식회사(이하 &quot;회사&quot;)가 운영하는 플랫폼 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>
          <p>제 2조 (정의) <br/>&quot;서비스&quot;란 회사가 제공하는 모든 인터넷 기반 서비스를 말합니다. &quot;회원&quot;이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</p>
          <p>제 3조 (약관의 명시와 개정) <br/>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 필요에 따라 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.</p>
        </div>
      },
      privacyPolicy: {
        title: '개인정보 수집 및 이용',
        content: <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>1. 수집하는 개인정보 항목 <br/>필수항목: 이름, 이메일 주소, 연락처, 비밀번호 등<br/>선택항목: 주소, 마케팅 수신 동의 여부 등</p>
          <p>2. 개정정보의 수집 및 이용 목적 <br/>본인 확인, 서비스 제공 및 계약 이행, 고객 문의 응대, 신규 서비스 안내 및 맞춤형 서비스 제공 등</p>
          <p>3. 개인정보의 보유 및 이용 기간 <br/>원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 법령이 정한 기간 동안 보존합니다.</p>
        </div>
      },
      marketing: {
        title: '마케팅 정보 수신 동의',
        content: <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>마케팅 정보 수신에 동의하시면 OnePick에서 제공하는 다양한 혜택과 이벤트 소식을 이메일, SMS, 스토어 앱 푸시 등으로 안내받으실 수 있습니다.</p>
          <p>- 제공 항목: 이메일, 전화번호<br/>- 사용 목적: 신규 서비스 안내, 프로모션 혜택 제공, 맞춤형 광고 전송<br/>- 보유 기간: 회원 탈퇴 또는 마케팅 정보 수신 동의 철회 시까지</p>
          <p>※ 마케팅 정보 수신에 동의하지 않아도 OnePick의 기본 서비스는 정상적으로 이용하실 수 있습니다.</p>
        </div>
      }
    };
    setModalContent(contentMap[type]);
  };

  return (
    <div className="bg-slate-50 flex flex-col pt-12 md:pt-20 pb-20">
      <div className="max-w-md mx-auto px-4 w-full">
        
        {/* 상단 로고 & 타이틀 */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-500 mb-6 justify-center">
            <Zap className="w-8 h-8 fill-current" />
            <span className="text-2xl font-black tracking-tighter text-slate-900">OnePick</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
            약관 동의
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            원픽 서비스 이용을 위해 약관에 동의해주세요.
          </p>
        </div>

        {/* 약관 동의 폼 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          
          {/* 전체 동의 */}
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors mb-6 group">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
              allAgreed ? 'bg-blue-500 border-blue-500 shadow-md shadow-blue-500/20' : 'bg-white border-slate-300 group-hover:border-blue-500'
            }`}>
              <Check className={`w-3.5 h-3.5 ${allAgreed ? 'text-white' : 'text-transparent'}`} strokeWidth={3} />
            </div>
            <input type="checkbox" className="hidden" checked={allAgreed} onChange={handleAllAgreeChange} />
            <span className={`font-bold transition-colors ${allAgreed ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'}`}>
              네, 모두 동의합니다.
            </span>
          </label>

          {/* 개별 약관 목록 */}
          <div className="space-y-4 px-1">
            
            {/* 만 14세 이상 확인 */}
            <label className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  agreements.ageConfirmed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-blue-500'
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.ageConfirmed} onChange={handleSingleAgreeChange('ageConfirmed')} />
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900"><span className="text-blue-500 mr-1">[필수]</span>만 14세 이상입니다</span>
              </div>
            </label>

            {/* 서비스 이용약관 동의 */}
            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 w-full cursor-pointer py-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  agreements.termsOfService ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-blue-500'
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.termsOfService} onChange={handleSingleAgreeChange('termsOfService')} />
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 flex-1"><span className="text-blue-500 mr-1">[필수]</span>서비스 이용약관 동의</span>
              </label>
              <button type="button" onClick={() => openTermsModal('termsOfService')} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 개인정보 수집 및 이용 동의 */}
            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-3 w-full cursor-pointer py-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  agreements.privacyPolicy ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-blue-500'
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.privacyPolicy} onChange={handleSingleAgreeChange('privacyPolicy')} />
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 flex-1"><span className="text-blue-500 mr-1">[필수]</span>개인정보 수집 및 이용 동의</span>
              </label>
              <button type="button" onClick={() => openTermsModal('privacyPolicy')} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 마케팅 수신 동의 */}
            <div className="flex items-center justify-between group pt-2 mt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 w-full cursor-pointer py-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  agreements.marketing ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-blue-500'
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <input type="checkbox" className="hidden" checked={agreements.marketing} onChange={handleSingleAgreeChange('marketing')} />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 flex-1"><span className="text-slate-400 font-bold mr-1">[선택]</span>마케팅 정보 수신 동의</span>
              </label>
              <button type="button" onClick={() => openTermsModal('marketing')} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 focus:outline-none">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleNextSteps}
              disabled={!isFormValid}
              className={`w-full py-4 px-6 rounded-2xl font-bold transition-all ${
                isFormValid 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              확인 및 다음으로
            </button>
          </div>
        </div>

        {/* 뒤로가기 링크 */}
        <div className="text-center mt-8">
          <button onClick={() => router.back()} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            이전 화면으로 돌아가기
          </button>
        </div>

      </div>

      {/* 약관 상세 팝업 (모달) */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalContent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">{modalContent.title}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              {modalContent.content}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setModalContent(null)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전문가 등록 팝업 (모달) */}
      {showExpertRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowExpertRegistration(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex flex-col bg-slate-50 relative">
              <h3 className="font-black text-xl text-slate-900">전문가 등록 정보 <span className="text-blue-500 font-bold ml-1">*</span></h3>
              <p className="text-sm text-slate-500 mt-1">고객에게 신뢰를 줄 수 있는 정보를 입력해주세요.</p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* 전문 분야 선택 */}
              <div className="space-y-3">
                <label className="font-bold text-slate-900 block text-sm">전문 분야 선택 <span className="text-slate-400 font-normal text-xs">(다중 선택 가능)</span></label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedSpecialties(prev => 
                          prev.includes(cat) ? prev.filter(item => item !== cat) : [...prev, cat]
                        );
                      }}
                      className={`px-3 py-2 text-sm font-bold rounded-xl border transition-colors ${
                        selectedSpecialties.includes(cat)
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 서비스 지역 선택 */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="font-bold text-slate-900 block text-sm">서비스 지역 추가 <span className="text-slate-400 font-normal text-xs">(다중 추가 가능)</span></label>
                <div className="flex gap-2">
                  <select 
                    value={selectedSido}
                    onChange={(e) => {
                      setSelectedSido(e.target.value);
                      setSelectedSigungu(''); // 시/도 변경 시 시/군/구 초기화
                      setSelectedDong(''); // 읍/면/동 초기화
                    }}
                    className="flex-1 text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>시/도 선택</option>
                    {Object.keys(regionData).map(sido => (
                      <option key={sido} value={sido}>{sido}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={selectedSigungu}
                    onChange={(e) => {
                      setSelectedSigungu(e.target.value);
                      setSelectedDong(''); // 시/군/구 변경 시 읍/면/동 초기화
                    }}
                    disabled={!selectedSido}
                    className="flex-1 text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="" disabled>시/군/구 선택</option>
                    {selectedSido && regionData[selectedSido].map(sigungu => (
                      <option key={sigungu} value={sigungu}>{sigungu}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedDong}
                    onChange={(e) => setSelectedDong(e.target.value)}
                    disabled={!selectedSigungu || selectedSigungu === '전체'}
                    className="flex-1 text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="" disabled>읍/면/동 선택</option>
                    {selectedSido && selectedSigungu && getDongs(selectedSido, selectedSigungu).map(dong => (
                      <option key={dong} value={dong}>{dong}</option>
                    ))}
                  </select>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      if (!selectedSido || !selectedSigungu) return;
                      // 읍/면/동은 선택일수도 있고(옵션), '전체'일 수도 있음. 
                      // 만약 '전체'를 선택했거나 시군구가 '전체'라서 읍면동이 비활성화된 경우 포맷 처리.
                      const dongStr = selectedDong && selectedDong !== '전체' ? ` ${selectedDong}` : '';
                      const regionStr = selectedSido === '전국' ? '전국 전체' : (selectedSigungu === '전체' ? `${selectedSido} 전체` : `${selectedSido} ${selectedSigungu}${dongStr}`);
                      if (!selectedRegions.includes(regionStr)) {
                        setSelectedRegions(prev => [...prev, regionStr]);
                      }
                      setSelectedSido('');
                      setSelectedSigungu('');
                      setSelectedDong('');
                    }}
                    disabled={!selectedSido || !selectedSigungu || (selectedSigungu !== '전체' && !selectedDong)}
                    className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl disabled:bg-slate-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>

                {/* 추가된 지역 목록 */}
                {selectedRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedRegions.map(region => (
                      <div key={region} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold shadow-sm">
                        <span>{region}</span>
                        <button 
                          type="button" 
                          onClick={() => setSelectedRegions(prev => prev.filter(r => r !== region))}
                          className="text-blue-400 hover:text-red-500 focus:outline-none flex items-center justify-center p-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 신분증 첨부 */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <label className="font-bold text-slate-900 block text-sm mb-1">신분증 사본 첨부 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
                    <p className="text-xs text-orange-500 font-bold mb-1">※ 미 첨부 시 관리자 승인이 지연될 수 있습니다.</p>
                    <p className="text-xs text-slate-500">주민등록증 또는 운전면허증 사본</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => idCardInputRef.current?.click()}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                      idCard ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}
                    disabled={!!idCard}
                  >
                    파일 추가
                  </button>
                  <input 
                    type="file" 
                    ref={idCardInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleIdCardFileChange} 
                  />
                </div>
                
                {idCard && (
                  <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    <span className="text-xs text-blue-700 truncate mr-2 font-medium">{idCard.name}</span>
                    <button type="button" onClick={handleRemoveIdCard} className="text-blue-400 hover:text-red-500 text-xs font-bold">
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {/* 사업자 등록증 */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <label className="font-bold text-slate-900 block text-sm mb-1">사업자 등록증 첨부 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
                    {businessLicenses.length > 0 ? (
                      <p className="text-xs text-blue-600 font-bold">🎉 전문가 등급으로 활동하실 수 있습니다!</p>
                    ) : (
                      <p className="text-xs text-orange-500 font-bold">⚠️ 사업자 미인증 시 헬퍼 등급으로 활동하게 됩니다.</p>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => businessLicenseInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 whitespace-nowrap"
                  >
                    파일 추가
                  </button>
                  <input 
                    type="file" 
                    ref={businessLicenseInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleBusinessLicenseFileChange} 
                  />
                </div>
                
                {/* 첨부된 사업자 등록증 목록 */}
                {businessLicenses.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {businessLicenses.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-700 truncate mr-2 font-medium">{doc.name}</span>
                        <button type="button" onClick={() => handleRemoveBusinessLicense(doc.id)} className="text-slate-400 hover:text-red-500 text-xs font-bold">
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 자격증 첨부 */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="font-bold text-slate-900 block text-sm">자격증 첨부 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                    placeholder="자격증 종류를 입력하세요 (예: 도배기능사)" 
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => certificationInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-bold rounded-lg transition-colors border bg-slate-800 text-white hover:bg-slate-700 whitespace-nowrap"
                  >
                    첨부하기
                  </button>
                  <input 
                    type="file" 
                    ref={certificationInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleCertificationFileChange} 
                  />
                </div>
                
                {/* 첨부된 자격증 목록 */}
                {certifications.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between items-center bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100">
                        <div className="flex flex-col overflow-hidden mr-2">
                          <span className="text-sm font-bold text-slate-800 truncate">{cert.name}</span>
                          <span className="text-[10px] text-slate-500 truncate">{cert.file}</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveCertification(cert.id)} className="text-slate-400 hover:text-red-500 text-xs font-bold shrink-0">
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-slate-500">관련 자격증이 있다면 전문가 프로필에 노출되어 신뢰도가 오릅니다.</p>
              </div>

              {/* 심사 안내 */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 mt-4">
                <h4 className="font-bold text-sm text-slate-900">💡 전문가 심사 안내</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>제출해주신 서류는 영업일 기준 1~2일 내에 심사됩니다.</li>
                  <li>심사 완료 전에도 견적 요청 내역을 둘러볼 수는 있습니다.</li>
                  <li>허위 정보 기재 시 전문가 자격이 박탈될 수 있습니다.</li>
                </ul>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowExpertRegistration(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                나중에 하기
              </button>
              <button 
                type="button" 
                onClick={handleCompleteRegistration}
                disabled={selectedSpecialties.length === 0 || selectedRegions.length === 0 || isSubmitting}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '처리 중...' : '등록 신청완료'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
