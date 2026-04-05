'use client';

import React, { useEffect, useState } from 'react';
import { getPortfolioCategoriesAction, getPortfoliosAction, deletePortfolioAction } from '@/actions/portfolio.action';
import PortfolioSidebar from '@/components/expert/portfolio/PortfolioSidebar';
import PortfolioList from '@/components/expert/portfolio/PortfolioList';
import PortfolioDetail from '@/components/expert/portfolio/PortfolioDetail';
import WritePortfolioModal from '@/components/expert/portfolio/WritePortfolioModal';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PortfolioClientLayout({ 
  targetUserId, 
  isOwner,
  variant = 'default'
}: { 
  targetUserId: number; 
  isOwner: boolean;
  variant?: 'default' | 'dashboard';
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [totalPortfoliosCount, setTotalPortfoliosCount] = useState<number>(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInitializedList = React.useRef(false);

  const fetchCategories = async () => {
    const res = await getPortfolioCategoriesAction(targetUserId);
    if (res.success && res.data) {
      setCategories(res.data);
      if (res.totalCount !== undefined) {
        setTotalPortfoliosCount(res.totalCount);
      }
    }
  };

  const fetchPortfolios = async () => {
    setLoading(true);
    const res = await getPortfoliosAction(targetUserId, selectedCategoryId);
    if (res.success && res.data) {
      setPortfolios(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [targetUserId]);

  useEffect(() => {
    fetchPortfolios();
    setSelectedPortfolio(null); // Reset detail view when category changes
  }, [targetUserId, selectedCategoryId]);

  // Handle auto-focusing on a portfolio based on URL query param (expert/portfolio page only)
  useEffect(() => {
    if (variant === 'default' && portfolios.length > 0 && !hasInitializedList.current) {
      const initId = searchParams.get('portfolioId');
      if (initId) {
        const target = portfolios.find((p) => p.id.toString() === initId);
        if (target) {
          setSelectedPortfolio(target);
          hasInitializedList.current = true;
        }
      }
    }
  }, [portfolios, searchParams, variant]);

  const handleOpenWriteModal = (portfolio?: any) => {
    if (portfolio) {
      setEditData(portfolio);
    } else {
      setEditData(null);
    }
    setIsWriteModalOpen(true);
  };

  const handleDeletePortfolio = () => {
    if (!selectedPortfolio || !isOwner) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePortfolio = async () => {
    if (!selectedPortfolio || !isOwner) return;
    const res = await deletePortfolioAction(selectedPortfolio.id);
    if (res.success) {
      setSelectedPortfolio(null);
      setIsDeleteModalOpen(false);
      fetchPortfolios();
      fetchCategories();
    } else {
      alert(res?.error || "삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDeleteModalOpen]);

  let prevPost = null;
  let nextPost = null;
  if (selectedPortfolio) {
    const currentIndex = portfolios.findIndex(p => p.id === selectedPortfolio.id);
    if (currentIndex >= 0) {
      if (currentIndex + 1 < portfolios.length) {
        prevPost = portfolios[currentIndex + 1]; // Older post
      }
      if (currentIndex - 1 >= 0) {
        nextPost = portfolios[currentIndex - 1]; // Newer post
      }
    }
  }

  return (
    <div className={variant === 'default' ? "flex flex-col lg:flex-row gap-8" : "flex flex-col gap-6"}>
      {/* Sidebar - Only strictly visible on 'default' variant */}
      {variant === 'default' && (
        <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 h-max self-start z-10">
          <PortfolioSidebar 
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            isOwner={isOwner}
            onCategoryChanged={fetchCategories}
            expertId={targetUserId}
            totalCount={totalPortfoliosCount}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Dashboard Variant - Horizontal Category Tabs */}
        {variant === 'dashboard' && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategoryId === null 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              전체
              {totalPortfoliosCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedCategoryId === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {totalPortfoliosCount}
                </span>
              )}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedCategoryId === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
                {cat._count?.portfolios > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedCategoryId === cat.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {cat._count.portfolios}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {variant !== 'dashboard' && (
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800">
              {selectedCategoryId === null ? '전체 포트폴리오' : categories.find(c => c.id === selectedCategoryId)?.name + ' 포트폴리오'}
              <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-sm">
                {portfolios.length}
              </span>
            </h2>
            
            {isOwner && !selectedPortfolio && (
              <button 
                onClick={() => handleOpenWriteModal()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                글쓰기
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedPortfolio ? (
          <PortfolioDetail 
            portfolio={selectedPortfolio}
            onBack={() => {
              setSelectedPortfolio(null);
              if (searchParams.has('portfolioId')) {
                // Clear the query param silently if they hit back
                const params = new URLSearchParams(searchParams.toString());
                params.delete('portfolioId');
                router.replace(`/expert/portfolio?${params.toString()}`, { scroll: false });
              }
            }}
            isOwner={isOwner}
            onEdit={() => handleOpenWriteModal(selectedPortfolio)}
            onDelete={handleDeletePortfolio}
            prevPost={prevPost}
            nextPost={nextPost}
            onSelectPost={(post) => {
              setSelectedPortfolio(post);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <PortfolioList 
            portfolios={variant === 'dashboard' ? portfolios.slice(0, 6) : portfolios} 
            onSelect={(item) => {
              if (variant === 'dashboard') {
                router.push(`/expert/portfolio?userId=${targetUserId}&portfolioId=${item.id}`);
              } else {
                setSelectedPortfolio(item);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                const params = new URLSearchParams(searchParams.toString());
                params.set('portfolioId', item.id.toString());
                router.replace(`/expert/portfolio?${params.toString()}`, { scroll: false });
              }
            }} 
          />
        )}
      </div>

      {isOwner && isWriteModalOpen && (
        <WritePortfolioModal 
          isOpen={isWriteModalOpen}
          onClose={() => {
            setIsWriteModalOpen(false);
            setEditData(null);
          }}
          expertId={targetUserId}
          categories={categories}
          editData={editData}
          onSuccess={() => {
            setIsWriteModalOpen(false);
            setEditData(null);
            fetchPortfolios();
            fetchCategories();
            setSelectedPortfolio(null); // Return to list after save
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-800">정말 삭제하시겠습니까?</h3>
              <p className="text-sm text-slate-500 font-medium">
                삭제된 포트폴리오는 다시 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <div className="w-px bg-slate-100"></div>
              <button 
                onClick={confirmDeletePortfolio}
                className="flex-1 px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
