"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * 전문가 즐겨찾기를 토글합니다.
 * @param expertId 즐겨찾기할 전문가 ID
 */
export async function toggleFavoriteExpertAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = parseInt(session.user.id, 10);

    const existing = await prisma.favoriteExpert.findUnique({
      where: {
        userId_expertId: {
          userId,
          expertId,
        },
      },
    });

    if (existing) {
      // 이미 즐겨찾기된 경우 삭제
      await prisma.favoriteExpert.delete({
        where: { id: existing.id },
      });
      revalidatePath(`/expert/dashboard`);
      revalidatePath(`/user/my-experts`);
      return { success: true, isFavorited: false };
    } else {
      // 즐겨찾기 목록에 추가
      await prisma.favoriteExpert.create({
        data: {
          userId,
          expertId,
        },
      });
      revalidatePath(`/expert/dashboard`);
      revalidatePath(`/user/my-experts`);
      return { success: true, isFavorited: true };
    }
  } catch (error: any) {
    console.error("toggleFavoriteExpertAction error:", error);
    return { success: false, error: "즐겨찾기 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 현재 로그인한 유저가 즐겨찾기한 전문가의 ID 배열을 반환합니다.
 */
export async function getMyFavoriteExpertIdsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, data: [] };
    }

    const userId = parseInt(session.user.id, 10);

    const favorites = await prisma.favoriteExpert.findMany({
      where: { userId },
      select: { expertId: true },
    });

    return { success: true, data: favorites.map((f) => f.expertId) };
  } catch (error: any) {
    console.error("getMyFavoriteExpertIdsAction error:", error);
    return { success: false, error: "조회 중 오류가 발생했습니다." };
  }
}

/**
 * 접속한 페이지(userId)의 해당 전문가를 내가 즐겨찾기 했는지 확인
 */
export async function checkIsFavoriteExpertAction(expertId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: true, isFavorited: false };
    
    const userId = parseInt(session.user.id, 10);
    const existing = await prisma.favoriteExpert.findUnique({
      where: {
        userId_expertId: {
          userId,
          expertId,
        },
      },
    });

    return { success: true, isFavorited: !!existing };
  } catch (error) {
    return { success: false, isFavorited: false };
  }
}

/**
 * 현재 로그인한 유저가 즐겨찾기한 전문가 목록 상세 조회 (MY 전문가 리스트용)
 */
export async function getMyFavoriteExpertsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = parseInt(session.user.id, 10);

    const favorites = await prisma.favoriteExpert.findMany({
      where: { userId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            image: true,
            career: true,
            grade: true,
            regions: true,
            specialties: true,
            profile: {
              select: {
                rating: true,
                reviewCount: true,
                introduction: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, data: favorites.map(f => f.expert) };
  } catch (error: any) {
    console.error("getMyFavoriteExpertsAction error:", error);
    return { success: false, error: "즐겨찾기 전문가 목록을 가져오는 데 실패했습니다." };
  }
}
