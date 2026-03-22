import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 이름 마스킹 (익명 처리)
 * @param name 이름
 * @returns 마스킹된 이름 (예: 홍길동 -> 홍*동)
 */
export const maskName = (name?: string) => {
  if (!name) return "고객";
  
  const isKorean = /^[가-힣]{2,4}$/.test(name);
  if (isKorean) {
    if (name.length === 2) return name[0] + "*";
    if (name.length === 3) return name[0] + "*" + name[2];
    if (name.length === 4) return name[0] + "**" + name[3];
  }
  
  if (name.length > 3) {
    const visibleLen = Math.max(2, Math.floor(name.length / 3));
    return name.substring(0, visibleLen) + "*".repeat(name.length - visibleLen);
  }
  
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*" + name[2];
};

/**
 * 연락처 마스킹
 * @param contact 연락처 (예: 010-1234-5678)
 * @returns 마스킹된 연락처 (예: 010-****-5678)
 */
export const maskContact = (contact?: string) => {
  if (!contact) return "연락처 비공개";
  
  // 010-1234-5678 또는 01012345678 형태 대응
  const cleaned = contact.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return contact; // 형식이 맞지 않으면 그대로 반환

  if (cleaned.length === 11) {
    // 010-1234-5678
    return `${cleaned.substring(0, 3)}-****-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    // 010-123-4567
    return `${cleaned.substring(0, 3)}-***-${cleaned.substring(6)}`;
  }
  
  return contact;
};

/**
 * 주소 마스킹 (구/동/아파트까지만 노출)
 * @param address 전체 주소
 * @returns 요약된 주소 (예: 서울특별시 강남구 역삼동 한양아파트 101동 -> 강남구 역삼동 한양아파트)
 */
export const maskAddress = (address?: string) => {
  if (!address) return "주소 정보 없음";
  
  const parts = address.split(' ');
  // "서울특별시 강남구 역삼동 한양아파트 101동 1004호"
  // 보통 시/도(0), 구(1), 동(2), 아파트(3) 순서라고 가정
  
  // 시/도(서울)를 제외하고 구/동/아파트까지만 가져옴
  // "강남구 역삼동 한양아파트" 정도가 적당함
  
  let masked = "";
  let count = 0;
  
  for (const part of parts) {
    // 시/도는 제외 (서울, 경기도 등)
    if (part.endsWith('시') || part.endsWith('도')) continue;
    
    masked += part + " ";
    count++;
    
    // 구, 동, 아파트/건물명 까지만 포함 (최대 3~4단어)
    if (count >= 3) break;
  }
  
  return masked.trim() || address;
};

/**
 * 카테고리명 한글 변환 (case-insensitive)
 * @param category 영문 또는 한글 카테고리명
 * @returns 변환된 한글 카테고리명
 */
export const categoryMap: Record<string, string> = {
  '도배/장판': '도배/장판',
  '욕실/주방': '욕실/주방',
  '전기/조명': '전기/조명',
  '청소/이사': '청소/이사',
  '가전/에어컨': '가전/에어컨',
  '자동차 수리': '자동차 수리',
  '베이비/펫시터': '베이비/펫시터',
  '과외/레슨': '과외/레슨',
  '디자인/IT': '디자인/IT',
  '기타 서비스': '기타 서비스',
  'CLEANING': '청소/이사',
  'REPAIR': '기타 서비스',
  'MOVING': '청소/이사',
  'LESSON': '과외/레슨',
  'INTERIOR': '도배/장판',
  'KITCHEN': '욕실/주방',
  'BATHROOM': '욕실/주방',
  'ELECTRIC': '전기/조명',
  'LIGHTING': '전기/조명',
  'APPLIANCE': '가전/에어컨',
  'CAR': '자동차 수리',
  'SITTER': '베이비/펫시터',
  'DESIGN': '디자인/IT',
  'TECH': '디자인/IT',
  'ETC': '기타 서비스',
  'OTHER': '기타 서비스',
};

export const formatCategory = (category?: string) => {
  if (!category) return "기타";
  
  const trimmed = category.trim();
  // 1. 그대로 매칭되는지 확인 (한글 등)
  if (categoryMap[trimmed]) return categoryMap[trimmed];
  
  // 2. 대문자로 변환하여 매칭 시도 (영문)
  const upper = trimmed.toUpperCase();
  if (categoryMap[upper]) return categoryMap[upper];
  
  return trimmed;
};

/**
 * 특정 한글 카테고리명에 해당하는 모든 원본(영문/한글) 키 목록을 반환합니다.
 * DB 쿼리 필터링 시 사용합니다.
 */
export const getReverseCategoryMap = (targetKoreanName: string): string[] => {
  const keys: string[] = [];
  
  // 1. 직접 매칭되는 키 (자기 자신 포함)
  keys.push(targetKoreanName);
  
  // 2. 맵을 순회하며 대상 한글명으로 변환되는 모든 키 추출
  Object.entries(categoryMap).forEach(([key, value]) => {
    if (value === targetKoreanName && key !== targetKoreanName) {
      keys.push(key);
    }
  });
  
  return Array.from(new Set(keys));
};

/**
 * D-Day 계산 (생성일로부터 7일 기준)
 * @param createdAt 생성일
 * @returns 마킹 텍스트 (e.g., D-7, D-Day, 만료) 및 색상 타입
 */
export const calculateDDay = (createdAt: string | Date) => {
  const createdDate = new Date(createdAt);
  const deadline = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  
  // 시간/분/초 제외하고 일 단위로만 계산
  const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineReset = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  
  const diffTime = deadlineReset.getTime() - todayReset.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return { label: `마감 D-${diffDays}`, isUrgent: diffDays <= 2 };
  if (diffDays === 0) return { label: '오늘까지', isUrgent: true };
  return { label: '요청 마감', isUrgent: false };
};
