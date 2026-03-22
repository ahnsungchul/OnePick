import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key 검사
const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Google Gemini API Key is missing. Please set GOOGLE_AI_API_KEY in .env');
}

// GoogleGenerativeAI 인스턴스 초기화
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, location, details } = body;

    // 입력값 검증 (details는 실제 고객이 작성한 요청 내용)
    if (!details) {
      return NextResponse.json(
        { success: false, message: '분석할 요청 내용(details)이 필요합니다.' },
        { status: 400 }
      );
    }

    // Gemini 모델 가져오기 (1.5-flash 모델 권장)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // AI에게 지시할 프롬프트 구조화
    const prompt = `
당신은 '원픽(OnePick)' 플랫폼의 전문가 매칭 AI 어시스턴트입니다.
고객의 견적 요청 내용을 분석하여, 전문가가 한눈에 파악하기 쉽게 핵심만 요약해주세요.

[고객 요청 데이터]
- 카테고리: ${category || '미지정'}
- 위치: ${location || '미지정'}
- 상세 내용: ${details}

[출력 요구사항]
다음 형식의 순수 JSON 포맷으로만 응답해주세요. (마크다운 블록 \`\`\`json 등을 제외하고 순수 JSON 객체만 반환)
{
  "summaryPoints": [
    "핵심 요구사항 1번 (명사형이나 짧은 문장으로)",
    "핵심 요구사항 2번",
    "핵심 요구사항 3번"
  ],
  "difficulty": "하|중|상|최상 중 하나 선택",
  "reason": "해당 난이도를 책정한 이유 (1문장)"
}
`;

    // AI에게 프롬프트 전송 및 응답 대기
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // AI의 응답 텍스트가 마크다운 코드 블록 등으로 감싸져 있을 수 있으므로 예외 처리
    let parsedData;
    try {
      // 불필요한 마크다운 코드 틱(```json, ```) 제거
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text);
      throw new Error('AI의 응답을 JSON으로 변환할 수 없습니다.');
    }

    // 성공적으로 파싱된 데이터를 클라이언트로 반환
    return NextResponse.json({
      success: true,
      data: parsedData,
    });

  } catch (error) {
    console.error('Estimate Analysis Error:', error);
    return NextResponse.json(
      { success: false, message: 'AI 견적 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
