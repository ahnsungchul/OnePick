'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  CheckSquare, 
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { createReportAction } from '@/actions/support.action';

interface ReportTabProps {
  userId: string | undefined;
}

export default function ReportTab({ userId }: ReportTabProps) {
  const [targetId, setTargetId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  
  const reportReasons = [
    { value: 'spam', label: '스팸/홍보물 포함' },
    { value: 'abusive', label: '비속어/부적절한 언어 사용' },
    { value: 'fraud', label: '사기/금전적 피해 의심' },
    { value: 'out-of-app', label: '외부 결제 유도' },
    { value: 'misleading', label: '허위 프로필/정보' },
    { value: 'other', label: '기타 부적절한 행위' },
  ];

  const handleSubmit = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!reportReason || !details) {
      alert('모든 필수 항목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        throw new Error("유효한 사용자 ID가 아닙니다.");
      }

      const reasonLabel = reportReasons.find(r => r.value === reportReason)?.label || reportReason;
      const result = await createReportAction(
        parsedUserId,
        targetId,
        reasonLabel,
        details
      );

      if (result.success) {
        alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
        setTargetId('');
        setReportReason('');
        setDetails('');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
      <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-red-900">안전한 원픽을 위해 함께 해주세요.</h4>
          <p className="text-xs text-red-700 leading-relaxed font-medium">
            건전한 서비스 이용을 저해하거나 타인에게 피해를 주는 행위가 발견되면 제보해 주세요. <br />
            보내주신 제보는 담당자가 신속히 검토하여 운영 정책에 따라 조치하겠습니다.
          </p>
        </div>
      </div>

      {/* Report Form Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Target Selection (Step-like) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              1. 신고 대상 정보
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="신고할 대상(전문가 이름 또는 요청서 번호 등)을 입력해 주세요"
                className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-slate-700 font-bold"
              />
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              2. 신고 사유 선택 <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setReportReason(reason.value)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                    reportReason === reason.value 
                    ? 'border-red-500 bg-red-50 ring-1 ring-red-500' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-sm font-bold ${reportReason === reason.value ? 'text-red-700' : 'text-slate-600'}`}>
                    {reason.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    reportReason === reason.value ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-200 group-hover:border-slate-400'
                  }`}>
                    {reportReason === reason.value && <div className="text-[10px] font-bold">✓</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              3. 상세 경위 입력 <span className="text-red-500">*</span>
            </h3>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="피해 상황이나 구체적인 부적절 행위 내용을 적어주세요. 캡처 화면 등이 있다면 1:1 문의를 이용해 주시기 바랍니다."
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-slate-700 resize-none font-bold"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 bg-red-600 text-white font-bold rounded-3xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
            신고 접수하기
          </button>
        </div>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium">
            허위 신고 또는 타인을 비방할 목적으로 신고를 이용할 경우 <br />
            이용 약관에 따라 서비스 이용이 제한될 수 있으니 신중하게 접수해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
