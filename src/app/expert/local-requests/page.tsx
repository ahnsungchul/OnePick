import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import { getLocalRequestsForExpertAction } from '@/actions/estimate.action';
import LocalRequestsClient from './LocalRequestsClient';

export const metadata = {
  title: '우리동네요청 - OnePick 전문가',
  description: '내가 설정한 서비스 지역의 최신 견적 요청 목록입니다.',
};

export default async function LocalRequestsPage({
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

  const result = await getLocalRequestsForExpertAction(targetUserId);
  const estimates = result.success && result.data ? result.data : [];
  const regions: string[] = (result as any).regions || [];
  const specialties: string[] = (result as any).specialties || [];

  return (
    <ExpertDashboardLayout>
      <LocalRequestsClient
        estimates={estimates}
        regions={regions}
        specialties={specialties}
        expertId={targetUserId}
      />
    </ExpertDashboardLayout>
  );
}
