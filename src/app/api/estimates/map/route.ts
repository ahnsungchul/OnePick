import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const estimates = await prisma.estimate.findMany({
      select: {
        id: true,
        location: true,
        status: true,
        category: {
          select: { name: true }
        }
      },
      take: 200, // 최대 200개 마커로 제한 (지오코딩 성능 고려)
      orderBy: { createdAt: 'desc' }
    });
    
    // 매핑: { id, category, status, location }
    const mapped = estimates.map(e => ({
      id: e.id,
      category: e.category?.name || '기타',
      status: e.status === 'PENDING' ? '요청중' : e.status === 'BIDDING' ? '견적중' : '진행중',
      location: e.location,
    }));
    // 활성화된 카테고리 목록 가져오기
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { name: true }
    });

    return NextResponse.json({
      estimates: mapped,
      categories: categories.map(c => c.name)
    });
  } catch (error) {
    console.error("Failed to fetch map estimates:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
