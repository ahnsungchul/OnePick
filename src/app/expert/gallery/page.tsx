import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import ScheduleCalendar from '@/components/expert/ScheduleCalendar';
import { getExpertSchedulesAction } from '@/actions/schedule.action';
import Link from 'next/link';

export const metadata = {
  title: '통합 스케줄 - OnePick',
  description: '전문가 통합 일정 관리',
};

export default async function ExpertGalleryPage({
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

  const result = await getExpertSchedulesAction(targetUserId);
  const initialSchedules = result.success && result.data ? (result.data as any[]) : [];

  return (
    <ExpertDashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <ScheduleCalendar expertId={targetUserId} initialSchedules={initialSchedules} isOwner={true} />
      </div>
    </ExpertDashboardLayout>
  );
}
