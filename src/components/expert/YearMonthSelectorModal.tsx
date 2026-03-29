'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface YearMonthSelectorModalProps {
  currentYear: number;
  currentMonth: number; // 0-indexed month (0 = Jan, 11 = Dec)
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

export default function YearMonthSelectorModal({ currentYear, currentMonth, onSelect, onClose }: YearMonthSelectorModalProps) {
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800">년/월 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Year Selector */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setYear(y => y - 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-2xl font-black text-slate-800">{year}년</div>
            <button 
              onClick={() => setYear(y => y + 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month Selector Grid */}
          <div className="grid grid-cols-3 gap-3">
            {months.map(m => {
              const isActive = year === currentYear && m === currentMonth;
              return (
                <button
                  key={m}
                  onClick={() => {
                    onSelect(year, m);
                    onClose();
                  }}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors border ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {m + 1}월
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
