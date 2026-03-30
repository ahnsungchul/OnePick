"use server";

import prisma from "@/lib/prisma";
import { UserRole, ExpertGrade } from "@/generated/prisma";

/**
 * 사용자 정보, 계정 연동, 전문 분야 등을 한 번에 등록하는 원자적 회원가입 액션
 */
export async function registerUserAction({
  email,
  name,
  role,
  specialties = [],
  regions = [],
  idCardUrl = null,
  businessLicenseUrls = [],
  certificationUrls = [],
}: {
  email: string;
  name: string;
  role: string;
  specialties?: string[];
  regions?: string[];
  idCardUrl?: string | null;
  businessLicenseUrls?: string[];
  certificationUrls?: string[];
}) {
  try {
    // 1. 이미 존재하는 유저인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "이미 가입된 이메일입니다." };
    }

    // 2. 트랜잭션으로 유저 및 계정 생성 (원자성 보장)
    const result = await prisma.$transaction(async (tx) => {
      const normalizedRole = (role.toUpperCase() as UserRole) || UserRole.USER;
      const initialGrade = null;

      console.log("Creating user with role:", normalizedRole);
      const categoryRecords = await tx.category.findMany({
        where: { name: { in: specialties } }
      });

      const newUser = await (tx.user as any).create({
        data: {
          email,
          name,
          role: normalizedRole,
          specialties: {
            connect: categoryRecords.map(c => ({ id: c.id }))
          },
          regions: regions,
          grade: initialGrade,
          idCardUrl,
          businessLicenseUrls,
          ...(certificationUrls && certificationUrls.length > 0 && {
            certifications: {
              create: certificationUrls.map(url => ({
                name: url,
                isApproved: false,
              }))
            }
          }),
        },
      });

      console.log("User created successfully, ID:", newUser.id);

      const newAccount = await tx.account.create({
        data: {
          userId: newUser.id,
          type: "oauth",
          provider: "kakao",
          providerAccountId: `mock-kakao-id-${newUser.id}-${Date.now()}`, // 더 확실한 유니크 보장
        },
      });

      console.log("Account created successfully, Account ID:", newAccount.id);

      return newUser;
    });

    return { success: true, user: result };
  } catch (error: any) {
    console.error("registerUserAction error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    let userMessage = "회원 등록 중 오류가 발생했습니다.";
    if (error.code === 'P2002') {
      userMessage = "이미 가입된 정보가 있습니다. (중복 오류)";
    }
    
    return { success: false, error: `${userMessage} [${error.message || "알 수 없는 오류"}]` };
  }
}
