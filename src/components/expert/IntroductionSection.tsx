'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, MapPin, Briefcase, Star, ShieldCheck, User, Award, Camera, FileText, FileCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { updateFullExpertProfileAction } from '@/actions/expert.action';
import { regionData } from '@/lib/regions';
import { CategoryData } from '@/actions/category.action';

interface IntroductionSectionProps {
  user: any;
  profile: any;
  isOwner: boolean;
  categoriesData?: CategoryData[];
}

export default function IntroductionSection({ user, profile, isOwner, categoriesData = [] }: IntroductionSectionProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [editName, setEditName] = useState('');
  const [editCareerYear, setEditCareerYear] = useState('');
  const [editCareerMonth, setEditCareerMonth] = useState('');
  const [editRegions, setEditRegions] = useState<string[]>([]);
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [editIntroduction, setEditIntroduction] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const categoriesList = categoriesData && categoriesData.length > 0
    ? categoriesData.map(c => c.name)
    : ['도배/장판', '욕실/주방', '전기/조명', '청소/이사', '가전/에어컨', '자동차 수리', '베이비/펫시터', '과외/레슨', '디자인/IT', '기타 서비스'];

  // Document Edit States
  const [editIdCard, setEditIdCard] = useState<{ name: string } | null>(null);
  const [editBusinessLicenses, setEditBusinessLicenses] = useState<{ id: number; name: string }[]>([]);
  const [newCertName, setNewCertName] = useState('');
  const [editCertifications, setEditCertifications] = useState<{ id?: string | number; name: string; isApproved?: boolean }[]>([]);

  // Derived state for verified marks
  const hasIdCard = !!user.idCardUrl;
  const hasBusinessLicense = user.businessLicenseUrls && user.businessLicenseUrls.length > 0;
  const hasCertification = user.certifications && user.certifications.length > 0;
  
  // Custom Verification Mark Component
  const VerificationMark = ({ name, active, icon: Icon }: { name: string, active: boolean, icon: any }) => (
    <div className="flex flex-col items-center gap-1.5 w-[70px]">
      <div className={`w-12 h-12 rounded-md flex items-center justify-center border-2 transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-500 shadow-sm' : 'border-slate-200 bg-slate-100 text-slate-400 border-dashed'}`}>
        {active ? (
          <Icon className="w-5 h-5" />
        ) : (
          <span className="text-[10px] font-bold tracking-tight text-center leading-tight whitespace-pre-wrap break-keep px-1 text-slate-400">심사중</span>
        )}
      </div>
      <span className={`text-[11px] font-bold text-center ${active ? 'text-slate-800' : 'text-slate-500'}`}>
        {name}
      </span>
    </div>
  );

  // Region Selection State
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const businessLicenseInputRef = useRef<HTMLInputElement>(null);
  const certificationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      // Initialize states when modal opens
      setEditName(user.name || '');
      
      const careerStr = user.career || '';
      const matchYear = careerStr.match(/(\d{4})/);
      const matchMonth = careerStr.match(/(\d{1,2})월/);
      
      if (matchYear) {
        setEditCareerYear(matchYear[1]);
      } else {
        setEditCareerYear('');
      }
      
      if (matchMonth) {
        setEditCareerMonth(matchMonth[1]);
      } else {
        setEditCareerMonth('');
      }

      setEditRegions(user.regions || []);
      setEditSpecialties(user.specialties || []);
      setEditIntroduction(profile?.introduction || '');
      setEditImagePreview(user.image || null);
      setEditIdCard(user.idCardUrl ? { name: user.idCardUrl } : null);
      setEditBusinessLicenses(user.businessLicenseUrls?.map((url: string, i: number) => ({ id: i, name: url })) || []);
      setEditCertifications(user.certifications?.map((c: any) => ({ id: c.id, name: c.name, isApproved: c.isApproved })) || []);
      setNewCertName('');
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen, user, profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      const url = URL.createObjectURL(file);
      setEditImagePreview(url);
    }
  };

  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.'); return;
      }
      setEditIdCard({ name: file.name });
    }
    e.target.value = '';
  };

  const handleRemoveIdCard = () => {
    setEditIdCard(null);
  };

  const handleBusinessLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.'); return;
      }
      setEditBusinessLicenses(prev => [...prev, { id: Date.now(), name: file.name }]);
    }
    e.target.value = '';
  };

  const handleRemoveBusinessLicense = (id: number) => {
    setEditBusinessLicenses(prev => prev.filter(item => item.id !== id));
  };

  const handleCertificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일(jpg, png 등)만 등록 가능합니다.'); return;
      }
      if (!newCertName.trim()) { alert('자격증 종류를 먼저 입력해주세요.'); return; }
      setEditCertifications(prev => [...prev, { id: Date.now(), name: newCertName }]);
      setNewCertName('');
    }
    e.target.value = '';
  };

  const handleRemoveCertification = (id: string | number) => {
    setEditCertifications(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRegion = () => {
    if (!selectedSido || !selectedSigungu) return;
    const regionStr = selectedSido === '전국' ? '전국 전체' : (selectedSigungu === '전체' ? `${selectedSido} 전체` : `${selectedSido} ${selectedSigungu}`);
    
    if (!editRegions.includes(regionStr)) {
      setEditRegions(prev => [...prev, regionStr]);
    }
    setSelectedSido('');
    setSelectedSigungu('');
  };

  const handleRemoveRegion = (region: string) => {
    setEditRegions(prev => prev.filter(r => r !== region));
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    const result = await updateFullExpertProfileAction({
      userId: user.id,
      image: editImagePreview,
      name: editName,
      regions: editRegions,
      specialties: editSpecialties,
      career: (editCareerYear && editCareerMonth) ? `${editCareerYear}년 ${editCareerMonth}월 시작` : (editCareerYear ? `${editCareerYear}년 시작` : '경력 미입력'),
      introduction: editIntroduction,
      idCardUrl: editIdCard ? editIdCard.name : null,
      businessLicenseUrls: editBusinessLicenses.map(b => b.name),
      certifications: editCertifications.map(c => ({
        id: typeof c.id === 'string' ? c.id : undefined,
        name: c.name,
      }))
    });
    
    setIsLoading(false);
    if (result.success) {
      setIsModalOpen(false);
      // 세션을 즉시 업데이트하여 공통 헤더 등 클라이언트 컴포넌트에 반영
      await update({ image: editImagePreview });
      router.refresh(); // Force a server re-render to fetch the newly uploaded documents
    } else {
      alert(result.error);
    }
  };

  const getCareerDisplay = () => {
    const careerStr = user.career;
    if (!careerStr || careerStr === '경력 미입력' || careerStr === '신입') return careerStr || '경력 미입력';
    
    const yearMatch = careerStr.match(/(\d{4})년/);
    const monthMatch = careerStr.match(/(\d{1,2})월/);
    
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const month = monthMatch ? parseInt(monthMatch[1], 10) : 1;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const monthsDiff = (currentYear - year) * 12 + (currentMonth - month);
      const yearOfExp = monthsDiff >= 0 ? Math.floor(monthsDiff / 12) + 1 : 1;
      
      return `${careerStr} (${yearOfExp}년차)`;
    }
    
    // Fallback for just "YYYY년 시작"
    const fallbackMatch = careerStr.match(/(\d{4})년 시작/);
    if (fallbackMatch) {
      const year = parseInt(fallbackMatch[1], 10);
      const yearOfExp = new Date().getFullYear() - year + 1;
      return `${careerStr} (${yearOfExp > 0 ? yearOfExp : 1}년차)`;
    }
    
    return careerStr;
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Left: Profile Image & Rating */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-inner mb-4 bg-slate-100 flex items-center justify-center relative">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-12 h-12 text-slate-300" />
            )}
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50 mb-2">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span className="font-bold text-xs text-amber-700">{Number(profile.rating || 0).toFixed(1)}</span>
            <span className="text-amber-600/50 text-[10px]">({profile.reviewCount || 0})</span>
          </div>
        </div>

        {/* Right: Info & Introduction */}
        <div className="flex-1 flex flex-col">
          {/* Header row: Name, Grade, and Edit buttons */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{user.name} 전문가</h2>
                {user.isApproved && (
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                )}
                {user.grade === 'PRO' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black tracking-wide">PRO</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {user.regions && user.regions.length > 0 ? user.regions.join(', ') : '전국, 지역협의'}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {getCareerDisplay()}</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-slate-400" /> {user.grade === 'PRO' ? '프로 전문가' : '일반 헬퍼'}</span>
              </div>
            </div>
            
            {/* Edit Button */}
            {isOwner && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              >
                <Pencil className="w-4 h-4" />
                프로필 수정
              </button>
            )}
          </div>

          {/* Specialties Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {user.specialties && user.specialties.length > 0 ? (
              user.specialties.map((specialty: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                  {specialty}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium border border-slate-200">
                제공 서비스 미지정
              </span>
            )}
          </div>

          {/* Verification Marks (Only visible if there is any uploaded document) */}
          {(hasIdCard || hasBusinessLicense || hasCertification) && (
            <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-700 text-xs mb-3 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> 신원 및 검증 서류</h4>
              <div className="flex items-start gap-4 flex-wrap">
                {hasIdCard && (
                  <VerificationMark name="본인인증" active={user.idCardApproved} icon={User} />
                )}
                {hasBusinessLicense && (
                  <VerificationMark name="사업자 등록증" active={user.businessLicenseApproved} icon={FileText} />
                )}
                {hasCertification && user.certifications && (
                  user.certifications.map((cert: any, index: number) => (
                    <VerificationMark key={`cert-${index}`} name={cert.name} active={cert.isApproved} icon={Award} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Introduction Text Area */}
          <div className="mt-2 text-sm">
            <h4 className="font-bold text-slate-700 mb-2">상세 소개</h4>
            <div className="bg-slate-50 p-5 rounded-2xl min-h-[100px] border border-slate-100">
              {profile.introduction ? (
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {profile.introduction}
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  아직 작성된 소개글이 없네요. 고객에게 신뢰를 줄 수 있는 멋진 소개글을 작성해보세요!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900">프로필 수정</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Image & Nickname */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 relative group border-4 border-white shadow-sm">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <button 
                      onClick={() => imageInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <input type="file" ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  <button onClick={() => imageInputRef.current?.click()} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    사진 변경
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className='flex flex-row gap-2'>
                    <label className="inline-flex w-[60px] whitespace-nowrap items-center text-sm font-bold text-slate-700">닉네임</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="이름이나 활동명을 입력해주세요"
                    />
                  </div>
                  <div className='flex flex-row gap-2'>
                    <label className="inline-flex w-[60px] whitespace-nowrap items-center text-sm font-bold text-slate-700">시작 경력</label>
                    <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <select
                          value={editCareerYear}
                          onChange={(e) => setEditCareerYear(e.target.value)}
                          className="w-24 text-sm border border-slate-200 rounded-xl px-2 py-2.5 focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="" disabled>년도</option>
                          {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year.toString()}>{year}년</option>
                          ))}
                        </select>
                        <select
                          value={editCareerMonth}
                          onChange={(e) => setEditCareerMonth(e.target.value)}
                          className="w-20 text-sm border border-slate-200 rounded-xl px-2 py-2.5 focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="" disabled>월</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month.toString()}>{month}월</option>
                          ))}
                        </select>
                        <span className="text-sm font-base text-slate-700 whitespace-nowrap">(경력 시작년월)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">제공 서비스 설정 <span className="text-xs font-normal text-slate-400 ml-1">(다중 선택 가능)</span></label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map(cat => (
                    <button 
                      key={cat}
                      type="button"
                      onClick={() => {
                        setEditSpecialties(prev => 
                          prev.includes(cat) ? prev.filter(item => item !== cat) : [...prev, cat]
                        );
                      }}
                      className={`px-3 py-2 text-sm font-bold rounded-xl border transition-colors ${
                        editSpecialties.includes(cat)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Regions */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">서비스 지역 설정 <span className="text-xs font-normal text-slate-400 ml-1">(다중 선택 가능)</span></label>
                <div className="flex gap-2">
                  <select 
                    value={selectedSido}
                    onChange={(e) => {
                      setSelectedSido(e.target.value);
                      setSelectedSigungu('');
                    }}
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="" disabled>시/도</option>
                    {Object.keys(regionData).map(sido => (
                      <option key={sido} value={sido}>{sido}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedSigungu}
                    onChange={(e) => setSelectedSigungu(e.target.value)}
                    disabled={!selectedSido}
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 bg-white disabled:bg-slate-50"
                  >
                    <option value="" disabled>시/군/구</option>
                    {selectedSido && regionData[selectedSido].map(sigungu => (
                      <option key={sigungu} value={sigungu}>{sigungu}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={handleAddRegion}
                    disabled={!selectedSido || !selectedSigungu}
                    className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl disabled:bg-slate-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
                {/* Region Tags */}
                {editRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {editRegions.map((region, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold shrink-0">
                        <span>{region}</span>
                        <button 
                          onClick={() => handleRemoveRegion(region)}
                          className="text-blue-400 hover:text-red-500 focus:outline-none flex items-center justify-center p-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ID Card Upload */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <label className="font-bold text-slate-900 block text-sm mb-1">신분증 관리</label>
                    <p className="text-xs text-slate-500">신분증 사본을 등록해주세요. <span className="text-orange-500 font-bold">(변경 시 권한 재심사 진행)</span></p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => idCardInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 whitespace-nowrap"
                  >
                    파일 등록
                  </button>
                  <input 
                    type="file" 
                    ref={idCardInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleIdCardFileChange} 
                  />
                </div>
                
                {editIdCard && (
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-700 truncate mr-2 font-medium">{editIdCard.name}</span>
                      <button type="button" onClick={handleRemoveIdCard} className="text-slate-400 hover:text-red-500 text-xs font-bold">
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Business License Upload */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <label className="font-bold text-slate-900 block text-sm mb-1">사업자 등록증 관리</label>
                    <p className="text-xs text-slate-500">새롭게 등록하거나 기존 내역을 삭제할 수 있습니다. <span className="text-orange-500 font-bold">(변경 시 재심사 진행)</span></p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => businessLicenseInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 whitespace-nowrap"
                  >
                    파일 등록
                  </button>
                  <input 
                    type="file" 
                    ref={businessLicenseInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleBusinessLicenseFileChange} 
                  />
                </div>
                
                {editBusinessLicenses.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {editBusinessLicenses.map((doc) => (
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

              {/* Certifications Upload */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="font-bold text-slate-900 block text-sm">전문 자격증 관리 <span className="text-xs text-orange-500 ml-1 font-normal">(변경 시 재심사 진행)</span></label>
                <div className="flex gap-2 mb-2">
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
                    첨부
                  </button>
                  <input 
                    type="file" 
                    ref={certificationInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleCertificationFileChange} 
                  />
                </div>
                
                {editCertifications.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {editCertifications.map((cert, index) => (
                      <div key={cert.id || index} className="flex justify-between items-center bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100">
                        <span className="text-sm font-bold text-slate-800 truncate">{cert.name}</span>
                        <button type="button" onClick={() => handleRemoveCertification(cert.id!)} className="text-slate-400 hover:text-red-500 text-xs font-bold shrink-0">
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Introduction */}
              <div className="space-y-2 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">상세 소개글</label>
                <textarea
                  value={editIntroduction}
                  onChange={(e) => setEditIntroduction(e.target.value)}
                  className="w-full h-32 p-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                  placeholder="고객에게 신뢰를 줄 수 있는 강점과 인사말을 자세히 적어주세요!"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                disabled={isLoading}
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : (
                  <>
                    <Check className="w-4 h-4" />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
