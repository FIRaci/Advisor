import React, { useState, useRef, useEffect } from 'react';
import { Send, ListChecks, X, RefreshCw, Sparkles } from 'lucide-react';
interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  currentCampaign: { quizData?: any } | null;
  onOpenFullQuiz: () => void;
}

const PREDEFINED_PROMPTS = [
  "Phân tích đối thủ cạnh tranh chính",
  "Lên kế hoạch ra mắt sản phẩm mới",
  "Gợi ý chiến dịch Marketing đa kênh",
  "Cách tối ưu hóa chi phí quảng cáo",
  "Đề xuất content cho dịp lễ sắp tới",
  "Lập ngân sách Marketing cơ bản",
  "Chiến lược định giá sản phẩm",
  "Tìm hiểu tệp khách hàng Gen Z",
  "Cách tăng tỷ lệ chuyển đổi (CR)",
  "Phân tích SWOT cho dự án",
];

export default function ChatInput({ onSend, loading, currentCampaign, onOpenFullQuiz }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionOffset, setSuggestionOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleSendClick = () => {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  const handleShuffleSuggestions = () => {
    setSuggestionOffset((prev) => (prev + 3) % PREDEFINED_PROMPTS.length);
  };

  const visibleSuggestions = PREDEFINED_PROMPTS.slice(suggestionOffset, suggestionOffset + 3);
  if (visibleSuggestions.length < 3) {
    visibleSuggestions.push(...PREDEFINED_PROMPTS.slice(0, 3 - visibleSuggestions.length));
  }

  return (
    <div className="chat-input-wrapper">
      {(!currentCampaign || Object.keys(currentCampaign.quizData || {}).length === 0) && (
        <div className="chat-toolbar">
          <button className="chat-quiz-cta" onClick={onOpenFullQuiz}>
            <ListChecks size={14} />
            <span>{'Discovery Quiz'}</span>
          </button>
        </div>
      )}
      
      {showSuggestions && !input.trim() && !loading && (
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={12} /> Gợi ý từ AI
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleShuffleSuggestions} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }} title="Load thêm gợi ý">
                <RefreshCw size={12} />
              </button>
              <button type="button" onClick={() => setShowSuggestions(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }} title="Đóng">
                <X size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {visibleSuggestions.map(sugg => (
              <button 
                key={sugg} 
                onClick={() => {
                  onSend(sugg);
                  setInput('');
                }}
                disabled={loading}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'Ask me anything about marketing...'}
          rows={1}
          disabled={loading}
          className="main-chat-textarea"
        />
        <button
          className="send-btn"
          onClick={handleSendClick}
          disabled={!input.trim() || loading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
