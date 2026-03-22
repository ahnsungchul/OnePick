'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * 즐겨찾기 상태를 토글합니다.
 */
export async function toggleBookmarkAction(estimateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = parseInt(session.user.id);
    
    // 이미 즐겨찾기 되어있는지 확인
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_estimateId: {
          userId,
          estimateId,
        },
      },
    });

    if (existing) {
      // 존재하면 삭제 (즐겨찾기 취소)
      await prisma.bookmark.delete({
        where: {
          id: existing.id,
        },
      });
      revalidatePath("/estimate");
      revalidatePath("/expert/bookmarks");
      return { success: true, bookmarked: false };
    } else {
      // 존재하지 않으면 생성 (즐겨찾기 추가)
      await prisma.bookmark.create({
        data: {
          userId,
          estimateId,
        },
      });
      revalidatePath("/estimate");
      revalidatePath("/expert/bookmarks");
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    console.error("Error in toggleBookmarkAction:", error);
    return { success: false, error: "즐겨찾기 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 내 즐겨찾기 목록을 가져옵니다.
 */
export async function getMyBookmarksAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = parseInt(session.user.id);

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        estimate: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { 
      success: true, 
      data: bookmarks.map((b) => ({
        ...b.estimate,
        isBookmarked: true, // 목록조회시 항상 true
      })) 
    };
  } catch (error) {
    console.error("Error in getMyBookmarksAction:", error);
    return { success: false, error: "즐겨찾기 목록을 가져오는 중 오류가 발생했습니다." };
  }
}

/**
 * 로그인한 사용자의 모든 즐겨찾기 ID 목록을 가져옵니다. (리스트 UI에서 상태 표시용)
 */
export async function getMyBookmarkIdsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: true, data: [] };

    const userId = parseInt(session.user.id);
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { estimateId: true },
    });

    return { success: true, data: bookmarks.map(b => b.estimateId) };
  } catch (error) {
    return { success: false, error: "오류 발생" };
  }
}
