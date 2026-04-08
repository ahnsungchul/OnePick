'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import MainFooter from './MainFooter';
import ExpertFooter from './ExpertFooter';

export default function Footer() {
  const pathname = usePathname() || '';
  
  // 전문가 관련 경로는 간편 푸터 적용
  const isExpertPath = pathname.startsWith('/expert');
  const isEstimateMap = pathname.startsWith('/estimate-map');

  if (isEstimateMap) {
    return null;
  }

  if (isExpertPath) {
    return <ExpertFooter />;
  }

  return <MainFooter />;
}
