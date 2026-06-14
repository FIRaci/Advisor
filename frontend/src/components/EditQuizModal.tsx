import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { questions } from '../pages/Quiz';
import { INSIGHT_QUIZ_HINTS } from '../lib/quizDisplay';
import { X } from 'lucide-react';

interface EditQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
  initialData: Record<string, string>;
  fullQuizProfile: any[];
}

export default function EditQuizModal({ isOpen, onClose, onSave, initialData, fullQuizProfile }: EditQuizModalProps) {
  const [tempQuizData, setTempQuizData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTempQuizData(initialData || {});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '550px', maxWidth: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '1.5rem', background: '#141418', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edit Quiz Responses</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Update your answers below. Changes will be saved to the campaign.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
          {fullQuizProfile.map((item, idx) => {
            const qh = INSIGHT_QUIZ_HINTS[item.key];
            const qDef = questions.find(q => q.id === item.key);
            const isSelect = qDef?.type === 'select';
            const isMulti = qDef?.allowMultiple;
            
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {item.icon} {item.label}
                  {qh && <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({qh})</span>}
                </label>
                {isSelect && qDef.options ? (
                  isMulti ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {qDef.options.map(opt => {
                        const currentVal = tempQuizData[item.key] || '';
                        const currentArray = currentVal.split('||').map(s => s.trim()).filter(Boolean);
                        const selected = currentArray.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              let newArr;
                              if (selected) {
                                newArr = currentArray.filter(v => v !== opt.value);
                              } else {
                                newArr = [...currentArray, opt.value];
                              }
                              setTempQuizData(prev => ({ ...prev, [item.key]: newArr.join(' || ') }));
                            }}
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              border: selected ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                              background: selected ? 'rgba(124, 58, 237, 0.15)' : 'rgba(0,0,0,0.2)',
                              color: selected ? 'var(--accent)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: selected ? 'none' : '1px solid rgba(255,255,255,0.3)', background: selected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selected && <div style={{ width: '6px', height: '6px', backgroundColor: '#fff', borderRadius: '1px' }} />}
                            </div>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      className="form-input"
                      style={{ padding: '0.6rem', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                      value={tempQuizData[item.key] || ''}
                      onChange={(e) => setTempQuizData(prev => ({ ...prev, [item.key]: e.target.value }))}
                    >
                      <option value="">Select {item.label}...</option>
                      {qDef.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.6rem', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                    value={tempQuizData[item.key] || ''}
                    onChange={(e) => setTempQuizData(prev => ({ ...prev, [item.key]: e.target.value }))}
                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '0.5rem 1.2rem', margin: 0 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSave(tempQuizData)}
            style={{ padding: '0.5rem 1.2rem', margin: 0 }}
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
