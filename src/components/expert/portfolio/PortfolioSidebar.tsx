'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Settings, Plus, Folder, FolderOpen, FileText } from 'lucide-react';
import { createPortfolioCategoryAction } from '@/actions/portfolio.action';

interface PortfolioSidebarProps {
  categories: any[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  isOwner: boolean;
  onCategoryChanged: () => void;
  expertId: number;
  totalCount?: number;
}

export default function PortfolioSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isOwner,
  onCategoryChanged,
  expertId,
  totalCount
}: PortfolioSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsLoading(true);
    const res = await createPortfolioCategoryAction(expertId, newCatName.trim());
    if (res.success) {
      setNewCatName('');
      setIsAdding(false);
      onCategoryChanged();
    } else {
      alert(res.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
      <div className="flex items-center justify-between px-2 pl-3">
        <h3 className="font-black text-slate-800 text-lg">카테고리</h3>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-200",
            selectedCategoryId === null
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          {selectedCategoryId === null ? (
            <FolderOpen className="w-5 h-5 text-blue-500 fill-blue-100 flex-shrink-0" />
          ) : (
            <Folder className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
          <span className="flex-1 truncate">전체보기</span>
          {totalCount !== undefined && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100/60 px-2 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
              {totalCount}
            </span>
          )}
        </button>
        
        {categories.length > 0 && (
          <div className="pl-4 mt-1">
            <ul className="space-y-1 border-l-2 border-slate-100 pl-3 relative">
              {categories.map((cat) => (
                <li key={cat.id} className="relative group">
                  {/* Tree branch horizontal line */}
                  <div className="absolute top-1/2 -left-3 w-3 h-0.5 bg-slate-100 -translate-y-1/2 group-hover:bg-slate-200 transition-colors"></div>
                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200",
                      selectedCategoryId === cat.id
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <FileText className={cn("w-4 h-4 flex-shrink-0", selectedCategoryId === cat.id ? "text-blue-500" : "text-slate-400")} />
                    <span className="truncate flex-1">{cat.name}</span>
                    {cat._count?.portfolios !== undefined && (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100/60 px-1.5 py-0.5 rounded-md">
                        {cat._count.portfolios}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="pt-2 border-t border-slate-100 mt-2">
          {isAdding ? (
            <div className="flex bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="새 카테고리 명"
                className="w-full bg-transparent border-none text-sm px-3 py-2 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
                disabled={isLoading}
                autoFocus
              />
              <button 
                onClick={handleAddCategory}
                disabled={isLoading}
                className="px-3 whitespace-nowrap flex-shrink-0 bg-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                추가
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              카테고리 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
