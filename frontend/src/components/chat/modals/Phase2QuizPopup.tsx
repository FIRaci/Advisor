import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronRight, Pencil, HelpCircle } from 'lucide-react';

interface Phase2Question {
  id: string;
  icon: any;
  question: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface Phase2QuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
  phase2Step: number;
  phase2Questions: Phase2Question[];
  phase2Answers: Record<string, string>;
  phase2TextInput: string;
  setPhase2TextInput: (val: string) => void;
  phase2CustomOpen: boolean;
  setPhase2CustomOpen: (val: boolean) => void;
  phase2CustomInput: string;
  setPhase2CustomInput: (val: string) => void;
  handlePhase2Answer: (val: string) => void;
  handlePhase2CustomSubmit: () => void;
  handlePhase2SkipQuestion: () => void;
  handleSkipToStage3: () => void;
}

export default function Phase2QuizPopup({
  isOpen, onClose, phase2Step, phase2Questions, phase2Answers,
  phase2TextInput, setPhase2TextInput, phase2CustomOpen, setPhase2CustomOpen,
  phase2CustomInput, setPhase2CustomInput, handlePhase2Answer,
  handlePhase2CustomSubmit, handlePhase2SkipQuestion, handleSkipToStage3
}: Phase2QuizPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay quiz-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="quiz-popup"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quiz-popup-header">
              <div className="quiz-popup-header-left">
                <div className="quiz-popup-icon" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                  <Check size={20} />
                </div>
                <div>
                  <h3>{'Finalize Plan'}</h3>
                  <p>{`Phase 2 - Question ${phase2Step + 1} of ${phase2Questions.length}`}</p>
                </div>
              </div>
              <div className="quiz-popup-header-right">
                <button className="quiz-popup-close" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="quiz-popup-progress">
              <motion.div
                className="quiz-popup-progress-fill"
                style={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
                animate={{ width: `${((phase2Step + 1) / phase2Questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={phase2Step}
                className="quiz-popup-body"
                data-lenis-prevent="true"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const q = phase2Questions[phase2Step];
                  const QIcon = q.icon;
                  const isTextQuestion = q.type === 'text';
                  return (
                    <>
                      <div className="quiz-popup-question" style={{ color: '#10b981' }}>
                        <QIcon size={22} />
                        <span>{q.question}</span>
                      </div>

                      <div className="quiz-popup-options">
                        {isTextQuestion ? (
                          <div className="quiz-popup-text-area">
                            <input
                              type="text"
                              placeholder={q.placeholder || 'Type your answer...'}
                              value={phase2TextInput}
                              onChange={(e) => setPhase2TextInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && phase2TextInput.trim() && handlePhase2Answer(phase2TextInput.trim())}
                              className="quiz-popup-input"
                              autoFocus
                            />
                            <div className="quiz-popup-text-actions">
                              <button
                                className="quiz-popup-submit"
                                onClick={() => phase2TextInput.trim() && handlePhase2Answer(phase2TextInput.trim())}
                                disabled={!phase2TextInput.trim()}
                              >
                                {'Continue'}
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        ) : q.options?.map((opt, idx) => (
                          <motion.button
                            key={opt.value}
                            className={`quiz-popup-option ${phase2Answers[q.id] === opt.value ? 'selected' : ''}`}
                            onClick={() => { handlePhase2Answer(opt.value); setPhase2CustomOpen(false); setPhase2TextInput(''); }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {opt.label}
                          </motion.button>
                        ))}

                        <button
                          className={`quiz-popup-skip-inline ${phase2CustomOpen ? 'active' : ''}`}
                          onClick={() => { setPhase2CustomOpen(!phase2CustomOpen); setPhase2CustomInput(''); }}
                        >
                          <Pencil size={14} />
                          {'Type my own answer'}
                        </button>

                        <AnimatePresence>
                          {phase2CustomOpen && (
                            <motion.div
                              className="quiz-popup-custom-input"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ gridColumn: '1 / -1' }}
                            >
                              <input
                                type="text"
                                placeholder={'Type your answer...'}
                                value={phase2CustomInput}
                                onChange={(e) => setPhase2CustomInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePhase2CustomSubmit()}
                                autoFocus
                                className="quiz-popup-input"
                              />
                              <div className="quiz-popup-text-actions">
                                <button className="quiz-popup-submit" onClick={handlePhase2CustomSubmit}>
                                  {'Submit'}
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button className="quiz-popup-skip-inline" onClick={() => { handlePhase2SkipQuestion(); setPhase2TextInput(''); }}>
                          <HelpCircle size={14} />
                          {'Skip this question'}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
            <div className="quiz-popup-footer">
              <button className="quiz-popup-skip-all" onClick={handleSkipToStage3}>
                {'Skip Stage 2 and continue to Stage 3'}
              </button>
              <span className="quiz-popup-hint">
                {'Tip: Targets in Stage 2 are used in Insights for KPI comparison.'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
