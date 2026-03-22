'use client';

import { useState } from 'react';
import { submitEstimateAction } from '@/actions/estimate.action';

export default function SubmitEstimateForm({ customerId }: { customerId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage('');
    
    // Server Action 호출
    const result = await submitEstimateAction(formData);
    
    setIsSubmitting(false);
    
    if (result.success) {
      setMessage(`견적 요청이 성공적으로 완료되었습니다! 요청 ID: ${result.estimate?.id}`);
    } else {
      setMessage(`오류 발생: ${result.error || '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-sm mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">새로운 견적 요청</h2>
      
      <form action={handleSubmit} className="space-y-5">
        {/* 숨김 필드로 customerId 전달 */}
        <input type="hidden" name="customerId" value={customerId} />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">카테고리</label>
          <select name="category" required className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">카테고리를 선택하세요</option>
            <option value="CLEANING">청소</option>
            <option value="REPAIR">수리 (집수리 등)</option>
            <option value="MOVING">이사/운송</option>
            <option value="LESSON">과외/레슨</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">상세 내용 (견적 설명)</label>
          <textarea 
            name="details" 
            placeholder="상세한 요청 내용과 현재 상황을 설명해주세요." 
            required 
            rows={4}
            className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">위치 (주소)</label>
          <input 
            type="text" 
            name="location" 
            placeholder="예) 서울시 강남구 테헤란로" 
            required 
            className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">참고 사진 (선택)</label>
          <input 
            type="file" 
            name="photo" 
            accept="image/*" 
            className="w-full border border-gray-300 p-2.5 rounded-md bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">현장 상황을 알 수 있는 사진을 첨부해주시면 더 정확한 견적을 받을 수 있습니다.</p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold py-3 mt-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '업로드 및 요청 진행 중...' : '견적 요청 등록하기'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.includes('오류') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
