"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 전문가 견적 제출 Server Action
 */
export async function submitBidAction({
  estimateId,
  expertId,
  items,
  message,
  availableDate,
}: {
  estimateId: string;
  expertId: number;
  items: { name: string; content: string; period: string; amount: number }[];
  message?: string;
  availableDate?: string;
}) {
  try {
    // 1. 이미 입찰했는지 확인 (중복 입찰 방지)
    const existingBid = await prisma.bid.findFirst({
      where: {
        estimateId,
        expertId,
      },
    });

    if (existingBid) {
      throw new Error("이미 이 견적 요청에 참여하셨습니다.");
    }

    // 2. 유효성 확인 (견적 상태 및 전문가 등급)
    const [estimate, expert] = await Promise.all([
      prisma.estimate.findUnique({
        where: { id: estimateId },
        select: { status: true },
      }),
      prisma.user.findUnique({
        where: { id: expertId },
        select: { grade: true },
      })
    ]);

    if (!estimate) {
      throw new Error("대상 견적 요청을 찾을 수 없습니다.");
    }

    if (estimate.status === "COMPLETED" || estimate.status === "CANCELLED") {
      throw new Error("종료되었거나 취소된 견적에는 참여할 수 없습니다.");
    }

    if (!expert) {
      throw new Error("전문가 정보를 찾을 수 없습니다.");
    }

    // 총 금액 계산 (부가세 포함 여부 결정)
    const basePrice = items.reduce((sum, item) => sum + item.amount, 0);
    const vat = expert.grade === "PRO" ? Math.floor(basePrice * 0.1) : 0;
    const totalPrice = basePrice + vat;

    // 3. 입찰 정보 및 세부 항목 저장 (트랜잭션)
    const newBid = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          estimateId,
          expertId,
          price: totalPrice,
          message,
          availableDate,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. 견적 상태 업데이트 (PENDING -> BIDDING)
      if (estimate.status === "PENDING") {
        await tx.estimate.update({
          where: { id: estimateId },
          data: { status: "BIDDING" },
        });
      }

      return bid;
    });

    revalidatePath(`/estimate/${estimateId}`);
    return { success: true, bid: newBid };
  } catch (error: any) {
    console.error("submitBidAction error:", error);
    return { success: false, error: error.message || "견적 참여 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 제안(견적) 채택 Server Action
 */
export async function acceptBidAction(estimateId: string, bidId: string, customerId: number, selectedDate?: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Estimate 가져오기 및 권한 확인
      const estimate = await tx.estimate.findUnique({
        where: { id: estimateId },
      });

      if (!estimate) throw new Error("견적 요청을 찾을 수 없습니다.");
      if (estimate.customerId !== customerId) throw new Error("채택 권한이 없습니다.");
      if (estimate.status === "COMPLETED" || estimate.status === "CANCELLED" || estimate.status === "IN_PROGRESS") {
        throw new Error("이미 처리된 견적입니다.");
      }

      // 2. 다른 입찰 상태 업데이트 (선택 사항: 나머지 다 REJECTED로 바꿀 수도 있지만 여기선 채택된 것만 ACCEPTED로)
      await tx.bid.update({
        where: { id: bidId },
        data: { status: "ACCEPTED" },
      });

      // 3. Estimate 상태를 SELECTED (전문가선택됨/결제대기) 및 isClosed (마감) 로 변경
      const updatedEstimate = await tx.estimate.update({
        where: { id: estimateId },
        data: { 
          status: "SELECTED",
          isClosed: true,
          ...(selectedDate ? { selectedDate } : {})
        },
      });

      return updatedEstimate;
    });

    revalidatePath("/(user)/user/my-requests");
    revalidatePath(`/estimate/${estimateId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("acceptBidAction error:", error);
    return { success: false, error: error.message || "전문가 채택 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 제안(견적) 채택 취소 Server Action (SELECTED 상태에서 취소)
 */
export async function cancelBidSelectionAction(estimateId: string, bidId: string, customerId: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Estimate 가져오기
      const estimate = await tx.estimate.findUnique({
        where: { id: estimateId },
      });

      if (!estimate) throw new Error("견적 요청을 찾을 수 없습니다.");
      if (estimate.customerId !== customerId) throw new Error("취소 권한이 없습니다.");
      if (estimate.status !== "SELECTED") {
        throw new Error("전문가가 선택된 상태에서만 취소할 수 있습니다.");
      }

      // 2. Bid 상태 원복
      await tx.bid.update({
        where: { id: bidId },
        data: { status: "PENDING" },
      });

      // 3. Estimate 상태 및 마감 상태 원복
      const updatedEstimate = await tx.estimate.update({
        where: { id: estimateId },
        data: { 
          status: "BIDDING",
          isClosed: false,
          selectedDate: null
        },
      });

      return updatedEstimate;
    });

    revalidatePath("/(user)/user/my-requests");
    revalidatePath(`/estimate/${estimateId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("cancelBidSelectionAction error:", error);
    return { success: false, error: error.message || "선택 취소 중 오류가 발생했습니다." };
  }
}
