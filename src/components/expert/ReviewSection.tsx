'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X } from 'lucide-react';

interface ReviewSectionProps {
  rating: number;
}

export default function ReviewSection({ rating }: ReviewSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // 예시 리뷰 데이터
  const mockReviews = [
    { id: 1, user: '이*순', content: '꼼꼼하게 잘 해주셔서 만족합니다!', rating: 5, date: '2024.03.10' },
    { id: 2, user: '김*호', content: '시간 약속 잘 지키시고 친절하세요.', rating: 4, date: '2024.03.05' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-amber-400 rounded-full" />
          고객 리뷰
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
          <Star className="w-4 h-4 text-amber-500 fill-current" />
          <span className="text-lg font-bold text-amber-600">{rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {mockReviews.length > 0 ? (
          mockReviews.map((review) => (
            <div key={review.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{review.user}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{review.date}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {review.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">아직 등록된 리뷰가 없습니다.</p>
          </div>
        )}
      </div>
      
      {mockReviews.length > 0 && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-6 py-3 text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors"
        >
          모든 리뷰 보기
        </button>
      )}

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">고객 리뷰 <span className="text-amber-500 text-lg">{mockReviews.length}</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {mockReviews.map((review) => (
                <div key={`modal-${review.id}`} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{review.user}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={`modal-star-${i}`} className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{review.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
