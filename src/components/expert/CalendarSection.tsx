'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, MapPin, SearchX } from 'lucide-react';
import { getExpertSchedulesAction } from '@/actions/expert.action';
import { formatCategory } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CalendarSection({ userId }: { userId: number }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = session?.user?.id ? Number(session.user.id) === userId : false;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const parsedEvents = useMemo(() => {
    const events: { date: string; displayDate: string; bid: any; id: string }[] = [];
    schedules.forEach((bid, idx) => {
      if (bid.availableDate) {
        const dates = bid.availableDate.split(',').map((d: string) => d.trim());
        dates.forEach((d: string, dIdx: number) => {
          // 정규식: 앞의 "YYYY-MM-DD" 형태만 추출 (예: '2026-11-20 (금)' -> '2026-11-20')
          const match = d.match(/^(\d{4}-\d{2}-\d{2})/);
          const cleanDate = match ? match[1] : d;
          events.push({ date: cleanDate, displayDate: d, bid, id: `${bid.id}-${dIdx}` });
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

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md h-full flex flex-col">
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
              const estimate = event.bid.estimate;
              // Date formatted for list (e.g. 11.20)
              const [m, d] = event.date.split('-').slice(1);
              
              return (
                <div 
                  key={event.id} 
                  onClick={() => {
                    if (isOwner) {
                      router.push(`/expert/bids?bidId=${event.bid.id}`);
                    }
                  }}
                  className={`flex flex-col bg-indigo-50/40 rounded-xl border border-indigo-100/60 p-3 hover:bg-indigo-50 transition-colors ${isOwner ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded shadow-sm border border-indigo-100">
                      {m}/{d} ({event.bid.status === 'ACCEPTED' ? '확정' : '제안중'})
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{formatCategory(estimate.category)}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 mb-1 leading-tight line-clamp-1">
                    {estimate.details}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[120px]">{estimate.location}</span>
                    </div>
                    {estimate.customer?.name && (
                      <span className="text-[11px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                        {estimate.customer.name} 고객
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
