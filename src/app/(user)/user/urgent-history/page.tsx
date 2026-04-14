'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUrgentHistoryAction } from '@/actions/estimate.action';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function UrgentHistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);
      getUrgentHistoryAction(userId)
        .then(res => {
          if (res.success && res.data) {
            setHistory(res.data);
          } else {
            setError(res.error || "데이터를 불러오는 데 실패했습니다.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch urgent history:", err);
          setError("오류가 발생했습니다.");
        })
        .finally(() => setIsLoading(false));
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">긴급 사용 내역을 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">로그인이 필요합니다</h2>
        <p className="text-slate-500 mb-6">내역을 확인하시려면 먼저 로그인해 주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-red-50 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">오류 발생</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-rose-600 fill-rose-600" />
          긴급사용내역
        </h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">긴급 요청을 적용한 서비스 요청의 상태를 확인하세요.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-600">
                  <th className="py-4 px-6">요청 ID</th>
                  <th className="py-4 px-6">카테고리</th>
                  <th className="py-4 px-6">시작일</th>
                  <th className="py-4 px-6">종료일</th>
                  <th className="py-4 px-6 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const isCompleted = record.status === 'COMPLETED' || record.status === 'IN_PROGRESS' || record.status === 'CANCELLED';
                  
                  return (
                    <tr key={record.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <Link href="/user/my-requests" className="font-semibold text-blue-600 hover:underline">
                          {record.requestNumber || `REQ-${record.id.substring(0,6)}`}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {record.category}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {record.selectedDate || '미정'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            긴급사용완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            긴급사용중
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">긴급사용내역이 없습니다</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">현재 긴급 요청으로 전환된 내역이 존재하지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
