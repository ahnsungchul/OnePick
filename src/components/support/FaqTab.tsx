import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { getFaqsAction } from '@/actions/support.action';

interface FaqTabProps {
  isExpert?: boolean;
}

export default function FaqTab({ isExpert = false }: FaqTabProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      setLoading(true);
      try {
        const target = isExpert ? "EXPERT" : "USER";
        const result = await getFaqsAction(target);
        if (result.success && Array.isArray(result.data)) {
          setFaqs(result.data);
        } else if (!result.success) {
          setError(result.error || '자주 묻는 질문을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setError('시스템 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, [isExpert]);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.includes(searchTerm) || faq.answer.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-1">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">자주 묻는 질문</h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="궁금하신 내용을 검색해 보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
            <p className="text-sm font-medium">검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div 
              key={faq.id} 
              className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                openId === faq.id ? 'border-blue-200 shadow-lg shadow-blue-500/5' : 'border-slate-100 shadow-sm'
              }`}
            >
              <button 
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full p-6 text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 whitespace-nowrap uppercase">
                    {faq.category}
                  </span>
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </h4>
                </div>
                {openId === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-blue-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-slate-400 shrink-0" />
                )}
              </button>
              
              {openId === faq.id && (
                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-5 bg-slate-50 rounded-2xl text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-50">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
