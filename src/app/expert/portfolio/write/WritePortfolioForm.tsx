'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Loader2, ArrowLeft, X } from 'lucide-react';
import { fetchOpenGraphDataAction, createPortfolioAction, uploadPortfolioImageAction, updatePortfolioAction } from '@/actions/portfolio.action';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import { useRouter } from 'next/navigation';

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

interface WritePortfolioFormProps {
  expertId: number;
  categories: any[];
  editData?: any;
  initialCategoryId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function WritePortfolioForm({ expertId, categories, editData, initialCategoryId = null, onSuccess, onCancel }: WritePortfolioFormProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'write'>(editData ? (editData.isImported ? 'import' : 'write') : 'import');
  const [categoryId, setCategoryId] = useState<number | null>(editData?.categoryId || initialCategoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoTags, setSeoTags] = useState(editData?.seoTags || '');

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

  useEffect(() => {
    if (isFetchingUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFetchingUrl]);

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
          seoTags: seoTags.trim(),
        };

        let res;
        if (editData?.id) {
          res = await updatePortfolioAction(editData.id, data);
        } else {
          res = await createPortfolioAction(data);
        }

        if (res.success) {
          onSuccess();
        } else {
          alert(res.error);
        }
        
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
          seoTags: seoTags.trim(),
        };

        let res;
        if (editData?.id) {
          res = await updatePortfolioAction(editData.id, data);
        } else {
          res = await createPortfolioAction(data);
        }
        
        if (res.success) {
          onSuccess();
        } else {
          alert(res.error);
        }
      }
    } catch (error) {
      console.error(error);
      alert('등록 중 오류가 발생했습니다.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <style>{`
        .sun-editor .se-toolbar.se-toolbar-sticky {
          top: 64px !important;
        }
        .sun-editor-editable {
          font-size: 16px !important;
        }
        .sun-editor-editable .se-component-content {
          width: 100% !important;
        }
      `}</style>
      {isFetchingUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 !mt-0">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <p className="text-white font-bold text-lg">블로그 정보를 가져오는 중입니다...</p>
          <p className="text-white/80 text-sm mt-2">잠시만 기다려주세요.</p>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden w-full">
        {/* Header */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100 bg-slate-50/50">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl md:text-2xl font-black text-slate-800">
          {editData ? '블로그 수정' : '블로그 작성'}
        </h2>
      </div>

      {/* Tabs */}
      {!editData && (
        <div className="flex border-b border-slate-100 px-8 bg-slate-50/20">
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
      <div className="p-8 space-y-8">
        
        {/* Category Select */}
        <div className="w-full">
          <label className="block text-sm font-bold text-slate-700 mb-2">카테고리 선택</label>
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">카테고리 없음</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full h-px bg-slate-100"></div>

        {activeTab === 'import' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-sm text-blue-800 flex flex-col gap-1">
              <span className="font-bold text-base flex items-center gap-2">
                💡 외부 블로그 링크를 입력해주세요.
              </span>
              <span className="text-blue-600">입력하신 블로그의 대표 이미지와 제목, 내용을 가져와 블로그로 보여줍니다.</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">블로그 URL</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url" 
                    placeholder="https://blog.naver.com/..."
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleFetchUrl}
                  disabled={isFetchingUrl || !blogUrl}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[120px] flex justify-center items-center shadow-sm"
                >
                  {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : '정보 가져오기'}
                </button>
              </div>
            </div>

            {fetchCompleted && (
              <div className="space-y-6 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-semibold leading-relaxed border border-amber-100">
                  일부 블로그 플랫폼(네이버 블로그 등)은 보안 정책상 정보가 완벽하게 불러와지지 않을 수 있습니다. 정보가 정확하지 않다면 아래 에디터에서 직접 수정해주세요.
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">불러온 제목 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    placeholder="제목 추가"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">불러온 내용 (이미지와 텍스트)</label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">불러온 썸네일 이미지 링크</label>
                  <div className="flex gap-4">
                     {importImage ? (
                       <img src={importImage} alt="preview" referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm" />
                     ) : (
                       <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 shadow-sm">
                         <ImageIcon className="w-6 h-6" />
                       </div>
                     )}
                     <input 
                      type="url" 
                      value={importImage || ''}
                      onChange={(e) => setImportImage(e.target.value)}
                      placeholder="이미지가 없는 경우 URL 직접 입력"
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 shadow-sm self-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">대표 썸네일 사진</label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {imagePreview ? (
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 group flex-shrink-0 shadow-sm">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-8 h-8" />
                    </button>
                  </div>
                ) : (
                  <label className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-slate-400 hover:text-blue-500 flex-shrink-0">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-bold">사진 선택</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
                <div className="text-sm text-slate-600 bg-slate-50 p-5 rounded-2xl flex-1 border border-slate-100">
                  블로그 목록에 보여질 대표 썸네일 이미지를 업로드해주세요.<br/>
                  게시글 내부에 이미지가 많거나 다른 곳에서 작성한 블로그가 있다면 <span className="font-bold text-blue-600">외부 블로그 가져오기</span> 기능을 추천합니다.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">블로그 제목 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="예) 송파구 30평형 아파트 인테리어 시공 사례"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">글 작성 <span className="text-red-500">*</span></label>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                    minHeight: '500px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-px bg-slate-100"></div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">검색어 태그 (검색 노출용)</label>
          <input 
            type="text" 
            placeholder="예) 인테리어, 송파구, 30평형 (콤마로 구분)"
            value={seoTags}
            onChange={(e) => setSeoTags(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
          <p className="text-xs text-slate-500 mt-2">네이버, 구글 검색 등의 SEO 키워드로 직접 반영됩니다. 여러 개일 경우 콤마(,)로 구분해 주세요.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
        <button 
          onClick={onCancel}
          className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          취소
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || (activeTab === 'import' && !fetchCompleted)}
          className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center min-w-[140px]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editData ? '수정 완료' : '등록 완료')}
        </button>
      </div>
    </div>
    </>
  );
}
