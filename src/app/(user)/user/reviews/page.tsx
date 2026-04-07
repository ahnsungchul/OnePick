'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserReviewsAction } from '@/actions/review.action';
import { Loader2, AlertCircle, Star, Image as ImageIcon, Camera } from 'lucide-react';
import UserReviewModal from '@/components/user/UserReviewModal';
import { formatCategory } from '@/lib/utils';

export default function UserReviewsPage() {
  const { data: session, status } = useSession();
  const [reviewsData, setReviewsData] = useState<{ written: any[], unwritten: any[] }>({ written: [], unwritten: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNWRITTEN' | 'WRITTEN'>('ALL');
  
  // 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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
                onClick={() => setActiveTab(f.value as any)}
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
        <div className="flex flex-col gap-4">
          {currentList.map((item, index) => {
            const isWritten = !!item.rating; // review data (item is Review)
            const isUnwritten = !isWritten; // item is Estimate

            // 작성 후기 렌더링
            if (isWritten) {
              const review = item as any;
              const expert = review.expert;
              const estimate = review.estimate;
              const photos = estimate?.completionPhotoUrls || review.photoUrls || [];

              return (
                <div key={`written-${review.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 inline-block mb-2">작성 완료</span>
                      <h3 className="font-bold text-slate-800">{formatCategory(estimate?.category?.name || '')} 서비스 후기</h3>
                      <p className="text-xs text-slate-500 mt-1">{expert?.name || '알 수 없는'} 전문가</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-lg text-slate-800">{review.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>

                  {(review.photoUrls && review.photoUrls.length > 0) && (
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {review.photoUrls.map((url: string, i: number) => (
                        <div key={i} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative group">
                          <img src={url} alt={`후기 첨부 사진 ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 전문가 완료 사진 참고용 */}
                  {!(review.photoUrls && review.photoUrls.length > 0) && estimate?.completionPhotoUrls && estimate.completionPhotoUrls.length > 0 && (
                     <div className="mt-3 py-3 border-t border-slate-100">
                       <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5"/> 전문가가 등록한 완료 사진</p>
                       <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                         {estimate.completionPhotoUrls.map((url: string, i: number) => (
                           <img key={i} src={url} className="w-16 h-16 object-cover rounded-md border border-slate-200 shrink-0" alt={`완료 사진 ${i+1}`} />
                         ))}
                       </div>
                     </div>
                  )}
                  <p className="text-[11px] text-slate-400 text-right mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              );
            }

            // 미작성 후기 렌더링
            if (isUnwritten) {
              const estimate = item as any;
              const expert = estimate.expert;
              const categoryName = formatCategory(estimate.category?.name || '');

              return (
                <div key={`unwritten-${estimate.id}`} className="bg-white py-5 px-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 opacity-50"></div>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="shrink-0 relative">
                       {estimate.completionPhotoUrls && estimate.completionPhotoUrls.length > 0 ? (
                         <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group">
                            <img src={estimate.completionPhotoUrls[0]} alt="시공 완료 사진" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            {estimate.completionPhotoUrls.length > 1 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                                +{estimate.completionPhotoUrls.length - 1}
                              </div>
                            )}
                         </div>
                       ) : (
                         <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                           <span className="text-[10px] font-bold">사진 없음</span>
                         </div>
                       )}
                    </div>
                    <div>
                      <span className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-md border border-red-100 inline-block mb-2 animate-pulse">미작성 후기</span>
                      <h3 className="text-lg font-bold text-slate-800">{categoryName}</h3>
                      <p className="text-sm text-slate-500 mt-1">시공 완료: <span className="font-semibold text-slate-700">{new Date(estimate.updatedAt).toLocaleDateString()}</span></p>
                      {expert && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          담당: {expert.name} 전문가
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => openReviewModal(estimate)}
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    후기 작성하기
                  </button>
                </div>
              );
            }
            
            return null;
          })}
        </div>
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

      {selectedReviewTarget && (
        <UserReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedReviewTarget(null);
          }}
          expertName={selectedReviewTarget?.expert?.name || '전문가'}
          expertId={selectedReviewTarget?.expert?.id}
          customerId={parseInt(session?.user?.id || '0', 10)}
          estimateId={selectedReviewTarget.id}
        />
      )}
    </div>
  );
}
