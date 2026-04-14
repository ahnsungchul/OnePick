'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  HelpCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { createInquiryAction, getMyInquiriesAction } from '@/actions/support.action';

interface InquiryTabProps {
  userId: string | undefined;
  isExpert?: boolean;
}

export default function InquiryTab({ userId, isExpert = false }: InquiryTabProps) {
  const [inquiryType, setInquiryType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  
  const inquiryTypes = isExpert ? [
    { value: 'account', label: '계정/프로필' },
    { value: 'payment', label: '정산/수수료' },
    { value: 'service', label: '견적/매칭 이용' },
    { value: 'customer', label: '고객 분쟁/신고' },
    { value: 'other', label: '기타 문의' },
  ] : [
    { value: 'account', label: '계정/로그인' },
    { value: 'payment', label: '결제/환불' },
    { value: 'service', label: '서비스 이용' },
    { value: 'expert', label: '전문가 관련' },
    { value: 'other', label: '기타 문의' },
  ];

  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const target = isExpert ? "EXPERT" : "USER";
      const result = await getMyInquiriesAction(parseInt(userId), target);
      if (result.success) {
        // 샘플 답변 완료 데이터 추가
        const sampleAnswered = {
          id: 'sample-001',
          type: '서비스 이용',
          title: '가상 계좌 입금 기한은 어떻게 되나요?',
          content: '가상 계좌로 입금할 때 기한이 있는지 궁금합니다. 기한이 지나면 다시 요청해야 하나요?',
          answer: '안녕하세요, 원픽 고객센터입니다. 가상 계좌의 입금 기한은 발급 시점으로부터 24시간입니다. 기한 내 입금이 확인되지 않으면 해당 요청은 자동으로 취소되니, 다시 한 번 요청해 주시기 바랍니다. 감사합니다.',
          status: 'ANSWERED',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
        };
        
        setHistory([sampleAnswered, ...(result.data || [])]);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedInquiry) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedInquiry]);

  const handleSubmit = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!inquiryType || !title || !content) {
      alert('모든 필수 항목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        throw new Error("유효한 사용자 ID가 아닙니다.");
      }

      const target = isExpert ? "EXPERT" : "USER";
      const typeLabel = inquiryTypes.find(t => t.value === inquiryType)?.label || inquiryType;
      const result = await createInquiryAction(
        parsedUserId,
        typeLabel,
        title,
        content,
        target
      );

      if (result.success) {
        setTitle('');
        setContent('');
        setInquiryType('');
        fetchHistory();
      } else {
        alert('발생한 오류: ' + result.error);
      }
    } catch (error) {
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="space-y-8">
        {/* Inquiry Form Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">문의 유형 <span className="text-red-500">*</span></label>
              <select 
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none text-slate-700 font-medium"
              >
                <option value="">유형을 선택해 주세요</option>
                {inquiryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">제목 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문의 제목을 입력해 주세요"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">상세 내용 <span className="text-red-500">*</span></label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의하실 내용을 상세히 적어주시면 정확한 답변을 받으실 수 있습니다. (최대 1000자)"
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 resize-none font-medium"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              문의 제출하기
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50/50 p-6 flex items-start gap-4 border-t border-blue-50">
          <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            문의하신 내용은 담당자가 확인 후 영업일 기준 24시간 이내에 답변해 드립니다. <br />
            답변이 완료되면 가입하신 이메일 또는 알림으로 안내해 드립니다.
          </p>
        </div>
      </div>

      {/* Inquiry History Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-slate-900 ml-1">나의 문의 내역</h3>
        
        {historyLoading ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">내역을 불러오는 중...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
            <p className="text-sm font-medium">문의 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedInquiry(item)}
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded-2xl ${item.status === 'ANSWERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.status === 'ANSWERED' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tracking-tighter uppercase whitespace-nowrap">
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[200px] md:max-w-md">
                      {item.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                    item.status === 'ANSWERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'ANSWERED' ? '답변완료' : '접수대기'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 uppercase tracking-tight">{selectedInquiry.type}</span>
                  <span>{new Date(selectedInquiry.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight truncate">{selectedInquiry.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-all shrink-0"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Question Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">Q</div>
                  <span className="text-sm font-bold text-slate-800">나의 문의 내용</span>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedInquiry.content}
                </div>
              </div>

              {/* Answer Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">A</div>
                  <span className="text-sm font-bold text-slate-800">운영진 답변</span>
                </div>
                {selectedInquiry.status === 'ANSWERED' ? (
                  <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-emerald-900 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedInquiry.answer}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-2xl text-slate-400 italic text-sm text-center font-medium">
                    담당자가 문의 내용을 확인 중입니다. 잠시만 기다려 주세요.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
