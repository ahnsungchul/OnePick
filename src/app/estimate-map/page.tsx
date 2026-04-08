'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { MapPin } from 'lucide-react';

export default function EstimateMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initMap = useCallback(() => {
    // 네이버 지도 API가 로드되었는지 체크
    if (typeof window !== 'undefined' && (window as any).naver && (window as any).naver.maps && !mapLoaded) {
      try {
        const mapOptions = {
          center: new (window as any).naver.maps.LatLng(37.4979, 127.0276), // 강남역 기본 좌표
          zoom: 15,
          mapDataControl: false,
        };
        // 공식 문서와 똑같이 'map' 이라는 ID를 직접 넘기도록 수정
        const map = new (window as any).naver.maps.Map('map', mapOptions);
        
        // 마커 예시
        new (window as any).naver.maps.Marker({
          position: new (window as any).naver.maps.LatLng(37.4979, 127.0276),
          map: map
        });
        
        setMapLoaded(true);
      } catch (e) {
        console.error("네이버 지도 초기화 실패:", e);
      }
    }
  }, [mapLoaded]);

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

  return (
    <div className="w-full h-[calc(100vh-64px)] relative bg-slate-100 flex flex-col overflow-hidden">
      <Script 
        strategy="afterInteractive" 
        src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=881liwxlgv&submodules=geocoder,visualization"
        onReady={initMap}
      />

      {/* 지도 컨테이너 (비워두어야 함) */}
      <div id="map" ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-200"></div>

      {/* 로딩 UI (지도 컨테이너 밖으로 분리) */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 bg-slate-200">
          <MapPin className="w-16 h-16 mb-4 text-slate-400 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">네이버 지도 로딩 중...</h2>
          <p className="text-sm">지도 데이터를 불러오고 있습니다.</p>
        </div>
      )}

      {/* 지도 위에 띄울 UI 레이어 */}
      <div className="relative z-10 w-full p-4 pointer-events-none mt-4 ml-4">
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 w-full max-w-sm pointer-events-auto">
          <h1 className="text-2xl font-black text-slate-900 mb-2">지역 기반 요청찾기</h1>
          <p className="text-slate-500 text-sm mb-6">지도에서 내 주변의 새로운 요청을 확인하세요.</p>
          
          <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20">
            현재 지도에서 검색
          </button>
        </div>
      </div>
    </div>
  );
}
