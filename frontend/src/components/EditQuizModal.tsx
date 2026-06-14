import React, { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { questions } from '../pages/Quiz';
import { INSIGHT_QUIZ_HINTS, QUIZ_ACTIVITY_FIELDS } from '../lib/quizDisplay';
import { X, Package, Building, Zap, Users, Globe, Smartphone, ShoppingBag, Target, Heart, Megaphone, BarChart3, TrendingUp, Briefcase, Clock, DollarSign, BookOpen, Star, Sparkles } from 'lucide-react';

interface QuizFieldRowProps {
  fieldKey: string;
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (key: string, newValue: string) => void;
}

const QuizFieldRow = React.memo(({ fieldKey, label, icon, value, onChange }: QuizFieldRowProps) => {
  const qh = INSIGHT_QUIZ_HINTS[fieldKey];
  const qDef = questions.find(q => q.id === fieldKey);
  const isSelect = qDef?.type === 'select';
  const isMulti = qDef?.allowMultiple;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(fieldKey, e.target.value);
  };

  const handlePillClick = (e: React.MouseEvent, optValue: string, selected: boolean, currentArray: string[]) => {
    e.stopPropagation();
    let newArr;
    if (selected) {
      newArr = currentArray.filter(v => v !== optValue);
    } else {
      newArr = [...currentArray, optValue];
    }
    onChange(fieldKey, newArr.join(' || '));
  };

  return (
    <div className="edit-quiz-field">
      <label className="edit-quiz-label">
        {icon} {label}
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
            <option value="">Select {label}...</option>
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
          placeholder={`Enter ${label.toLowerCase()}...`}
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
}

export default function EditQuizModal({ isOpen, onClose, onSave, initialData }: EditQuizModalProps) {
  const [tempQuizData, setTempQuizData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTempQuizData(initialData || {});
    }
  }, [isOpen, initialData]);

  const handleFieldChange = useCallback((key: string, newValue: string) => {
    setTempQuizData(prev => ({ ...prev, [key]: newValue }));
  }, []);

  const quizFields = useMemo(() => {
    const icons: Record<string, ReactNode> = {
      productName: <Package size={16} />,
      business: <Building size={16} />,
      stage: <Zap size={16} />,
      audience: <Users size={16} />,
      region: <Globe size={16} />,
      platform: <Smartphone size={16} />,
      priceRange: <ShoppingBag size={16} />,
      goal: <Target size={16} />,
      usp: <Heart size={16} />,
      channels: <Megaphone size={16} />,
      currentMarketing: <BarChart3 size={16} />,
      experience: <TrendingUp size={16} />,
      competitors: <Briefcase size={16} />,
      timeline: <Clock size={16} />,
      budget: <DollarSign size={16} />,
      seasonality: <Clock size={16} />,
      contentFormat: <BookOpen size={16} />,
      offerType: <Star size={16} />,
      deadline: <Clock size={16} />,
      target_ctr: <TrendingUp size={16} />,
      target_cvr: <Target size={16} />,
      target_roas: <BarChart3 size={16} />
    };

    const labelOverride: Partial<Record<string, string>> = {
      productName: 'Product',
      goal: 'Goal',
      audience: 'Audience',
      channels: 'Channels',
      usp: 'USP',
      target_ctr: 'Target CTR',
      target_cvr: 'Target CVR',
      target_roas: 'Target ROAS'
    };

    return QUIZ_ACTIVITY_FIELDS.map(field => ({
      key: field.key,
      label: labelOverride[field.key] ?? field.label,
      icon: icons[field.key] ?? <Sparkles size={16} />
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="modal-content edit-quiz-modal"
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
          {quizFields.map((field) => (
            <QuizFieldRow
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              icon={field.icon}
              value={tempQuizData[field.key] || ''}
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
      </div>
    </div>
  );
}
