"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws-config";
import { v4 as uuidv4 } from "uuid";

export async function submitReviewAction(formData: FormData) {
  try {
    const estimateId = formData.get("estimateId") as string;
    const expertId = parseInt(formData.get("expertId") as string, 10);
    const customerId = parseInt(formData.get("customerId") as string, 10);
    const rating = parseFloat(formData.get("rating") as string);
    const content = formData.get("content") as string;
    const photos = formData.getAll("photo") as File[];

    const photoUrls: string[] = [];
    const bucketName = process.env.AWS_S3_BUCKET || "onepick-storage";

    // 1. S3 사진 업로드
    for (const photo of photos) {
      if (photo && photo.size > 0) {
        try {
          const buffer = Buffer.from(await photo.arrayBuffer());
          const fileName = `reviews/${uuidv4()}-${photo.name}`;

          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: photo.type,
          });

          await s3Client.send(command);
          photoUrls.push(`${process.env.AWS_S3_ENDPOINT || "http://localhost:4566"}/${bucketName}/${fileName}`);
        } catch (s3Error) {
          console.warn("S3 Upload Failed, skipping photo:", s3Error);
        }
      }
    }

    return await prisma.$transaction(async (tx) => {
      const estimate = await tx.estimate.findUnique({
        where: { id: estimateId },
      });

      if (!estimate) {
        throw new Error("요청을 찾을 수 없습니다.");
      }

      // 후기를 작성할 수 있는 상태: INSPECTION, IN_PROGRESS, COMPLETED
      if (estimate.status !== 'INSPECTION' && estimate.status !== 'IN_PROGRESS' && estimate.status !== 'COMPLETED') {
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
          photoUrls,
        },
      });

      // 2. 견적 상태를 COMPLETED로 변경 (이미 COMPLETED라면 덮어씀)
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

export async function getUserReviewsAction(customerId: number) {
  try {
    // 1. 작성한 후기 가져오기
    const writtenReviews = await prisma.review.findMany({
      where: { customerId },
      include: {
        expert: { select: { id: true, name: true, image: true, grade: true } },
        estimate: { select: { id: true, category: true, selectedDate: true, completionPhotoUrls: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. 미작성 후기 (상태가 COMPLETED인데 review가 없는 estimate)
    const unwrittenEstimates = await prisma.estimate.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
        review: null,
      },
      include: {
        category: true,
        bids: {
          where: { status: 'ACCEPTED' },
          include: { expert: { select: { id: true, name: true, image: true, grade: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // unwrittenEstimates 포맷팅 (리뷰 대상자 expert 정보 추출)
    const formattedUnwritten = unwrittenEstimates.map(estimate => {
      const acceptedBid = estimate.bids?.[0];
      return {
        ...estimate,
        expert: acceptedBid?.expert || null,
      };
    });

    return {
      success: true,
      data: {
        written: writtenReviews,
        unwritten: formattedUnwritten
      }
    };
  } catch (error: any) {
    console.error("getUserReviewsAction error:", error);
    return { success: false, error: "후기 목록을 불러오는 데 실패했습니다." };
  }
}
