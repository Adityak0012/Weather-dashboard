import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { Bookmark, GripVertical, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fetchSnapshots } from '../lib/api.js';
import { temp } from '../lib/units.js';
import { describeCode } from '../lib/weatherCodes.js';
import WeatherIcon from './WeatherIcon.jsx';

const keyOf = (p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;

function SavedItem({ place, snap, units, active, onSelect, onRemove }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={place}
      dragListener={false}
      dragControls={controls}
      className={`saved-item ${active ? 'is-active' : ''}`}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 30px rgba(0,0,0,.35)' }}
    >
      <button
        type="button"
        className="saved-handle"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Drag to reorder ${place.name}`}
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={16} />
      </button>
      <button type="button" className="saved-main" onClick={() => onSelect(place)}>
        <span className="saved-text">
          <strong>{place.name}</strong>
          <small>{snap ? describeCode(snap.code).label : [place.region, place.country].filter(Boolean).join(', ')}</small>
        </span>
        {snap ? (
          <span className="saved-wx">
            <WeatherIcon code={snap.code} isDay={snap.isDay} size={22} />
            <span className="saved-temp">{temp(snap.temp, units)}°</span>
          </span>
        ) : (
          <span className="skeleton skeleton--chip" aria-hidden="true" />
        )}
      </button>
      <button type="button" className="icon-btn icon-btn--ghost icon-btn--sm" onClick={() => onRemove(place)} aria-label={`Remove ${place.name}`}>
        <Trash2 size={15} />
      </button>
    </Reorder.Item>
  );
}

export default function SavedDrawer({ open, onClose, saved, setSaved, units, onSelect, currentKey }) {
  const [snaps, setSnaps] = useState({});
  const closeRef = useRef(null);

  // Fetch a live temperature for every saved city in one request.
  useEffect(() => {
    if (!open || !saved.length) return;
    const ctrl = new AbortController();
    fetchSnapshots(saved, ctrl.signal)
      .then((list) => setSnaps(Object.fromEntries(list.map((s, i) => [keyOf(saved[i]), s]))))
      .catch(() => {});
    return () => ctrl.abort();
  }, [open, saved.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="drawer-head">
              <h2 id="saved-title">Saved cities</h2>
              <button ref={closeRef} type="button" className="icon-btn icon-btn--ghost" onClick={onClose} aria-label="Close saved cities">
                <X size={18} />
              </button>
            </div>

            {saved.length === 0 ? (
              <div className="empty">
                <span className="empty-icon"><Bookmark size={22} /></span>
                <p className="empty-title">No saved cities yet</p>
                <p className="empty-text">Tap the star next to a city’s name to keep it here for one-tap access.</p>
              </div>
            ) : (
              <>
                <p className="drawer-hint">Drag the handle to reorder.</p>
                <Reorder.Group axis="y" values={saved} onReorder={setSaved} className="saved-list">
                  <AnimatePresence initial={false}>
                    {saved.map((p) => (
                      <SavedItem
                        key={keyOf(p)}
                        place={p}
                        snap={snaps[keyOf(p)]}
                        units={units}
                        active={keyOf(p) === currentKey}
                        onSelect={(pl) => { onSelect(pl); onClose(); }}
                        onRemove={(pl) => setSaved((s) => s.filter((x) => keyOf(x) !== keyOf(pl)))}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
