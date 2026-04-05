import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import { getExpertReceivedRequestsAction } from '@/actions/expert.action';
import ExpertReceivedRequestList from '@/components/expert/ExpertReceivedRequestList';
import Link from 'next/link';

export const metadata = {
  title: '받은요청 - OnePick 전문가',
  description: '전문가에게 직접 들어온 1:1 견적 요청 내역입니다.',
};

export default async function ExpertRequestsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  
  const paramUserId = searchParams.userId;
  let targetUserId = Number(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId);
  
  const isInvalidAccess = 
    !paramUserId || 
    isNaN(targetUserId) || 
    !session?.user?.id || 
    Number(session.user.id) !== targetUserId;

  if (isInvalidAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800">잘못된 접근입니다</h2>
          <p className="text-slate-500 font-medium">유효하지 않은 페이지 요청이거나 접근 권한이 없습니다.</p>
        </div>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          원픽 메인으로 이동
        </Link>
      </div>
    );
  }

  const expertId = targetUserId;
  const result = await getExpertReceivedRequestsAction(expertId);

  const bids = result.success && result.data ? result.data : [];

  return (
    <ExpertDashboardLayout>
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[500px]">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">받은 요청 (1:1 견적)</h2>
          <p className="text-slate-500 mt-2 font-medium">고객님들께서 직접 요청하신 1:1 맞춤 견적 내역을 관리하세요.</p>
        </div>

        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              📬
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">아직 받은 직접 요청이 없습니다.</h3>
            <p className="text-sm text-slate-500">
              전문가 프로필을 더 매력적으로 꾸미고, 갤러리 홍보를 통해 1:1 요청을 받아보세요.
            </p>
          </div>
        ) : (
          <ExpertReceivedRequestList bids={bids} expertId={expertId} />
        )}
      </div>
    </ExpertDashboardLayout>
  );
}
