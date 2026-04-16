'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import MapEstimateFullModal from '@/components/expert/MapEstimateFullModal';
import NewEstimateModal from '@/components/user/NewEstimateModal';
import { MapPin, Navigation, X, Plus, ChevronDown, ChevronUp, ChevronRight, Zap } from 'lucide-react';
import { regionData } from '@/lib/regions';
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

function getGroupedEstimates(zoom: number, targetEstimates: any[], isUrgentGroup: boolean = false) {
  // 1km 배율(zoom 13)보다 더 지도를 확대할 경우 마커를 표시하지 않음
  if (zoom > 13) return [];

  const groups: Record<string, { count: number; lat: number; lng: number; title: string, key: string, estimates: any[] }> = {};

  targetEstimates.forEach(est => {
    if (!est.lat || !est.lng) return;
    const parts = (est.location || '').split(' ');
    
    let key = '';
    let title = '';

    if (zoom >= 12 && isUrgentGroup) {
      // 3km(zoom 12), 1km(zoom 13) 배율에서 긴급 마커 거리 기반 클러스터링
      // 8제곱키로미터 면적 = 반경 약 1600미터 원과 유사함
      let foundKey = '';
      for (const [k, g] of Object.entries(groups)) {
        const centerLat = g.lat / g.count;
        const centerLng = g.lng / g.count;
        const dist = getDistance(centerLat, centerLng, est.lat, est.lng);
        if (dist <= 1600) {
          foundKey = k;
          break;
        }
      }

      if (foundKey) {
        key = foundKey;
        title = groups[foundKey].title;
      } else {
        key = 'URGENT_DIST_' + (est.id || est._id || Math.random().toString());
        title = parts[2] || parts[1] || parts[0] || '기타';
      }
    } else {
      if (zoom <= 7) {
        // 50km (zoom 7) : 전국 기준
        key = '대한민국 전체';
        title = '대한민국 전체';
      } else if (zoom <= 9) {
        // 30km (zoom 8), 20km (zoom 9) : 도 기준
        key = parts[0] || '기타';
        title = parts[0] || '기타';
      } else if (zoom >= 10 && zoom <= 11) {
        // 10km ~ 5km (zoom 10 ~ 11) : 시/군/구 기준
        key = parts[0] + ' ' + (parts[1] || '');
        title = parts[1] || parts[0] || '기타';
      } else {
        // 일반 마커는 3km, 1km 배율에서도 시/군/구 기준 유지
        key = [parts[0], parts[1]].filter(Boolean).join(' ');
        title = parts[1] || parts[0] || '기타';
      }
    }

    if (!groups[key]) {
      groups[key] = { count: 0, lat: 0, lng: 0, title, key, estimates: [] };
    }
    // 해당 시에 포함된 요청의 개수 합산
    groups[key].count++;
    groups[key].lat += est.lat;
    groups[key].lng += est.lng;
    groups[key].estimates.push(est);
  });

  if (Object.keys(groups).length === 0) return null;

  return Object.values(groups).map(g => ({
    count: g.count,
    lat: g.lat / g.count,
    lng: g.lng / g.count,
    title: g.title,
    key: g.key,
    estimates: g.estimates,
  }));
}

export default function EstimateMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(11);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체']);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [shuffledUrgentEstimates, setShuffledUrgentEstimates] = useState<any[]>([]);
  const [mapBounds, setMapBounds] = useState<any>(null);

  const urgentList = React.useMemo(() => {
    return estimates.filter(e => {
      if (!e.isUrgent) return false;
      if (!selectedCategories.includes('전체') && !selectedCategories.includes(e.category)) return false;
      
      // 현재 지도 화면 영역 내에 등록된 요청인지 확인 (없으면 미등록/전국 무관이므로 스킵 또는 일단 포함할 수 있으나, 마커 기준이면 필터)
      if (mapBounds && e.lat && e.lng) {
        if (typeof window !== 'undefined' && (window as any).naver && (window as any).naver.maps) {
          const latLng = new (window as any).naver.maps.LatLng(e.lat, e.lng);
          if (!mapBounds.hasLatLng(latLng)) return false;
        }
      }
      return true;
    });
  }, [estimates, selectedCategories, mapBounds]);

  React.useEffect(() => {
    setShuffledUrgentEstimates([...urgentList].sort(() => 0.5 - Math.random()));
  }, [urgentList]);
  
  // 맵 페이지 진입 시 전역 스크롤 방지 (최초 마운트 시 1회만 적용)
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // 사이드바 상태
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [radius, setRadius] = useState<number>(5000);

  // 모달 상태
  const [modalEstimateId, setModalEstimateId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  
  // 지역 선택 모달 상태
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');

  const handleRegionConfirm = () => {
    if (!selectedSido || !selectedSigungu) {
      alert("도/시와 시/군/구를 모두 선택해주세요.");
      return;
    }
    const query = selectedSido === '전국' ? '서울특별시' : `${selectedSido} ${selectedSigungu === '전체' ? '' : selectedSigungu}`.trim();
    
    (window as any).naver.maps.Service.geocode({ query }, (status: any, response: any) => {
      if (status === (window as any).naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
        const item = response.v2.addresses[0];
        const lat = parseFloat(item.y);
        const lng = parseFloat(item.x);
        
        if (mapInstanceRef.current) {
          const currentPos = new (window as any).naver.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(currentPos);
          mapInstanceRef.current.setZoom(11); // 지역은 보통 넓게 보여줌
          new (window as any).naver.maps.Marker({
            position: currentPos,
            map: mapInstanceRef.current,
            icon: {
              content: '<div class="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-md animate-bounce"></div>',
              anchor: new (window as any).naver.maps.Point(10, 10),
            }
          });
        }
      } else {
        alert("선택하신 지역의 위치를 찾을 수 없습니다.");
      }
    });

    setIsRegionModalOpen(false);
  };

  const handleEstimateClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setModalEstimateId(id);
    setIsModalOpen(true);
  };

  const handleCategoryToggle = (cat: string) => {
    if (cat === '전체') {
      setSelectedCategories(['전체']);
      return;
    }

    setSelectedCategories((prev) => {
      const isCurrentlySelected = prev.includes(cat);
      const prevWithoutAll = prev.filter(c => c !== '전체');

      let nextState;
      if (isCurrentlySelected) {
        nextState = prevWithoutAll.filter(c => c !== cat);
      } else {
        nextState = [...prevWithoutAll, cat];
      }

      // 아무것도 선택되지 않으면 '전체' 상태로 복귀
      if (nextState.length === 0) {
        return ['전체'];
      }
      return nextState;
    });
  };

  const nearbyEstimates = React.useMemo(() => {
    if (!selectedMarker) return [];
    
    // 현재 선택된 카테고리에 맞는 마커만 1차 필터링 & '진행중' 상태 제외
    const filtered = estimates.filter(e => 
      (selectedCategories.includes('전체') || selectedCategories.includes(e.category)) &&
      e.status !== '진행중'
    );

    // 그룹 마커(CLUSTER)를 클릭했을 경우, 정확히 해당 클러스터 텍스트(key)에 부합하는 요청들만 반환
    if (selectedMarker.id === 'CLUSTER') {
      let clusterFiltered = filtered;
      
      if (selectedMarker.key.startsWith('URGENT_DIST_')) {
        // 거리 기반 클러스터링된 긴급 마커의 경우
        const withDist = clusterFiltered.map(est => {
          const dist = getDistance(selectedMarker.lat, selectedMarker.lng, est.lat, est.lng);
          return { ...est, distance: dist };
        });
        clusterFiltered = withDist.filter(est => est.distance <= 1650);
      } else {
        clusterFiltered = selectedMarker.key === '대한민국 전체' 
          ? clusterFiltered 
          : clusterFiltered.filter(est => est.location && est.location.startsWith(selectedMarker.key));
      }
        
      if (selectedMarker.isUrgentCluster === true) {
        return clusterFiltered.filter(est => est.isUrgent);
      }
      return clusterFiltered;
    }

    const withDist = filtered.map(est => {
      const dist = getDistance(selectedMarker.lat, selectedMarker.lng, est.lat, est.lng);
      return { ...est, distance: dist };
    });

    // 개별 마커 (기본 반경 탐색 시)
    return withDist
      .filter(est => est.distance <= radius && est.id !== selectedMarker.id)
      .sort((a, b) => a.distance - b.distance);
  }, [selectedMarker, estimates, radius, selectedCategories, zoom]);

  const initMap = useCallback(() => {
    // 네이버 지도 API가 로드되었는지 체크
    if (typeof window !== 'undefined' && (window as any).naver && (window as any).naver.maps && !mapLoaded) {
      try {
        const mapOptions = {
          center: new (window as any).naver.maps.LatLng(37.4979, 127.0276), // 강남역 기본 좌표
          zoom: 11, // 초기 배율 5km (zoom 11)
          minZoom: 7, // 최소 배율 (축소 최대 제한) - 50km (zoom 7)
          maxZoom: 13, // 최대 배율 (확대 최대 제한) 1km 보다 작은 배율 불가
          mapDataControl: false,
          zoomControl: true, // 배율 조절 컨트롤 추가
          zoomControlOptions: {
            position: (window as any).naver.maps.Position.RIGHT_CENTER,
          },
        };
        // 공식 문서와 똑같이 'map' 이라는 ID를 직접 넘기도록 수정
        const map = new (window as any).naver.maps.Map('map', mapOptions);
        mapInstanceRef.current = map;
        setZoom(map.getZoom());

        // 초기 화면 마운트 시 바운드 처리 (약간의 딜레이 후 적용)
        setTimeout(() => {
          if (map) setMapBounds(map.getBounds());
        }, 400);

        // Zoom 변경 이벤트 리스너 추가
        (window as any).naver.maps.Event.addListener(map, 'zoom_changed', () => {
          setZoom(map.getZoom());
          setMapBounds(map.getBounds());
          setSidebarOpen(false);
        });

        // 지도 이동(드래그) 완료 시 화면 내 리스트 업데이트
        (window as any).naver.maps.Event.addListener(map, 'dragend', () => {
          setMapBounds(map.getBounds());
          // 강제로 동일한 리스트일 때도 순서를 섞기 우히애 여기서 직접 호출 가능하지만 useEffect가 대부분 처리해줌
          setShuffledUrgentEstimates(prev => [...prev].sort(() => 0.5 - Math.random()));
        });

        // 지도 이동(드래그) 시작 시 사이드바 닫기
        (window as any).naver.maps.Event.addListener(map, 'dragstart', () => {
          setSidebarOpen(false);
        });
        
        // GPS 및 유저 위치 처리는 loadData 함수 이후로 위임
        
        // 확실한 제한을 위해 setOptions 호출
        map.setOptions({ minZoom: 7, maxZoom: 13 });
        
        setMapLoaded(true);
      } catch (e) {
        console.error("네이버 지도 초기화 실패:", e);
      }
    }
  }, [mapLoaded]);

  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstanceRef.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentPos = new (window as any).naver.maps.LatLng(lat, lng);
        
        mapInstanceRef.current.setCenter(currentPos);
        mapInstanceRef.current.setZoom(11);
      },
      (error) => {
        console.warn("위치 권한이 거부되었거나 가져올 수 없습니다:", error);
        alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    // 이미 로드되어 있는 경우를 위한 체크
    if (typeof window !== 'undefined' && (window as any).naver && (window as any).naver.maps) {
      initMap();
    }
    
    // 개발 환경 HMR 등에서 mapLoaded 상태일 때 옵션 강제 갱신
    if (mapLoaded && mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({ minZoom: 7, maxZoom: 13 });
    }
  }, [initMap, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    async function loadData() {
      try {
        const res = await fetch('/api/estimates/map');
        if (!res.ok) return;
        const data = await res.json();
        
        setCategories(['전체', ...(data.categories || [])]);

        const getCoords = (query: string): Promise<any> => {
          return new Promise((resolve) => {
            (window as any).naver.maps.Service.geocode({ query }, (status: any, response: any) => {
              if (status === (window as any).naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
                resolve(response.v2.addresses[0]);
              } else {
                resolve(null);
              }
            });
          });
        };

        const moveMapTo = (lat: number, lng: number, withMarker = true) => {
          if (!mapInstanceRef.current) return;
          const currentPos = new (window as any).naver.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(currentPos);
          mapInstanceRef.current.setZoom(11);
          if (withMarker) {
            new (window as any).naver.maps.Marker({
              position: currentPos,
              map: mapInstanceRef.current,
              icon: {
                content: '<div class="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-md animate-bounce"></div>',
                anchor: new (window as any).naver.maps.Point(10, 10),
              }
            });
          }
        };

        const tryGpsLocation = (): Promise<boolean> => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve(false);
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (position) => {
                moveMapTo(position.coords.latitude, position.coords.longitude);
                resolve(true);
              },
              (error) => {
                console.warn("GPS failed:", error);
                resolve(false);
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          });
        };

        const initUserLocation = async () => {
          let locationSet = false;

          // 로그인 상태이고 회원정보의 주소(userRegion)가 있는 경우
          if (data.isLoggedIn && data.userRegion) {
            const regionCoords = await getCoords(data.userRegion);
            if (regionCoords) {
              moveMapTo(parseFloat(regionCoords.y), parseFloat(regionCoords.x));
              locationSet = true;
            }
          }

          // 주소정보가 없거나 (또는 비로그인), 주소 변환에 실패했다면 GPS 시도
          if (!locationSet) {
            locationSet = await tryGpsLocation();
          }

          // 모든 방법(GPS, 주소)이 실패한 경우 임시 기본 위치 세팅 후 지역 선택 모달 표시
          if (!locationSet) {
             if (mapInstanceRef.current) {
               const defaultPos = new (window as any).naver.maps.LatLng(37.4979, 127.0276);
               mapInstanceRef.current.setCenter(defaultPos);
             }
             setIsRegionModalOpen(true);
          }
        };

        await initUserLocation();

        const estimatesData = data.estimates || data;
        
        // 1. 통계(클러스터)용 좌표를 위해 동/시/도 단위의 고유한 지역 이름 및 개별 위치 추출
        const uniqueLocations = new Set<string>();
        for (const est of estimatesData) {
          if (!est.location) continue;
          const parts = est.location.split(' ');
          if (parts[0]) uniqueLocations.add(parts[0]);
          if (parts[0] && parts[1]) uniqueLocations.add(`${parts[0]} ${parts[1]}`);
          if (parts[0] && parts[1] && parts[2]) uniqueLocations.add(`${parts[0]} ${parts[1]} ${parts[2]}`);
          
          if (est.isUrgent) {
            uniqueLocations.add(est.location); // 긴급요청은 개별 분리를 위해 실제 주소 전체 추가
          }
        }

        // 2. 추출된 "대표 지역 이름"만 네이버 Geocoding API로 변환 (최적화)
        // 행정구역명을 검색하면 네이버 지도는 정확히 그 행정구역의 '중앙' 좌표를 뱉어냅니다.
        const locationCoordsCache: Record<string, { lat: number, lng: number }> = {};
        for (const loc of Array.from(uniqueLocations)) {
          let item = await getCoords(loc);
          if (item) {
             locationCoordsCache[loc] = { lat: parseFloat(item.y), lng: parseFloat(item.x) };
          }
        }

        // 3. API 호출 없이 메모리 상의 동/시/도 중앙 좌표를 요청건들에 일괄 부여
        const geocoded: any[] = [];
        for (const est of estimatesData) {
          if (!est.location) continue;
          const parts = est.location.split(' ');
          const dongKey = parts[0] + (parts[1] ? ` ${parts[1]}` : '') + (parts[2] ? ` ${parts[2]}` : '');
          const sigunguKey = parts[0] + (parts[1] ? ` ${parts[1]}` : '');
          const sidoKey = parts[0];
          
          const exactCoords = est.isUrgent ? locationCoordsCache[est.location] : null;
          const coords = exactCoords || locationCoordsCache[dongKey] || locationCoordsCache[sigunguKey] || locationCoordsCache[sidoKey];
          if (coords) {
            geocoded.push({ ...est, lat: coords.lat, lng: coords.lng });
          }
        }
        setEstimates(geocoded);
      } catch (err) {
        console.error('Failed to load estimates:', err);
      }
    }
    loadData();
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;

    // 기존 마커 클리어
    markersRef.current.forEach(m => {
      if (m._centerListener) {
        (window as any).naver.maps.Event.removeListener(m._centerListener);
      }
      m.setMap(null);
    });
    markersRef.current = [];

    const filteredEstimates = selectedCategories.includes('전체')
      ? estimates
      : estimates.filter(e => selectedCategories.includes(e.category));

    const totalEstimates = filteredEstimates; // 전체 요청 포함
    const urgentEstimates = filteredEstimates.filter(e => e.isUrgent);

    const totalGroups = getGroupedEstimates(zoom, totalEstimates, false);
    const urgentGroups = getGroupedEstimates(zoom, urgentEstimates, true);

    const createGroupMarker = (g: any, isUrgent: boolean) => {
      let content = '';
      if (isUrgent && g.count === 1) {
        const est = g.estimates[0];
        content = `
          <div style="position: absolute; left: 0; bottom: 0; transform: translateX(-50%);">
            <div class="relative flex flex-col items-center cursor-pointer group">
              <div class="w-auto h-11 bg-white px-2.5 rounded-lg shadow-md border-[2.5px] border-red-500 flex items-center justify-center text-[13px] font-bold text-red-600 transform transition-transform group-hover:-translate-y-1 z-10 gap-1 whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-red-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                [긴급] ${est.category}
              </div>
              <div class="w-2.5 h-2.5 bg-red-500 rotate-45 transform -translate-y-1.5 shadow-sm"></div>
            </div>
          </div>
        `;
      } else {
        const bgClass = isUrgent ? 'bg-red-600/95' : 'bg-blue-600/95';
        const titleClass = isUrgent ? 'text-red-700' : 'text-slate-700';
        const borderClass = isUrgent ? 'border-red-200' : 'border-slate-200';
        const titleText = isUrgent ? (g.title === '대한민국 전체' ? '전국' : g.title)+'긴급' : g.title;

        content = `
          <div class="relative flex items-center justify-center min-w-[64px] px-3 h-16 rounded-full ${bgClass} text-white font-bold shadow-lg border-[3px] border-white transform transition-transform hover:scale-105 cursor-pointer">
            <span class="text-[17px] whitespace-nowrap tracking-tight absolute inset-0 flex items-center justify-center pt-0.5">${g.count}건</span>
            <div class="absolute -bottom-7 text-xs font-bold ${titleClass} bg-white px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] whitespace-nowrap border ${borderClass}">
              ${titleText}
            </div>
          </div>
        `;
      }

      const isNational = zoom <= 7 && g.key === '대한민국 전체';
      const position = isNational
        ? map.getCenter()
        : new (window as any).naver.maps.LatLng(g.lat, g.lng);

      const defaultZIndex = isUrgent ? 100 : 10;
      
      let anchorX = 32;
      let anchorY = 44;

      // 개별 긴급 마커는 CSS translate로 중앙 정렬을 맞췄으므로 앵커를 0,0으로 설정
      if (isUrgent && g.count === 1) {
        anchorX = 0;
        anchorY = 0;
      }

      if (!isUrgent) {
        // 애니메이션 중 투영 좌표계(Projection)의 오차 바운딩 문제를 아예 방지하기 위해,
        // 위도 37도(대한민국 중심) 기준 Web Mercator 픽셀당 미터(m/px) 비율을 순수 수학으로 도출하여 사용합니다.
        // 공식: 125000 / (2^zoom) = 현재 줌 레벨에서의 1픽셀당 미터 길이
        const metersPerPixel = 125000 / Math.pow(2, zoom);
        const thresholdMeters = 110 * metersPerPixel; // 110px 겹침 방지 반경 (90px보다 조금 더 넓고 쾌적하게 잡음)
        
        let isOverlapping = false;
        let pushRight = false;
        
        for (const uGroup of urgentGroups) {
          const dist = getDistance(uGroup.lat, uGroup.lng, g.lat, g.lng);
          if (dist < thresholdMeters) {
            isOverlapping = true;
            // 일반 마커가 긴급 마커보다 지리적으로 오른쪽에 있다면, 오른쪽으로 밀어냅니다.
            if (g.lng > uGroup.lng) {
              pushRight = true;
            }
            break;
          }
        }
        
        const hasUrgentInside = g.estimates.some((e: any) => e.isUrgent);
        
        if (isOverlapping || hasUrgentInside) {
          // 오른쪽으로 피할 때는 앵커 길이를 마이너스(-45)로 주어 아이콘을 우측으로 전진,
          // 왼쪽으로 피할 때는 앵커 길이를 길게(115) 주어 아이콘을 좌측으로 후진시킵니다.
          anchorX = pushRight ? -45 : 115;
        }
      }

      const marker = new (window as any).naver.maps.Marker({
        position: position,
        map: map,
        zIndex: defaultZIndex,
        icon: {
          content,
          anchor: new (window as any).naver.maps.Point(anchorX, anchorY),
        }
      });
      
      if (isNational) {
        marker._centerListener = (window as any).naver.maps.Event.addListener(map, 'center_changed', () => {
          marker.setPosition(map.getCenter());
        });
      }

      if (isUrgent) {
        (window as any).naver.maps.Event.addListener(marker, 'mouseover', () => {
          marker.setZIndex(110);
        });
        (window as any).naver.maps.Event.addListener(marker, 'mouseout', () => {
          marker.setZIndex(100);
        });
      }

      (window as any).naver.maps.Event.addListener(marker, 'click', () => {
        if (isUrgent && g.count === 1) {
          setModalEstimateId(g.estimates[0].id);
          setIsModalOpen(true);
        } else {
          setSelectedMarker({ lat: g.lat, lng: g.lng, id: 'CLUSTER', title: g.title, key: g.key, isUrgentCluster: isUrgent });
          setSidebarOpen(true);
        }
      });

      markersRef.current.push(marker);
    };

    if (totalGroups) {
      totalGroups.forEach(g => createGroupMarker(g, false));
    }
    if (urgentGroups) {
      urgentGroups.forEach(g => createGroupMarker(g, true));
    }
  }, [zoom, mapLoaded, estimates, selectedCategories]);

  return (
    <div className="w-full h-[calc(100dvh-64px)] flex bg-slate-100 overflow-hidden overscroll-none">
      <Script 
        strategy="afterInteractive" 
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '881liwxlgv'}&submodules=geocoder,visualization`}
        onReady={initMap}
      />

      {/* 긴급 리스트 사이드바 (임시 숨김 처리) */}
      {false && shuffledUrgentEstimates.length > 0 && (
        <div className="w-[230px] shrink-0 bg-[#FAFAFA] border-r border-slate-200 flex flex-col z-10 shadow-xl overflow-hidden relative">
          {/* 상단 포인트 라인 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 z-20"></div>
          
          {/* 타이틀 영역 */}
          <div className="px-4 py-3.5 bg-white border-b border-slate-100 shrink-0 relative overflow-hidden flex flex-col justify-center">
            {/* 상단 배경 장식 삭제, 깔끔한 솔리드 컬러 유지 */}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <h3 className="font-extrabold text-slate-800 text-[14px] tracking-tight">긴급 견적 요청</h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium relative z-10 tracking-tight pl-3.5">
              빠른 배정이 필요한 요청입니다.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50 relative no-scrollbar">
            {shuffledUrgentEstimates.map((est) => (
              <div 
                key={est.id} 
                onClick={(e) => handleEstimateClick(e, est.id)}
                className="group w-full bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-200 hover:border-red-300 hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col"
              >
                {/* 좌측 악센트 라인 */}
                <div className="absolute left-0 top-0 w-[3px] h-full bg-red-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300"></div>
                
                {/* 타이틀 및 태그 병합 렌더링 */}
                <div className="flex items-center justify-between mb-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border border-red-200/60 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 fill-red-600 text-red-600" /> 긴급
                    </span>
                    <h4 className="font-bold text-slate-800 text-[13px] group-hover:text-red-600 transition-colors line-clamp-1">
                      <span className="text-slate-600 mr-1 opacity-90 font-medium">[{est.category}]</span>요청
                    </h4>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-red-500 transition-colors shrink-0 hidden sm:block opacity-0 group-hover:opacity-100" />
                </div>

                <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 mb-2.5 pl-1 relative z-10 w-[95%]">
                  {est.details || '가장 빠른 처리가 필요합니다!'}
                </p>

                {/* 하단 위치 및 날짜 정보 */}
                <div className="flex items-center justify-between w-full mt-auto pl-1 relative z-10">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-100/50">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{est.location ? est.location.split(' ').slice(0, 3).join(' ') : ''}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300">{est.createdAt ? new Date(est.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 우측 맵 영역 */}
      <div className="flex-1 relative flex flex-col h-full bg-slate-200 overflow-hidden">
        {/* 지도 컨테이너 (비워두어야 함) */}
        <div id="map" ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-200"></div>

      {/* 카테고리 필터 토글 (다중 선택 및 자동 줄바꿈) */}
      {categories.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-max max-w-[96%] lg:max-w-[680px] bg-white/95 backdrop-blur shadow-lg p-3 flex flex-col items-center justify-center gap-2 border border-slate-200 rounded-3xl transition-all">
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            {(isCategoryExpanded ? categories : categories.slice(0, 7)).map((cat, idx) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={idx}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md scale-105 border-transparent' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {categories.length > 7 && (
            <button
              onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
              className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors w-full pt-2 border-t border-slate-100"
            >
              {isCategoryExpanded ? (
                <>접기 <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>나머지 {categories.length - 7}개 펼침 <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* 새 요청 등록 플로팅 버튼 (우측 상단) */}
      {mapLoaded && (
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="absolute top-4 right-4 z-10 px-5 py-3.5 bg-blue-600 text-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 gap-2 font-black text-[15px]"
        >
          <Plus className="w-5 h-5" />
          요청등록
        </button>
      )}

      {/* 맵 로드 시 내 위치 이동 버튼 */}
      {mapLoaded && (
        <button
          onClick={moveToCurrentLocation}
          className="absolute bottom-6 right-6 z-10 p-3 bg-white text-slate-700 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95"
          aria-label="현재 위치로 이동"
        >
          <Navigation className="w-5 h-5 text-blue-600 fill-blue-600/20" />
        </button>
      )}

      {/* 로딩 UI (지도 컨테이너 밖으로 분리) */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 bg-slate-200">
          <MapPin className="w-16 h-16 mb-4 text-slate-400 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">네이버 지도 로딩 중...</h2>
          <p className="text-sm">지도 데이터를 불러오고 있습니다.</p>
        </div>
      )}

      {/* 왼쪽 슬라이드 사이드바 (반경 내 마커 리스트 표시) */}
      <div 
        className={`absolute top-0 left-0 h-full w-[280px] max-w-[85vw] bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-2.6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {(() => {
                if (!selectedMarker) return '선택 요청 목록';

                // 개별 마커(비-클러스터)인 경우 기존 타이틀 유지
                if (selectedMarker.id !== 'CLUSTER') return '선택 요청 목록';

                const isUrgent = selectedMarker.isUrgentCluster === true;
                const rawKey: string = selectedMarker.key || '';
                const rawTitle: string = selectedMarker.title || '';

                // 전국(대한민국 전체) 케이스
                if (rawKey === '대한민국 전체' || rawTitle === '대한민국 전체') {
                  return isUrgent ? '전국 긴급 요청' : '대한민국 전체 요청';
                }

                // 거리 기반 긴급 클러스터(개별 긴급 마커)
                if (typeof rawKey === 'string' && rawKey.startsWith('URGENT_DIST_')) {
                  const region = rawTitle || '기타';
                  return `${region} 긴급 요청`;
                }

                // 일반 지역 클러스터 (도/시/군/구)
                const region = rawTitle || rawKey || '선택 지역';
                return isUrgent ? `${region} 긴급 요청` : `${region} 요청`;
              })()}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">선택한 마커 기준 검색결과 <span className="font-bold text-blue-600">{nearbyEstimates.length}</span>건</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 relative no-scrollbar">
          {nearbyEstimates.map(est => (
             <button key={est.id} onClick={(e) => handleEstimateClick(e, est.id)} className="block w-full text-left group">
               <div className="bg-white p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col">
                 <div className="absolute left-0 top-0 w-[3px] h-full bg-blue-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300"></div>

                 <div className="flex items-center justify-between mb-1.5 pl-1">
                   <div className="flex items-center gap-1.5">
                     <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border flex items-center ${
                        ['요청중', '매칭중', '견적중'].includes(est.status) ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                     }`}>
                       {['매칭중', '견적중'].includes(est.status) ? '요청중' : est.status}
                     </span>
                     {est.isUrgent && (
                       <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border border-red-200/60 flex items-center gap-0.5">
                         <Zap className="w-2.5 h-2.5 fill-red-600 text-red-600" /> 긴급
                       </span>
                     )}
                     <h4 className="font-bold text-slate-800 text-[13px] group-hover:text-blue-600 transition-colors line-clamp-1 ml-0.5">
                       {est.category} 요청
                     </h4>
                   </div>
                 </div>

                 <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mb-2.5 pl-1 w-[95%]">
                   {est.details || '가장 가까운 거리의 맞춤 요청입니다.'}
                 </p>
                 
                 <div className="flex items-center justify-between w-full mt-auto pl-1">
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50/80 px-1.5 py-1 rounded-md border border-slate-100/50 font-medium">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{est.location}</span>
                   </div>
                   <span className="text-[9px] font-bold text-slate-300">
                     {est.createdAt ? new Date(est.createdAt).toLocaleDateString() : ''}
                   </span>
                 </div>
               </div>
             </button>
          ))}
          {nearbyEstimates.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Navigation className="w-5 h-5 text-slate-300" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">근처에 요청이 없습니다</h4>
              <p className="text-[13px] text-slate-500">배율을 축소하거나<br/>검색 반경을 더 넓게 설정해보세요.</p>
            </div>
          )}
        </div>
      </div>

      <MapEstimateFullModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        estimateId={modalEstimateId} 
      />

      {/* 새 요청 등록 모달 */}
      <NewEstimateModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          setIsNewModalOpen(false);
          // TODO: 필요시 데이터 새로고침
        }}
      />

      {/* 수동 지역 선택 모달 */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl w-full max-w-sm border border-slate-100 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 text-center shrink-0">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">위치 확인 불가</h2>
              <p className="text-[13px] text-slate-500 mt-2 font-medium">현재 위치를 확인할 수 없습니다.<br/>지도를 이동할 지역을 선택해주세요.</p>
            </div>
            
            <div className="flex flex-col space-y-3 mb-6">
              <label className="font-bold text-slate-900 block text-sm">지역 선택</label>
              <div className="flex gap-2">
                <select 
                  value={selectedSido} 
                  onChange={(e) => { setSelectedSido(e.target.value); setSelectedSigungu(''); }} 
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>시/도</option>
                  {Object.keys(regionData).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={selectedSigungu} 
                  onChange={e => setSelectedSigungu(e.target.value)} 
                  disabled={!selectedSido} 
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                >
                  <option value="" disabled>시/군/구</option>
                  {selectedSido && regionData[selectedSido].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setIsRegionModalOpen(false)} 
                className="flex-1 font-bold py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                닫기
              </button>
              <button 
                onClick={handleRegionConfirm} 
                disabled={!selectedSido || !selectedSigungu}
                className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl disabled:bg-slate-300 transition-colors"
              >
                이동하기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
