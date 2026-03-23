import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { getChatMessagesAction, sendChatMessageAction } from '@/actions/chat.action';

interface ChatMessage {
  id: string;
  senderId: number;
  receiverId: number;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
}

interface ChatPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: any;
  currentUserId: number;
  estimateId: string;
  otherParty?: { id: number; name: string; image?: string; roleLabel?: string };
}

export default function ChatPopupModal({ isOpen, onClose, bid, currentUserId, estimateId, otherParty }: ChatPopupModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine the other party (fallback to bid.expert for customer view)
  const targetUser = otherParty || {
    id: bid?.expert?.id,
    name: bid?.expert?.name,
    image: bid?.expert?.image,
    roleLabel: bid?.expert?.specialty || '상담 진행 중'
  };

  // Fetch messages function
  const fetchMessages = async () => {
    if (!isOpen || !bid || !currentUserId || !estimateId || !targetUser.id) return;
    
    // Fetch between current user and target user
    const res = await getChatMessagesAction(estimateId, currentUserId, targetUser.id);
    if (res.success && res.data) {
      setMessages(res.data as ChatMessage[]);
    }
  };

  useEffect(() => {
    if (isOpen && bid) {
      // First fetch
      setIsLoading(true);
      fetchMessages().finally(() => setIsLoading(false));

      // Polling every 3 seconds
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);

      // Scroll lock
      document.body.style.overflow = 'hidden';

      return () => {
        clearInterval(interval);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, bid, currentUserId, estimateId, targetUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !bid) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: targetUser.id,
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, tempMessage]);

    // Send to DB
    const res = await sendChatMessageAction({
      estimateId,
      senderId: currentUserId,
      receiverId: targetUser.id,
      message: messageText
    });

    if (res.success) {
      // Fetch fresh to get accurate DB id and status
      fetchMessages();
    } else {
      alert("메시지 전송에 실패했습니다.");
      // Revert optimistic update 
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInputValue(messageText);
    }
    
    setIsSending(false);
  };

  const formatTime = (time: string | Date) => {
    const date = new Date(time);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 !m-0" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
               <img 
                 src={targetUser.image || `https://picsum.photos/seed/${targetUser.id || targetUser.name}/100/100`} 
                 alt={targetUser.name} 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
               />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{targetUser.name} {targetUser.roleLabel === '고객님' ? '고객님' : '전문가'}</h3>
              <p className="text-xs text-slate-500 font-medium">{targetUser.roleLabel !== '고객님' ? targetUser.roleLabel : '요청 내역 상담'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 flex flex-col">
          <div className="text-center text-xs text-slate-400 mb-4 font-bold bg-white/50 py-2 rounded-xl border border-slate-100/50">
            채팅방이 생성되었습니다. <br/>
            안전한 거래를 위해 원픽 플랫폼 내에서 대화해 주세요.
          </div>
          
          <div className="flex-1" /> {/* Push messages to bottom if few */}

          {isLoading ? (
            <div className="text-center py-4 text-xs font-bold text-slate-400 animate-pulse">
              메시지 불러오는 중...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-xs font-bold text-slate-400">
              첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2"
          >
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <textarea
                placeholder="메시지를 입력하세요..."
                className="w-full max-h-32 min-h-[48px] bg-transparent border-none focus:ring-0 focus:outline-none resize-none px-4 py-3 text-sm flex items-center font-medium"
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:hover:bg-slate-300 shadow-lg shadow-blue-600/20 disabled:shadow-none shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
