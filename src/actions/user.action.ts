"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 전문가 전문 분야 및 추가 정보 업데이트
 */
export async function updateExpertInfoAction({
  userId,
  specialties,
}: {
  userId: number;
  specialties: string[];
}) {
  try {
    console.log('[DEBUG] updateExpertInfoAction starting for userId:', userId, 'specialties:', specialties);
    
    // 강제 타입 캐스팅으로 빌드 오류 방지 및 실시간 반영 확인
    const updatedUser = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        specialties: {
          set: specialties
        },
      },
    });

    console.log('[DEBUG] updateExpertInfoAction success:', updatedUser.id);

    revalidatePath("/(user)/estimate/[id]"); // 명확한 경로가 아니면 일반적인 관련 경로
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error("updateExpertInfoAction error:", error);
    return { success: false, error: error.message || "전문 분야 저장 중 오류가 발생했습니다." };
  }
}
