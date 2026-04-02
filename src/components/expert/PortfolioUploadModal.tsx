'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { uploadExpertPortfolioAction } from '@/actions/expert.action';

interface PortfolioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingLimit: number;
}

export default function PortfolioUploadModal({ isOpen, onClose, remainingLimit }: PortfolioUploadModalProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setPhotos([]);
      setError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, remainingLimit)); 
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      setError("최소 1장 이상의 사진을 선택해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      photos.forEach(photo => {
        formData.append("photo", photo);
      });

      const res = await uploadExpertPortfolioAction(formData);
      
      if (res.success) {
        onClose();
        // The parent component should refresh data if necessary, 
        // but Next.js Server Action will revalidatePath('/expert/dashboard')
      } else {
        setError(res.error || "처리 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-800">포트폴리오 사진 등록</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6">
          <p className="text-slate-600 font-medium mb-6 leading-relaxed">
            고객에게 매력을 어필할 수 있는 작업 사진을 <span className="font-bold text-blue-600">직접 등록</span>해 보세요. 
            최대 {remainingLimit}장까지 추가 가능합니다.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              사진 선택 <span className="font-normal text-slate-400">({photos.length}/{remainingLimit})</span>
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              {photos.length < remainingLimit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1" />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">사진 추가</span>
                </button>
              )}
              
              {photos.map((photo, index) => (
                <div key={index} className="aspect-square relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img 
                    src={URL.createObjectURL(photo)} 
                    alt="Upload preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                      className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transform scale-0 group-hover:scale-100 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden" 
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl mb-6 border border-red-100 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 font-medium">
            작업 완료 보고를 통해 추가된 사진은 카테고리 탭과 함께 별도로 자동 등록됩니다.
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '등록하기'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
