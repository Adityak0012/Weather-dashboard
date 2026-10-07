import { AnimatePresence, motion } from 'framer-motion';
import { CloudOff, RotateCcw } from 'lucide-react';

/** Placeholder layout shown on the very first load. */
export function DashboardSkeleton() {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading weather">
      <div className="card hero skeleton-card" style={{ minHeight: 320 }}>
        <span className="skeleton" style={{ width: 180, height: 14 }} />
        <span className="skeleton" style={{ width: 240, height: 40, marginTop: 14 }} />
        <span className="skeleton" style={{ width: 160, height: 110, marginTop: 34 }} />
        <span className="skeleton" style={{ width: 280, height: 14, marginTop: 24 }} />
      </div>
      <div className="side-stack">
        <div className="card skeleton-card" style={{ minHeight: 150 }}><span className="skeleton" style={{ width: '60%', height: 14 }} /><span className="skeleton" style={{ width: '100%', height: 70, marginTop: 18 }} /></div>
        <div className="card skeleton-card" style={{ minHeight: 150 }}><span className="skeleton" style={{ width: '50%', height: 14 }} /><span className="skeleton" style={{ width: '40%', height: 40, marginTop: 18 }} /></div>
      </div>
      <div className="card hourly skeleton-card" style={{ minHeight: 190 }}>
        <span className="skeleton" style={{ width: 140, height: 14 }} />
        <span className="skeleton" style={{ width: '100%', height: 120, marginTop: 20 }} />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <motion.div className="card error-state" role="alert" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="empty-icon"><CloudOff size={24} /></span>
      <h2 className="empty-title">We couldn’t load the weather</h2>
      <p className="empty-text">{message}</p>
      <button type="button" className="btn-primary" onClick={onRetry}>
        <RotateCcw size={16} /> Try again
      </button>
    </motion.div>
  );
}

/** Thin progress bar at the top of the page while refreshing. */
export function TopProgress({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="top-progress"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.5, ease: [0.1, 0.6, 0.3, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.35 } }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

export function Toast({ toast }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast ${toast.tone === 'error' ? 'toast--error' : ''}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
