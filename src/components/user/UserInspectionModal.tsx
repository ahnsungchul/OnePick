import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface UserInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  photoUrls: string[];
}

export default function UserInspectionModal({ isOpen, onClose, onComplete, photoUrls }: UserInspectionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(0);
    } else {
      document.body.style.overflow = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? photoUrls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === photoUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {photoUrls.length > 0 ? (
            <>
              <img 
                src={photoUrls[currentIndex]} 
                alt="Completion Photo" 
                className="max-w-full max-h-full object-contain"
              />
              
              {photoUrls.length > 1 && (
                <>
                  <button onClick={handlePrev} className="absolute left-4 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={handleNext} className="absolute right-4 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 text-white text-xs rounded-full font-bold">
                    {currentIndex + 1} / {photoUrls.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-white/50 font-medium flex flex-col items-center">
              <span className="mb-2">전문가가 첨부한 작업 완료 사진이 없습니다.</span>
              <span className="text-xs">바로 검수를 완료할 수 있습니다.</span>
            </div>
          )}
        </div>

        <div className="bg-white p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] flex justify-center">
          <button 
            onClick={onComplete}
            className="px-10 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-md shadow-fuchsia-600/20"
          >
            <CheckCircle2 className="w-5 h-5" />
            검수 완료
          </button>
        </div>
      </div>
    </div>
  );
}
