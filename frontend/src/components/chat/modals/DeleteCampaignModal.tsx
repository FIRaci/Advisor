import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

export default function DeleteCampaignModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onClose()}
              >
                <motion.div
                  className="modal-content"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-icon delete-icon">
                    <Trash2 size={32} />
                  </div>
                  <h3>{'Delete Campaign?'}</h3>
                  <p>{'This will permanently delete this campaign and all its messages. This action cannot be undone.'}</p>
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => onClose()}>
                      {'Cancel'}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                      {'Delete'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
  );
}
