"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitReviewAction(
  estimateId: string,
  expertId: number,
  customerId: number,
  rating: number,
  content: string
) {
  try {
    // 1. 트랜잭션으로 상태 변경, 리뷰 생성, 프로필 점수 갱신을 한 번에 처리
    return await prisma.$transaction(async (tx) => {
      // 해당 견적이 검수요청 상태인지 확인
      const estimate = await tx.estimate.findUnique({
        where: { id: estimateId },
      });

      if (!estimate) {
        throw new Error("요청을 찾을 수 없습니다.");
      }

      if (estimate.status !== 'INSPECTION' && estimate.status !== 'IN_PROGRESS') {
        throw new Error("리뷰를 작성할 수 있는 상태가 아닙니다.");
      }

      // 1. 리뷰 생성
      const review = await tx.review.create({
        data: {
          estimateId,
          expertId,
          customerId,
          rating,
          content,
        },
      });

      // 2. 견적 상태를 COMPLETED로 변경
      await tx.estimate.update({
        where: { id: estimateId },
        data: { status: 'COMPLETED' },
      });

      // 3. 전문가 프로필 평점 및 리뷰 개수 갱신
      const expertReviews = await tx.review.findMany({
        where: { expertId },
        select: { rating: true }
      });
      
      const reviewCount = expertReviews.length;
      const totalRating = expertReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;

      await tx.profile.update({
        where: { expertId },
        data: {
          rating: avgRating,
          reviewCount: reviewCount,
        }
      });

      return { success: true, data: review };
    });
  } catch (error: any) {
    console.error("submitReviewAction error:", error);
    return { success: false, error: error.message || "리뷰 등록 중 오류가 발생했습니다." };
  }
}
