'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserReviewsAction } from '@/actions/review.action';
import { Loader2, AlertCircle, Star, Image as ImageIcon, Camera } from 'lucide-react';
import UserReviewModal from '@/components/user/UserReviewModal';
import UserReviewDetailModal from '@/components/user/UserReviewDetailModal';
import { formatCategory, cn } from '@/lib/utils';

export default function UserReviewsPage() {
  const { data: session, status } = useSession();
  const [reviewsData, setReviewsData] = useState<{ written: any[], unwritten: any[] }>({ written: [], unwritten: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNWRITTEN' | 'WRITTEN'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // 미작성(작성용) 모달
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // 상세조회 모달
  const [selectedReviewTarget, setSelectedReviewTarget] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);
      if (isNaN(userId)) {
        setError("유효하지 않은 사용자 ID입니다.");
        setIsLoading(false);
        return;
      }

      getUserReviewsAction(userId)
        .then(res => {
          if (res.success && res.data) {
            setReviewsData(res.data);
          } else {
            setError(res.error || "데이터를 불러오는 데 실패했습니다.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch reviews:", err);
          setError("오류가 발생했습니다.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const openReviewModal = (estimate: any) => {
    setSelectedReviewTarget(estimate);
    setIsReviewModalOpen(true);
  };

  const openDetailModal = (review: any) => {
    setSelectedReviewTarget(review);
    setIsDetailModalOpen(true);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">후기 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">로그인이 필요합니다</h2>
        <p className="text-slate-500 mb-6">후기 내역을 확인하시려면 먼저 로그인해 주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-red-50 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">오류 발생</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  const { written, unwritten } = reviewsData;
  const counts = {
    ALL: written.length + unwritten.length,
    UNWRITTEN: unwritten.length,
    WRITTEN: written.length,
  };

  const getFilteredList = () => {
    if (activeTab === 'UNWRITTEN') return unwritten;
    if (activeTab === 'WRITTEN') return written;
    // ALL의 경우 미작성 -> 작성순으로 보여줍니다.
    return [...unwritten, ...written];
  };

  const currentList = getFilteredList();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">나의 후기</h2>
        <p className="text-slate-500 text-sm mt-1 mb-6">전문가에게 받은 서비스에 대한 솔직한 후기를 남겨주세요.</p>
        
        <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-slate-200">
          {[
            { label: '전체', value: 'ALL', count: counts.ALL, activeCls: 'text-slate-900 border-slate-800', badgeActive: 'bg-slate-800 text-white' },
            { label: '미작성 후기', value: 'UNWRITTEN', count: counts.UNWRITTEN, activeCls: 'text-blue-600 border-blue-600', badgeActive: 'bg-blue-600 text-white' },
            { label: '작성 후기', value: 'WRITTEN', count: counts.WRITTEN, activeCls: 'text-emerald-600 border-emerald-600', badgeActive: 'bg-emerald-600 text-white' },
          ].map(f => {
            const isActive = activeTab === f.value;
            return (
              <button
                key={f.value}
                onClick={() => handleTabChange(f.value)}
                className={`flex-1 sm:flex-none py-4 px-6 border-b-2 font-bold text-sm transition-all flex items-center justify-center gap-2
                  ${isActive ? f.activeCls : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                {f.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                  isActive ? f.badgeActive : 'bg-slate-100 text-slate-500'
                }`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {currentList.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item, index) => {
              const isWritten = !!item.rating; 
              const isUnwritten = !isWritten; 

              // 작성 후기 렌더링 (갤러리용 정사각형 썸네일 카드)
              if (isWritten) {
                const review = item as any;
                const expert = review.expert;
                const estimate = review.estimate;
                const photos = estimate?.completionPhotoUrls || review.photoUrls || [];
                const firstThumb = photos.length > 0 ? photos[0] : null;

                return (
                  <div 
                    key={`written-${review.id}`} 
                    onClick={() => openDetailModal(review)}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 transition-all flex flex-col overflow-hidden cursor-pointer group h-full"
                  >
                    {/* 상단 썸네일 영역 (1:1 가로세로 비율 유지) */}
                    <div className="w-full aspect-square bg-slate-100 relative shrink-0 overflow-hidden">
                      {firstThumb ? (
                        <img src={firstThumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="후기 썸네일" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-[10px] font-bold">사진 없음</span>
                        </div>
                      )}
                      
                      {photos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          +{photos.length - 1}
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white px-2 py-1 rounded-lg font-black text-xs shadow-md">
                        <Star className="w-3 h-3 fill-white" /> {review.rating}
                      </div>
                    </div>

                    {/* 하단 텍스트 정보 */}
                    <div className="p-4 flex flex-col flex-1 relative">
                      <div className="mb-2 line-clamp-1">
                        <h3 className="font-black text-slate-800 text-sm">{formatCategory(estimate?.category?.name || '')}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{expert?.name || '알 수 없는'} 전문가</p>
                      </div>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 mt-auto font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                        "{review.content}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-4 text-right">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              }

              // 미작성 후기 렌더링 (갤러리 그리드용 소형 카드)
              if (isUnwritten) {
                const estimate = item as any;
                const categoryName = formatCategory(estimate.category?.name || '');

                return (
                  <div 
                    key={`unwritten-${estimate.id}`} 
                    onClick={() => openReviewModal(estimate)}
                    className="bg-blue-50/50 hover:bg-blue-50 py-5 px-4 rounded-2xl border border-blue-200 border-dashed hover:border-solid shadow-sm flex flex-col items-center justify-center text-center cursor-pointer group transition-all h-full min-h-[220px]"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-lg mb-2">미작성</span>
                    <h3 className="text-sm font-black text-slate-800">{categoryName}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 mb-4 flex flex-col gap-0.5">
                      <span>시공 완료: <strong className="text-slate-700">{new Date(estimate.updatedAt).toLocaleDateString()}</strong></span>
                      {estimate.expert && <span>담당: {estimate.expert.name} 전문가</span>}
                    </p>

                    <span className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all w-full mt-auto">
                      작성하기
                    </span>
                  </div>
                );
              }
              
              return null;
            })}
          </div>

          {/* 페이징 UI */}
          {Math.ceil(currentList.length / ITEMS_PER_PAGE) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button 
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                이전
              </button>
              
              {Array.from({ length: Math.ceil(currentList.length / ITEMS_PER_PAGE) }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn("w-10 h-10 rounded-xl text-sm font-bold transition-all",
                      currentPage === pageNum 
                        ? "bg-slate-800 text-white shadow-md"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => {
                  setCurrentPage(prev => Math.min(Math.ceil(currentList.length / ITEMS_PER_PAGE), prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === Math.ceil(currentList.length / ITEMS_PER_PAGE)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-20 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10 text-slate-200 fill-slate-100" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {activeTab === 'ALL' ? '내역이 없습니다.' : '해당하는 후기가 없습니다.'}
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto">서비스를 받고 전문가에게 따뜻한 후기를 남겨주세요!</p>
        </div>
      )}

      {/* 작성용 모달 */}
      <UserReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedReviewTarget(null);
        }}
        expertName={selectedReviewTarget?.expert?.name || '전문가'}
        expertId={selectedReviewTarget?.expert?.id}
        customerId={parseInt(session?.user?.id || '0', 10)}
        estimateId={selectedReviewTarget?.id}
      />

      {/* 상세조회 신규 모달 */}
      <UserReviewDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReviewTarget(null);
        }}
        review={selectedReviewTarget}
      />
    </div>
  );
}
