'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, MapPin, SearchX } from 'lucide-react';
import { getExpertSchedulesAction } from '@/actions/schedule.action';
import { formatCategory } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DirectEstimateRequestModal from './DirectEstimateRequestModal';

import { CategoryData } from '@/actions/category.action';

export default function CalendarSection({ userId, specialties = [], categoriesData = [] }: { userId: number; specialties?: string[]; categoriesData?: CategoryData[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = session?.user?.id ? Number(session.user.id) === userId : false;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchSchedules = async () => {
    setIsLoading(true);
    const res = await getExpertSchedulesAction(userId);
    if (res.success && res.data) {
      setSchedules(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId > 0) {
      fetchSchedules();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const currentMonth = currentDate.getMonth(); // 0-based
  const currentYear = currentDate.getFullYear();

  // Parse schedules into an array of { dateString, bid }
  // Parse schedules into unified events
  const parsedEvents = useMemo(() => {
    const events: { date: string; id: string; title: string; content?: string; type: string; estimateId?: string }[] = [];
    schedules.forEach((sch) => {
      if (sch.date) {
        events.push({ 
          date: sch.date, 
          id: sch.id,
          title: sch.title,
          content: sch.content,
          type: sch.type,
          estimateId: sch.estimateId
        });
      }
    });
    return events;
  }, [schedules]);

  // filtered events logic
  const displayedEvents = useMemo(() => {
    if (selectedDate) {
      return parsedEvents.filter(e => e.date === selectedDate);
    } else {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const future = new Date(today);
      future.setDate(future.getDate() + 30);
      const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
      
      return parsedEvents
        .filter(e => e.date >= todayStr && e.date <= futureStr)
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [parsedEvents, selectedDate]);

  // Calendar rendering logic
  const realToday = new Date();
  const isPrevDisabled = currentDate.getFullYear() < realToday.getFullYear() || 
                        (currentDate.getFullYear() === realToday.getFullYear() && currentMonth <= realToday.getMonth());

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null); // Clear selection on month change
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null); // toggle off
    } else {
      setSelectedDate(dateStr);
    }
  };

  const daysInMonthFn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday
  const daysInCurrentMonth = daysInMonthFn(currentYear, currentMonth);

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  const renderCalendarCell = (dateStr: string, dayNum: number, isCurrentMonth: boolean) => {
    const dayEvents = parsedEvents.filter(e => e.date === dateStr);
    const hasEvent = dayEvents.length > 0;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const isPast = dateStr < todayStr;

    return (
      <div 
        key={dateStr}
        onClick={() => {
          if (!isPast) {
            handleDateClick(dateStr);
            if (!isCurrentMonth) {
              const clickedDate = new Date(dateStr);
              setCurrentDate(new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1));
            }
          }
        }}
        className={`aspect-square p-1 rounded-xl border transition-all ${isPast ? 'opacity-40 cursor-not-allowed bg-slate-50/30 border-transparent' : 'cursor-pointer ' + (isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50/50 border-transparent hover:border-indigo-100')}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-[10px] sm:text-xs font-black sm:ml-1 mt-0.5 text-center sm:text-left
            ${isToday ? 'text-emerald-600' : (isSelected ? 'text-indigo-900' : (isPast ? 'text-slate-300' : (isCurrentMonth ? 'text-slate-600' : 'text-slate-300')))}
          `}>
            {dayNum}
          </span>
          <div className="mt-auto mb-1 flex flex-col gap-0.5 px-1 items-center sm:items-stretch">
            {hasEvent && (
              <div className={`w-full max-w-full h-1.5 sm:h-2 rounded-full border border-white ${isPast ? 'bg-indigo-200' : 'bg-indigo-400'} ${!isCurrentMonth ? 'opacity-50' : ''}`} />
            )}
            {dayEvents.length > 1 && (
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white mx-auto sm:mx-0 ${isPast ? 'bg-emerald-200' : 'bg-emerald-400'} ${!isCurrentMonth ? 'opacity-50' : ''}`} />
            )}
          </div>
          {isToday && !hasEvent && (
            <div className={`mt-auto mb-0.5 text-[9px] font-black text-emerald-500 mx-auto leading-none ${!isCurrentMonth ? 'opacity-50' : ''}`}>Today</div>
          )}
        </div>
      </div>
    );
  };

  const calendarGrid = [];
  
  // 1. 이전 달 빈 칸 채우기
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, prevDay);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
    calendarGrid.push(renderCalendarCell(dateStr, prevDay, false));
  }
  
  // 2. 실제 날짜들
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarGrid.push(renderCalendarCell(dateStr, day, true));
  }
  
  // 3. 다음 달 빈 칸 채우기
  const totalCellsSoFar = firstDayOfMonth + daysInCurrentMonth;
  const remainingCells = totalCellsSoFar % 7 === 0 ? 0 : 7 - (totalCellsSoFar % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarGrid.push(renderCalendarCell(dateStr, i, false));
  }

  const isSelectedDateAvailable = selectedDate && parsedEvents.filter(e => e.date === selectedDate).length === 0;

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-end">
        <button
          disabled={!isSelectedDateAvailable}
          onClick={() => {
            if (!session?.user) {
              alert('로그인이 필요한 서비스입니다.');
              window.location.href = '/login';
              return;
            }
            setIsRequestModalOpen(true);
          }}
          className={`px-6 py-4 font-bold rounded-2xl transition-all w-full flex justify-center items-center gap-2 text-base ${
            isSelectedDateAvailable
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSelectedDateAvailable ? '📝 전문가에게 1:1 견적 요청하기' : '📅 스케줄 없는 날짜를 달력에서 선택해주세요'}
        </button>
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md h-full flex flex-col min-h-0">
      {/* 헤더 부분 */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full" />
          스케줄 관리
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-700">
            {currentYear}.{String(currentMonth + 1).padStart(2, '0')}
          </span>
          <div className="flex gap-1">
            <button 
              onClick={handlePrevMonth}
              disabled={isPrevDisabled}
              className={`p-1.5 rounded-lg transition-colors ${isPrevDisabled ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-slate-50 hover:bg-slate-200'}`}
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-6 bg-white shrink-0">
        {days.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">
            {d}
          </div>
        ))}
        {calendarGrid}
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            {selectedDate ? `${selectedDate.split('-')[1]}월 ${selectedDate.split('-')[2]}일 일정` : '예정된 스케줄 (향후 30일)'}
          </h4>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            총 {displayedEvents.length}건
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-400" />
            <span className="text-xs font-medium">일정을 불러오는 중입니다...</span>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-2">
            <SearchX className="w-8 h-8 mb-2 text-slate-300" />
            <span className="text-xs font-medium">예정된 일정이 없습니다.</span>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto h-full custom-scrollbar pr-1">
            {displayedEvents.map((event) => {
              const [m, d] = event.date.split('-').slice(1);
              const isAuto = event.type === 'AUTO';
              const isHoliday = event.type === 'HOLIDAY';
              
              return (
                <div 
                  key={event.id} 
                  className={`flex flex-col rounded-xl border p-3 hover:bg-slate-50 transition-colors ${isHoliday ? 'bg-red-50/40 border-red-100/60' : 'bg-indigo-50/40 border-indigo-100/60'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black bg-white px-2 py-0.5 rounded shadow-sm border ${isHoliday ? 'text-red-600 border-red-100' : 'text-indigo-600 border-indigo-100'}`}>
                      {m}/{d} ({isAuto ? '매칭' : isHoliday ? '휴일' : '개별'})
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 mb-1 leading-tight line-clamp-1">
                    {event.title}
                  </div>
                  {event.content && (
                    <div className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2">
                      {event.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>

      {isRequestModalOpen && (
        <DirectEstimateRequestModal 
          expertId={userId} 
          onClose={() => setIsRequestModalOpen(false)} 
          initialServiceDate={selectedDate || undefined}
          unavailableDates={parsedEvents.map(e => e.date)}
          specialties={specialties}
          categoriesData={categoriesData}
        />
      )}
    </>
  );
}
