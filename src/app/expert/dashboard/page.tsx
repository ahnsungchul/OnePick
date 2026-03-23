import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExpertDashboardLayout from '@/components/layout/ExpertDashboardLayout';
import { getExpertHomeDataAction } from '@/actions/expert.action';
import IntroductionSection from '@/components/expert/IntroductionSection';
import PortfolioSection from '@/components/expert/PortfolioSection';
import ReviewSection from '@/components/expert/ReviewSection';
import CalendarSection from '@/components/expert/CalendarSection';

export const metadata = {
  title: '전문가홈 - OnePick',
  description: '원픽 전문가 전용 대시보드입니다.',
};

export default async function ExpertDashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  
  // URL 파라미터에서 userId 가져오기, 없으면 세션의 본인 ID 사용
  const paramUserId = searchParams.userId;
  let targetUserId = 0;
  
  if (paramUserId) {
    targetUserId = Number(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId);
  } else if (session?.user?.id) {
    targetUserId = Number(session.user.id);
  }

  // NaN 체크 (유효하지 않은 ID인 경우 Guest 모드(0)로 처리)
  if (isNaN(targetUserId)) {
    targetUserId = 0;
  }
  
  // 조회 대상과 현재 로그인 유저가 동일한지 확인 (본인 여부)
  const isOwner = session?.user?.id ? Number(session.user.id) === targetUserId : false;

  const result = await getExpertHomeDataAction(targetUserId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center text-slate-500">
        정보를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const { user, profile, stats } = result.data;
  const isApproved = user.isApproved;

  return (
    <ExpertDashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {isOwner && !isApproved && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">
                ⏳
              </div>
              <div>
                <h4 className="font-black text-amber-900">현재 서비스 심사 중입니다.</h4>
                <p className="text-sm text-amber-700 font-medium">심사가 완료되면 견적 요청을 받고 입찰에 참여하실 수 있습니다.</p>
              </div>
            </div>
            <button className="text-sm font-bold text-amber-700 underline decoration-2 underline-offset-4 pointer-events-none opacity-50">
              서류 보완하기
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* 전문가 프로필 섹션 */}
            <IntroductionSection user={user} profile={profile} isOwner={isOwner} />
            
            {/* 포트폴리오 섹션 */}
            <PortfolioSection portfolioUrl={profile.portfolioUrl} isOwner={isOwner} />
            
            {/* 리뷰 섹션 */}
            <ReviewSection rating={profile.rating} />
          </div>

          <div className="lg:col-span-1">
            {/* 캘린더 섹션 */}
            <CalendarSection userId={targetUserId} />
          </div>
        </div>
      </div>
    </ExpertDashboardLayout>
  );
}
