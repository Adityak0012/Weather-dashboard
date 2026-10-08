import { motion } from 'framer-motion';
import { Bookmark, Loader2, LocateFixed } from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import WeatherArt from './WeatherArt.jsx';

function UnitToggle({ units, onChange }) {
  const opts = [
    { id: 'metric', label: '°C' },
    { id: 'imperial', label: '°F' },
  ];
  return (
    <div className="segmented" role="radiogroup" aria-label="Units">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={units === o.id}
          className={`segmented-btn ${units === o.id ? 'is-active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {units === o.id && (
            <motion.span layoutId="unit-pill" className="segmented-pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
          )}
          <span className="segmented-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function Header({
  units, onUnits, onSelect, recents, onClearRecents, onLocate, locating, savedCount, onOpenSaved,
}) {
  return (
    <header className="header">
      <a className="brand" href="./" aria-label="WeatherNow home">
        <span className="brand-mark"><WeatherArt kind="partly-day" size={26} /></span>
        <span className="brand-name">Weather<span>Now</span></span>
      </a>

      <SearchBar onSelect={onSelect} recents={recents} onClearRecents={onClearRecents} />

      <div className="header-actions">
        <motion.button
          type="button"
          className="icon-btn"
          onClick={onLocate}
          disabled={locating}
          whileTap={{ scale: 0.94 }}
          aria-label="Use my current location"
          title="Use my location"
        >
          {locating ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />}
        </motion.button>
        <UnitToggle units={units} onChange={onUnits} />
        <motion.button
          type="button"
          className="icon-btn"
          onClick={onOpenSaved}
          whileTap={{ scale: 0.94 }}
          aria-label={`Saved cities (${savedCount})`}
          title="Saved cities"
        >
          <Bookmark size={18} />
          {savedCount > 0 && (
            <motion.span key={savedCount} className="badge" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
              {savedCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </header>
  );
}
