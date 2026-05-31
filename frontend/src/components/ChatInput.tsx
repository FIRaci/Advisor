import React, { useState, useRef, useEffect } from 'react';
import { Send, ListChecks } from 'lucide-react';
interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  currentCampaign: { quizData?: any } | null;
  onOpenFullQuiz: () => void;
}

export default function ChatInput({ onSend, loading, currentCampaign, onOpenFullQuiz }: ChatInputProps) {
  const [input, setInput] = useState('');
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
