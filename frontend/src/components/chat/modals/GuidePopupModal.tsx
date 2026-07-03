import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, MessageSquare, ListChecks, PenTool, LayoutDashboard } from 'lucide-react';

interface GuidePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'overview' | 'stages' | 'panes' | 'metrics' | 'faq';
  setActiveTab: (tab: 'overview' | 'stages' | 'panes' | 'metrics' | 'faq') => void;
}

export default function GuidePopupModal({ isOpen, onClose, activeTab, setActiveTab }: GuidePopupModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay guide-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 1200 }}
        >
          <motion.div
            className="guide-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="guide-modal-header">
              <div className="guide-modal-title">
                <div className="guide-modal-icon"><HelpCircle size={20} /></div>
                <h3>How AdVisor Works</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="guide-modal-close"
                aria-label={'Close'}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="guide-tabs">
              <button 
                className={`guide-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={16} /> Overview
              </button>
              <button 
                className={`guide-tab ${activeTab === 'stages' ? 'active' : ''}`}
                onClick={() => setActiveTab('stages')}
              >
                <ListChecks size={16} /> Stages
              </button>
              <button 
                className={`guide-tab ${activeTab === 'panes' ? 'active' : ''}`}
                onClick={() => setActiveTab('panes')}
              >
                <PenTool size={16} /> Strategy & Content
              </button>
            </div>

            <div className="guide-modal-body">
              {activeTab === 'overview' && (
                <div className="guide-section">
                  <h4>Welcome to your AI Marketing Co-Pilot</h4>
                  <p>AdVisor uses a structured, multi-stage process to help you build campaigns. You don't have to start from a blank page.</p>
                  <ul className="guide-feature-list">
                    <li>
                      <div className="feature-icon"><MessageSquare size={16}/></div>
                      <div>
                        <strong>Interactive Planning:</strong> Answer questions to build a strategy.
                      </div>
                    </li>
                    <li>
                      <div className="feature-icon"><PenTool size={16}/></div>
                      <div>
                        <strong>Content Generation:</strong> Let the AI draft posts based on your plan.
                      </div>
                    </li>
                  </ul>
                </div>
              )}
              {activeTab === 'stages' && (
                <div className="guide-section">
                  <h4>The 4-Stage Process</h4>
                  <div className="stage-explanation-list">
                    <div className="stage-explanation">
                      <div className="stage-badge stage-badge-1">1</div>
                      <div className="stage-text">
                        <strong>Discovery:</strong> Gather basic info about your product and audience.
                      </div>
                    </div>
                    <div className="stage-explanation">
                      <div className="stage-badge stage-badge-2">2</div>
                      <div className="stage-text">
                        <strong>Strategy:</strong> Define specific channels, formats, and messages.
                      </div>
                    </div>
                    <div className="stage-explanation">
                      <div className="stage-badge stage-badge-3">3</div>
                      <div className="stage-text">
                        <strong>Execution:</strong> Draft the actual content for your campaign.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'panes' && (
                <div className="guide-section">
                  <h4>Dual-Pane Interface</h4>
                  <p>At Stage 3, the interface splits into two panes:</p>
                  <div className="pane-explanation-list">
                    <div className="pane-explanation">
                      <div className="pane-icon" style={{color: 'var(--accent)'}}><HelpCircle size={16}/></div>
                      <div className="pane-text">
                        <strong>Strategy Analyst (Left):</strong> Your ongoing chat and campaign context.
                      </div>
                    </div>
                    <div className="pane-explanation">
                      <div className="pane-icon" style={{color: '#34d399'}}><PenTool size={16}/></div>
                      <div className="pane-text">
                        <strong>Content Writer (Right):</strong> The drafted assets and copy.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="guide-modal-footer">
              <button className="btn btn-primary" onClick={onClose}>
                Got it, let's go!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
