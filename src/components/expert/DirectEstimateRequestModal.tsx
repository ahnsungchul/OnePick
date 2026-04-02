'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { createDirectEstimateAction } from '@/actions/expert.action';
import DaumPostcode from 'react-daum-postcode';

import { CategoryData } from '@/actions/category.action';

interface DirectEstimateRequestModalProps {
  expertId: number;
  onClose: () => void;
  initialServiceDate?: string;
  unavailableDates?: string[];
  specialties?: string[];
  categoriesData?: CategoryData[];
}

export default function DirectEstimateRequestModal({ expertId, onClose, initialServiceDate, unavailableDates = [], specialties = [], categoriesData = [] }: DirectEstimateRequestModalProps) {
  const CATEGORIES = React.useMemo(() => {
    const result: Record<string, string[]> = {};
    if (categoriesData && categoriesData.length > 0) {
      categoriesData.forEach(cat => {
        result[cat.name] = cat.subcategories.map(sub => sub.name);
      });
      return result;
    }
    return { '기타 서비스': ['기타'] }; // fallback
  }, [categoriesData]);

  const availableCategories = React.useMemo(() => {
    if (!specialties || specialties.length === 0) return CATEGORIES;
    const result: Record<string, string[]> = {};
    for (const [cat, subCats] of Object.entries(CATEGORIES)) {
      const isMainMatch = specialties.includes(cat);
      const allowedSubCats = subCats.filter(sub => specialties.includes(sub));
      
      if (isMainMatch) {
        result[cat] = subCats;
      } else if (allowedSubCats.length > 0) {
        result[cat] = allowedSubCats;
      }
    }
    return Object.keys(result).length > 0 ? result : CATEGORIES;
  }, [specialties, CATEGORIES]);

  const initialCatKeys = Object.keys(availableCategories);
  const initialCat = initialCatKeys.length > 0 ? initialCatKeys[0] : Object.keys(CATEGORIES)[0];
  const initialSubCat = availableCategories[initialCat] ? availableCategories[initialCat][0] : '';

  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(initialCat);
  const [subcategory, setSubcategory] = useState(initialSubCat);
  const [location, setLocation] = useState('');
  const [locationDetailText, setLocationDetailText] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [serviceDate, setServiceDate] = useState(initialServiceDate || '');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim() || !locationDetailText.trim()) {
      alert('서비스 위치 및 상세주소를 입력해주세요.');
      return;
    }

    if (!serviceDate) {
      alert('서비스 희망일을 선택해주세요.');
      return;
    }

    if (!details.trim()) {
      alert('요청 상세 내용을 입력해주세요.');
      return;
    }

    // 날짜 포맷 차이 방어를 위해 Date 객체로 변환하여 연/월/일 단순 비교
    const isDateUnavailable = serviceDate && unavailableDates.some((dateStr) => {
      const d1 = new Date(dateStr);
      const d2 = new Date(serviceDate);
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    });

    if (isDateUnavailable) {
      setShowUnavailableModal(true);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('expertId', expertId.toString());
    formData.append('category', `${category} - ${subcategory}`);
    formData.append('location', `${location} ${locationDetailText}`.trim());
    formData.append('serviceDate', serviceDate);
    formData.append('details', details);
    photos.forEach(photo => formData.append('photo', photo));

    const res = await createDirectEstimateAction(formData);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      alert(res.error || '견적 요청 전송에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800">1:1 견적 요청 작성</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto min-h-0 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  setSubcategory(availableCategories[newCat]?.[0] || '');
                }}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-white"
              >
                {Object.keys(availableCategories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">상세 서비스</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-white"
              >
                {availableCategories[category]?.map((subCat) => (
                  <option key={subCat} value={subCat}>{subCat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">서비스 위치</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울 강남구 역삼동"
                  readOnly
                  onClick={() => setShowAddressModal(true)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 cursor-pointer bg-slate-50"
                  required
                />
              </div>
              <button 
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="px-4 py-3 bg-slate-800 text-white font-semibold rounded-xl shrink-0 flex items-center gap-1 hover:bg-slate-700 transition"
              >
                <Search className="w-4 h-4" /> 검색
              </button>
            </div>
            <input 
              type="text" 
              value={locationDetailText}
              onChange={(e) => setLocationDetailText(e.target.value)}
              placeholder="상세주소를 입력해주세요 (예: 101동 202호)" 
              className="w-full mt-2 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">서비스 희망일</label>
            <input 
              type="date" 
              value={serviceDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">요청 상세 내용</label>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="전문가가 정확한 견적을 낼 수 있도록 자세히 설명해주세요. (현장 상황, 등)"
              className="w-full h-32 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">현장 사진 첨부 (선택, 최대 5장)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition duration-200 relative mb-4">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const selected = Array.from(e.target.files);
                    if (selected.length + photos.length > 5) {
                      setMessage('사진은 최대 5장까지만 첨부할 수 있습니다.');
                      return;
                    }
                    setMessage('');
                    setPhotos(prev => [...prev, ...selected].slice(0, 5));
                  }
                }}
                className="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-xs inline-block">
                사진 파일 선택
              </span>
              <p className="text-xs text-slate-500 mt-2">전문가가 견적을 산출하는 데 큰 도움이 됩니다.</p>
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((file, idx) => {
                  const imageUrl = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={imageUrl} 
                        alt={`첨부사진 ${idx + 1}`} 
                        className="w-16 h-16 object-cover"
                        onLoad={() => URL.revokeObjectURL(imageUrl)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          type="button" 
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="bg-white/90 text-red-500 hover:text-red-600 hover:bg-white p-1 rounded-full shadow-sm transition-all transform hover:scale-105"
                          title="삭제하기"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {message && (
              <p className="mt-2 text-xs font-medium text-red-600">{message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              견적 요청 보내기
            </button>
          </div>
        </form>
      </div>

      {showAddressModal && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddressModal(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">주소 검색</h3>
              <button type="button" onClick={(e) => { e.stopPropagation(); setShowAddressModal(false); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[480px]">
              <DaumPostcode 
                style={{ height: '480px' }}
                onComplete={(data) => {
                  let fullAddress = data.address;
                  let extraAddress = '';

                  if (data.addressType === 'R') {
                    if (data.bname !== '') extraAddress += data.bname;
                    if (data.buildingName !== '') extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
                    fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
                  }

                  setLocation(fullAddress);
                  setShowAddressModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showUnavailableModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setShowUnavailableModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">예약 불가 안내</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              선택하신 날짜(<span className="font-bold text-slate-800">{serviceDate}</span>)에는<br />전문가의 일정이 꽉 차 있습니다.<br />다른 날짜를 선택해주세요.
            </p>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowUnavailableModal(false); }}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors active:scale-95"
            >
              날짜 다시 선택하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
