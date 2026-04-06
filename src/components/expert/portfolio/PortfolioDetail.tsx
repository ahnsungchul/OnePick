import React from 'react';
import 'suneditor/dist/css/suneditor.min.css';
import { ExternalLink, Clock, ArrowLeft, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PortfolioDetailProps {
  portfolio: any;
  onBack: () => void;
  isOwner: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  prevPost?: any | null;
  nextPost?: any | null;
  onSelectPost?: (post: any) => void;
}

export default function PortfolioDetail({ 
  portfolio, onBack, isOwner, onEdit, onDelete, prevPost, nextPost, onSelectPost 
}: PortfolioDetailProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-full h-full animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="sticky top-16 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm rounded-t-2xl">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              수정
            </button>
            {onDelete && (
              <button 
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-8 md:p-10 max-w-4xl mx-auto space-y-8 flex-1 w-full">
        {/* Title Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {portfolio.category?.name || '기본 설정 안됨'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {new Date(portfolio.createdAt).toLocaleDateString()}
            </div>
            {portfolio.isImported && portfolio.blogUrl && (
              <a 
                href={portfolio.blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-white bg-slate-800 px-2 py-1 rounded-md hover:bg-slate-900 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                원본 블로그 열기
              </a>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
            {portfolio.title}
          </h1>
        </div>

        {/* Image Section */}
        {portfolio.thumbnailUrl && (
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <img 
              src={portfolio.thumbnailUrl} 
              alt={portfolio.title}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Content Section */}
        {portfolio.content.includes('<p') || portfolio.content.includes('<img') ? (
           <div className="sun-editor" style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}>
             <div 
               className="sun-editor-editable leading-relaxed text-[15px] text-slate-800 break-words"
               dangerouslySetInnerHTML={{ __html: portfolio.content.replace(/<img(?![^>]*referrerpolicy)/g, '<img referrerpolicy="no-referrer"') }} 
             />
           </div>
        ) : (
          <div className="prose prose-slate max-w-none prose-p:leading-loose">
            {portfolio.content.split('\n').map((line: string, i: number) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('![img](') && trimmed.endsWith(')')) {
                 const src = trimmed.slice(7, -1);
                 return (
                   <div key={i} className="my-8 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                     <img src={src} alt="본문 이미지" referrerPolicy="no-referrer" className="w-full h-auto object-cover max-h-[600px]" />
                   </div>
                 );
              }
              return <p key={i} className="min-h-[1.5rem] text-slate-700 text-[15px]">{line}</p>;
            })}
          </div>
        )}
      </div>

      {/* Pagination / Navigation Footer */}
      {(prevPost || nextPost) && (
        <div className="border-t border-slate-100 p-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          {prevPost ? (
            <button 
              onClick={() => onSelectPost && onSelectPost(prevPost)}
              className="group flex flex-col items-start w-full sm:w-1/2 p-4 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1 group-hover:text-blue-600 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
                이전글
              </div>
              <div className="font-semibold text-slate-800 text-sm line-clamp-1 w-full">{prevPost.title}</div>
            </button>
          ) : (
            <div className="w-full sm:w-1/2 p-4 hidden sm:block"></div>
          )}

          {/* Divider */}
          <div className="hidden sm:block w-px h-12 bg-slate-100 shrink-0"></div>

          {nextPost ? (
            <button 
              onClick={() => onSelectPost && onSelectPost(nextPost)}
              className="group flex flex-col items-end w-full sm:w-1/2 p-4 rounded-xl hover:bg-slate-50 transition-colors text-right"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1 group-hover:text-blue-600 transition-colors">
                다음글
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-slate-800 text-sm line-clamp-1 w-full">{nextPost.title}</div>
            </button>
          ) : (
            <div className="w-full sm:w-1/2 p-4 hidden sm:block"></div>
          )}
        </div>
      )}
    </div>
  );
}
