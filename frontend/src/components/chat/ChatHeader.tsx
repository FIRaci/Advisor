import { ChevronRight, Edit2, Check, BarChart3, HelpCircle, BookOpen, Trash2 } from 'lucide-react';
import { Message } from '../../store/chatStore';
import { type Stage } from '../../lib/stageMachine';

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  status?: string;
  updatedAt?: string;
  quizData?: Record<string, string>;
}

interface ChatHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  currentCampaign: Campaign | null;
  messages: Message[];
  currentStage: Stage;
  stageTransitionPending: boolean;
  handleResetToStage: (stage: Stage) => void;
  STAGE_DESCRIPTORS: Record<Stage, any>;
  insightsOpen: boolean;
  setInsightsOpen: (val: boolean) => void;
  guidePopupOpen: boolean;
  setGuidePopupOpen: (val: boolean) => void;
  glossaryOpen: boolean;
  setGlossaryOpen: (val: boolean) => void;
  setClearModalOpen: (val: boolean) => void;
  setEditQuizModalOpen: (val: boolean) => void;
}

export default function ChatHeader({
  sidebarOpen, setSidebarOpen, currentCampaign, messages,
  currentStage, stageTransitionPending, handleResetToStage, STAGE_DESCRIPTORS,
  insightsOpen, setInsightsOpen, guidePopupOpen, setGuidePopupOpen,
  glossaryOpen, setGlossaryOpen, setClearModalOpen, setEditQuizModalOpen
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="chat-header-left">
        {!sidebarOpen && (
          <button
            className="sidebar-toggle-open"
            onClick={() => setSidebarOpen(true)}
            aria-label={'Show sidebar'}
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div className="chat-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="chat-title" style={{ margin: 0 }}>
              {currentCampaign?.name || ('General Marketing Chat')}
            </h1>
            {currentCampaign && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditQuizModalOpen(true);
                }}
                title="Edit Quiz Responses"
                style={{ 
                  width: 28, 
                  height: 28, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <p className="chat-subtitle">
            {`${messages.length} message${messages.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="chat-header-right">
        {currentCampaign && (
          <div className="chat-stage-timeline" role="list" aria-label={'Campaign stages'}>
            {([0, 1, 2, 3] as const).map(stage => (
              <button
                key={stage}
                type="button"
                role="listitem"
                className={`stage-step ${currentStage > stage ? 'completed' : ''} ${currentStage === stage ? 'current' : ''} ${stage < currentStage ? 'clickable' : ''}`}
                disabled={stage > currentStage || stageTransitionPending}
                onClick={() => stage < currentStage && handleResetToStage(stage)}
                aria-current={currentStage === stage ? 'step' : undefined}
                title={stage < currentStage
                  ? `Return to Stage ${stage} (Warning: Progress after this stage will be reset)`
                  : STAGE_DESCRIPTORS[stage].title}
              >
                <div className="stage-dot">
                  {currentStage > stage ? <Check size={12} /> : stage}
                </div>
                <span className="stage-label">{STAGE_DESCRIPTORS[stage].title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="chat-header-actions">
          {currentCampaign && (
            <button
              className={`chat-action-btn ${insightsOpen ? 'active' : ''}`}
              onClick={() => setInsightsOpen(true)}
            >
              <BarChart3 size={16} />
              <span>{'Insights'}</span>
            </button>
          )}
          <button
            className={`chat-action-btn ${guidePopupOpen ? 'active' : ''}`}
            onClick={() => setGuidePopupOpen(true)}
          >
            <HelpCircle size={16} />
            <span>{'Guide'}</span>
          </button>
          <button
            className={`chat-action-btn ${glossaryOpen ? 'active' : ''}`}
            onClick={() => setGlossaryOpen(!glossaryOpen)}
          >
            <BookOpen size={16} />
          </button>
          <button
            className="chat-action-btn"
            onClick={() => setClearModalOpen(true)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
