import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { glossaryGroups, getGlossaryByGroup } from '../../../utils/marketingGlossary';

interface GlossaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  glossaryMatches: any[];
}

export default function GlossaryPanel({ isOpen, onClose, glossaryMatches }: GlossaryPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="quiz-summary-panel glossary-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', width: '320px', display: 'flex', flexDirection: 'column' }}
        >
          <div className="summary-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{'Marketing Glossary'}</h3>
              <p className="summary-subtitle" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{'Key terms used by marketers'}</p>
            </div>
            <button className="summary-close" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div className="summary-list" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }} data-lenis-prevent="true">
            {glossaryMatches.length > 0 && (
              <div className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{'Suggested for you'}</span>
                {glossaryMatches.map((entry) => (
                  <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                    <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                    <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name}</div>
                    <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition}</p>
                  </div>
                ))}
              </div>
            )}
            {glossaryGroups.map((group) => (
              <div key={group.id} className="glossary-section" style={{ marginBottom: '1.5rem' }}>
                <span className="glossary-section-title" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{group.label}</span>
                {getGlossaryByGroup(group.id).map((entry) => (
                  <div key={entry.id} className="glossary-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem' }}>
                    <div className="glossary-term" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{entry.term}</div>
                    <div className="glossary-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{entry.name}</div>
                    <p className="glossary-definition" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{entry.definition}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
