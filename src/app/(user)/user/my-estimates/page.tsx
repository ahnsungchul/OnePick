'use client';

import React from 'react';
import UserDashboardStatus from '@/components/user/UserDashboardStatus';
import UserDashboardSummary from '@/components/user/UserDashboardSummary';
import UserDashboardSupport from '@/components/user/UserDashboardSupport';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUserDashboardStatsAction } from '@/actions/dashboard.action';

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || '사용자';
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchStats() {
      if (session?.user?.id) {
        const result = await getUserDashboardStatsAction(Number(session.user.id));
        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error || '대시보드 데이터를 불러오는데 실패했습니다.');
        }
      }
    }
    fetchStats();
  }, [session]);

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100 m-8">
        <h2 className="text-red-700 font-bold text-xl mb-2">대시보드 로드 오류</h2>
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          재시도
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            안녕하세요, <span className="text-blue-600">{userName}</span> 님! 👋
          </h2>
          <p className="text-slate-500 mt-1">오늘의 요청 현황을 확인해보세요.</p>
        </div>
        <Link href="/estimate/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            <Plus className="w-5 h-5" />
            새 견적요청 하기
          </button>
        </Link>
      </div>

      <UserDashboardStatus stats={dashboardData?.stats} directStats={dashboardData?.directStats} />
      
      <div className="mt-12">
        <h3 className="text-lg font-bold text-slate-800 mb-4">내 활동 요약</h3>
        <UserDashboardSummary summary={dashboardData?.summary} />
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-slate-800 mb-4">고객지원</h3>
        <UserDashboardSupport />
      </div>
    </div>
  );
}
