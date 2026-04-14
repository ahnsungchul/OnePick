'use client';

import React, { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Calendar as CalendarIcon, Save } from 'lucide-react';
import { updateCustomScheduleAction } from '@/actions/schedule.action';

interface CustomScheduleDetailModalProps {
  schedule: {
    id: string;
    title: string;
    content: string;
    date: string;
    type: 'CUSTOM' | 'HOLIDAY' | 'AUTO';
    amount?: number;
  };
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedSch: any) => void;
}

export default function CustomScheduleDetailModal({ schedule, onClose, onDelete, onUpdate }: CustomScheduleDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(schedule.title);
  const [content, setContent] = useState(schedule.content || '');
  const [amount, setAmount] = useState(schedule.amount ? schedule.amount.toLocaleString() : '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    
    const res = await updateCustomScheduleAction({
      id: schedule.id,
      title,
      content,
      amount: parsedAmount
    });
    
    setIsLoading(false);

    if (res.success && res.data) {
      onUpdate({
        ...schedule,
        title: res.data.title,
        content: res.data.content,
        amount: res.data.amount
      });
      setIsEditing(false);
    } else {
      alert(res.error || '수정에 실패했습니다.');
    }
  };

  const isHoliday = schedule.type === 'HOLIDAY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            {isHoliday ? '휴일/휴무 상세' : '개인 일정 상세'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content Body */}
        <div className="p-6 overflow-y-auto min-h-0 space-y-6">
          <div className="bg-indigo-50/50 text-indigo-700 px-4 py-2 rounded-xl font-bold inline-block text-sm">
            {schedule.date}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-1">일정 제목</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-base font-bold border border-blue-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 bg-white"
                  placeholder="제목을 입력하세요"
                />
              ) : (
                <div className="text-lg font-black text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{schedule.title}</div>
              )}
            </div>

            {!isHoliday && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">예상 금액</label>
                  {isEditing ? (
                    <div className="relative">
                      <input 
                        type="text" 
                        value={amount}
                        onChange={e => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setAmount(numericValue ? parseInt(numericValue, 10).toLocaleString() : '');
                        }}
                        className="w-full text-base font-bold border border-blue-300 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:border-blue-500 bg-white"
                        placeholder="금액 (선택)"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">원</span>
                    </div>
                  ) : (
                    <div className="text-base font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                      {schedule.amount ? `${schedule.amount.toLocaleString()}원` : '미입력'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">상세 내용</label>
                  {isEditing ? (
                    <textarea 
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full h-32 text-sm border border-blue-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none bg-white"
                      placeholder="내용을 입력하세요"
                    />
                  ) : (
                    <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[5rem]">
                      {schedule.content || <span className="text-slate-400 italic">내용이 없습니다.</span>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between shrink-0 bg-white gap-2">
          {!isEditing ? (
            <button 
              onClick={() => onDelete(schedule.id)}
              className="px-6 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors border border-red-100 flex items-center justify-center gap-1.5 w-full sm:w-auto order-2 sm:order-1"
            >
              <Trash2 className="w-4 h-4" />
              삭제하기
            </button>
          ) : (
            <button 
              onClick={() => {
                setIsEditing(false);
                setTitle(schedule.title);
                setContent(schedule.content);
                setAmount(schedule.amount ? schedule.amount.toLocaleString() : '');
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200 w-full sm:w-auto order-2 sm:order-1"
              disabled={isLoading}
            >
              편집 취소
            </button>
          )}

          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto order-1 sm:order-2"
            >
              <Edit2 className="w-4 h-4" />
              수정하기
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto order-1 sm:order-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
