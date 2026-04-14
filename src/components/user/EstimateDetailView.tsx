'use client';

import React from 'react';
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCategory } from '@/lib/utils';

interface EstimateDetailViewProps {
  estimate: any;
}

export default function EstimateDetailView({ estimate }: EstimateDetailViewProps) {
  if (!estimate) return null;

  return (
    <div className="space-y-6">
      {/* 견적 메인 정보 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-slate-900">{formatCategory(estimate.category)} 요청</h1>
        <div className="flex flex-wrap items-center gap-2">
          {estimate.isUrgent && (
            <span className="bg-red-600 text-white text-sm font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Clock className="w-3 h-3" /> 긴급
            </span>
          )}
          <span className={`text-sm font-bold px-3 py-0.5 rounded-full shadow-sm ${
            estimate.status === 'PENDING' ? 'bg-blue-600 text-white' :
            estimate.status === 'BIDDING' ? 'bg-amber-500 text-white' :
            estimate.status === 'IN_PROGRESS' ? 'bg-emerald-600 text-white' :
            'bg-slate-500 text-white'
          }`}>
            {estimate.status === 'PENDING' ? '매칭중' :
             estimate.status === 'BIDDING' ? '견적중' :
             estimate.status === 'IN_PROGRESS' ? '전문가확정' :
             estimate.status === 'COMPLETED' ? '서비스완료' : '취소'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-50">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">지역 정보</p>
              <p className="text-sm font-bold text-slate-700">{estimate.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">요청 일시</p>
              <p className="text-sm font-bold text-slate-700">{new Date(estimate.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {estimate.serviceDate && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-500 uppercase">서비스 희망 일</p>
                <p className="text-sm font-bold text-slate-700">
                  {estimate.serviceDate}
                  {estimate.serviceTime && ` (${estimate.serviceTime})`}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">요청자</p>
              <p className="text-sm font-bold text-slate-700">{estimate.authorName || estimate.customer?.name}님</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">연락처</p>
              <p className="text-sm font-bold text-slate-700">{estimate.contact}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" /> 상세 요청 내용
        </h3>
        <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-md leading-relaxed whitespace-pre-wrap">
          {estimate.details}
        </div>
      </div>

      {estimate.photoUrls && estimate.photoUrls.length > 0 && (
        <div>
          <h3 className="text-[11px] font-black text-slate-900 mb-3">첨부 사진 ({estimate.photoUrls.length})</h3>
          <div className="flex flex-wrap gap-2">
            {estimate.photoUrls.map((url: string, index: number) => (
              <div 
                key={index} 
                className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 relative group"
              >
                <img 
                  src={url} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
