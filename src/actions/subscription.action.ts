"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getSystemConfig } from "@/actions/systemConfig.action";
import { unstable_noStore as noStore } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getSubscriptionInfoAction(expertId: number) {
  noStore();
  try {
    const user = await prisma.user.findUnique({
      where: { id: expertId },
      select: {
        subscriptionPlan: true,
        subscriptionDate: true,
        subscriptionEndDate: true,
        subscriptionBillingCycle: true,
      } as any
    });

    if (!user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." };
    }

    return {
      success: true,
      data: {
        plan: user.subscriptionPlan,
        billingCycle: (user as any).subscriptionBillingCycle || "MONTHLY",
        startDate: user.subscriptionDate,
        endDate: user.subscriptionEndDate
      }
    };
  } catch (error: any) {
    console.error("getSubscriptionInfo error:", error);
    return { success: false, error: "구독 정보를 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 현재 활성화된 빌링키(정기결제 카드) 조회
 */
export async function getActiveBillingKeyAction(expertId: number) {
  noStore();
  try {
    const billingKey = await prisma.billingKey.findFirst({
      where: {
        userId: expertId,
        isActive: true,
        isDefault: true,
        issueSucceeded: true,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: billingKey || null };
  } catch (error: any) {
    console.error("getActiveBillingKeyAction error:", error);
    return { success: false, error: "카드 정보를 불러오는 중 오류가 발생했습니다.", data: null };
  }
}

/**
 * 빌링키(정기결제 카드) 등록 또는 교체
 *
 * 실제 PG 연동 전의 대체 구현:
 *  - 카드번호 마스킹 정보(앞 6자리 BIN, 끝 4자리)만 DB에 저장
 *  - billingKey 필드에는 향후 PG 토큰이 들어갈 위치 (현재는 내부 UUID로 임시 보관)
 *  - 기존 활성 카드는 isActive=false 처리 (소프트 교체)
 */
export async function saveBillingKeyAction({
  expertId,
  cardFull,
  cardExpireYear,
  cardExpireMonth,
  cardCompany,
  cardType,
  holderName,
}: {
  expertId: number;
  cardFull: string;
  cardExpireYear: string;
  cardExpireMonth: string;
  cardCompany?: string;
  cardType?: string;
  holderName?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const digitsOnly = cardFull.replace(/\D/g, "");
    if (digitsOnly.length < 15 || digitsOnly.length > 16) {
      return { success: false, error: "올바른 카드 번호를 입력해주세요." };
    }
    if (!cardExpireYear || !cardExpireMonth) {
      return { success: false, error: "유효기간을 입력해주세요." };
    }

    const cardBin = digitsOnly.slice(0, 6);
    const cardLast4 = digitsOnly.slice(-4);

    // 기존 활성 빌링키 비활성화
    await prisma.billingKey.updateMany({
      where: { userId: expertId, isActive: true },
      data: { isActive: false, isDefault: false },
    });

    // 신규 빌링키 등록 (PG 연동 전 임시 토큰 사용)
    const mockBillingToken = `MOCK_${uuidv4()}`;

    const newKey = await prisma.billingKey.create({
      data: {
        userId: expertId,
        pgProvider: "PORTONE",
        billingKey: mockBillingToken,
        cardBin,
        cardLast4,
        cardExpireYear,
        cardExpireMonth,
        cardCompany: cardCompany || null,
        cardType: cardType || null,
        holderName: holderName || null,
        isActive: true,
        isDefault: true,
        issueSucceeded: true,
        issuedAt: new Date(),
      },
    });

    revalidatePath("/expert/subscription");
    return { success: true, data: newKey };
  } catch (error: any) {
    console.error("saveBillingKeyAction error:", error);
    return { success: false, error: error.message || "카드 등록 중 오류가 발생했습니다." };
  }
}

/**
 * 빌링키 소프트 삭제 (정기결제 수단 제거)
 */
export async function deleteBillingKeyAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    await prisma.billingKey.updateMany({
      where: { userId: expertId, isActive: true },
      data: {
        isActive: false,
        isDefault: false,
        deletedAt: new Date(),
      },
    });

    revalidatePath("/expert/subscription");
    return { success: true };
  } catch (error: any) {
    console.error("deleteBillingKeyAction error:", error);
    return { success: false, error: "카드 삭제 중 오류가 발생했습니다." };
  }
}

export async function subscribeToBasicAction(
  expertId: number,
  billingCycle: "MONTHLY" | "ANNUAL" = "MONTHLY"
) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const isAnnual = billingCycle === "ANNUAL";
    const planName = isAnnual ? "BASIC_ANNUAL" : "BASIC_MONTHLY";

    // system_configs 에서 동적으로 금액·개월수 조회
    const monthlyFeeRaw = await getSystemConfig("BASIC_SUBSCRIPTION_FEE", 11000);
    const annualFeeRaw  = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_FEE", 110000);
    const annualMonthsRaw = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_MONTHS", 12);

    const monthlyFee    = typeof monthlyFeeRaw === "number" ? monthlyFeeRaw : Number(monthlyFeeRaw);
    const annualFee     = typeof annualFeeRaw === "number" ? annualFeeRaw : Number(annualFeeRaw);
    const annualMonths  = typeof annualMonthsRaw === "number" ? annualMonthsRaw : Number(annualMonthsRaw);

    const billingMonths = isAnnual ? annualMonths : 1;
    const amountToCharge = isAnnual ? annualFee : monthlyFee;

    const today = new Date();
    const nextPaymentDate = new Date(today);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + billingMonths);

    // 기존 가입 기간이 남았는지 확인 (월간 플랜 재가입시에만 적용)
    const lastPayment = await prisma.paymentHistory.findFirst({
      where: { userId: expertId, paymentType: "SUBSCRIPTION" },
      orderBy: { paymentDate: "desc" }
    });

    const lastCoverageMonths = (lastPayment as any)?.billingMonths ?? 1;
    const coverageMs = lastCoverageMonths * 30 * 24 * 60 * 60 * 1000;
    const isPeriodRemaining = !isAnnual && lastPayment &&
      (today.getTime() - lastPayment.paymentDate.getTime() < coverageMs);

    if (isPeriodRemaining) {
      await prisma.user.update({
        where: { id: expertId },
        data: { subscriptionPlan: "BASIC", subscriptionEndDate: null }
      });
      revalidatePath("/expert/subscription");
      revalidatePath("/expert/requests");
      return { success: true, message: "기존 가입 기간이 남아있어 추가 결제 없이 Basic 구독이 재개되었습니다." };
    }

    // 현재 활성 빌링키 조회
    const activeBillingKey = await prisma.billingKey.findFirst({
      where: { userId: expertId, isActive: true, isDefault: true, issueSucceeded: true, deletedAt: null },
    });

    // 신규 필드(subscriptionBillingCycle / planName / billingCycle / billingMonths)는
    // 스키마 마이그레이션 직후 prisma generate 재실행 전까지 타입 인식이 늦을 수 있어
    // data 객체를 as any 로 처리합니다.
    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "BASIC",
        subscriptionDate: today,
        subscriptionEndDate: null,
        subscriptionBillingCycle: billingCycle,
      } as any
    });

    await prisma.paymentHistory.create({
      data: {
        userId: expertId,
        paymentType: "SUBSCRIPTION",
        planName,
        billingCycle,
        billingMonths,
        amount: amountToCharge,
        paymentDate: today,
        status: "PAID",
        nextPaymentDate,
        billingKeyId: activeBillingKey?.id || null,
        pgTransactionId: activeBillingKey ? `MOCK_TXN_${uuidv4()}` : null,
      } as any
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");
    return {
      success: true,
      message: isAnnual
        ? `Basic 연간 플랜(${billingMonths}개월) 결제가 완료되었습니다!`
        : undefined
    };
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
      data: { subscriptionPlan: "LITE", subscriptionEndDate: today }
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
  noStore();
  try {
    const history = await prisma.paymentHistory.findMany({
      where: { userId: expertId, paymentType: "SUBSCRIPTION" },
      include: {
        billingKey: {
          select: { cardLast4: true, cardCompany: true, cardBin: true }
        }
      },
      orderBy: { paymentDate: "desc" }
    });

    // billingCycle / billingMonths 미기록 구 데이터의 기본값 보정
    const normalized = history.map((h: any) => ({
      ...h,
      planName: h.planName || (h.billingCycle === "ANNUAL" ? "BASIC_ANNUAL" : "BASIC_MONTHLY"),
      billingCycle: h.billingCycle || "MONTHLY",
      billingMonths: h.billingMonths || 1,
    }));

    return { success: true, data: normalized };
  } catch (error: any) {
    console.error("getPaymentHistory error:", error);
    return { success: false, error: "결제 내역 조회 중 오류가 발생했습니다." };
  }
}
