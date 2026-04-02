'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface CompletionPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  urls: string[];
}

export default function CompletionPhotosModal({ isOpen, onClose, urls }: CompletionPhotosModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      {/* 닫기 버튼 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-[70]">
        <button 
          onClick={onClose} 
          className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
        >
          <X className="w-8 h-8" />
        </button>
      </div>
      
      {urls.length === 0 ? (
        <div className="bg-white/10 p-8 rounded-3xl flex flex-col items-center">
          <ImageIcon className="w-12 h-12 text-white/50 mb-4" />
          <p className="text-white font-bold">등록된 작업 완료 사진이 없습니다.</p>
        </div>
      ) : (
        <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center px-12" onClick={e => e.stopPropagation()}>
          <img 
            src={urls[currentIndex]} 
            alt={`Completion Photo ${currentIndex}`} 
            className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-lg"
          />
          
          {currentIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev - 1); }}
              className="absolute left-2 sm:left-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {currentIndex < urls.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev + 1); }}
              className="absolute right-2 sm:right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
      
      {urls.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white font-bold text-sm tracking-widest pointer-events-none shadow-xl">
          {currentIndex + 1} / {urls.length}
        </div>
      )}
    </div>
  );
}
