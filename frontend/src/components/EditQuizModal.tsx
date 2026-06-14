import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { questions } from '../pages/Quiz';
import { INSIGHT_QUIZ_HINTS } from '../lib/quizDisplay';
import { X } from 'lucide-react';

interface QuizFieldRowProps {
  item: any;
  value: string;
  onChange: (key: string, newValue: string) => void;
}

const QuizFieldRow = React.memo(({ item, value, onChange }: QuizFieldRowProps) => {
  const qh = INSIGHT_QUIZ_HINTS[item.key];
  const qDef = questions.find(q => q.id === item.key);
  const isSelect = qDef?.type === 'select';
  const isMulti = qDef?.allowMultiple;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(item.key, e.target.value);
  };

  const handlePillClick = (e: React.MouseEvent, optValue: string, selected: boolean, currentArray: string[]) => {
    e.stopPropagation();
    let newArr;
    if (selected) {
      newArr = currentArray.filter(v => v !== optValue);
    } else {
      newArr = [...currentArray, optValue];
    }
    onChange(item.key, newArr.join(' || '));
  };

  return (
    <div className="edit-quiz-field">
      <label className="edit-quiz-label">
        {item.icon} {item.label}
        {qh && <span className="edit-quiz-hint">({qh})</span>}
      </label>
      {isSelect && qDef.options ? (
        isMulti ? (
          <div className="edit-quiz-pills">
            {qDef.options.map(opt => {
              const currentArray = (value || '').split('||').map(s => s.trim()).filter(Boolean);
              const selected = currentArray.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`edit-quiz-pill ${selected ? 'selected' : ''}`}
                  onClick={(e) => handlePillClick(e, opt.value, selected, currentArray)}
                >
                  <div className="edit-quiz-pill-indicator" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <select
            className="input"
            value={value || ''}
            onChange={handleChange}
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
          className="input"
          value={value || ''}
          onChange={handleChange}
          placeholder={`Enter ${item.label.toLowerCase()}...`}
        />
      )}
    </div>
  );
});

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

  const handleFieldChange = useCallback((key: string, newValue: string) => {
    setTempQuizData(prev => ({ ...prev, [key]: newValue }));
  }, []);

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
        className="modal-content edit-quiz-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-quiz-modal-header">
          <h2>Edit Quiz Responses</h2>
          <button type="button" className="edit-quiz-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <p className="edit-quiz-modal-desc">
          Update your answers below. Changes will be saved to the campaign.
        </p>
        <div className="edit-quiz-modal-body custom-scrollbar">
          {fullQuizProfile.map((item) => (
            <QuizFieldRow
              key={item.key}
              item={item}
              value={tempQuizData[item.key] || ''}
              onChange={handleFieldChange}
            />
          ))}
        </div>
        <div className="edit-quiz-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave(tempQuizData)}
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
