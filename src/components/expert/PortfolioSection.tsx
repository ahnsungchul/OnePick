'use client';

import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';

interface PortfolioSectionProps {
  portfolioUrl?: string | null;
  isOwner: boolean;
}

export default function PortfolioSection({ portfolioUrl, isOwner }: PortfolioSectionProps) {
  // 예시 데이터
  const mockImages = [
    "https://picsum.photos/seed/p1/400/400",
    "https://picsum.photos/seed/p2/400/400",
    "https://picsum.photos/seed/p3/400/400",
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full" />
          포트폴리오
        </h3>
        {isOwner && (
          <button className="flex items-center gap-2 text-sm font-bold text-emerald-600 px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
            <Plus className="w-4 h-4" />
            추가하기
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockImages.map((src, i) => (
          <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
            <img 
              src={src} 
              alt={`Portfolio ${i}`} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-bold">확대보기</span>
            </div>
          </div>
        ))}
        {isOwner && (
          <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs font-bold">사진 업로드</span>
          </button>
        )}
      </div>
    </div>
  );
}
