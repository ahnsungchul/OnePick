export interface MockEstimate {
  id: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
  location: string; // e.g., "서울특별시 강남구 역삼동"
}

export const MOCK_ESTIMATES: MockEstimate[] = [
  // 강남구 역삼동 (밀집)
  { id: '1', category: '청소', status: '요청중', lat: 37.4979, lng: 127.0276, location: '서울특별시 강남구 역삼동' },
  { id: '2', category: '이사', status: '견적중', lat: 37.4985, lng: 127.0280, location: '서울특별시 강남구 역삼동' },
  { id: '3', category: '인테리어', status: '요청중', lat: 37.4970, lng: 127.0260, location: '서울특별시 강남구 역삼동' },
  { id: '4', category: '청소', status: '요청중', lat: 37.4990, lng: 127.0290, location: '서울특별시 강남구 역삼동' },
  
  // 강남구 논현동
  { id: '5', category: '기타', status: '견적중', lat: 37.5100, lng: 127.0300, location: '서울특별시 강남구 논현동' },
  { id: '6', category: '청소', status: '요청중', lat: 37.5110, lng: 127.0310, location: '서울특별시 강남구 논현동' },

  // 서초구 서초동
  { id: '7', category: '청소', status: '요청중', lat: 37.4950, lng: 127.0150, location: '서울특별시 서초구 서초동' },
  { id: '8', category: '이사', status: '견적중', lat: 37.4960, lng: 127.0160, location: '서울특별시 서초구 서초동' },
  { id: '9', category: '인테리어', status: '요청중', lat: 37.4940, lng: 127.0140, location: '서울특별시 서초구 서초동' },

  // 송파구 잠실동
  { id: '10', category: '청소', status: '요청중', lat: 37.5133, lng: 127.1000, location: '서울특별시 송파구 잠실동' },
  { id: '11', category: '이사', status: '견적중', lat: 37.5140, lng: 127.1010, location: '서울특별시 송파구 잠실동' },

  // 경기도 성남시 분당구
  { id: '12', category: '청소', status: '요청중', lat: 37.3827, lng: 127.1189, location: '경기도 성남시 분당구 삼평동' },
  { id: '13', category: '이사', status: '견적중', lat: 37.3830, lng: 127.1190, location: '경기도 성남시 분당구 삼평동' },
  { id: '14', category: '설치', status: '요청중', lat: 37.3800, lng: 127.1150, location: '경기도 성남시 분당구 정자동' },

  // 경기도 수원시 영통구
  { id: '15', category: '청소', status: '견적중', lat: 37.2636, lng: 127.0286, location: '경기도 수원시 팔달구 인계동' },
  { id: '16', category: '이사', status: '요청중', lat: 37.2640, lng: 127.0290, location: '경기도 수원시 팔달구 인계동' },
];

export function getGroupedEstimates(zoom: number) {
  // Zoom Level thresholds (임의 기준: 네이버 지도 기준 14 미만이면 클러스터링 적용)
  // 14 이상: 개별 (그룹 리턴 안함)
  // 12 ~ 13: 동 단위
  // 10 ~ 11: 구 단위
  // 8 ~ 9: 시 단위
  // 7 이하: 도 단위
  
  if (zoom >= 14) return null;

  const groups: Record<string, { count: number; lat: number; lng: number; title: string }> = {};

  MOCK_ESTIMATES.forEach(est => {
    const parts = est.location.split(' ');
    // parts[0]: 도/특별시
    // parts[1]: 시/구
    // parts[2]: 구/동

    let key = '';
    let title = '';

    if (zoom <= 7) {
      // 10km 이상 -> 도 단위
      key = parts[0];
      title = parts[0];
    } else if (zoom <= 9) {
      // 3km ~ 10km -> 시 단위
      // 일부 지역은 시가 없고 구만 있을 수 있으나 단순화를 위해 분기
      const siPart = parts[0]; // 서울특별시 등 광역 단위
      key = siPart;
      title = siPart;
    } else if (zoom <= 11) {
      // 1km ~ 3km -> 구 단위
      key = parts[0] + ' ' + (parts[1] || '');
      title = parts[1] || parts[0];
    } else if (zoom <= 13) {
      // 300m ~ 1km -> 동 단위
      key = parts[0] + ' ' + (parts[1] || '') + ' ' + (parts[2] || '');
      title = parts[2] || parts[1] || parts[0];
    }

    if (!groups[key]) {
      groups[key] = { count: 0, lat: 0, lng: 0, title };
    }
    groups[key].count++;
    // 중심 좌표를 위해 좌표 합산 (나중에 평균 계산)
    groups[key].lat += est.lat;
    groups[key].lng += est.lng;
  });

  // 평균 좌표 계산
  return Object.values(groups).map(g => ({
    count: g.count,
    lat: g.lat / g.count,
    lng: g.lng / g.count,
    title: g.title,
  }));
}
