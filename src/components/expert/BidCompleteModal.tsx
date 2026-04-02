'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { completeExpertBidAction } from '@/actions/bid.action';

interface BidCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
  expertId: number;
}

export default function BidCompleteModal({ isOpen, onClose, estimateId, expertId }: BidCompleteModalProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles].slice(0, 5)); // 최대 5장 제한
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      setError("최소 1장 이상의 사진을 등록해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // S3 presigned URL 기능을 사용하거나, FormData를 통해 직접 서버에 전송.
      // 여기서는 Next.js 서버액션을 통해 처리한다고 가정. (FormData)
      const formData = new FormData();
      photos.forEach(photo => {
        formData.append("photos", photo);
      });
      formData.append("estimateId", estimateId);
      formData.append("expertId", expertId.toString());

      // /api/upload 라우트가 있다면 거기를 통해 업로드하고 URL을 받아서 저장.
      // 하지만 현재 onedeal 환경에서 s3Client는 백엔드에 있음. API 헬퍼나 S3 전용 라우트를 써야함.
      // 간단히 사진 업로드 후 AWS URL 반환하는 과정은 예시로 처리하거나 submitEstimateAction을 참고.
      // TODO: 만약 별개의 /api/upload 가 없다면 actions를 통해서 Buffer를 전송해야 하는데,
      // React Server Action에는 File 객체 전송이 가능함!
      
      // 하지만 앞서 추가한 completeExpertBidAction은 string[] (photoUrls) 을 받음.
      // 업로드 과정을 위한 추가 Action 호출 필요. 편의상 여기에 바로 S3 API 호출이 있으면 좋겠지만,
      // formData를 받는 Action으로 교체하거나, /api/upload를 태운다고 가정.

      // -> 서버 액션으로 File을 보낼 때는 FormData가 최적입니다. 
      // 현재는 클라이언트에서 서버액션으로 보낼 때, 별도의 photoUploadAction이 필요할 수 있습니다. 
      // 임시로 더미 URL을 넣거나, 업로드 로직이 있다면 그것을 사용.
      
      const uploadedUrls = photos.map(f => `https://dummy-image-url.com/${f.name}`);
      
      const res = await completeExpertBidAction(estimateId, expertId, uploadedUrls);
      
      if (res.success) {
        onClose();
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
      <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-800">작업 완료 보고</h3>
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
            고객님께 완료 보고를 위해 <span className="font-bold text-emerald-600">완료 사진</span>을 첨부해 주세요.
            검수가 완료되면 최종 작업이 종료됩니다.
          </p>

          {/* 사진 업로드 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              완료 사진 첨부 <span className="text-emerald-500">*</span> <span className="font-normal text-slate-400">({photos.length}/5)</span>
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition-colors group"
                >
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 mb-1" />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-600">사진 추가</span>
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
                      onClick={() => removePhoto(index)}
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

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 font-medium">
            작업완료 보고 시 상태가 <strong>'고객 검수'</strong> 로 변경되며, 고객의 최종 확인이 필요합니다.
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
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '완료 보고하기'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
