"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getSubscriptionInfoAction(expertId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: expertId },
      select: {
        subscriptionPlan: true,
        subscriptionDate: true,
        subscriptionEndDate: true,
      }
    });

    if (!user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    return { 
      success: true, 
      data: {
        plan: user.subscriptionPlan,
        startDate: user.subscriptionDate,
        endDate: user.subscriptionEndDate
      }
    };
  } catch (error: any) {
    console.error("getSubscriptionInfo error:", error);
    return { success: false, error: "구독 정보를 불러오는 중 오류가 발생했습니다." };
  }
}

export async function subscribeToBasicAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // 마지막 결제 내역 조회하여 남은 유효 기간 확인
    const lastPayment = await prisma.paymentHistory.findFirst({
      where: { expertId },
      orderBy: { paymentDate: 'desc' }
    });

    // 최근 결제일로부터 한 달이 지나지 않았는지 체크 (중복 결제 방지)
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const isPeriodRemaining = lastPayment && (today.getTime() - lastPayment.paymentDate.getTime() < ONE_MONTH_MS);

    if (isPeriodRemaining) {
      // 잔여 기간이 남은 경우 결제 내역 추가 없이 요금제만 재가입 처리
      await prisma.user.update({
        where: { id: expertId },
        data: {
          subscriptionPlan: "BASIC",
          subscriptionEndDate: null,
        }
      });
      
      revalidatePath("/expert/subscription");
      revalidatePath("/expert/requests");
      
      return { success: true, message: "기존 가입 기간이 남아있어 추가 결제 없이 Basic 구독이 재개되었습니다." };
    }

    // 1. 유저 플랜 업데이트 (신규 결제)
    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "BASIC",
        subscriptionDate: today,
        subscriptionEndDate: null,
      }
    });

    // 2. 결제 내역 기록 (목업)
    await prisma.paymentHistory.create({
      data: {
        expertId,
        amount: 11000,
        paymentDate: today,
        status: "PAID",
        nextPaymentDate: nextMonth
      }
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");
    
    return { success: true };
  } catch (error: any) {
    console.error("subscribeToBasic error:", error);
    return { success: false, error: "구독 결제 처리 중 오류가 발생했습니다." };
  }
}

export async function cancelSubscriptionAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const today = new Date();

    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "LITE",
        subscriptionEndDate: today,
      }
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");
    
    return { success: true };
  } catch (error: any) {
    console.error("cancelSubscription error:", error);
    return { success: false, error: "구독 취소 중 오류가 발생했습니다." };
  }
}

export async function getPaymentHistoryAction(expertId: number) {
  try {
    const history = await prisma.paymentHistory.findMany({
      where: { expertId },
      orderBy: { paymentDate: 'desc' }
    });

    return { success: true, data: history };
  } catch (error: any) {
    console.error("getPaymentHistory error:", error);
    return { success: false, error: "결제 내역 조회 중 오류가 발생했습니다." };
  }
}
