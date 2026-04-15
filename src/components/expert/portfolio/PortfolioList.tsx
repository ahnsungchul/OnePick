'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Clock, FolderOpen, X } from 'lucide-react';

interface PortfolioListProps {
  portfolios: any[];
  onSelect: (item: any) => void;
}

export default function PortfolioList({ portfolios, onSelect }: PortfolioListProps) {

  if (portfolios.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">등록된 블로그가 없습니다</h3>
        <p className="text-sm text-slate-500">
          오른쪽 위 글쓰기 버튼을 눌러 블로그를 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {portfolios.map((item) => (
          <a
            key={item.id} 
            href={item.isImported && item.blogUrl ? item.blogUrl : `/expert/portfolio?userId=${item.expertId}&portfolioId=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col h-full"
          >
            {/* 썸네일 영역 */}
            <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
              {item.thumbnailUrl ? (
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Image src="/images/placeholder.webp" alt="placeholder" layout="fill" objectFit="cover" className="opacity-10" />
                </div>
              )}
              {item.isImported && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  블로그
                </div>
              )}
            </div>

            {/* 내용 영역 */}
            <div className="p-5 flex flex-col flex-1">
              <div className="text-xs font-bold text-blue-600 mb-2">
                {item.category?.name || '기본 설정 안됨'}
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1 break-words">
                {item.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
              </p>
              
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-auto pt-4 border-t border-slate-50">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
