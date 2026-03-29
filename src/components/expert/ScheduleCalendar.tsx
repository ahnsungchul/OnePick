'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react';
import { addCustomScheduleAction, deleteCustomScheduleAction } from '@/actions/schedule.action';
import ScheduleDetailModal from './ScheduleDetailModal';
import YearMonthSelectorModal from './YearMonthSelectorModal';

interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  type: 'AUTO' | 'CUSTOM' | 'HOLIDAY';
  estimateId?: string;
  isConfirmed?: boolean;
}

interface ScheduleCalendarProps {
  expertId: number;
  initialSchedules: Schedule[];
  isOwner?: boolean;
}

export default function ScheduleCalendar({ expertId, initialSchedules, isOwner = true }: ScheduleCalendarProps) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  // New Modal States
  const [isYMModalOpen, setIsYMModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<{ id: string, estimateId: string } | null>(null);

  // Add Form State
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleOpenAddModal = (dateStr: string) => {
    if (!isOwner) return;
    setSelectedDateStr(dateStr);
    setAddTitle('');
    setAddContent('');
    setIsHoliday(false);
    setIsAddModalOpen(true);
  };

  const handleHolidayChange = (val: boolean) => {
    setIsHoliday(val);
    if (val) {
      setAddTitle('휴일입니다');
    } else {
      if (addTitle === '휴일입니다') setAddTitle('');
    }
  };

  const handleSaveSchedule = async () => {
    if (!addTitle.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    const res = await addCustomScheduleAction({
      expertId,
      date: selectedDateStr,
      title: addTitle,
      content: isHoliday ? '' : addContent,
      isHoliday
    });
    setIsLoading(false);

    if (res.success && res.data) {
      setSchedules([...schedules, {
        id: res.data.id,
        date: res.data.date,
        title: res.data.title,
        content: res.data.content || '',
        type: res.data.isHoliday ? 'HOLIDAY' : 'CUSTOM'
      }]);
      setIsAddModalOpen(false);
    } else {
      alert(res.error);
    }
  };

  const handleDeleteSchedule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('해당 일정을 삭제하시겠습니까?')) return;
    
    const res = await deleteCustomScheduleAction(id);
    if (res.success) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    } else {
      alert(res.error);
    }
  };

  // Generate grid days
  const calendarDays: { day: number, dateStr: string, isCurrentMonth: boolean }[] = [];
  
  // Prev month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr, isCurrentMonth: false });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, dateStr, isCurrentMonth: true });
  }

  // Next month leading days
  const totalSlots = 42;
  let nextDay = 1;
  while (calendarDays.length < totalSlots) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
    calendarDays.push({ day: nextDay, dateStr, isCurrentMonth: false });
    nextDay++;
  }

  const getSchedulesForDay = (dateStr: string) => {
    return schedules.filter(s => s.date === dateStr);
  };

  const getTypeStyle = (sch: Schedule) => {
    switch (sch.type) {
      case 'AUTO': 
        return sch.isConfirmed 
          ? 'bg-blue-100 border-blue-200 text-blue-700 cursor-pointer hover:bg-blue-200' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 border-dashed cursor-pointer hover:bg-emerald-100';
      case 'HOLIDAY': return 'bg-red-100 border-red-200 text-red-700';
      case 'CUSTOM': default: return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const scheduleClickHandler = (sch: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sch.type === 'AUTO' && sch.estimateId) {
      setSelectedSchedule({ id: sch.id, estimateId: sch.estimateId });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
        <h1 className="text-2xl font-bold text-slate-800">통합 갤러리 (일정 관리)</h1>
        
        <button 
          onClick={() => setIsYMModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <CalendarIcon className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-black text-slate-800">
            {year}년 {month + 1}월
          </h2>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">
            오늘
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-white text-center">
          {weekDays.map((day, i) => (
            <div key={day} className={`py-4 text-xs font-black ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-slate-200">
          {calendarDays.map((dayObj, i) => {
            const isToday = dayObj.dateStr === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
            const daySchedules = getSchedulesForDay(dayObj.dateStr);

            return (
              <div 
                key={i} 
                className={`min-h-[100px] p-1.5 sm:p-2 transition-colors ${
                  dayObj.isCurrentMonth ? 'bg-white' : 'bg-slate-50/80'
                } ${isOwner ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                onClick={() => isOwner && handleOpenAddModal(dayObj.dateStr)}
              >
                <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday 
                    ? 'bg-blue-600 text-white' 
                    : !dayObj.isCurrentMonth 
                      ? 'text-slate-300' 
                      : i % 7 === 0 ? 'text-red-500' : i % 7 === 6 ? 'text-blue-500' : 'text-slate-700'
                }`}>
                  {dayObj.day}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px] sm:max-h-[120px] scrollbar-hide">
                  {daySchedules.map(sch => (
                    <div 
                      key={sch.id} 
                      title={sch.content || sch.title}
                      className={`text-[10px] sm:text-xs px-1.5 py-1 rounded truncate border ${getTypeStyle(sch)} flex justify-between items-center group`}
                      onClick={(e) => scheduleClickHandler(sch, e)}
                    >
                      <span className="truncate">{sch.title}</span>
                      {isOwner && sch.type !== 'AUTO' && (
                        <button 
                          onClick={(e) => handleDeleteSchedule(sch.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity ml-1 shrink-0 bg-white/50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">일정 추가</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block mb-2">
                {selectedDateStr}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">일정 구분</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleHolidayChange(false)}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-colors ${!isHoliday ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    개별 일정
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleHolidayChange(true)}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-colors ${isHoliday ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                  >
                    휴가/휴일
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">일정 제목 (카테고리명)</label>
                <input 
                  type="text" 
                  value={addTitle}
                  onChange={e => setAddTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="예: 내부 공사, 개인 휴가 등"
                  maxLength={30}
                />
              </div>

              {!isHoliday && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">상세 내용 (선택)</label>
                  <textarea 
                    value={addContent}
                    onChange={e => setAddContent(e.target.value)}
                    className="w-full h-24 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="일정에 대한 간략한 메모를 남겨주세요."
                  />
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                취소
              </button>
              <button 
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Year/Month Selector Modal */}
      {isYMModalOpen && (
        <YearMonthSelectorModal 
          currentYear={year}
          currentMonth={month}
          onSelect={(y, m) => setCurrentDate(new Date(y, m, 1))}
          onClose={() => setIsYMModalOpen(false)}
        />
      )}

      {/* Schedule Detail Modal */}
      {selectedSchedule && (
        <ScheduleDetailModal 
          estimateId={selectedSchedule.estimateId}
          expertId={expertId}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
}
