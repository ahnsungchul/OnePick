'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

export interface CategoryData {
  id: number;
  name: string;
  order: number;
  subcategories: {
    id: number;
    name: string;
    order: number;
  }[];
}

export async function getCategoriesAction(): Promise<{ success: boolean; data?: CategoryData[]; error?: string }> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    const parsed = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      order: cat.order,
      subcategories: cat.services.map((svc) => ({
        id: svc.id,
        name: svc.name,
        order: svc.order,
      })),
    }));

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { success: false, error: '카테고리 정보를 불러오는 데 실패했습니다.' };
  }
}
