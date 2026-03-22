'use client';

import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarSection() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // 이번 달 예시 데이터 (1일부터 30일까지라 가정)
  const daysInMonth = 30;
  const events = [
    { day: 15, title: '도배 시공 (강남구)', color: 'bg-blue-500' },
    { day: 22, title: '견적 상담', color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full" />
          스케줄 관리
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-600">{currentYear}.{currentMonth < 10 ? `0${currentMonth}` : currentMonth}</span>
          <div className="flex gap-1">
            <button className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">
            {d}
          </div>
        ))}
        {[...Array(35)].map((_, i) => {
          const day = i - 1; // 대략적인 월요일 시작 가정
          const isToday = day === today.getDate();
          const hasEvent = events.find(e => e.day === day);

          return (
            <div 
              key={i} 
              className={`aspect-square p-1 rounded-xl border border-transparent transition-all cursor-pointer hover:border-indigo-100 ${day > 0 && day <= daysInMonth ? 'bg-slate-50/50' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="flex flex-col h-full">
                <span className={`text-[10px] font-black ml-1 mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {day > 0 && day <= daysInMonth ? day : ''}
                </span>
                {hasEvent && (
                  <div className={`mt-auto mb-1 w-full h-1.5 rounded-full ${hasEvent.color} scale-75 border border-white`} />
                )}
                {isToday && (
                  <div className="mt-auto mb-1 w-1 h-1 bg-indigo-600 rounded-full mx-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 mt-8">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">예정된 일정</h4>
        {events.map((event, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 transition-all hover:bg-indigo-50">
            <div className={`w-2 h-8 rounded-full ${event.color}`} />
            <div className="flex flex-col">
              <span className="text-xs font-black text-indigo-600">{currentMonth}월 {event.day}일</span>
              <span className="text-sm font-bold text-slate-700">{event.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
