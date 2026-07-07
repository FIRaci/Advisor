import React, { useState, useRef, useEffect } from 'react';
import { Send, ListChecks, X, RefreshCw, Sparkles, Upload } from 'lucide-react';
interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  currentCampaign: { quizData?: any } | null;
  onOpenFullQuiz: () => void;
  stage?: number;
}

const STAGE_1_PROMPTS = [
  "Analyze main competitors",
  "Understand the Gen Z customer segment",
  "Product pricing strategy",
  "SWOT analysis for the project",
  "Define our unique selling proposition (USP)",
  "Research emerging market trends",
];

const STAGE_2_PROMPTS = [
  "Plan a new product launch",
  "Suggest a multi-channel marketing campaign",
  "Create a basic marketing budget",
  "Content proposals for the upcoming holidays",
  "Draft an email sequence for abandoned carts",
  "Outline a 30-day social media calendar",
];

const STAGE_3_PROMPTS = [
  "How to optimize advertising costs",
  "How to increase conversion rate (CR)",
  "Analyze our current ROAS and CPC",
  "A/B testing ideas for our landing page",
  "Strategies to reduce customer churn",
  "Scale our best performing ads",
];

export default function ChatInput({ onSend, loading, currentCampaign, onOpenFullQuiz, stage = 1 }: ChatInputProps) {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) return;
      const headers = lines[0].split(',').map(h => h.trim());
      let data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] ? values[i].trim() : '';
        });
        return obj;
      });
      
      let truncationNote = '';
      if (data.length > 50) {
        data = data.slice(0, 50);
        truncationNote = '\n[Note: Data truncated to 50 rows to fit AI memory limits]';
      }
      
      setInput(prev => prev + (prev ? '\n\n' : '') + 'Data Import:\n' + JSON.stringify(data, null, 2) + truncationNote);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShuffleSuggestions = () => {
    setSuggestionOffset((prev) => prev + 3);
  };

  const activePrompts = stage === 1 ? STAGE_1_PROMPTS : stage === 2 ? STAGE_2_PROMPTS : STAGE_3_PROMPTS;
  const currentOffset = suggestionOffset % activePrompts.length;
  
  const visibleSuggestions = activePrompts.slice(currentOffset, currentOffset + 3);
  if (visibleSuggestions.length < 3) {
    visibleSuggestions.push(...activePrompts.slice(0, 3 - visibleSuggestions.length));
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
              <Sparkles size={12} /> AI Suggestions
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleShuffleSuggestions} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }} title="Refresh suggestions">
                <RefreshCw size={12} />
              </button>
              <button type="button" onClick={() => setShowSuggestions(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }} title="Close">
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

      <div className="chat-input" style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '0 10px', cursor: 'pointer' }}
          title="Import CSV"
        >
          <Upload size={18} />
        </button>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
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
