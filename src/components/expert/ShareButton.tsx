'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

export default function ShareButton() {
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: 'OnePick - 전문가 서비스',
          url: window.location.href,
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다.');
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all flex items-center justify-center"
      title="공유하기"
    >
      <Share2 className="w-5 h-5" />
    </button>
  );
}
