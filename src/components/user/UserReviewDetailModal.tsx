import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Star, Image as ImageIcon } from 'lucide-react';
import { formatCategory, cn } from '@/lib/utils';

export default function UserReviewDetailModal({ isOpen, onClose, review }: { isOpen: boolean, onClose: () => void, review: any }) {
  const [mounted, setMounted] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentImgIndex(0);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || !review) return null;

  const expert = review.expert;
  const estimate = review.estimate;
  
  // 후기 사진이 없으면 전문가 완료 사진 사용
  const photos = (review.photoUrls && review.photoUrls.length > 0) 
                  ? review.photoUrls 
                  : (estimate?.completionPhotoUrls || []);

  const slideLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
  };

  const slideRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 닫기 액션 공간 */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={onClose} 
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단: 이미지 슬라이더 (1:1 비율) */}
        <div className="w-full aspect-square bg-slate-100 relative group overflow-hidden shrink-0">
          {photos.length > 0 ? (
            <>
              <img 
                src={photos[currentImgIndex]} 
                alt={`후기 사진 ${currentImgIndex + 1}`} 
                className="w-full h-full object-cover transition-opacity duration-300" 
              />
              {photos.length > 1 && (
                <>
                  <button 
                    onClick={slideLeft}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={slideRight}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* 페이지 인디케이터 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/30 rounded-full backdrop-blur-md">
                    {photos.map((_: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          idx === currentImgIndex ? "bg-white w-3" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold">등록된 사진이 없습니다</p>
            </div>
          )}
        </div>

        {/* 하단: 리뷰 컨텐츠 */}
        <div className="p-6 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 mb-2 inline-block shadow-sm">
                내가 쓴 후기
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {formatCategory(estimate?.category?.name || '')} 서비스 후기
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                <span className="font-bold text-slate-700">{expert?.name || '알 수 없는'}</span> 전문가
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-black text-lg text-amber-700">{review.rating}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative">
            <div className="absolute -top-3 -left-2 text-4xl text-slate-200">"</div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
              {review.content}
            </p>
            <div className="absolute -bottom-6 -right-2 text-4xl text-slate-200">"</div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
