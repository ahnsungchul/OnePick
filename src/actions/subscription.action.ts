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

// ─── 위약금 계산 유틸리티 ───────────────────────────────────
// 연간 할인을 받은 기간에 대해, 월간 정가와의 차액(할인액)을 위약금으로 부과합니다.
//
// ■ 계산 공식
//   annualMonthlyRate = annualFee / annualMonths   (연간 월환산 단가)
//   discountPerMonth  = monthlyFee - annualMonthlyRate (한 달당 할인받은 금액)
//   penalty           = usedMonths × discountPerMonth
//
// ■ 전환 시점
//   - 1개월 미만 사용(하루라도 사용): usedMonths=1, 이번 달 잔여 기간까지 이용 후 다음 달부터 월간 결제
//   - 1개월 이상 사용: 이번 달까지(현재 결제 주기 끝) 사용 후 다음 달부터 월간 결제
async function calcAnnualPenalty(expertId: number) {
  const monthlyFeeRaw = await getSystemConfig("BASIC_SUBSCRIPTION_FEE", 11000);
  const annualFeeRaw = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_FEE", 110000);
  const annualMonthsRaw = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_MONTHS", 12);

  const monthlyFee = typeof monthlyFeeRaw === "number" ? monthlyFeeRaw : Number(monthlyFeeRaw);
  const annualFee = typeof annualFeeRaw === "number" ? annualFeeRaw : Number(annualFeeRaw);
  const annualMonths = typeof annualMonthsRaw === "number" ? annualMonthsRaw : Number(annualMonthsRaw);

  // 연간 월환산 단가 & 월당 할인액
  const annualMonthlyRate = Math.round(annualFee / annualMonths);
  const discountPerMonth = monthlyFee - annualMonthlyRate;

  // 최근 연간 결제 내역 조회
  const lastAnnualPayment = await prisma.paymentHistory.findFirst({
    where: { userId: expertId, paymentType: "SUBSCRIPTION", billingCycle: "ANNUAL", status: "PAID" },
    orderBy: { paymentDate: "desc" },
  });

  if (!lastAnnualPayment) {
    return {
      penalty: 0, usedMonths: 0, totalMonths: annualMonths,
      monthlyFee, annualFee, annualMonthlyRate, discountPerMonth,
      monthlyStartDate: new Date(),
      lastPayment: null,
    };
  }

  const today = new Date();
  const payDate = new Date(lastAnnualPayment.paymentDate);

  // 실 사용 개월 수 (최소 1, 최대 annualMonths)
  const diffMs = today.getTime() - payDate.getTime();
  const usedMonths = Math.min(annualMonths, Math.max(1, Math.ceil(diffMs / (30 * 24 * 60 * 60 * 1000))));

  // 위약금 = 사용 개월 × 월당 할인액 (최소 0원)
  const penalty = Math.max(0, usedMonths * discountPerMonth);

  // 월간 결제 시작일 = 연간결제 시작일 + usedMonths 개월 (이번 달 잔여 기간까지 사용 후 다음 달)
  const monthlyStartDate = new Date(payDate);
  monthlyStartDate.setMonth(monthlyStartDate.getMonth() + usedMonths);

  return {
    penalty, usedMonths, totalMonths: annualMonths,
    monthlyFee, annualFee, annualMonthlyRate, discountPerMonth,
    monthlyStartDate,
    lastPayment: lastAnnualPayment,
  };
}

/**
 * 연간 구독 위약금 정보 조회 (UI 미리보기용)
 */
export async function getAnnualPenaltyInfoAction(expertId: number) {
  noStore();
  try {
    const info = await calcAnnualPenalty(expertId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error("getAnnualPenaltyInfo error:", error);
    return { success: false, error: "위약금 정보 조회 중 오류가 발생했습니다." };
  }
}

/**
 * 월간 → 연간 플랜 전환
 * 현재 월간 결제 기간이 끝난 시점부터 연간 결제가 시작되도록 예약합니다.
 */
export async function switchToAnnualAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const annualFeeRaw = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_FEE", 110000);
    const annualMonthsRaw = await getSystemConfig("BASIC_ANNUAL_SUBSCRIPTION_MONTHS", 12);
    const annualFee = typeof annualFeeRaw === "number" ? annualFeeRaw : Number(annualFeeRaw);
    const annualMonths = typeof annualMonthsRaw === "number" ? annualMonthsRaw : Number(annualMonthsRaw);

    // 마지막 월간 결제 내역에서 다음 결제 예정일(= 월간 기간 종료일)을 가져옴
    const lastMonthlyPayment = await prisma.paymentHistory.findFirst({
      where: { userId: expertId, paymentType: "SUBSCRIPTION", billingCycle: "MONTHLY", status: "PAID" },
      orderBy: { paymentDate: "desc" },
    });

    const annualStartDate = lastMonthlyPayment?.nextPaymentDate || new Date();
    const annualEndDate = new Date(annualStartDate);
    annualEndDate.setMonth(annualEndDate.getMonth() + annualMonths);

    // 현재 활성 빌링키 조회
    const activeBillingKey = await prisma.billingKey.findFirst({
      where: { userId: expertId, isActive: true, isDefault: true, issueSucceeded: true, deletedAt: null },
    });

    // 결제 내역 생성 (연간 결제 — 시작일이 미래인 경우 "예약 결제" 개념)
    await prisma.paymentHistory.create({
      data: {
        userId: expertId,
        paymentType: "SUBSCRIPTION",
        planName: "BASIC_ANNUAL",
        billingCycle: "ANNUAL",
        billingMonths: annualMonths,
        amount: annualFee,
        paymentDate: annualStartDate,
        status: "PAID",
        nextPaymentDate: annualEndDate,
        billingKeyId: activeBillingKey?.id || null,
        pgTransactionId: activeBillingKey ? `MOCK_TXN_${uuidv4()}` : null,
      } as any,
    });

    // 유저 구독 정보를 연간으로 변경
    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "BASIC",
        subscriptionBillingCycle: "ANNUAL",
        subscriptionEndDate: null,
      } as any,
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");

    const startStr = annualStartDate.toLocaleDateString("ko-KR");
    return {
      success: true,
      message: `연간 플랜으로 전환되었습니다. ${startStr}부터 연간 결제(${annualFee.toLocaleString()}원/${annualMonths}개월)가 적용됩니다.`,
    };
  } catch (error: any) {
    console.error("switchToAnnual error:", error);
    return { success: false, error: "연간 플랜 전환 중 오류가 발생했습니다." };
  }
}

/**
 * 연간 → 월간 플랜 전환 (위약금 결제 후 전환)
 */
export async function switchToMonthlyAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const { penalty, usedMonths, monthlyFee, annualFee, monthlyStartDate, lastPayment } =
      await calcAnnualPenalty(expertId);

    const activeBillingKey = await prisma.billingKey.findFirst({
      where: { userId: expertId, isActive: true, isDefault: true, issueSucceeded: true, deletedAt: null },
    });

    const now = Date.now();

    // paymentDate에 시간 오프셋을 줘서 내역 정렬 순서를 보장합니다.
    // 결제내역은 paymentDate DESC 정렬이므로 → 취소(최신) → 위약금 → 월간 전환(가장 오래됨)
    const cancelDate  = new Date(now + 2000); // +2초 → 가장 먼저 표시
    const penaltyDate = new Date(now + 1000); // +1초
    const switchDate  = new Date(now);        // 기준 시각

    // 1) 기존 연간 구독 취소 내역 생성
    await prisma.paymentHistory.create({
      data: {
        userId: expertId,
        paymentType: "CANCELLATION",
        planName: "BASIC_ANNUAL_CANCEL",
        billingCycle: "ANNUAL",
        billingMonths: 0,
        amount: annualFee,
        paymentDate: cancelDate,
        status: "CANCELLED",
        billingKeyId: activeBillingKey?.id || null,
        pgTransactionId: lastPayment?.pgTransactionId
          ? `CANCEL_${lastPayment.pgTransactionId}`
          : null,
      } as any,
    });

    // 2) 위약금이 0보다 크면 위약금 결제 내역 생성
    if (penalty > 0) {
      await prisma.paymentHistory.create({
        data: {
          userId: expertId,
          paymentType: "PENALTY",
          planName: "ANNUAL_TO_MONTHLY_PENALTY",
          billingCycle: "MONTHLY",
          billingMonths: 0,
          amount: penalty,
          paymentDate: penaltyDate,
          status: "PAID",
          billingKeyId: activeBillingKey?.id || null,
          pgTransactionId: activeBillingKey ? `MOCK_PENALTY_${uuidv4()}` : null,
        } as any,
      });
    }

    // 3) 월간 구독 전환 — 이번 달(현재 결제 주기) 잔여 기간까지 사용 후
    //    다음 달(monthlyStartDate)부터 월간 결제 시작
    const monthlyNextPayment = new Date(monthlyStartDate);
    monthlyNextPayment.setMonth(monthlyNextPayment.getMonth() + 1);

    await prisma.paymentHistory.create({
      data: {
        userId: expertId,
        paymentType: "SUBSCRIPTION",
        planName: "BASIC_MONTHLY",
        billingCycle: "MONTHLY",
        billingMonths: 1,
        amount: monthlyFee,
        paymentDate: monthlyStartDate,   // 다음 달부터 결제 시작
        status: "PAID",
        nextPaymentDate: monthlyNextPayment,
        billingKeyId: activeBillingKey?.id || null,
        pgTransactionId: activeBillingKey ? `MOCK_TXN_${uuidv4()}` : null,
      } as any,
    });

    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "BASIC",
        subscriptionBillingCycle: "MONTHLY",
        subscriptionEndDate: null,
      } as any,
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");

    const startStr = monthlyStartDate.toLocaleDateString("ko-KR");
    return {
      success: true,
      penalty,
      message: penalty > 0
        ? `위약금 ${penalty.toLocaleString()}원 결제 완료. ${startStr}부터 월간 플랜(${monthlyFee.toLocaleString()}원/월)으로 전환됩니다.`
        : `${startStr}부터 월간 플랜으로 전환됩니다.`,
    };
  } catch (error: any) {
    console.error("switchToMonthly error:", error);
    return { success: false, error: "월간 플랜 전환 중 오류가 발생했습니다." };
  }
}

/**
 * 연간 구독 중도 취소 (위약금 결제 후 LITE 전환)
 */
export async function cancelAnnualSubscriptionAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id || Number(session.user.id) !== expertId) {
      return { success: false, error: "권한이 없습니다." };
    }

    const { penalty, annualFee, lastPayment } = await calcAnnualPenalty(expertId);

    const activeBillingKey = await prisma.billingKey.findFirst({
      where: { userId: expertId, isActive: true, isDefault: true, issueSucceeded: true, deletedAt: null },
    });

    const now = Date.now();
    const cancelDate  = new Date(now + 1000); // +1초 → 취소 내역이 먼저 표시
    const penaltyDate = new Date(now);        // 기준 시각

    // 1) 연간 구독 취소 내역 생성
    await prisma.paymentHistory.create({
      data: {
        userId: expertId,
        paymentType: "CANCELLATION",
        planName: "BASIC_ANNUAL_CANCEL",
        billingCycle: "ANNUAL",
        billingMonths: 0,
        amount: annualFee,
        paymentDate: cancelDate,
        status: "CANCELLED",
        billingKeyId: activeBillingKey?.id || null,
        pgTransactionId: lastPayment?.pgTransactionId
          ? `CANCEL_${lastPayment.pgTransactionId}`
          : null,
      } as any,
    });

    // 2) 위약금 결제 내역 생성
    if (penalty > 0) {
      await prisma.paymentHistory.create({
        data: {
          userId: expertId,
          paymentType: "PENALTY",
          planName: "ANNUAL_CANCEL_PENALTY",
          billingCycle: "ANNUAL",
          billingMonths: 0,
          amount: penalty,
          paymentDate: penaltyDate,
          status: "PAID",
          billingKeyId: activeBillingKey?.id || null,
          pgTransactionId: activeBillingKey ? `MOCK_PENALTY_${uuidv4()}` : null,
        } as any,
      });
    }

    await prisma.user.update({
      where: { id: expertId },
      data: {
        subscriptionPlan: "LITE",
        subscriptionEndDate: new Date(),
      },
    });

    revalidatePath("/expert/subscription");
    revalidatePath("/expert/requests");

    return {
      success: true,
      penalty,
      message: penalty > 0
        ? `위약금 ${penalty.toLocaleString()}원 결제 후 구독이 취소되었습니다.`
        : "구독이 취소되었습니다.",
    };
  } catch (error: any) {
    console.error("cancelAnnualSubscription error:", error);
    return { success: false, error: "연간 구독 취소 중 오류가 발생했습니다." };
  }
}

export async function getPaymentHistoryAction(expertId: number) {
  noStore();
  try {
    const history = await prisma.paymentHistory.findMany({
      where: { userId: expertId, paymentType: { in: ["SUBSCRIPTION", "PENALTY", "CANCELLATION"] } },
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
