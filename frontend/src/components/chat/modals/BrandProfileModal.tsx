import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandProfileModal({ isOpen, onClose }: BrandProfileModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content"
            style={{ width: '450px', maxWidth: '90%' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="modal-header">
              <h2>Brand Profile</h2>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Define your brand's core tone and guidelines. AI will use this context for all campaigns.
              </p>
              <div>
                <label className="form-label">Brand Tone</label>
                <input type="text" className="form-input" placeholder="e.g. Professional, Friendly, Witty" />
              </div>
              <div>
                <label className="form-label">Target Audience Baseline</label>
                <input type="text" className="form-input" placeholder="e.g. Millennials, B2B Founders" />
              </div>
              <div>
                <label className="form-label">Restricted Words (Comma separated)</label>
                <textarea className="form-input" rows={2} placeholder="e.g. cheap, guarantee, best"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={onClose}>Save Profile</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
