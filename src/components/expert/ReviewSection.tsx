'use client';

import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface ReviewSectionProps {
  rating: number;
}

export default function ReviewSection({ rating }: ReviewSectionProps) {
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
        <button className="w-full mt-6 py-3 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          모든 리뷰 보기
        </button>
      )}
    </div>
  );
}
