"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 1:1 문의 생성 (Create Inquiry)
 */
export async function createInquiryAction(userId: number, type: string, title: string, content: string, target: string = "USER") {
  try {
    if (!userId || !type || !title || !content) {
      throw new Error("필수 입력값이 누락되었습니다.");
    }

    console.log(">>> [support.action] Prisma available keys:", Object.keys(prisma).join(", "));
    console.log(">>> [support.action] typeof prisma.inquiry:", typeof (prisma as any).inquiry);
    
    if (!(prisma as any).inquiry) {
      const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
      throw new Error(`Prisma model 'inquiry' is missing. Available models: ${models.join(", ")}`);
    }

    const inquiry = await (prisma as any).inquiry.create({
      data: {
        userId,
        target,
        type,
        title,
        content,
      },
    });

    console.log(">>> [support.action] Inquiry created successfully:", inquiry.id);
    revalidatePath("/user/support"); // 전체 경로 재검증
    return { success: true, data: inquiry };
  } catch (error: any) {
    console.error(">>> [support.action] Error creating inquiry:", error);
    return { 
      success: false, 
      error: error.message || "문의 제출 중 알 수 없는 오류가 발생했습니다.",
      details: error.stack
    };
  }
}

/**
 * 내 문의 내역 조회 (Get My Inquiries)
 */
export async function getMyInquiriesAction(userId: number, target: string = "USER") {
  try {
    if (!userId) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    console.log(">>> [support.action] getMyInquiriesAction - typeof prisma.inquiry:", typeof (prisma as any).inquiry);
    if (!(prisma as any).inquiry) {
      throw new Error(`Prisma model 'inquiry' is missing. Available models: ${Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(", ")}`);
    }

    const inquiries = await (prisma as any).inquiry.findMany({
      where: { userId, target },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: inquiries };
  } catch (error: any) {
    console.error(">>> [support.action] Error fetching inquiries:", error);
    return { 
      success: false, 
      error: error.message || "문의 내역을 불러오는 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 신고 접수 (Create Report)
 */
export async function createReportAction(userId: number, targetId: string, reason: string, details: string) {
  try {
    if (!userId || !reason || !details) {
      throw new Error("필수 입력값이 누락되었습니다.");
    }

    console.log(">>> [support.action] createReportAction - typeof prisma.report:", typeof (prisma as any).report);
    if (!(prisma as any).report) {
      throw new Error(`Prisma model 'report' is missing. Available models: ${Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(", ")}`);
    }

    const report = await (prisma as any).report.create({
      data: {
        userId,
        targetId,
        reason,
        details,
      },
    });

    revalidatePath("/user/support/report");
    return { success: true, data: report };
  } catch (error: any) {
    console.error("Error creating report:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 공지사항 목록 조회 (Get Notices)
 */
export async function getNoticesAction() {
  try {
    const noticeModel = (prisma as any).notice || (prisma as any).Notice;
    if (!noticeModel) {
      throw new Error("Notice model not found in Prisma client");
    }
    const notices = await noticeModel.findMany({
      orderBy: { createdAt: "desc" },
    });
    const data = Array.isArray(notices) ? notices : [];
    console.log(`[getNoticesAction] Found ${data.length} notices`);
    return { success: true, data, count: data.length };
  } catch (error: any) {
    console.error("Error fetching notices:", error);
    return { success: false, error: error.message || "공지사항을 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * FAQ 목록 조회 (Get FAQs)
 */
export async function getFaqsAction(target: string = "USER") {
  try {
    const faqModel = (prisma as any).fAQ || (prisma as any).faq || (prisma as any).FAQ;
    if (!faqModel) {
      throw new Error("FAQ model not found in Prisma client");
    }
    const faqs = await faqModel.findMany({
      where: { target },
      orderBy: { id: "asc" },
    });
    const data = Array.isArray(faqs) ? faqs : [];
    console.log(`[getFaqsAction] Found ${data.length} faqs for target ${target}`);
    return { success: true, data, count: data.length };
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    return { success: false, error: error.message || "FAQ를 불러오는 중 오류가 발생했습니다." };
  }
}

/**
 * 초기 데이터 시딩 (Seed Support Data)
 */
export async function seedSupportDataAction() {
  try {
    // 공지사항 체크 및 시딩
    const noticeCount = await (prisma as any).notice.count();
    if (noticeCount === 0) {
      await (prisma as any).notice.createMany({
        data: [
          { 
            title: '[안내] 원픽 정기 점검 안내 (2024년 4월 20일)', 
            important: true,
            content: '안녕하세요, 원픽팀입니다.\n\n보다 안정적인 서비스 제공을 위해 정기 점검을 실시할 예정입니다.\n점검 시간에는 서비스 이용이 일시 중단되오니 모쪼록 너른 양해 부탁드립니다.\n\n■ 일시: 2024년 4월 20일(토) 02:00 ~ 06:00 (약 4시간)\n■ 대상: 원픽 웹/앱 서비스 전체\n■ 내용: 데이터베이스 최적화 및 보안 업데이트\n\n앞으로도 더 나은 서비스를 위해 최선을 다하겠습니다.\n감사합니다.'
          },
          { 
            title: '[이벤트] 봄맞이 전문가 리뷰 이벤트 안내', 
            important: false,
            content: '새봄을 맞아 전문가분들을 위한 특별한 이벤트를 준비했습니다!\n\n리뷰를 남겨주시는 모든 전문가분들께 포인트를 지급해 드립니다.\n\n■ 이벤트 기간: 4월 12일 ~ 5월 12일\n■ 참여 방법: 작업 완료 후 리뷰 작성 시 자동 응모\n■ 혜택: 베스트 리뷰어 10분께 50,000포인트 증정 / 참가자 전원 1,000포인트 지급\n\n많은 참여 부탁드립니다!'
          },
          { 
            title: '[공지] 개인정보 처리방침 변경 안내', 
            important: false,
            content: '원픽의 개인정보 처리방침이 일부 변경될 예정입니다.\n주요 변경 사항을 확인하시어 서비스 이용에 참고하시기 바랍니다.\n\n■ 개정 일자: 2024년 4월 17일\n■ 주요 내용: 제3자 정보 제공 동의 절차 간소화 및 수집 항목 구체화\n■ 문의: 고객센터 (1544-XXXX)\n\n변경된 내용은 원픽 홈페이지 하단에서 전문을 확인하실 수 있습니다.'
          },
          { 
            title: '[안내] 결제 모듈 시스템 고도화 작업 안내', 
            important: true,
            content: '더 빠르고 안전한 결제 환경을 위해 결제 시스템 고도화 작업을 진행합니다.\n\n■ 작업 일시: 4월 5일 오후 11시 ~ 4월 6일 오전 1시\n■ 영향: 일부 신용카드 및 간편결제 서비스 이용이 제한될 수 있습니다.\n\n서비스 이용에 불편을 드려 죄송합니다.'
          },
          { 
            title: '[이벤트] 신규 회원 가입 시 5,000 포인트 즉시 지급!', 
            important: false,
            content: '지금 원픽에 가입하시면 첫 시작을 응원하는 5,000포인트를 바로 드립니다!\n\n■ 대상: 원픽 신규 가입 회원 전원\n■ 기간: 상시 진행 (종료 시 별도 공지)\n■ 사용: 견적 요청 및 상담 시 자유롭게 사용 가능\n\n주변 지인들에게도 원픽을 추천해 주세요!'
          },
        ]
      });
    }

    // FAQ 체크 및 시딩
    const faqCount = await (prisma as any).fAQ.count();
    if (faqCount === 0) {
      await (prisma as any).fAQ.createMany({
        data: [
          { target: 'USER', category: '이용문의', question: '원픽은 어떤 서비스인가요?', answer: '원픽은 사용자의 필요에 딱 맞는 전문가를 연결해 드리는 매칭 플랫폼입니다. 간단한 요청서 작성을 통해 여러 전문가의 견적을 비교하고 최적의 파트너를 찾으실 수 있습니다.' },
          { target: 'USER', category: '결제/환불', question: '결제 취소 및 환불 규정은 어떻게 되나요?', answer: '서비스 유형에 따라 상이할 수 있으나, 일반적으로 서비스 시작 전에는 전액 환불이 가능합니다. 상세한 환불 규정은 마이페이지 > 결제 내역의 상세 보기에서 확인하실 수 있습니다.' },
          { target: 'USER', category: '계정관리', question: '전문가로 등록하고 싶습니다. 어떻게 하나요?', answer: '마이페이지 하단의 "전문가 전환" 버튼을 클릭하시거나, 회원가입 시 역할을 "전문가"로 선택하시면 됩니다. 전문가 등록 시 필요한 서류가 있을 수 있으니 가이드를 참고해 주세요.' },
          { target: 'USER', category: '이용문의', question: '요청서를 수정하거나 삭제할 수 있나요?', answer: '네, 마이페이지 > 내 요청 목록에서 진행 중인 요청서의 "수정" 또는 "삭제" 버튼을 통해 처리하실 수 있습니다. 단, 이미 전문가와 매칭이 완료된 경우 수정에 제한이 있을 수 있습니다.' },
          { target: 'USER', category: '기타', question: '비밀번호를 잊어버렸어요.', answer: '로그인 화면 하단의 "비밀번호 찾기" 링크를 통해 가입하신 이메일로 임시 비밀번호를 발송받으실 수 있습니다.' },
          { target: 'EXPERT', category: '이용문의', question: '견적서는 어떻게 작성하나요?', answer: '전문가홈 > 받은 요청 메뉴에서 고객의 요청서를 확인하고 견적서를 작성할 수 있습니다.' },
          { target: 'EXPERT', category: '정산/수수료', question: '정산은 언제 되나요?', answer: '고객이 서비스 완료를 확정하면 매주 수요일에 등록하신 계좌로 정산됩니다.' },
          { target: 'EXPERT', category: '계정관리', question: '포트폴리오는 어떻게 등록하나요?', answer: '전문가홈 > 포트폴리오 메뉴에서 새로운 작업물과 설명을 등록하실 수 있습니다.' },
          { target: 'EXPERT', category: '이용문의', question: '전문가 등급 기준은 무엇인가요?', answer: '평점, 응답률, 거래 완료 건수 등 다양한 지표를 종합하여 매월 1일 등급이 산정됩니다.' },
          { target: 'EXPERT', category: '기타문의', question: '고객과 연락이 닿지 않습니다.', answer: '안심번호가 만료되었거나 고객이 앱을 삭제했을 수 있습니다. 1:1 문의를 남겨주시면 확인해 드리겠습니다.' }
        ]
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error seeding support data:", error);
    return { success: false, error: error.message };
  }
}
