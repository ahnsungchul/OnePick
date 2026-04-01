"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 결제 내역 (전문가 확정 건) 가져오기
 */
export async function getUserPaymentsAction(userId: number) {
  try {
    const estimates = await prisma.estimate.findMany({
      where: {
        customerId: userId,
        status: {
          in: ["IN_PROGRESS", "COMPLETED"]
        }
      },
      include: {
        category: true,
        bids: {
          where: {
            status: "ACCEPTED"
          },
          include: {
            expert: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Payment 인터페이스에 맞게 매핑
    const payments = estimates.map(est => {
      const acceptedBid = est.bids[0];
      if (!acceptedBid) return null; // 데이터 이상 방어

      // 결제일(payDate)은 채택된 시간
      const payDate = new Date(acceptedBid.updatedAt).toISOString().split('T')[0];
      
      // 시작일(startDate)은 전문가가 제안한 날짜가 최우선
      const startDate = acceptedBid.availableDate ? acceptedBid.availableDate.split(',')[0].trim() : payDate;

      // Expert Company 이름을 어떻게든 추출 (전문가 프로필 한줄소개 -> 없으면 이름)
      const expertCompany = acceptedBid.expert?.profile?.introduction || acceptedBid.expert?.name || '원픽전문가';

      return {
        id: est.id, // Estimate ID
        requestNumber: est.requestNumber || est.id.substring(0, 8),
        category: est.category?.name || "기타",
        expertName: acceptedBid.expert?.name || '전문가',
        expertCompany: expertCompany,
        payDate,
        startDate,
        isDepositedToExpert: est.status === "COMPLETED", // 서비스 완료 시 지급되었다고 가정
        amount: acceptedBid.price,
        status: est.status, // IN_PROGRESS | COMPLETED
      };
    }).filter(Boolean);

    return { success: true, data: payments };
  } catch (error: any) {
    console.error("getUserPaymentsAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 결제 취소 (전문가 확정 취소 및 재입찰 상태로 원복)
 */
export async function cancelPaymentAction(estimateId: string, userId: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const estimate = await tx.estimate.findUnique({
        where: { id: estimateId },
        include: { bids: { where: { status: "ACCEPTED" } } }
      });

      if (!estimate) throw new Error("결제 내역을 찾을 수 없습니다.");
      if (estimate.customerId !== userId) throw new Error("취소 권한이 없습니다.");
      if (estimate.status !== "IN_PROGRESS") throw new Error("진행 중인 결제만 취소할 수 있습니다.");

      // 1. 견적 상태를 다시 BIDDING으로 변경하고, isClosed를 해제
      await tx.estimate.update({
        where: { id: estimateId },
        data: {
          status: "BIDDING",
          isClosed: false,
        }
      });

      // 2. 채택되었던 견적(Bid)들을 PENDING으로 원복하여 다른 전문가를 다시 선택하거나 취소할 수 있도록 복구
      await tx.bid.updateMany({
        where: {
          estimateId,
        },
        data: {
          status: "PENDING"
        }
      });
      
      return true;
    });

    revalidatePath("/(user)/user/payments");
    revalidatePath("/(user)/user/my-requests");
    return { success: true };
  } catch (error: any) {
    console.error("cancelPaymentAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 결제 완료 처리 (선택된 견적에 대한 최종 결제 완료)
 */
export async function completePaymentAction(estimateId: string, customerId: number) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const estimate = await tx.estimate.findUnique({ where: { id: estimateId } });
      if (!estimate) throw new Error("견적 요청을 찾을 수 없습니다.");
      if (estimate.customerId !== customerId) throw new Error("결제 권한이 없습니다.");
      if (estimate.status !== "SELECTED") throw new Error("결제 대기 상태가 아닙니다.");

      return await tx.estimate.update({
        where: { id: estimateId },
        data: { status: "IN_PROGRESS" }
      });
    });

    revalidatePath("/(user)/user/my-requests");
    revalidatePath(`/estimate/${estimateId}`);
    return { success: true };
  } catch (error: any) {
    console.error("completePaymentAction error:", error);
    return { success: false, error: error.message || "결제 처리 중 오류가 발생했습니다." };
  }
}
