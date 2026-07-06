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
            
            <div className="guide-modal-tabs">
              <button 
                className={`guide-modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={16} /> Overview
              </button>
              <button 
                className={`guide-modal-tab ${activeTab === 'stages' ? 'active' : ''}`}
                onClick={() => setActiveTab('stages')}
              >
                <ListChecks size={16} /> Stages
              </button>
              <button 
                className={`guide-modal-tab ${activeTab === 'panes' ? 'active' : ''}`}
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
                  <ul className="guide-list">
                    <li>
                      <strong>Interactive Planning:</strong> Answer questions to build a strategy.
                    </li>
                    <li>
                      <strong>Content Generation:</strong> Let the AI draft posts based on your plan.
                    </li>
                  </ul>
                </div>
              )}
              {activeTab === 'stages' && (
                <div className="guide-section">
                  <h4>The 4-Stage Process</h4>
                  <div className="guide-stages-grid">
                    <div className="guide-stage-card guide-stage-card--0">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">0</div>
                        <h4>Discovery</h4>
                      </div>
                      <p className="guide-stage-subtitle">Gather basic info about your product and audience.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--1">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">1</div>
                        <h4>Strategy</h4>
                      </div>
                      <p className="guide-stage-subtitle">Define specific channels, formats, and messages.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--2">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">2</div>
                        <h4>Execution</h4>
                      </div>
                      <p className="guide-stage-subtitle">Draft the actual content for your campaign.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--3">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">3</div>
                        <h4>Optimization</h4>
                      </div>
                      <p className="guide-stage-subtitle">Analyze metrics and improve performance.</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'panes' && (
                <div className="guide-section">
                  <h4>Dual-Pane Interface</h4>
                  <p>At Stage 3, the interface splits into two panes:</p>
                  <ul className="guide-list">
                    <li>
                      <strong>Strategy Analyst (Left):</strong> Your ongoing chat and campaign context.
                    </li>
                    <li>
                      <strong>Content Writer (Right):</strong> The drafted assets and copy.
                    </li>
                  </ul>
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
