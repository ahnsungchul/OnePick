import React, { useState, useEffect } from 'react';
import { X, Star, Edit3, CheckCircle2 } from 'lucide-react';
import { submitReviewAction } from '@/actions/review.action';
import { completeEstimateByCustomerAction } from '@/actions/estimate.action';

interface UserReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  expertName: string;
  expertId: number;
  customerId: number;
  estimateId: string;
}

export default function UserReviewModal({ isOpen, onClose, expertName, expertId, customerId, estimateId }: UserReviewModalProps) {
  const [rating, setRating] = useState(5.0);
  const [content, setContent] = useState('');
  const [selectedOption, setSelectedOption] = useState('직접입력');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setRating(5.0);
      setContent('');
      setSelectedOption('직접입력');
      setIsSubmitting(false);
      setPhotos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWriteLater = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // 후기 작성 없이 서비스만 완료 처리
    const result = await completeEstimateByCustomerAction(estimateId, customerId);
    
    if (result.success) {
      alert("서비스 완료 처리가 되었습니다.");
      window.location.reload();
    } else {
      alert((result as any).error || "완료 처리 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const finalContent = selectedOption === '직접입력' ? content : selectedOption;
    
    if (finalContent.trim().length === 0) {
      alert("상세 후기를 작성해주세요.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('estimateId', estimateId);
    formData.append('expertId', expertId.toString());
    formData.append('customerId', customerId.toString());
    formData.append('rating', rating.toString());
    formData.append('content', finalContent);
    photos.forEach(photo => formData.append('photo', photo));

    const result = await submitReviewAction(formData);
    
    if (result.success) {
      //alert("리뷰가 등록되었습니다. 감사합니다!");
      window.location.reload();
    } else {
      //alert((result as any).error || "리뷰 등록 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 shadow-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800">리뷰 작성</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pr-1">
          <div className="mb-6 text-center">
            <p className="text-slate-500 font-medium mb-3 mt-2">
              <span className="text-slate-800 font-bold">{expertName}</span> 전문가님의 작업은 어떠셨나요?
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`w-10 h-10 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-transparent'} transition-colors`} />
                </button>
              ))}
            </div>
            <p className="text-amber-500 font-black text-xl mt-2">{rating.toFixed(1)}점</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">상세 후기 작성</label>
            <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 font-medium leading-relaxed">
                리뷰를 남겨주시면 해당 요청 건이 <strong>&apos;서비스 완료&apos;</strong> 상태로 최종 확정됩니다.
              </p>
            </div>
            <div className="mb-3">
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="직접입력">직접 입력 (상세 후기를 직접 작성합니다)</option>
                <option value="전문가님이 정말 친절해요!">전문가님이 정말 친절해요!</option>
                <option value="작업을 너무 꼼꼼하게 잘해주셨어요.">작업을 너무 꼼꼼하게 잘해주셨어요.</option>
                <option value="시간 약속을 잘 지키고 신속하게 처리해주셨어요.">시간 약속을 잘 지키고 신속하게 처리해주셨어요.</option>
                <option value="결과물이 기대 이상으로 만족스럽습니다.">결과물이 기대 이상으로 만족스럽습니다.</option>
                <option value="비용이 합리적이고 또 이용하고 싶어요.">비용이 합리적이고 또 이용하고 싶어요.</option>
              </select>
            </div>

            <textarea
              className="w-full h-32 p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="전문가님의 서비스에 대해 솔직한 후기를 남겨주세요."
              value={selectedOption === '직접입력' ? content : selectedOption}
              onChange={(e) => setContent(e.target.value)}
              disabled={selectedOption !== '직접입력'}
            />

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">사진 첨부 (선택)</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setPhotos(Array.from(e.target.files));
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photos.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{photos.length}장의 사진이 선택되었습니다.</p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-4 mt-2 border-t border-slate-100 flex gap-2">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button 
            onClick={handleWriteLater}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-slate-500 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            다음에 쓰기
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedOption === '직접입력' && content.trim().length === 0)}
            className="flex-[1.5] py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isSubmitting ? '처리 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
