import { motion } from 'framer-motion';
import { useId } from 'react';

/**
 * Realistic, softly shaded weather illustrations drawn in SVG.
 * Every icon in the app uses these, from 22px forecast icons to the
 * large animated hero art. `animated` adds gentle idle motion.
 *
 * kinds: clear-day, clear-night, partly-day, partly-night, cloudy, fog,
 *        drizzle, rain, snow, storm
 */

const CLOUD = 'M16 50C9.4 50 6 45.5 6 40.5 6 35 10.5 31 16 31 17.5 23.5 24 18 32 18c8 0 14.5 5.6 15.6 13.2C53.5 31.6 58 36 58 41c0 5-4 9-9.5 9Z';
const loop = (duration, delay = 0) => ({ duration, delay, repeat: Infinity, ease: 'easeInOut' });
const center = { transformBox: 'fill-box', transformOrigin: 'center' };

function Defs({ id }) {
  return (
    <defs>
      <radialGradient id={`${id}sun`} cx="38%" cy="34%" r="70%">
        <stop offset="0" stopColor="#FFF6C4" />
        <stop offset=".45" stopColor="#FFD447" />
        <stop offset="1" stopColor="#FF9B1A" />
      </radialGradient>
      <radialGradient id={`${id}halo`}>
        <stop offset="0" stopColor="#FFC94D" stopOpacity=".55" />
        <stop offset=".55" stopColor="#FFB020" stopOpacity=".16" />
        <stop offset="1" stopColor="#FFB020" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}moon`} cx="36%" cy="32%" r="75%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".5" stopColor="#E3E8F6" />
        <stop offset="1" stopColor="#A9B4D2" />
      </radialGradient>
      <radialGradient id={`${id}mhalo`}>
        <stop offset="0" stopColor="#C9D3FF" stopOpacity=".42" />
        <stop offset="1" stopColor="#C9D3FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}cl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".55" stopColor="#E3EAF4" />
        <stop offset="1" stopColor="#AFBFD3" />
      </linearGradient>
      <linearGradient id={`${id}cd`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D5DDE8" />
        <stop offset=".55" stopColor="#95A3B8" />
        <stop offset="1" stopColor="#64728A" />
      </linearGradient>
      <linearGradient id={`${id}cs`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A8B0C2" />
        <stop offset=".55" stopColor="#5B6480" />
        <stop offset="1" stopColor="#373E57" />
      </linearGradient>
      <linearGradient id={`${id}drop`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B5E2FF" />
        <stop offset="1" stopColor="#3D8BEA" />
      </linearGradient>
      <linearGradient id={`${id}bolt`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF4B0" />
        <stop offset=".5" stopColor="#FFC61A" />
        <stop offset="1" stopColor="#FF8A00" />
      </linearGradient>
    </defs>
  );
}

function Sun({ id, cx, cy, r, animated }) {
  return (
    <g>
      <motion.circle
        cx={cx} cy={cy} r={r * 1.9} fill={`url(#${id}halo)`}
        style={center}
        animate={animated ? { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] } : undefined}
        transition={loop(5)}
      />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}sun)`} />
      <ellipse cx={cx - r * 0.32} cy={cy - r * 0.38} rx={r * 0.42} ry={r * 0.26} fill="#fff" opacity=".45" />
    </g>
  );
}

function Moon({ id, cx, cy, r, animated }) {
  return (
    <g>
      <motion.circle
        cx={cx} cy={cy} r={r * 1.8} fill={`url(#${id}mhalo)`}
        style={center}
        animate={animated ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : undefined}
        transition={loop(6)}
      />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}moon)`} />
      <circle cx={cx + r * 0.28} cy={cy - r * 0.18} r={r * 0.2} fill="#8E99B8" opacity=".35" />
      <circle cx={cx - r * 0.3} cy={cy + r * 0.32} r={r * 0.14} fill="#8E99B8" opacity=".3" />
      <circle cx={cx + r * 0.22} cy={cy + r * 0.45} r={r * 0.09} fill="#8E99B8" opacity=".3" />
    </g>
  );
}

function Cloud({ id, tone = 'cl', transform, animated, drift = 1.5, delay = 0 }) {
  return (
    <g transform={transform}>
      <motion.g
        animate={animated ? { x: [-drift, drift, -drift] } : undefined}
        transition={loop(8, delay)}
      >
        <path d={CLOUD} transform="translate(0 2.5)" fill="#0B1220" opacity=".22" />
        <path d={CLOUD} fill={`url(#${id}${tone})`} />
        <ellipse cx="29" cy="25" rx="7" ry="3.2" fill="#fff" opacity={tone === 'cl' ? 0.7 : 0.28} />
      </motion.g>
    </g>
  );
}

function Drops({ id, xs, y, animated, small = false }) {
  const h = small ? 3.2 : 4.4;
  return xs.map((x, i) => (
    <g key={i} transform={`rotate(14 ${x} ${y})`}>
      <motion.path
        d={`M${x} ${y - h}c1.6 2.4 2.6 4 2.6 5.3a2.6 2.6 0 0 1-5.2 0c0-1.3 1-2.9 2.6-5.3Z`}
        fill={`url(#${id}drop)`}
        animate={animated ? { y: [0, 9], opacity: [0, 1, 0] } : undefined}
        transition={animated ? { duration: 1.1, delay: i * 0.25, repeat: Infinity, ease: 'easeIn' } : undefined}
      />
    </g>
  ));
}

function Flakes({ xs, y, animated }) {
  return xs.map((x, i) => (
    <motion.g
      key={i}
      style={center}
      animate={animated ? { y: [0, 9], rotate: [0, 90], opacity: [0, 1, 0] } : undefined}
      transition={animated ? { duration: 2.4, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <g stroke="#F2F7FF" strokeWidth="1.3" strokeLinecap="round">
        <path d={`M${x} ${y - 3}v6M${x - 2.6} ${y - 1.5}l5.2 3M${x - 2.6} ${y + 1.5}l5.2-3`} />
      </g>
    </motion.g>
  ));
}

function Stars({ animated }) {
  const pts = [[10, 14, 1.6], [53, 10, 1.2], [56, 30, 1]];
  return pts.map(([x, y, s], i) => (
    <motion.path
      key={i}
      d={`M${x} ${y - 3 * s}L${x + 0.7 * s} ${y - 0.7 * s}L${x + 3 * s} ${y}L${x + 0.7 * s} ${y + 0.7 * s}L${x} ${y + 3 * s}L${x - 0.7 * s} ${y + 0.7 * s}L${x - 3 * s} ${y}L${x - 0.7 * s} ${y - 0.7 * s}Z`}
      fill="#EEF2FF"
      style={center}
      animate={animated ? { opacity: [0.2, 1, 0.2], scale: [0.7, 1, 0.7] } : { opacity: 0.8 }}
      transition={animated ? loop(3, i * 0.9) : undefined}
    />
  ));
}

export function artKind(icon, isDay) {
  if (icon === 'clear') return isDay ? 'clear-day' : 'clear-night';
  if (icon === 'partly') return isDay ? 'partly-day' : 'partly-night';
  return icon; // cloudy, fog, drizzle, rain, snow, storm
}

export default function WeatherArt({ kind = 'cloudy', size = 32, animated = false, className = '' }) {
  const id = `wa${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const a = animated;
  const raised = 'translate(0 -7)';

  let body;
  switch (kind) {
    case 'clear-day':
      body = <Sun id={id} cx={32} cy={32} r={15} animated={a} />;
      break;
    case 'clear-night':
      body = (<><Stars animated={a} /><Moon id={id} cx={32} cy={32} r={14} animated={a} /></>);
      break;
    case 'partly-day':
      body = (<><Sun id={id} cx={23} cy={22} r={12} animated={a} /><Cloud id={id} transform="translate(8 10) scale(.84)" animated={a} /></>);
      break;
    case 'partly-night':
      body = (<><Stars animated={a} /><Moon id={id} cx={23} cy={21} r={11} animated={a} /><Cloud id={id} transform="translate(8 10) scale(.84)" animated={a} /></>);
      break;
    case 'fog':
      body = (
        <>
          <Cloud id={id} tone="cd" transform="translate(0 -6)" animated={a} />
          {[48, 53.5, 59].map((y, i) => (
            <motion.rect
              key={y} x={i % 2 ? 14 : 8} y={y} width={i % 2 ? 40 : 46} height="3" rx="1.5"
              fill="#DCE4EE" opacity={0.75 - i * 0.15}
              animate={a ? { x: [0, i % 2 ? 3 : -3, 0] } : undefined}
              transition={loop(6, i * 0.6)}
            />
          ))}
        </>
      );
      break;
    case 'drizzle':
      body = (<><Cloud id={id} tone="cd" transform={raised} animated={a} /><Drops id={id} xs={[22, 32, 42]} y={52} animated={a} small /></>);
      break;
    case 'rain':
      body = (<><Cloud id={id} tone="cd" transform={raised} animated={a} /><Drops id={id} xs={[19, 28, 37, 46]} y={52} animated={a} /></>);
      break;
    case 'snow':
      body = (<><Cloud id={id} tone="cl" transform={raised} animated={a} /><Flakes xs={[21, 32, 43]} y={53} animated={a} /></>);
      break;
    case 'storm':
      body = (
        <>
          <Cloud id={id} tone="cs" transform={raised} animated={a} />
          <motion.path
            d="M34 40l-8 12h6l-3 10 10-14h-6l3-8Z"
            fill={`url(#${id}bolt)`}
            animate={a ? { opacity: [1, 1, 0.3, 1, 0.5, 1] } : undefined}
            transition={a ? { duration: 3, times: [0, 0.7, 0.75, 0.8, 0.85, 1], repeat: Infinity } : undefined}
          />
          <Drops id={id} xs={[20, 46]} y={52} animated={a} small />
        </>
      );
      break;
    default: // cloudy
      body = (
        <>
          <Cloud id={id} tone="cd" transform="translate(-4 -9) scale(.78)" animated={a} drift={1} delay={1} />
          <Cloud id={id} tone="cl" transform="translate(6 4) scale(.86)" animated={a} />
        </>
      );
  }

  return (
    <svg
      className={`wx-art ${className}`}
      width={size}
      height={size}
      viewBox="6 6 52 52"
      fill="none"
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <Defs id={id} />
      {body}
    </svg>
  );
}
