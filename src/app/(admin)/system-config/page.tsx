'use client';

import React, { useEffect, useState } from 'react';
import { getAllSystemConfigs, updateSystemConfig } from '@/actions/systemConfig.action';
import { Plus, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isNewMode, setIsNewMode] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const res = await getAllSystemConfigs();
    if (res.success && res.data) {
      setConfigs(res.data);
    } else {
      setErrorMsg(res.error || '설정을 불러오지 못했습니다.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditInit = (item: ConfigItem) => {
    setEditingKey(item.key);
    setEditValue(item.value);
    setEditDesc(item.description || '');
    setIsNewMode(false);
    setErrorMsg('');
  };

  const handleEditCancel = () => {
    setEditingKey(null);
  };

  const handleSaveConfig = async (key: string, value: string, desc: string) => {
    if (!key.trim() || !value.trim()) {
      setErrorMsg('Key와 Value는 필수입니다.');
      return;
    }

    const res = await updateSystemConfig(key, value, desc);
    if (res.success) {
      setEditingKey(null);
      setIsNewMode(false);
      setNewKey('');
      setNewValue('');
      setNewDesc('');
      setErrorMsg('');
      loadData();
      alert('설정이 성공적으로 저장되었습니다.');
    } else {
      setErrorMsg(res.error || '저장 실패');
      alert(res.error || '저장 실패');
    }
  };

  if (isLoading && configs.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">💵 시스템 결제 및 금액 설정</h1>
          <p className="text-slate-500 mt-2 font-medium">웹앱 전반에서 사용되는 각종 금액, 수수료 등을 동적으로 관리합니다.</p>
        </div>
        <button 
          onClick={() => { setIsNewMode(true); setEditingKey(null); setErrorMsg(''); }}
          className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> 새 설정 추가
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-3 mb-6 font-bold border border-rose-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600 w-1/4">설정 키 (Key)</th>
              <th className="p-4 font-bold text-slate-600 w-1/4">설정 값 (Value)</th>
              <th className="p-4 font-bold text-slate-600 w-1/3">설명</th>
              <th className="p-4 font-bold text-slate-600 w-1/6 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isNewMode && (
              <tr className="bg-blue-50/50">
                <td className="p-4">
                  <input 
                    type="text" 
                    value={newKey} 
                    onChange={e => setNewKey(e.target.value)} 
                    placeholder="예: NEW_FEE" 
                    autoFocus
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="text" 
                    value={newValue} 
                    onChange={e => setNewValue(e.target.value)} 
                    placeholder="예: 5000" 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="text" 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                    placeholder="설명을 입력하세요" 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700"
                  />
                </td>
                <td className="p-4 text-right align-middle">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleSaveConfig(newKey, newValue, newDesc)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="저장">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsNewMode(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition" title="취소">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {configs.length === 0 && !isNewMode && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">
                  등록된 설정이 없습니다.
                </td>
              </tr>
            )}

            {configs.map(item => {
              const isEditing = editingKey === item.key;
              return (
                <tr key={item.key} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 font-mono text-sm text-slate-800 font-bold bg-slate-50/50">
                    {item.key}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        autoFocus
                        className="w-full border border-blue-300 shadow-sm rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                      />
                    ) : (
                      <span className="font-mono text-blue-700 font-bold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                        {item.value}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editDesc} 
                        onChange={e => setEditDesc(e.target.value)} 
                        className="w-full border border-blue-300 shadow-sm rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-700"
                      />
                    ) : (
                      <span className="text-slate-600 text-sm font-medium">{item.description || '-'}</span>
                    )}
                  </td>
                  <td className="p-4 text-right align-middle">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveConfig(item.key, editValue, editDesc)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition" title="저장">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={handleEditCancel} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition" title="취소">
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleEditInit(item)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition" title="수정">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
