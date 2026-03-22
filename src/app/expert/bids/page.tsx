import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import ExpertHeaderContent from '@/components/layout/ExpertHeaderContent';
import { getExpertSentBidsAction } from '@/actions/expert.action';
import ExpertBidListItem from '@/components/expert/ExpertBidListItem';

export const metadata = {
  title: '보낸요청 - OnePick 전문가',
  description: '전문가가 참여한 견적 요청 내역입니다.',
};

export default async function ExpertBidsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const expertId = Number(session.user.id);
  const result = await getExpertSentBidsAction(expertId);

  const bids = result.success && result.data ? result.data : [];

  return (
    <ExpertDashboardLayout>

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 min-h-[500px]">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">보낸 요청 내역</h2>
          <p className="text-slate-500 mt-2 font-medium">고객님들께 제안한 견적과 진행 상태를 모아볼 수 있습니다.</p>
        </div>

        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              📝
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">아직 제안한 견적이 없습니다.</h3>
            <p className="text-sm text-slate-500">
              홈에서 새로운 요청을 찾아 견적을 제안해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid: any) => (
              <ExpertBidListItem key={bid.id} bid={bid} expertId={expertId} currentUserName={session.user?.name || ''} />
            ))}
          </div>
        )}
      </div>
    </ExpertDashboardLayout>
  );
}
