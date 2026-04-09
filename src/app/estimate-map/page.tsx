'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { MapPin, Navigation } from 'lucide-react';

function getGroupedEstimates(zoom: number, targetEstimates: any[]) {
  if (zoom >= 15) return null;

  const groups: Record<string, { count: number; lat: number; lng: number; title: string }> = {};

  targetEstimates.forEach(est => {
    if (!est.lat || !est.lng) return;
    const parts = (est.location || '').split(' ');
    let key = '';
    let title = '';

    if (zoom <= 7) {
      key = parts[0];
      title = parts[0];
    } else if (zoom <= 9) {
      const siPart = parts[0];
      key = siPart;
      title = siPart;
    } else if (zoom <= 11) {
      key = parts[0] + ' ' + (parts[1] || '');
      title = parts[1] || parts[0];
    } else if (zoom <= 14) {
      key = parts[0] + ' ' + (parts[1] || '') + ' ' + (parts[2] || '');
      title = parts[2] || parts[1] || parts[0];
    }

    if (!groups[key]) {
      groups[key] = { count: 0, lat: 0, lng: 0, title };
    }
    groups[key].count++;
    groups[key].lat += est.lat;
    groups[key].lng += est.lng;
  });

  if (Object.keys(groups).length === 0) return null;

  return Object.values(groups).map(g => ({
    count: g.count,
    lat: g.lat / g.count,
    lng: g.lng / g.count,
    title: g.title,
  }));
}

export default function EstimateMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(15);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['전체']);

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

  const initMap = useCallback(() => {
    // 네이버 지도 API가 로드되었는지 체크
    if (typeof window !== 'undefined' && (window as any).naver && (window as any).naver.maps && !mapLoaded) {
      try {
        const mapOptions = {
          center: new (window as any).naver.maps.LatLng(37.4979, 127.0276), // 강남역 기본 좌표
          zoom: 15,
          mapDataControl: false,
          zoomControl: true, // 배율 조절 컨트롤 추가
          zoomControlOptions: {
            position: (window as any).naver.maps.Position.TOP_RIGHT,
          },
        };
        // 공식 문서와 똑같이 'map' 이라는 ID를 직접 넘기도록 수정
        const map = new (window as any).naver.maps.Map('map', mapOptions);
        mapInstanceRef.current = map;
        setZoom(map.getZoom());

        // Zoom 변경 이벤트 리스너 추가
        (window as any).naver.maps.Event.addListener(map, 'zoom_changed', () => {
          setZoom(map.getZoom());
        });
        
        // GPS 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const currentPos = new (window as any).naver.maps.LatLng(lat, lng);
              
              // 지도 중심을 현재 GPS 위치로 이동
              map.setCenter(currentPos);
              
              // 현재 위치 마커 추가 (Tailwind CSS 스타일링 적용)
              new (window as any).naver.maps.Marker({
                position: currentPos,
                map: map,
                icon: {
                  content: '<div class="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-md animate-bounce"></div>',
                  anchor: new (window as any).naver.maps.Point(10, 10),
                }
              });
            },
            (error) => {
              console.warn("위치 권한이 거부되었거나 가져올 수 없습니다:", error);
              // 권한 거부 시 기본 마커 (강남역)
              new (window as any).naver.maps.Marker({
                position: new (window as any).naver.maps.LatLng(37.4979, 127.0276),
                map: map
              });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          // 브라우저 미지원 시 기본 마커
          new (window as any).naver.maps.Marker({
            position: new (window as any).naver.maps.LatLng(37.4979, 127.0276),
            map: map
          });
        }
        
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
        mapInstanceRef.current.setZoom(16);
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

    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [initMap]);

  useEffect(() => {
    if (!mapLoaded) return;
    async function loadData() {
      try {
        const res = await fetch('/api/estimates/map');
        if (!res.ok) return;
        const data = await res.json();
        
        setCategories(['전체', ...(data.categories || [])]);

        const geocoded: any[] = [];
        const estimatesData = data.estimates || data;
        for (const est of estimatesData) {
          if (!est.location) continue;
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

          // 요청: 괄호부터 상세 주소를 제외하고 기본 검색어로 사용
          const baseAddress = est.location.split('(')[0].trim();
          let item = await getCoords(baseAddress);
          
          if (!item) {
             // 1차 폴백: 처음 3개 단어(도/시/구 레벨)까지만 사용
             const fallback = baseAddress.split(' ').slice(0, 3).join(' ');
             if (fallback) item = await getCoords(fallback);
          }

          if (item) {
            geocoded.push({
              ...est,
              lat: parseFloat(item.y),
              lng: parseFloat(item.x)
            });
          } else {
            console.warn("Geocoding failed for:", est.location);
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
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const filteredEstimates = selectedCategories.includes('전체')
      ? estimates
      : estimates.filter(e => selectedCategories.includes(e.category));

    const groups = getGroupedEstimates(zoom, filteredEstimates);

    if (groups) {
      // 그룹(클러스터) 렌더링
      groups.forEach(g => {
        const content = `
          <div class="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/95 text-white font-bold shadow-lg border-[3px] border-white transform transition-transform hover:scale-105 cursor-pointer">
            <span class="text-xl">${g.count}</span>
            <div class="absolute -bottom-7 text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-full shadow-md whitespace-nowrap border border-slate-100">
              ${g.title}
            </div>
          </div>
        `;
        const marker = new (window as any).naver.maps.Marker({
          position: new (window as any).naver.maps.LatLng(g.lat, g.lng),
          map: map,
          icon: {
            content,
            anchor: new (window as any).naver.maps.Point(32, 44),
          }
        });
        
        // 원형 마커 클릭 시 해당 위치로 줌인
        (window as any).naver.maps.Event.addListener(marker, 'click', () => {
          map.morph(marker.getPosition(), zoom + 2); // 2단계 확대
        });

        markersRef.current.push(marker);
      });
    } else {
      // 개별 마커 렌더링
      filteredEstimates.forEach(est => {
        const content = `
          <div class="relative flex flex-col items-center cursor-pointer group">
            <div class="w-auto h-11 bg-white px-2 rounded-6 shadow-md border-2 border-blue-500 flex items-center justify-center text-sm font-bold text-blue-600 transform transition-transform group-hover:-translate-y-1 z-10">
              [${est.status}]${est.category}
            </div>
            <div class="w-2.5 h-2.5 bg-blue-500 rotate-45 transform -translate-y-1.5 shadow-sm"></div>
          </div>
        `;
        const marker = new (window as any).naver.maps.Marker({
          position: new (window as any).naver.maps.LatLng(est.lat, est.lng),
          map: map,
          icon: {
            content,
            anchor: new (window as any).naver.maps.Point(22, 54),
          }
        });
        markersRef.current.push(marker);
      });
    }
  }, [zoom, mapLoaded, estimates, selectedCategories]);

  return (
    <div className="w-full h-[calc(100vh-64px)] relative bg-slate-100 flex flex-col overflow-hidden">
      <Script 
        strategy="afterInteractive" 
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '881liwxlgv'}&submodules=geocoder,visualization`}
        onReady={initMap}
      />

      {/* 지도 컨테이너 (비워두어야 함) */}
      <div id="map" ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-200"></div>

      {/* 카테고리 필터 토글 (다중 선택 및 자동 줄바꿈) */}
      {categories.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[96%] max-w-4xl bg-white/95 backdrop-blur shadow-lg p-2 flex flex-wrap items-center justify-center gap-2 border border-slate-200 rounded-[24px]">
          {categories.map((cat, idx) => {
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
    </div>
  );
}
