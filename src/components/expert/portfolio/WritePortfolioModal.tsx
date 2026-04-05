'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { fetchOpenGraphDataAction, createPortfolioAction, uploadPortfolioImageAction } from '@/actions/portfolio.action';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });
interface WritePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  expertId: number;
  categories: any[];
  editData?: any;
  onSuccess: () => void;
  initialCategoryId?: number | null;
}

export default function WritePortfolioModal({ isOpen, onClose, expertId, categories, editData, onSuccess, initialCategoryId = null }: WritePortfolioModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'write'>(editData ? (editData.isImported ? 'import' : 'write') : 'import');
  const [categoryId, setCategoryId] = useState<number | null>(editData?.categoryId || initialCategoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [blogUrl, setBlogUrl] = useState(editData?.blogUrl || '');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchCompleted, setFetchCompleted] = useState(!!editData?.isImported);
  const [importTitle, setImportTitle] = useState(editData?.title || '');
  const [importDescription, setImportDescription] = useState(editData?.content || '');
  const [importImage, setImportImage] = useState<string | null>(editData?.thumbnailUrl || null);

  // Write State
  const [title, setTitle] = useState(editData && !editData.isImported ? editData.title : '');
  const [content, setContent] = useState(editData && !editData.isImported ? editData.content : '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editData && !editData.isImported ? editData.thumbnailUrl : null);

  if (!isOpen) return null;

  const handleFetchUrl = async () => {
    if (!blogUrl) return;
    setIsFetchingUrl(true);
    const res = await fetchOpenGraphDataAction(blogUrl);
    if (res.success && res.data) {
      setImportTitle(res.data.title || '');
      setImportDescription(res.data.content || res.data.description || '');
      setImportImage(res.data.image || null);
      setFetchCompleted(true);
    } else {
      alert(res.error || '블로그 정보를 가져오지 못했습니다.');
    }
    setIsFetchingUrl(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImagePreview(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (activeTab === 'import') {
        if (!fetchCompleted) {
          alert('먼저 블로그 정보를 가져와주세요.');
          setIsSubmitting(false);
          return;
        }

        if (!importTitle.trim()) {
           alert('제목을 입력해주세요.');
           setIsSubmitting(false);
           return;
        }

        const data = {
          expertId,
          categoryId,
          title: importTitle,
          content: importDescription || '내용 없음',
          thumbnailUrl: importImage || null,
          blogUrl: blogUrl,
          isImported: true,
        };

        let res;
        if (editData?.id) {
          // You must import updatePortfolioAction
          const { updatePortfolioAction } = await import('@/actions/portfolio.action');
          res = await updatePortfolioAction(editData.id, data);
        } else {
          res = await createPortfolioAction(data);
        }

        if (res.success) onSuccess();
        else alert(res.error);
        
      } else {
        if (!title.trim() || !content.trim()) {
          alert('제목과 내용을 입력해주세요.');
          setIsSubmitting(false);
          return;
        }

        let uploadedImageUrl = null;
        if (imageFile) {
          const formData = new FormData();
          formData.append('file', imageFile);
          const uploadRes = await uploadPortfolioImageAction(formData);
          if (uploadRes.success) {
            uploadedImageUrl = uploadRes.data;
          } else {
            console.error('Failed to upload image');
          }
        }

        const data = {
          expertId,
          categoryId,
          title,
          content,
          thumbnailUrl: uploadedImageUrl !== null ? uploadedImageUrl : (imagePreview || null),
          blogUrl: null,
          isImported: false,
        };

        let res;
        if (editData?.id) {
          const { updatePortfolioAction } = await import('@/actions/portfolio.action');
          res = await updatePortfolioAction(editData.id, data);
        } else {
          res = await createPortfolioAction(data);
        }
        
        if (res.success) onSuccess();
        else alert(res.error);
      }
    } catch (error) {
      console.error(error);
      alert('등록 중 오류가 발생했습니다.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-black text-slate-800">
            {editData ? '포트폴리오 수정' : '포트폴리오 글쓰기'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Only show when creating, not editing */}
        {!editData && (
          <div className="flex border-b border-slate-100 flex-shrink-0 px-6">
            <button 
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              외부 블로그 가져오기
            </button>
            <button 
              onClick={() => setActiveTab('write')}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'write' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              직접 작성하기
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Category Select */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">카테고리 선택 (선택)</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">카테고리 없음</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {activeTab === 'import' ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 외부 블로그 링크를 입력해주세요.</p>
                <p className="text-blue-600/80">입력하신 블로그의 대표 이미지와 제목을 가져와 포트폴리오로 보여줍니다.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">블로그 URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="url" 
                      placeholder="https://blog.naver.com/..."
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <button 
                    onClick={handleFetchUrl}
                    disabled={isFetchingUrl || !blogUrl}
                    className="px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px] flex justify-center items-center"
                  >
                    {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : '정보 가져오기'}
                  </button>
                </div>
              </div>

              {fetchCompleted && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-xs font-semibold leading-relaxed border border-amber-100">
                    일부 블로그 플랫폼(네이버 블로그 등)은 보안 정책상 정보가 완벽하게 불러와지지 않을 수 있습니다. 값이 비어 있다면 아래에서 직접 수정해주세요.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">불러온 제목 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={importTitle}
                      onChange={(e) => setImportTitle(e.target.value)}
                      placeholder="제목 추가"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">불러온 내용 (이미지와 텍스트)</label>
                    <SunEditor 
                      defaultValue={importDescription}
                      onChange={setImportDescription}
                      setOptions={{
                        buttonList: [
                          ['undo', 'redo', 'font', 'fontSize', 'formatBlock'],
                          ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                          ['fontColor', 'hiliteColor', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'table'],
                          ['link', 'image', 'video', 'fullScreen', 'showBlocks', 'codeView']
                        ],
                        minHeight: '400px'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">불러온 썸네일 이미지 링크</label>
                    <div className="flex gap-3">
                       {importImage ? (
                         <img src={importImage} alt="preview" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                       ) : (
                         <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                           <ImageIcon className="w-4 h-4" />
                         </div>
                       )}
                       <input 
                        type="url" 
                        value={importImage || ''}
                        onChange={(e) => setImportImage(e.target.value)}
                        placeholder="이미지가 없는 경우 URL 직접 입력"
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">대표 사진</label>
                <div className="flex gap-4 items-start">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 group flex-shrink-0">
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-slate-400 hover:text-slate-500 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs font-semibold">사진 선택</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                  <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl flex-1 border border-slate-100 group">
                     포트폴리오 목록에 보여질 대표 썸네일 이미지를 업로드해주세요. 장수가 많은 경우 게시글 내보이기 형태인 <span className="font-bold">블로그 가져오기</span>를 추천합니다.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">포트폴리오 제목</label>
                <input 
                  type="text" 
                  placeholder="예) 아파트 인테리어 시공 사례"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">글 작성</label>
                <SunEditor 
                  defaultValue={content}
                  onChange={setContent}
                  setOptions={{
                    buttonList: [
                      ['undo', 'redo', 'font', 'fontSize', 'formatBlock'],
                      ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                      ['fontColor', 'hiliteColor', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'table'],
                      ['link', 'image', 'video', 'fullScreen', 'showBlocks', 'codeView']
                    ],
                    minHeight: '400px'
                  }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-slate-50">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (activeTab === 'import' && !fetchCompleted)}
            className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editData ? '포트폴리오 수정하기' : '포트폴리오 등록하기')}
          </button>
        </div>

      </div>
    </div>
  );
}
