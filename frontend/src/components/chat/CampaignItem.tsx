import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  isFavorite: boolean;
  status?: string;
  updatedAt?: string;
  quizData?: Record<string, string>;
}

interface CampaignItemProps {
  campaign: Campaign;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  menuOpen: boolean;
  onNavigate: () => void;
  onMenuToggle: () => void;
  onStartEdit: () => void;
  onEditChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export default function CampaignItem({
  campaign, isActive, isEditing, editingName, menuOpen,
  onNavigate, onMenuToggle, onStartEdit, onEditChange, onEditSubmit, onEditCancel, onDelete, onToggleFavorite
}: CampaignItemProps) {
  if (isEditing) {
    return (
      <div className="campaign-item editing">
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`campaign-item ${isActive ? 'active' : ''} ${campaign.isFavorite ? 'favorited' : ''}`}
    >
      <button className="campaign-link" onClick={onNavigate}>
        <motion.div whileHover={{ rotate: 15 }}>
          <MessageSquare size={16} className={campaign.isFavorite ? 'favorite-icon' : ''} />
        </motion.div>
        <span>{campaign.name}</span>
      </button>

      <div className="campaign-actions">
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="campaign-action-btn" 
          onClick={onMenuToggle}
        >
          <MoreHorizontal size={14} />
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="campaign-menu"
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
            >
              <button onClick={onStartEdit}>
                <Pencil size={14} />
                {'Rename'}
              </button>
              <button onClick={onToggleFavorite}>
                <Star size={14} fill={campaign.isFavorite ? 'currentColor' : 'none'} />
                {campaign.isFavorite
                  ? ('Unfavorite')
                  : ('Favorite')}
              </button>
              <button className="danger" onClick={onDelete}>
                <Trash2 size={14} />
                {'Delete'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
