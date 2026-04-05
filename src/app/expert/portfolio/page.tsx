import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import Link from 'next/link';
import PortfolioClientLayout from './PortfolioClientLayout';

export const metadata = {
  title: '전문가 포트폴리오 - OnePick',
  description: '원픽 전문가 포트폴리오입니다.',
};

export default async function ExpertPortfolioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  const paramUserId = searchParams.userId;
  
  if (!paramUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800">잘못된 접근입니다</h2>
          <p className="text-slate-500 font-medium">유효하지 않은 페이지 요청입니다.</p>
        </div>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          원픽 메인으로 이동
        </Link>
      </div>
    );
  }

  let targetUserId = Number(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId);
  if (isNaN(targetUserId)) {
    targetUserId = 0;
  }
  
  const isOwner = session?.user?.id ? Number(session.user.id) === targetUserId : false;

  return (
    <ExpertDashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">포트폴리오</h1>
          <p className="text-slate-500 mt-1 font-medium">전문가의 작업 내역과 블로그를 확인해보세요.</p>
        </div>
        <PortfolioClientLayout targetUserId={targetUserId} isOwner={isOwner} />
      </div>
    </ExpertDashboardLayout>
  );
}
