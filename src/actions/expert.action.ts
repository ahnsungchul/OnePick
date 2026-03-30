"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

/**
 * 전문가 전문 분야 및 추가 정보 업데이트 (V2)
 */
export async function updateExpertSpecialtiesAction({
  userId,
  specialties,
}: {
  userId: number;
  specialties: string[];
}) {
  try {
    console.log('[DEBUG] updateExpertSpecialtiesAction V2 starting for userId:', userId);
    
    const categoryRecords = await (prisma.category as any).findMany({
      where: { name: { in: specialties } }
    });

    // 강제 타입 캐스팅으로 빌드 오류 방지 및 실시간 반영 확인
    const updatedUser = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        specialties: {
          set: [],
          connect: categoryRecords.map((c: any) => ({ id: c.id }))
        },
      },
    });

    console.log('[DEBUG] updateExpertSpecialtiesAction V2 success for id:', updatedUser.id);
    
    revalidatePath("/(user)/estimate/[id]");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error("updateExpertSpecialtiesAction V2 error:", error);
    return { success: false, error: error.message || "전문 분야 저장 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 홈 데이타 조회 (홈/전문가홈)
 */
export async function getExpertHomeDataAction(userId: number) {
  try {
    // Guest Mode (userId 0)
    if (userId === 0) {
       return {
         success: true,
         data: {
           user: {
             id: 0,
             name: "GUEST",
             role: "USER" as any,
             grade: "HELPER" as any,
             isApproved: false,
             idCardApproved: false,
             businessLicenseApproved: false,
             certifications: [],
             image: null,
           },
           profile: {
             introduction: "방문자 모드로 조회 중입니다. 로그인하시면 더 많은 기능을 이용하실 수 있습니다.",
             portfolioUrl: null,
             rating: 4.5,
           },
           stats: {
             totalBids: 120,
             matches: 45,
             revenue: 1250000,
           }
         }
       };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        specialties: true,
        certifications: true,
      },
    });

    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    // 통계 데이타 가공 (예시 데이타 포함)
    const stats = {
      totalBids: 0, // 나중에 Bid 테이블 카운트
      matches: 0,
      revenue: 0,
    };

    return { 
      success: true, 
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          grade: user.grade,
          isApproved: (user as any).isApproved,
          idCardApproved: (user as any).idCardApproved,
          businessLicenseApproved: (user as any).businessLicenseApproved,
          image: user.image,
          specialties: (user as any).specialties?.map((s: any) => s.name) || [],
          regions: user.regions || [],
          career: user.career,
          idCardUrl: user.idCardUrl,
          businessLicenseUrls: user.businessLicenseUrls || [],
          certifications: user.certifications || [],
        },
        profile: user.profile || {
          introduction: "",
          portfolioUrl: null,
          rating: 0,
        },
        stats
      } 
    };
  } catch (error: any) {
    console.error("getExpertHomeDataAction error:", error);
    return { success: false, error: error.message || "정보를 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 프로필(소개) 업데이트
 */
export async function updateExpertProfileAction(userId: number, introduction: string) {
  try {
    const updatedProfile = await prisma.profile.upsert({
      where: { expertId: userId },
      update: { introduction },
      create: {
        expertId: userId,
        introduction,
      },
    });

    revalidatePath("/expert/dashboard");
    return { success: true, profile: updatedProfile };
  } catch (error: any) {
    console.error("updateExpertProfileAction error:", error);
    return { success: false, error: error.message || "프로필 저장 중 오류가 발생했습니다." };
  }
}

/**
 * 추천 전문가 목록을 가져옵니다 (role이 EXPERT 또는 BOTH).
 */
export async function getRecommendedExpertsAction() {
  try {
    const experts = await prisma.user.findMany({
      where: {
        role: { in: ['EXPERT', 'BOTH'] }
      },
      include: {
        profile: true,
        specialties: true
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedExperts = experts.map((expert: any) => {
      const allCategoryNames = expert.specialties?.map((s: any) => s.name) || [];
      const joinedSpecialties = allCategoryNames.length > 0 ? allCategoryNames.join(', ') : '전문 서비스';
      
      let formattedCareer = '신입';
      if (expert.career && expert.career !== '경력 미입력' && expert.career !== '신입') {
        const yearMatch = expert.career.match(/(\d{4})년/);
        const monthMatch = expert.career.match(/(\d{1,2})월/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1], 10);
          const month = monthMatch ? parseInt(monthMatch[1], 10) : 1;
          const now = new Date();
          const monthsDiff = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
          const yearOfExp = monthsDiff >= 0 ? Math.floor(monthsDiff / 12) + 1 : 1;
          formattedCareer = `경력 ${yearOfExp}년`;
        } else {
          formattedCareer = expert.career;
        }
      } else if (expert.career) {
        formattedCareer = expert.career;
      }

      return {
        id: expert.id,
        name: `${expert.name} 전문가`,
        specialty: joinedSpecialties,
        category: allCategoryNames.length > 0 ? allCategoryNames[0] : '기타 서비스',
        categories: allCategoryNames,
        region: '전국, 서울, 경기, 인천, 강원, 충북, 충남, 대전, 세종, 전북, 전남, 광주, 경북, 경남, 부산, 대구, 울산, 제주', 
        career: formattedCareer,
        rating: expert.profile?.rating || '5.0',
        reviews: Math.floor(Math.random() * 50) + 1,
        image: expert.image || `https://picsum.photos/seed/${expert.name || expert.id}/200/200`
      };
    });

    return { success: true, data: formattedExperts };
  } catch (error: any) {
    console.error("getRecommendedExpertsAction error:", error);
    return { success: false, error: error.message || "추천 전문가를 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 프로필 수정 모달에서 호출하는 통합 업데이트
 */
export async function updateFullExpertProfileAction({
  userId,
  image,
  name,
  regions,
  specialties,
  career,
  introduction,
  idCardUrl,
  businessLicenseUrls,
  certifications,
}: {
  userId: number;
  image?: string | null;
  name: string;
  regions: string[];
  specialties: string[];
  career?: string | null;
  introduction: string;
  idCardUrl?: string | null;
  businessLicenseUrls?: string[];
  certifications?: { id?: string; name: string; isApproved?: boolean }[];
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check current user
      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      
      // Determine if documents changed
      const idCardChanged = idCardUrl !== undefined && currentUser?.idCardUrl !== idCardUrl;
      const businessLicenseChanged = 
        businessLicenseUrls && JSON.stringify(currentUser?.businessLicenseUrls || []) !== JSON.stringify(businessLicenseUrls);

      const categoryRecords = await tx.category.findMany({ where: { name: { in: specialties } } });

      // 1. Update User info
      const user = await (tx.user as any).update({
        where: { id: userId },
        data: {
          name,
          regions: { set: regions },
          specialties: { 
            set: categoryRecords.map(c => ({ id: c.id }))
          },
          career,
          ...(image !== undefined && { image }),
          ...(idCardUrl !== undefined && { idCardUrl }),
          ...(businessLicenseUrls !== undefined && { businessLicenseUrls: { set: businessLicenseUrls } }),
          ...(idCardChanged ? { idCardApproved: false } : {}),
          ...(businessLicenseChanged ? { businessLicenseApproved: false } : {}),
        },
      });

      // 2. Handle Certifications
      if (certifications !== undefined) {
        const existingCerts = await tx.certification.findMany({ where: { userId } });
        const existingCertIds = existingCerts.map(c => c.id);
        const incomingCertIds = certifications.filter(c => c.id).map(c => c.id as string);
        
        // Find which to delete
        const toDeleteIds = existingCertIds.filter(id => !incomingCertIds.includes(id));
        if (toDeleteIds.length > 0) {
          await tx.certification.deleteMany({
            where: { id: { in: toDeleteIds } }
          });
        }
        
        // Add new certifications
        const newCerts = certifications.filter(c => !c.id);
        if (newCerts.length > 0) {
          await tx.certification.createMany({
            data: newCerts.map(c => ({
              userId,
              name: c.name,
              isApproved: false, // 새 자격증은 무조건 승인 false
            }))
          });
        }
      }

      // 3. Update or Create Profile intro
      const profile = await tx.profile.upsert({
        where: { expertId: userId },
        update: { introduction },
        create: {
          expertId: userId,
          introduction,
        },
      });

      return { user, profile };
    });

    revalidatePath("/expert/dashboard");
    revalidatePath("/(user)/estimate/[id]");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("updateFullExpertProfileAction error:", error);
    return { success: false, error: error.message || "프로필 정보 저장 중 오류가 발생했습니다." };
  }
}


/**
 * 전문가가 보낸 견적(입찰) 목록을 조회합니다 (보낸요청)
 */
export async function getExpertSentBidsAction(expertId: number) {
  try {
    const bids = await prisma.bid.findMany({
      where: { expertId },
      include: {
        items: true,
        estimate: {
          include: {
            customer: {
              select: { name: true, image: true }
            },
            chats: {
              select: { id: true, senderId: true, isRead: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: bids };
  } catch (error: any) {
    console.error("getExpertSentBidsAction error:", error);
    return { success: false, error: error.message || "보낸 견적 목록을 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 전송한 견적 금액과 메시지를 수정합니다.
 */
export async function updateBidAction({
  bidId,
  price,
  message,
  items,
  availableDate,
}: {
  bidId: string;
  price: number;
  message: string;
  items?: { name: string; content: string; period: string; amount: number }[];
  availableDate?: string;
}) {
  try {
    // Check if the bid is still pending
    const existingBid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { estimate: true }
    });

    if (!existingBid) {
      throw new Error("견적을 찾을 수 없습니다.");
    }
    
    // estimate status must be BIDDING, or bid status must be PENDING
    // Depending on logic, usually bid can be updated if not accepted/rejected yet.
    if (existingBid.status !== "PENDING") {
      throw new Error(`이미 처리된 견적(${existingBid.status})은 수정할 수 없습니다.`);
    }

    const updatedBid = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.update({
        where: { id: bidId },
        data: {
          price,
          message,
          availableDate,
        }
      });

      if (items && items.length > 0) {
        // 기존 아이템 삭제
        await tx.bidItem.deleteMany({
          where: { bidId }
        });

        // 새 아이템 추가
        for (const item of items) {
          await tx.bidItem.create({
            data: {
              bidId,
              name: item.name,
              content: item.content,
              period: item.period,
              amount: item.amount,
            }
          });
        }
      }

      return bid;
    });

    revalidatePath("/expert/bids");
    return { success: true, data: updatedBid };
  } catch (error: any) {
    console.error("updateBidAction error:", error);
    return { success: false, error: error.message || "견적 수정 중 오류가 발생했습니다." };
  }
}

/**
 * 전문가 일정 관리용 견적 목록을 조회합니다 (수락되거나 제출한 서비스 가능일 포함 전체).
 */
export async function getExpertSchedulesAction(expertId: number) {
  try {
    const bids = await prisma.bid.findMany({
      where: { 
        expertId,
        availableDate: { not: null }
      },
      include: {
        estimate: {
          select: { details: true, location: true, category: true, customer: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: bids };
  } catch (error: any) {
    console.error("getExpertSchedulesAction error:", error);
    return { success: false, error: error.message || "일정을 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 특정 서비스 가능일 목록이 이미 다른 일정과 겹치는지 확인합니다.
 */
export async function checkDateAvailabilityAction(expertId: number, dates: string[], excludeBidId?: string) {
  try {
    const bids = await prisma.bid.findMany({
      where: {
        expertId,
        availableDate: { not: null },
        ...(excludeBidId ? { id: { not: excludeBidId } } : {})
      }
    });

    const existingDates = new Set<string>();
    bids.forEach((bid: any) => {
      if (bid.availableDate) {
        bid.availableDate.split(',').forEach((d: string) => existingDates.add(d.trim()));
      }
    });

    const conflicts = dates.filter(d => existingDates.has(d.trim()));
    
    return { success: true, hasConflict: conflicts.length > 0, conflicts };
  } catch (error: any) {
    console.error("checkDateAvailabilityAction error:", error);
    return { success: false, error: error.message || "일정 중복 상태를 확인하는 중 오류가 발생했습니다." };
  }
}
/**
 * 고객의 견적 수정 요청 Action
 */
export async function requestBidModificationAction(bidId: string, customerId: number) {
  try {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { estimate: true }
    });

    if (!bid) {
      throw new Error("존재하지 않는 견적 제안입니다.");
    }

    if (bid.estimate.customerId !== customerId) {
      throw new Error("접근 권한이 없습니다.");
    }

    await prisma.bid.update({
      where: { id: bidId },
      data: { isEditRequested: true }
    });

    return { success: true };
  } catch (error: any) {
    console.error("requestBidModificationAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function createDirectEstimateAction(data: {
  expertId: number;
  category: string;
  location: string;
  serviceDate: string;
  details: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    const customerId = Number(session.user.id);
    const authorName = session.user.name;

    const result = await prisma.$transaction(async (tx) => {
      const categoryRecord = await tx.category.findUnique({ where: { name: data.category } });

      const estimate = await tx.estimate.create({
        data: {
          categoryId: categoryRecord?.id,
          location: data.location,
          serviceDate: data.serviceDate,
          details: data.details,
          customerId,
          authorName,
          status: 'PENDING',
          designatedExpertId: data.expertId,
          requestNumber: `REQ-${Date.now()}`
        }
      });

      const bid = await tx.bid.create({
        data: {
          estimateId: estimate.id,
          expertId: data.expertId,
          price: 0,
          status: 'PENDING',
        }
      });

      return { estimate, bid };
    });

    revalidatePath('/expert/requests');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('createDirectEstimateAction error:', error);
    return { success: false, error: '견적 요청 중 오류가 발생했습니다.' };
  }
}

export async function getExpertReceivedRequestsAction(expertId: number) {
  try {
    const bids = await prisma.bid.findMany({
      where: {
        expertId,
        estimate: {
          designatedExpertId: expertId
        }
      },
      include: {
        items: true,
        estimate: {
          include: {
            customer: {
              select: { name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: bids };
  } catch (error: any) {
    console.error('getExpertReceivedRequestsAction error:', error);
    return { success: false, error: '받은 요청 목록을 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 전문가 헤더 알림용: 새로운 메시지가 있는 참여한 견적의 개수를 가져옵니다.
 */
export async function getExpertUnreadMessageCountAction(expertId: number) {
  try {
    const bidsWithUnread = await prisma.bid.findMany({
      where: { expertId },
      include: {
        estimate: {
          select: {
            id: true,
            chats: {
              where: {
                senderId: { not: expertId },
                isRead: false
              },
              select: { id: true }
            }
          }
        }
      }
    });

    const unreadCount = bidsWithUnread.filter(b => b.estimate && b.estimate.chats && b.estimate.chats.length > 0).length;

    return { success: true, data: unreadCount };
  } catch (error: any) {
    console.error("getExpertUnreadMessageCountAction error:", error);
    return { success: false, data: 0 };
  }
}
