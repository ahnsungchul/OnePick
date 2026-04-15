'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * 시스템 설정값을 가져옵니다. 값이 없으면 지정한 기본값을 DB에 새로 생성합니다.
 */
export async function getSystemConfig(key: string, defaultValue?: string | number): Promise<string | number | undefined> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });

    if (config) {
      // 값 반환시, 숫자 형태면 숫자로 변환 (결제 금액 등)
      if (!isNaN(Number(config.value)) && config.value.trim() !== '') {
        return Number(config.value);
      }
      return config.value;
    }

    // DB에 없는 경우 기본값이 제공되었다면 Upsert
    if (defaultValue !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: {},
        create: {
          key,
          value: String(defaultValue),
          description: `Auto-generated default for ${key}`
        }
      });
      return defaultValue;
    }

    return undefined;
  } catch (error) {
    console.error(`Error fetching system config (${key}):`, error);
    return defaultValue;
  }
}

/**
 * 모든 시스템 설정값을 조회합니다. 관리자용.
 */
export async function getAllSystemConfigs() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    });
    return { success: true, data: configs };
  } catch (error) {
    console.error("Error fetching all configs:", error);
    return { success: false, error: "설정을 불러오는데 실패했습니다." };
  }
}

/**
 * 특정 시스템 설정값을 생성 또는 수정합니다.
 */
export async function updateSystemConfig(key: string, value: string | number, description?: string) {
  try {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        ...(description !== undefined && { description })
      },
      create: {
        key,
        value: String(value),
        description: description || ''
      }
    });

    // 설정 변경사항이 즉각 반영될 수 있도록 캐시 초기화
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error(`Error updating system config (${key}):`, error);
    return { success: false, error: "설정 업데이트에 실패했습니다." };
  }
}
