"use server";
// Force reload: 2026-03-08T22:56:00

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws-config";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { formatCategory, getReverseCategoryMap } from "@/lib/utils";

/**
 * 고유한 요청 번호 생성기 (영문2자리+숫자4자리, 중복 검증 포함)
 */
async function generateUniqueRequestNumber(): Promise<string> {
  let isUnique = false;
  let reqNumber = '';
  
  while (!isUnique) {
    const year = new Date().getFullYear().toString();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    reqNumber = `${year}${l1}${l2}${num}`;
    
    const existing = await prisma.estimate.findUnique({
      where: { requestNumber: reqNumber }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return reqNumber;
}

/**
 * 견적 제출 Server Action (User-01)
 */
export async function submitEstimateAction(formData: FormData) {
  try {
    const estimateId = formData.get("estimateId") as string;
    const customerId = parseInt(formData.get("customerId") as string, 10);
    const authorName = formData.get("authorName") as string;
    const contact = formData.get("contact") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;
    const details = formData.get("details") as string;
    const photos = formData.getAll("photo") as File[];
    const subcategories = (formData.get("subcategories") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [];

    const serviceDate = formData.get("serviceDate")?.toString() || null;
    const serviceTime = formData.get("serviceTime")?.toString() || null;
    const isUrgent = formData.get("isUrgent") === "true";
    const needsReestimate = formData.get("needsReestimate") === "true";
    const shareContact = formData.get("shareContact") === "true";

    if (!customerId || !category || !location || !details) {
      throw new Error("필수 입력값이 누락되었습니다.");
    }

    const photoUrls: string[] = [];
    const bucketName = process.env.AWS_S3_BUCKET || "onepick-storage";

    // 1. S3 사진 업로드
    for (const photo of photos) {
      if (photo && photo.size > 0) {
        try {
          const buffer = Buffer.from(await photo.arrayBuffer());
          const fileName = `estimates/${uuidv4()}-${photo.name}`;

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

    // 2. 사용자 확인 및 생성
    let userExists = await prisma.user.findUnique({ where: { id: customerId } });
    if (!userExists) {
      userExists = await prisma.user.create({
        data: {
          id: customerId,
          email: `dummy_${customerId}@example.com`,
          name: authorName || "더미 사용자",
          role: "USER",
        }
      });
    }

    const categoryRecord = await prisma.category.findUnique({ where: { name: category } });
    const serviceRecords = await prisma.service.findMany({ where: { name: { in: subcategories } } });

    // 3. 데이터 저장 (신규 또는 업데이트)
    const estimateData = {
      customerId,
      authorName,
      contact,
      categoryId: categoryRecord?.id,
      services: {
        connect: serviceRecords.map(s => ({ id: s.id }))
      },
      location,
      details,
      serviceDate,
      serviceTime,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      isUrgent,
      needsReestimate,
      shareContact,
      status: "PENDING" as any,
    };

    let resultEstimate;
    if (estimateId && estimateId !== "undefined") {
      // 기존에 DRAFT 상태였다면 최초 발행 시점을 등록일(createdAt)로 처리
      const existing = await prisma.estimate.findUnique({
        where: { id: estimateId },
        select: { status: true }
      });

      const updateData: any = { 
        ...estimateData,
        services: {
          set: [], // 기존 관계 끊기
          connect: serviceRecords.map(s => ({ id: s.id }))
        }
      };
      if (existing?.status === "DRAFT") {
        updateData.createdAt = new Date();
      }

      resultEstimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: updateData,
      });
    } else {
      const requestNumber = await generateUniqueRequestNumber();
      
      resultEstimate = await prisma.estimate.create({
        data: {
          ...estimateData,
          requestNumber,
        },
      });
    }

    // 4. Redis 알림 (비동기로 시도, 타임아웃 3초)
    if (isUrgent) {
      try {
        const promise = (async () => {
          const { publishToExperts } = await import("@/lib/redis");
          await publishToExperts(
            JSON.stringify({
              type: "URGENT_ESTIMATE",
              estimateId: resultEstimate.id,
              category,
              location,
              message: `[긴급] 새로운 견적 요청이 등록되었습니다.`,
            })
          );
        })();
        
        // 3초 타임아웃 설정하여 메인 흐름 방해 금지
        await Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), 3000))
        ]).catch(e => console.warn("Redis notification failed or timed out:", e.message));
      } catch (redisError) {
        console.warn("Redis initialization failed:", redisError);
      }
    }

    return { success: true, estimate: { id: resultEstimate.id } };
  } catch (error: any) {
    console.error("submitEstimateAction error:", error);
    return { success: false, error: error.message || "견적 제출 중 오류가 발생했습니다." };
  }
}

/**
 * 견적 임시 저장 Server Action
 */
export async function saveEstimateDraftAction(formData: FormData) {
  try {
    const estimateId = formData.get("estimateId") as string;
    const customerId = parseInt(formData.get("customerId") as string, 10);
    const currentStep = parseInt(formData.get("currentStep") as string, 10) || 1;
    
    const subcategoriesRaw = (formData.get("subcategories") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [];
    
    const categoryRecord = await prisma.category.findUnique({ where: { name: formData.get("category") as string } });
    const serviceRecords = await prisma.service.findMany({ where: { name: { in: subcategoriesRaw } } });

    const data = {
      customerId,
      currentStep,
      status: "DRAFT" as any,
      authorName: formData.get("authorName") as string,
      contact: formData.get("contact") as string,
      categoryId: categoryRecord?.id,
      services: {
        connect: serviceRecords.map(s => ({ id: s.id }))
      },
      location: formData.get("location") as string,
      details: formData.get("details") as string,
      serviceDate: formData.get("serviceDate") as string || null,
      serviceTime: formData.get("serviceTime") as string || null,
      isUrgent: formData.get("isUrgent") === "true",
      needsReestimate: formData.get("needsReestimate") === "true",
    };

    let result;
    if (estimateId && estimateId !== "undefined") {
      result = await prisma.estimate.update({
        where: { id: estimateId },
        data: {
          ...data,
          services: {
            set: [],
            connect: serviceRecords.map(s => ({ id: s.id }))
          }
        },
      });
    } else {
      const requestNumber = await generateUniqueRequestNumber();

      result = await prisma.estimate.create({
        data: {
          ...data,
          requestNumber,
        },
      });
    }

    return { success: true, estimateId: result.id };
  } catch (error: any) {
    console.error("saveEstimateDraftAction error:", error);
    return { success: false, error: error.message || "임시 저장 중 오류가 발생했습니다." };
  }
}

/**
 * 견적 목록 조회 Server Action (User-02)
 */
export async function getEstimatesAction() {
  try {
    const estimates = await prisma.estimate.findMany({
      where: {
        status: {
          in: ["PENDING", "BIDDING", "IN_PROGRESS", "COMPLETED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: { customer: true, bids: true, category: true, services: true },
    });
    
    const parsed = (estimates as any).map((e: any) => ({
      ...e,
      category: e.category?.name || '',
      subcategories: e.services?.map((s: any) => s.name) || []
    }));
    
    return { success: true, data: parsed };
  } catch (error: any) {
    console.error("getEstimatesAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 사용자가 작성한 내 요청 목록 조회 (User-03)
 */
export async function getMyRequestsAction(userId: number) {
  if (!userId || isNaN(userId)) {
    return { success: false, error: "유효하지 않은 사용자 ID입니다." };
  }
  try {
    const estimates = await prisma.estimate.findMany({
      where: { 
        customerId: userId
      },
      include: {
        bids: {
          include: {
            expert: true,
            items: true
          },
          orderBy: { createdAt: "desc" }
        },
        chats: {
          where: { isRead: false, receiverId: userId },
          select: { id: true, senderId: true }
        },
        category: true,
        services: true
      } as any,
      orderBy: { createdAt: "desc" }
    });

    const data = (estimates as any).map((est: any) => ({
      ...est,
      category: est.category?.name || '',
      subcategories: est.services?.map((s: any) => s.name) || [],
      unreadChatCount: est.chats?.length || 0,
      unreadChats: est.chats || []
    }));

    return { success: true, data };
  } catch (error: any) {
    console.error("getMyRequestsAction error:", error);
    return { 
      success: false, 
      error: error.message || "데이터를 불러오는 중 오류가 발생했습니다.",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    };
  }
}

/**
 * 견적 상세 조회 Server Action
 */
export async function getEstimateByIdAction(id: string) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        customer: true,
        bids: {
          include: {
            expert: true,
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
        category: true,
        services: true
      },
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    const parsed = {
      ...estimate,
      category: estimate.category?.name || '',
      subcategories: estimate.services?.map((s) => s.name) || []
    };

    return { success: true, data: parsed };
  } catch (error: any) {
    console.error("getEstimateByIdAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 견적 삭제 Server Action
 */
export async function deleteEstimateAction(id: string, userId: number) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    if (estimate.customerId !== userId) {
      throw new Error("삭제 권한이 없습니다.");
    }

    await prisma.estimate.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteEstimateAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 견적 취소 Server Action (상태만 CANCELLED로 변경)
 */
export async function cancelEstimateAction(id: string, userId: number) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    if (estimate.customerId !== userId) {
      throw new Error("취소 권한이 없습니다.");
    }

    await prisma.estimate.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return { success: true };
  } catch (error: any) {
    console.error("cancelEstimateAction error:", error);
    return { success: false, error: error.message };
  }
}



/**
 * 현재 견적을 기준으로 이전/다음 견적의 ID와 카테고리를 가져옵니다.
 * 필터 조건이 있을 경우 해당 조건에 맞는 글 중에서만 탐색합니다.
 */
export async function getAdjacentEstimateIdsAction(
  currentId: string, 
  filters?: { category?: string; province?: string; city?: string }
) {
  try {
    const current = await prisma.estimate.findUnique({
      where: { id: currentId },
      select: { createdAt: true },
    });

    if (!current) throw new Error("Current estimate not found");

    // 공통 필터 조건 구축
    const filterAnd: any[] = [
      { status: { in: ["PENDING", "BIDDING"] } }
    ];
    if (filters?.category && filters.category !== '전체') {
      filterAnd.push({ category: { name: { in: getReverseCategoryMap(filters.category) } } });
    }
    if (filters?.province && filters.province !== '전국') {
      filterAnd.push({ location: { contains: filters.province } });
    }
    if (filters?.city && filters.city !== '전체') {
      filterAnd.push({ location: { contains: filters.city } });
    }

    // 이전글 (더 최신글: createdAt > current.createdAt) - 필터 조건 포함
    const prev = await prisma.estimate.findFirst({
      where: {
        AND: [
          { createdAt: { gt: current.createdAt } },
          ...filterAnd
        ]
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, category: true },
    });

    // 다음글 (더 오래된글: createdAt < current.createdAt) - 필터 조건 포함
    const next = await prisma.estimate.findFirst({
      where: {
        AND: [
          { createdAt: { lt: current.createdAt } },
          ...filterAnd
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, category: true },
    });

    return {
      success: true,
      data: {
        prev: prev ? { id: prev.id, title: `${formatCategory(prev.category?.name || '')} 요청` } : null,
        next: next ? { id: next.id, title: `${formatCategory(next.category?.name || '')} 요청` } : null,
      }
    };
  } catch (error: any) {
    console.error("Failed to get adjacent estimates:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 견적 수동 마감 처리 Action
 */
export async function closeEstimateAction(estimateId: string, userId: number) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId }
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    if (estimate.customerId !== userId) {
      throw new Error("권한이 없습니다.");
    }

    await prisma.estimate.update({
      where: { id: estimateId },
      data: { isClosed: true }
    });

    return { success: true };
  } catch (error: any) {
    console.error("closeEstimateAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 견적 수동 마감 취소 처리 Action
 */
export async function cancelCloseEstimateAction(estimateId: string, userId: number) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId }
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    if (estimate.customerId !== userId) {
      throw new Error("권한이 없습니다.");
    }

    await prisma.estimate.update({
      where: { id: estimateId },
      data: { isClosed: false }
    });

    return { success: true };
  } catch (error: any) {
    console.error("cancelCloseEstimateAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 견적 마감 연장 처리 Action
 */
export async function extendEstimateDeadlineAction(estimateId: string, userId: number, daysToAdd: number = 7) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId }
    });

    if (!estimate) {
      throw new Error("존재하지 않는 견적 요청입니다.");
    }

    if (estimate.customerId !== userId) {
      throw new Error("권한이 없습니다.");
    }

    await prisma.estimate.update({
      where: { id: estimateId },
      data: { 
        extendedDays: estimate.extendedDays + daysToAdd,
        isClosed: false
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("extendEstimateDeadlineAction error:", error);
    return { success: false, error: error.message };
  }
}
