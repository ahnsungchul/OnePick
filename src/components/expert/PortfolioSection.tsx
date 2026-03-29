'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PortfolioSectionProps {
  portfolioUrl?: string | null;
  isOwner: boolean;
}

export default function PortfolioSection({ portfolioUrl, isOwner }: PortfolioSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isModalOpen || selectedImageIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, selectedImageIndex]);

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
          <div 
            key={i} 
            className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer"
            onClick={() => setSelectedImageIndex(i)}
          >
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

      {mockImages.length > 0 && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-6 py-3 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          포트폴리오 더보기
        </button>
      )}

      {/* Portfolio Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">포트폴리오 전체보기</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mockImages.map((src, i) => (
                  <div 
                    key={`modal-${i}`} 
                    className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img src={src} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Large Image Viewer Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImageIndex(null)}>
          
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-[70]">
            <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }} className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all">
              <X className="w-8 h-8" />
            </button>
          </div>
          
          <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center px-12" onClick={e => e.stopPropagation()}>
            <img 
              src={mockImages[selectedImageIndex]} 
              alt={`Portfolio Full ${selectedImageIndex}`} 
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
            />
            
            {selectedImageIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! - 1); }}
                className="absolute left-2 sm:left-6 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {selectedImageIndex < mockImages.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! + 1); }}
                className="absolute right-2 sm:right-6 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 bg-black/50 rounded-full text-white font-bold text-sm tracking-widest pointer-events-none">
            {selectedImageIndex + 1} / {mockImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
