"use server";

import prisma from "@/lib/prisma";

/**
 * 사용자의 대시보드 통계 정보를 가져옵니다.
 */
export async function getUserDashboardStatsAction(userId: number) {
  if (!userId || isNaN(userId)) {
    return { success: false, error: "유효하지 않은 사용자 ID입니다." };
  }
  try {
    // 1. 견적 목록 조회
    const estimates = await prisma.estimate.findMany({
      where: { customerId: userId },
      select: { status: true, designatedExpertId: true }
    });

    // 2. 상태별 카운트 초기화
    const stats = {
      DRAFT: 0,      // 작성중
      MATCHING: 0,   // 매칭중 (PENDING, BIDDING)
      FINISHED: 0,   // 매칭완료 (IN_PROGRESS)
      INSPECTION: 0, // 검수요청 (INSPECTION)
      COMPLETED: 0,  // 서비스완료 (COMPLETED)
      CANCELLED: 0,  // 취소 (CANCELLED)
    };
    
    const directStats = {
      DRAFT: 0,
      MATCHING: 0,
      FINISHED: 0,
      INSPECTION: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    // 3. 상태 매핑 및 계산
    estimates.forEach(est => {
      const targetStats = est.designatedExpertId ? directStats : stats;
      switch (est.status as any) {
        case 'DRAFT':
          targetStats.DRAFT++;
          break;
        case 'PENDING':
        case 'BIDDING':
        case 'SELECTED':
          targetStats.MATCHING++;
          break;
        case 'IN_PROGRESS':
          targetStats.FINISHED++;
          break;
        case 'INSPECTION':
          targetStats.INSPECTION++;
          break;
        case 'COMPLETED':
          targetStats.COMPLETED++;
          break;
        case 'CANCELLED':
          targetStats.CANCELLED++;
          break;
        default:
          break;
      }
    });

    // 4. 안읽은 상담 및 미작성 후기
    const unreadChatsCount = await prisma.chat.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    const summary = {
      newEstimates: 0,
      unreadChats: unreadChatsCount,
      pendingReviews: 0,
    };

    return { 
      success: true, 
      data: { stats, directStats, summary } 
    };
  } catch (error: any) {
    console.error("getUserDashboardStatsAction error:", error);
    return { 
      success: false, 
      error: error.message || "대시보드 통계를 가져오는 중 오류가 발생했습니다.",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}
