'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import MapEstimateFullModal from '@/components/expert/MapEstimateFullModal';
import NewEstimateModal from '@/components/user/NewEstimateModal';
import { MapPin, Navigation, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  
  // 맵 페이지 진입 시 전역 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
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
    
    // 현재 선택된 카테고리에 맞는 마커만 1차 필터링
    const filtered = estimates.filter(e => selectedCategories.includes('전체') || selectedCategories.includes(e.category));

    const withDist = filtered.map(est => {
      const dist = getDistance(selectedMarker.lat, selectedMarker.lng, est.lat, est.lng);
      return { ...est, distance: dist };
    });

    // 반경 내 필터링 및 거리순 정렬, 단 본인은 제외 (거리가 0인 경우)
    return withDist
      .filter(est => est.distance <= radius && est.id !== selectedMarker.id)
      .sort((a, b) => a.distance - b.distance);
  }, [selectedMarker, estimates, radius, selectedCategories]);

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
            position: (window as any).naver.maps.Position.RIGHT_CENTER,
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
        
        // GPS 및 유저 위치 처리는 loadData 함수 이후로 위임
        
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

        // 로그인 여부에 따른 초기 맵 중앙 위치 설정 로직
        if (data.userRegion) {
          const regionCoords = await getCoords(data.userRegion);
          if (regionCoords && mapInstanceRef.current) {
            const currentPos = new (window as any).naver.maps.LatLng(parseFloat(regionCoords.y), parseFloat(regionCoords.x));
            mapInstanceRef.current.setCenter(currentPos);
            mapInstanceRef.current.setZoom(16);
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
          // 비로그인 또는 지역 정보 없을 시 GPS 활용
          if (navigator.geolocation && mapInstanceRef.current) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const currentPos = new (window as any).naver.maps.LatLng(lat, lng);
                mapInstanceRef.current.setCenter(currentPos);
                new (window as any).naver.maps.Marker({
                  position: currentPos,
                  map: mapInstanceRef.current,
                  icon: {
                    content: '<div class="w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-md animate-bounce"></div>',
                    anchor: new (window as any).naver.maps.Point(10, 10),
                  }
                });
              },
              (error) => {
                console.warn("GPS failed:", error);
                const defaultPos = new (window as any).naver.maps.LatLng(37.4979, 127.0276);
                new (window as any).naver.maps.Marker({
                  position: defaultPos,
                  map: mapInstanceRef.current,
                });
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          }
        }

        const geocoded: any[] = [];
        const estimatesData = data.estimates || data;
        for (const est of estimatesData) {
          if (!est.location) continue;

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
        
        // 그룹 마커 클릭 시 줌인하지 않고, 해당 위치를 기준으로 사이드바 열림
        (window as any).naver.maps.Event.addListener(marker, 'click', () => {
          setSelectedMarker({ lat: g.lat, lng: g.lng, id: 'CLUSTER', title: g.title });
          setSidebarOpen(true);
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

        // 마커 클릭 시 사이드바 열림
        (window as any).naver.maps.Event.addListener(marker, 'click', () => {
          setSelectedMarker(est);
          setSidebarOpen(true);
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
        className={`absolute top-0 left-0 h-full w-[380px] max-w-[85vw] bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              선택 요청 목록
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">선택한 마커 기준 검색결과 <span className="font-bold text-blue-600">{nearbyEstimates.length}</span>건</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 relative">
          {nearbyEstimates.map(est => (
             <button key={est.id} onClick={(e) => handleEstimateClick(e, est.id)} className="block w-full text-left group">
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     {est.requestNumber && (
                       <span className="text-[11px] font-bold text-slate-500">
                         {est.requestNumber}
                       </span>
                     )}
                     <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        est.status === '요청중' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                     }`}>
                       {est.status}
                     </span>
                   </div>
                   <span className="text-xs text-slate-400">
                     {est.createdAt ? new Date(est.createdAt).toLocaleDateString() : ''}
                   </span>
                 </div>
                 <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors mb-1.5 line-clamp-1">{est.category} 요청</h4>
                 <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                   {est.details || '가장 가까운 거리의 맞춤 요청입니다. 눌러서 상세 내용을 확인해보세요.'}
                 </p>
                 <div className="flex items-center gap-1.5 mt-auto text-[11px] text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{est.location}</span>
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
    </div>
  );
}
