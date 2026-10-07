import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { aqiLevel } from '../lib/insights.js';

export default function AirQualityCard({ air }) {
  const level = aqiLevel(air?.aqi);
  const pos = air ? Math.min(air.aqi / 300, 1) * 100 : 0;

  return (
    <section className="card air" aria-labelledby="air-title">
      <div className="card-head">
        <h2 id="air-title" className="card-title"><Leaf size={15} aria-hidden="true" /> Air quality</h2>
        <span className="card-hint">US AQI</span>
      </div>

      {air ? (
        <>
          <div className="air-reading">
            <span className="air-value">{Math.round(air.aqi)}</span>
            <span className={`pill pill--${level.tone}`}>{level.label}</span>
          </div>
          <div className="aqi-scale" aria-hidden="true">
            <motion.span className="aqi-marker" initial={{ left: '0%' }} animate={{ left: `${pos}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          </div>
          <p className="tile-note">{level.advice}</p>
          <dl className="air-list">
            <div><dt>PM2.5</dt><dd>{Math.round(air.pm25 ?? 0)}<small> µg/m³</small></dd></div>
            <div><dt>PM10</dt><dd>{Math.round(air.pm10 ?? 0)}<small> µg/m³</small></dd></div>
            <div><dt>O₃</dt><dd>{Math.round(air.o3 ?? 0)}<small> µg/m³</small></dd></div>
          </dl>
        </>
      ) : (
        <p className="tile-note air-empty">Air quality data isn’t available for this location right now.</p>
      )}
    </section>
  );
}
