import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, MessageSquare, ListChecks, PenTool, LayoutDashboard, TrendingUp, MessageCircle } from 'lucide-react';

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
                <PenTool size={16} /> Strategy
              </button>
              <button 
                className={`guide-modal-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                <TrendingUp size={16} /> Metrics
              </button>
              <button 
                className={`guide-modal-tab ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                <MessageCircle size={16} /> FAQ
              </button>
            </div>

            <div className="guide-modal-body">
              {activeTab === 'overview' && (
                <div className="guide-section">
                  <h4>Welcome to your AI Marketing Co-Pilot</h4>
                  <p>AdVisor is an intelligent, multi-stage platform designed to replace the blank canvas of marketing strategy with structured, data-driven execution. Think of it as a virtual Chief Marketing Officer (CMO) that works alongside you to formulate, execute, and optimize your marketing campaigns.</p>
                  
                  <h4>Core Capabilities</h4>
                  <ul className="guide-list">
                    <li>
                      <strong>Interactive Strategy Formulation:</strong> We start by deeply analyzing your business—your Unique Selling Proposition (USP), budget constraints, and target audience—to generate bespoke strategic plans.
                    </li>
                    <li>
                      <strong>Automated Content Generation:</strong> Once a strategy is locked in, the AI acts as an elite copywriter, drafting high-converting marketing materials (emails, ad copy, social posts) tailored specifically to your chosen campaign.
                    </li>
                    <li>
                      <strong>Real-Time Campaign Tracking & Optimization:</strong> When your campaign goes live, you can feed performance metrics back into the system. The AI will act as a Data Analyst, diagnosing bottlenecks and recommending immediate pivots.
                    </li>
                  </ul>
                  
                  <p style={{marginTop: '1rem', fontStyle: 'italic', color: 'var(--text-muted)'}}>
                    Tip: The AI remembers your entire conversation context. You don't need to repeat your product name or goals in every message.
                  </p>
                </div>
              )}
              {activeTab === 'stages' && (
                <div className="guide-section">
                  <h4>The 4-Stage Architecture</h4>
                  <p>Marketing is a funnel, and so is our workflow. You cannot jump to Stage 3 without completing Stage 1. This linear progression ensures the AI always has maximum context.</p>
                  
                  <div className="guide-stages-grid" style={{marginTop: '1rem'}}>
                    <div className="guide-stage-card guide-stage-card--0">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">0</div>
                        <h4>Discovery</h4>
                      </div>
                      <p className="guide-stage-subtitle">The foundation. You complete a detailed questionnaire about your product, target demographic, budget, and primary objectives.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--1">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">1</div>
                        <h4>Strategy Formulation</h4>
                      </div>
                      <p className="guide-stage-subtitle">The AI analyzes your Discovery data and presents 3 distinct tactical plans (e.g., Aggressive Paid Acquisition vs. Organic Community Building). You review and select one to proceed.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--2">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">2</div>
                        <h4>Execution Planning</h4>
                      </div>
                      <p className="guide-stage-subtitle">The AI breaks down your chosen plan into a granular, week-by-week roadmap. It provides budget allocations, necessary tools, and specific Key Performance Indicators (KPIs) to track.</p>
                    </div>
                    <div className="guide-stage-card guide-stage-card--3">
                      <div className="guide-stage-card-head">
                        <div className="guide-stage-num">3</div>
                        <h4>Ongoing Optimization</h4>
                      </div>
                      <p className="guide-stage-subtitle">The feedback loop. You input your real-world campaign metrics. The AI diagnoses issues (e.g., "High CTR but low CVR means your landing page is failing") and suggests A/B tests.</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'panes' && (
                <div className="guide-section">
                  <h4>The Dual-Pane Interface</h4>
                  <p>When you reach Stage 3, AdVisor transforms into a professional workstation, splitting into two distinct panels to separate strategy from creation.</p>
                  
                  <h4 style={{marginTop: '1.5rem', color: 'var(--accent)'}}>Left Pane: The Strategy Analyst</h4>
                  <p>This is your command center. Use this chat interface to:</p>
                  <ul className="guide-list">
                    <li>Report weekly metrics and ask for diagnoses.</li>
                    <li>Request adjustments to the overall strategy.</li>
                    <li>Brainstorm new target audiences or angles.</li>
                    <li>Trigger the Content Writer pane by clicking the floating Action Buttons.</li>
                  </ul>

                  <h4 style={{marginTop: '1.5rem', color: '#34d399'}}>Right Pane: The Content Writer</h4>
                  <p>This is your creative studio. It acts independently to draft ready-to-use assets.</p>
                  <ul className="guide-list">
                    <li><strong>No generic templates:</strong> The AI writes copy based on your specific USP and Stage 1 Strategy.</li>
                    <li><strong>Psychological Frameworks:</strong> Content is generated using proven models like AIDA (Attention, Interest, Desire, Action) and PAS (Problem, Agitation, Solution).</li>
                    <li><strong>A/B Testing:</strong> Every draft comes with a variant suggestion (e.g., a different headline) so you can test what works best.</li>
                  </ul>
                </div>
              )}
              {activeTab === 'metrics' && (
                <div className="guide-section">
                  <h4>Understanding Key Metrics</h4>
                  <p>To get the best advice in Stage 3, you need to provide accurate data. Here is a crash course on the core metrics AdVisor looks for:</p>
                  
                  <ul className="guide-list" style={{marginTop: '1rem'}}>
                    <li style={{marginBottom: '0.8rem'}}>
                      <strong>CTR (Click-Through Rate):</strong> The percentage of people who saw your ad and clicked it. <br/>
                      <span style={{color: 'var(--text-muted)'}}>• <em>If CTR is low:</em> Your image/video is boring, or your hook is weak. The AI will suggest new creative angles.</span>
                    </li>
                    <li style={{marginBottom: '0.8rem'}}>
                      <strong>CVR (Conversion Rate):</strong> The percentage of people who clicked your ad AND completed the desired action (bought, signed up). <br/>
                      <span style={{color: 'var(--text-muted)'}}>• <em>If CVR is low (but CTR is high):</em> Your landing page is failing. The AI will suggest UI changes or offer improvements.</span>
                    </li>
                    <li style={{marginBottom: '0.8rem'}}>
                      <strong>CPA (Cost Per Acquisition):</strong> Exactly how much money it costs to acquire one paying customer.<br/>
                      <span style={{color: 'var(--text-muted)'}}>• <em>Rule of thumb:</em> Your CPA must be lower than your product's profit margin, or you are losing money.</span>
                    </li>
                    <li style={{marginBottom: '0.8rem'}}>
                      <strong>ROAS (Return On Ad Spend):</strong> For every $1 you spend on ads, how much revenue do you make?<br/>
                      <span style={{color: 'var(--text-muted)'}}>• <em>Example:</em> A ROAS of 3.0x means you made $3 for every $1 spent. The AI will tell you when to scale up budgets based on ROAS.</span>
                    </li>
                  </ul>
                </div>
              )}
              {activeTab === 'faq' && (
                <div className="guide-section">
                  <h4>Frequently Asked Questions</h4>
                  
                  <h4 style={{marginTop: '1.2rem', fontSize: '0.9rem'}}>Can I skip directly to Stage 3?</h4>
                  <p>No. AdVisor's AI models require the deep context gathered in Stages 0, 1, and 2 to provide expert-level advice. Without knowing your strategy and audience, the AI would only be able to provide generic, unhelpful responses.</p>
                  
                  <h4 style={{marginTop: '1.2rem', fontSize: '0.9rem'}}>How do I change my initial quiz answers?</h4>
                  <p>You can click the Stage 1 or Stage 2 bubbles in the top header at any time to rewind the process. However, please note that rewinding will discard your current strategy, and you will need to re-generate the plans.</p>

                  <h4 style={{marginTop: '1.2rem', fontSize: '0.9rem'}}>Why did the AI give me an error instead of a plan?</h4>
                  <p>If you see a placeholder or an error, it is likely because the Gemini API key configured in the system has hit its rate limit or expired. AdVisor uses an API key rotation system, but if all keys are exhausted, you may need to wait a few minutes.</p>
                  
                  <h4 style={{marginTop: '1.2rem', fontSize: '0.9rem'}}>How do I get better content from the Content Writer?</h4>
                  <p>Garbage in, garbage out! If you want a highly specific email draft, use the "Custom Request" option and provide details like: <em>"Write a 300-word email targeting college students, emphasizing our 50% discount, using a funny tone."</em></p>
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
