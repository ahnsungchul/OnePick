import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * 사용자 견적 요청서를 바탕으로 전문가용 핵심 요약을 생성합니다.
 */
export async function generateExpertSummary(details: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set.");
    return "요약 정보 없음";
  }

  const prompt = `
당신은 각 분야의 전문가들이 고객의 견적 요청을 빠르게 파악할 수 있도록 돕는 AI 어시스턴트입니다.
다음 고객의 견적 요청 상세 내용을 바탕으로, 전문가가 가장 중요하게 생각할 만한 '핵심 요약'을 3~4줄 이내 글머리 기호로 작성해주세요.

[고객 요청 상세 내용]
"${details}"

요약 형태:
- 핵심 요구사항:
- 제약/특이사항:
- 예상 소요기간/규모: (내용이 있다면)
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "요약 생성 실패";
  }
}
