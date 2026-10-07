import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from '../hooks/hooks.js';
import { searchCities } from '../lib/api.js';

/**
 * Accessible city search (ARIA combobox) with live suggestions,
 * recent searches, keyboard navigation and a "/" shortcut.
 */
export default function SearchBar({ onSelect, recents = [], onClearRecents }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const listId = useId();
  const debounced = useDebounce(query, 250);

  const showingRecents = query.trim().length < 2;
  const items = showingRecents ? recents : results;

  // Fetch suggestions as the user types.
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) { setResults([]); setStatus('idle'); return; }
    const ctrl = new AbortController();
    setStatus('loading');
    searchCities(q, ctrl.signal)
      .then((r) => { setResults(r); setStatus('done'); setActive(r.length ? 0 : -1); })
      .catch((e) => { if (e?.name !== 'AbortError') setStatus('error'); });
    return () => ctrl.abort();
  }, [debounced]);

  // "/" focuses search, like many productivity apps.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close when clicking outside.
  useEffect(() => {
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const choose = (place) => {
    onSelect(place);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setOpen(true);
      setActive((a) => (items.length ? (a + 1) % items.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = items[active] ?? items[0];
      if (pick) choose(pick);
    } else if (e.key === 'Escape') {
      if (query) setQuery(''); else { setOpen(false); inputRef.current?.blur(); }
    }
  };

  const showPanel = open && (items.length > 0 || (!showingRecents && status !== 'idle'));

  return (
    <div className="search" ref={wrapRef}>
      <div className={`search-field ${open ? 'is-focused' : ''}`}>
        <Search size={18} className="search-icon" aria-hidden="true" />
        <label htmlFor="city-search" className="sr-only">Search for a city</label>
        <input
          id="city-search"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && showPanel ? `${listId}-${active}` : undefined}
          placeholder="Search any city…"
          autoComplete="off"
          spellCheck="false"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {status === 'loading' && !showingRecents && <Loader2 size={16} className="spin search-trail" aria-label="Searching" />}
        {query && status !== 'loading' && (
          <button type="button" className="icon-btn icon-btn--ghost search-trail" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        {!query && <kbd className="search-kbd" aria-hidden="true">/</kbd>}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="search-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {showingRecents && (
              <div className="search-panel-head">
                <span>Recent</span>
                <button type="button" className="text-btn" onClick={onClearRecents}>Clear</button>
              </div>
            )}
            <ul id={listId} role="listbox" aria-label={showingRecents ? 'Recent searches' : 'Cities'}>
              {items.map((p, i) => (
                <li
                  key={`${p.lat},${p.lon}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`search-option ${i === active ? 'is-active' : ''}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(p)}
                >
                  {showingRecents ? <Clock3 size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                  <span className="search-option-text">
                    <strong>{p.name}</strong>
                    <small>{[p.region, p.country].filter(Boolean).join(', ')}</small>
                  </span>
                  {p.countryCode && <span className="search-cc">{p.countryCode}</span>}
                </li>
              ))}
            </ul>
            {!showingRecents && status === 'done' && results.length === 0 && (
              <p className="search-empty">No cities match “{query.trim()}”. Check the spelling or try a nearby city.</p>
            )}
            {!showingRecents && status === 'error' && (
              <p className="search-empty">Couldn’t reach the search service. Check your connection.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
