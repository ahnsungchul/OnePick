'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getExpertSchedulesAction(expertId: number) {
  try {
    const manualSchedules = await prisma.schedule.findMany({
      where: { expertId },
      orderBy: { date: 'asc' },
    });

    const bids = await prisma.bid.findMany({
      where: {
        expertId,
        OR: [
          { status: 'PENDING', estimate: { status: 'BIDDING' }, availableDate: { not: null } },
          { status: 'ACCEPTED', estimate: { selectedDate: { not: null } } }
        ]
      },
      include: {
        estimate: {
          select: { id: true, details: true, location: true, category: true, selectedDate: true, requestNumber: true, status: true, customer: { select: { name: true } } }
        },
      },
    });

    const schedules = [
      ...manualSchedules.map((s) => ({
        id: s.id,
        date: s.date, // Expected "YYYY-MM-DD"
        title: s.title,
        content: s.content || '',
        type: s.isHoliday ? 'HOLIDAY' : 'CUSTOM',
      })),
      ...bids.flatMap((b) => {
        const isConfirmed = b.status === 'ACCEPTED';
        
        let allDatesStr = '';
        if (isConfirmed && b.estimate.selectedDate) {
           allDatesStr = b.estimate.selectedDate;
        } else if (!isConfirmed && b.availableDate) {
           allDatesStr = b.availableDate;
        }

        if (!allDatesStr) return [];

        const items: any[] = [];
        const rawDates = allDatesStr.split(',').map(d => d.trim());
        const reqNum = b.estimate.requestNumber || 'No#';
        const displayStatus = isConfirmed ? '확정' : '입찰중';

        rawDates.forEach((d, idx) => {
          let cleanDate = d;
          const match = d.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/);
          if (match) {
            cleanDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          }

          items.push({
            id: `auto-${b.id}-${idx}`,
            date: cleanDate,
            title: `[${displayStatus}] ${b.estimate.category?.name || '카테고리 없음'}`,
            content: b.estimate.details,
            type: 'AUTO',
            estimateId: b.estimate.id,
            isConfirmed,
          });
        });
        return items;
      })
    ];

    return { success: true, data: schedules };
  } catch (error: any) {
    console.error('getExpertSchedulesAction error:', error);
    return { success: false, error: '스케줄을 불러오는데 실패했습니다.' };
  }
}

export async function addCustomScheduleAction(data: {
  expertId: number;
  date: string; // "YYYY-MM-DD"
  title: string;
  content?: string;
  isHoliday?: boolean;
}) {
  try {
    const newSchedule = await prisma.schedule.create({
      data: {
        expertId: data.expertId,
        date: data.date,
        title: data.title,
        content: data.content,
        isHoliday: data.isHoliday || false,
      },
    });
    revalidatePath('/expert/gallery');
    revalidatePath('/expert/dashboard');
    return { success: true, data: newSchedule };
  } catch (error: any) {
    console.error('addCustomScheduleAction error:', error);
    return { success: false, error: '일정 추가에 실패했습니다.' };
  }
}

export async function deleteCustomScheduleAction(scheduleId: string) {
  try {
    await prisma.schedule.delete({
      where: { id: scheduleId },
    });
    revalidatePath('/expert/gallery');
    revalidatePath('/expert/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCustomScheduleAction error:', error);
    return { success: false, error: '일정 삭제에 실패했습니다.' };
  }
}

export async function getScheduleDetailAction(estimateId: string, expertId: number) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        customer: { select: { name: true } },
        category: true,
        services: true,
      }
    });

    const bid = await prisma.bid.findFirst({
      where: { estimateId, expertId },
      include: { items: true }
    });

    if (!estimate || !bid) {
      return { success: false, error: '상세 정보를 찾을 수 없습니다.' };
    }

    return { success: true, data: { estimate, bid } };
  } catch (error: any) {
    console.error('getScheduleDetailAction error:', error);
    return { success: false, error: '스케줄 상세 정보를 불러오는데 실패했습니다.' };
  }
}

