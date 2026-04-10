import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    let userRegion: string | null = null;
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id, 10) },
        select: { regions: true }
      });
      if (dbUser?.regions && dbUser.regions.length > 0) {
        userRegion = dbUser.regions[0];
      }
    }

    const estimates = await prisma.estimate.findMany({
      where: {
        designatedExpertId: null,
        status: { in: ['PENDING', 'BIDDING'] }
      },
      select: {
        id: true,
        location: true,
        status: true,
        details: true,
        createdAt: true,
        requestNumber: true,
        category: {
          select: { name: true }
        }
      },
      take: 200, // 최대 200개 마커로 제한 (지오코딩 성능 고려)
      orderBy: { createdAt: 'desc' }
    });
    
    // 매핑: { id, category, status, location, details, createdAt, requestNumber }
    const mapped = estimates.map(e => ({
      id: e.id,
      category: e.category?.name || '기타',
      status: e.status === 'PENDING' ? '요청중' : e.status === 'BIDDING' ? '견적중' : '진행중',
      location: e.location,
      details: e.details,
      createdAt: e.createdAt,
      requestNumber: e.requestNumber,
    }));
    // 활성화된 카테고리 목록 가져오기
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { name: true }
    });

    return NextResponse.json({
      estimates: mapped,
      categories: categories.map(c => c.name),
      userRegion,
      isLoggedIn: !!session?.user?.id
    });
  } catch (error) {
    console.error("Failed to fetch map estimates:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
