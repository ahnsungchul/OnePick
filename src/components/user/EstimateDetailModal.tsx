'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import EstimateDetailView from './EstimateDetailView';

interface EstimateDetailModalProps {
  estimate: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EstimateDetailModal({ estimate, isOpen, onClose }: EstimateDetailModalProps) {
  // 배경 스크롤 방지
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 !m-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-50 shrink-0">
          <h2 className="text-lg font-black text-slate-800">견적 요청 상세</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <EstimateDetailView estimate={estimate} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50 shrink-0 flex justify-end gap-2">
          {/* 수정 버튼 */}
          <button 
            onClick={() => alert('수정 페이지로 이동합니다.')}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            수정
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
