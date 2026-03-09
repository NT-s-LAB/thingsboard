/**
 * V2 Widget Templates — Static SVG strings extracted from SCADA V2 widget renderers.
 * These are "frozen" at representative default states for use as pre-built V1 Widget Library entries.
 */

export interface V2WidgetTemplate {
  name: string;
  description: string;
  type: string;
  category: string; // grouping label
  svg: string;
  config: Record<string, unknown>;
}

// ─── Button ──────────────────────────────────────────────────────────────────

const buttonSvg = `<svg width="120" height="48" viewBox="0 0 120 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="116" height="44" rx="6" fill="#3B82F6" stroke="#2563EB" stroke-width="1"/>
  <text x="60" y="26" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" fill="#FFFFFF" font-family="Arial, sans-serif">Button</text>
</svg>`;

// ─── Switch ──────────────────────────────────────────────────────────────────

const switchSvg = `<svg width="80" height="48" viewBox="0 0 80 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="14" width="48" height="20" rx="10" fill="#9CA3AF"/>
  <circle cx="27" cy="24" r="7.2" fill="#fff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="40" y="44" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Switch</text>
</svg>`;

// ─── Gauge (Circular) ────────────────────────────────────────────────────────

const gaugeSvg = (() => {
  const w = 120, h = 120;
  const cx = 60, cy = 60, r = 46;
  const startAngle = 135, endAngle = 405;
  const value = 50, min = 0, max = 100;
  const fraction = (value - min) / (max - min);
  const valueAngle = startAngle + fraction * (endAngle - startAngle);
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (from: number, to: number, radius: number) => {
    const x1 = cx + radius * Math.cos(toRad(from));
    const y1 = cy + radius * Math.sin(toRad(from));
    const x2 = cx + radius * Math.cos(toRad(to));
    const y2 = cy + radius * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };
  const needleX = cx + (r - 14) * Math.cos(toRad(valueAngle));
  const needleY = cy + (r - 14) * Math.sin(toRad(valueAngle));
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <path d="${arcPath(startAngle, endAngle, r)}" fill="none" stroke="#E5E7EB" stroke-width="8" stroke-linecap="round"/>
  <path d="${arcPath(startAngle, valueAngle, r)}" fill="none" stroke="#3B82F6" stroke-width="8" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${needleX}" y2="${needleY}" stroke="#1F2937" stroke-width="2" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#1F2937"/>
  <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="16" font-weight="700" fill="#1F2937" font-family="Arial, sans-serif">50</text>
  <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="9" fill="#6B7280" font-family="Arial, sans-serif">%</text>
  <text x="${cx}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Gauge</text>
</svg>`;
})();

// ─── Tank ────────────────────────────────────────────────────────────────────

const tankSvg = (() => {
  const w = 80, h = 120;
  const pad = 6, bodyTop = 28, bodyH = h - bodyTop - pad;
  const innerW = w - pad * 2;
  const fraction = 0.6;
  const fillH = fraction * bodyH;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w / 2}" y="14" text-anchor="middle" font-size="11" fill="#6B7280" font-family="Arial, sans-serif">Tank</text>
  <rect x="${pad}" y="${bodyTop}" width="${innerW}" height="${bodyH}" rx="4" ry="4" fill="none" stroke="#6B7280" stroke-width="1.5"/>
  <rect x="${pad + 1}" y="${bodyTop + bodyH - fillH}" width="${innerW - 2}" height="${fillH}" fill="#3B82F6" opacity="0.6"/>
  <line x1="${pad}" y1="${bodyTop + bodyH * 0.75}" x2="${pad + 6}" y2="${bodyTop + bodyH * 0.75}" stroke="#9CA3AF" stroke-width="1"/>
  <line x1="${pad}" y1="${bodyTop + bodyH * 0.5}" x2="${pad + 6}" y2="${bodyTop + bodyH * 0.5}" stroke="#9CA3AF" stroke-width="1"/>
  <line x1="${pad}" y1="${bodyTop + bodyH * 0.25}" x2="${pad + 6}" y2="${bodyTop + bodyH * 0.25}" stroke="#9CA3AF" stroke-width="1"/>
  <text x="${w / 2}" y="${bodyTop + bodyH / 2 + 4}" text-anchor="middle" font-size="14" font-weight="700" fill="#1F2937" font-family="Arial, sans-serif">60.0 %</text>
</svg>`;
})();

// ─── Pump ────────────────────────────────────────────────────────────────────

const pumpSvg = (() => {
  const w = 80, h = 80;
  const cx = 40, cy = 36, r = 28;
  const pts = `0,${-r * 0.6} ${r * 0.5},${r * 0.35} ${-r * 0.5},${r * 0.35}`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#6B7280" stroke-width="2"/>
  <polygon points="${pts}" fill="#6B7280" opacity="0.7" transform="translate(${cx},${cy})"/>
  <line x1="${cx + r}" y1="${cy}" x2="${w - 2}" y2="${cy}" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  <circle cx="${cx + r - 4}" cy="${cy - r + 4}" r="4" fill="#6B7280"/>
  <text x="${cx}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Pump</text>
</svg>`;
})();

// ─── Motor ───────────────────────────────────────────────────────────────────

const motorSvg = (() => {
  const w = 80, h = 80;
  const cx = 40, cy = 36, r = 28;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#6B7280" stroke-width="2.5"/>
  <text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="central" font-size="${r * 0.9}" font-weight="700" fill="#6B7280" font-family="Arial, sans-serif">M</text>
  <line x1="${cx + r}" y1="${cy}" x2="${cx + r + 10}" y2="${cy}" stroke="#6B7280" stroke-width="3" stroke-linecap="round"/>
  <text x="${cx}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Motor</text>
</svg>`;
})();

// ─── Valve ───────────────────────────────────────────────────────────────────

const valveSvg = (() => {
  const w = 100, h = 80;
  const cx = 50, cy = 36;
  const s = Math.min(w, h - 16) - 8;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <line x1="0" y1="${cy}" x2="${cx - s * 0.35}" y2="${cy}" stroke="#9CA3AF" stroke-width="3"/>
  <line x1="${cx + s * 0.35}" y1="${cy}" x2="${w}" y2="${cy}" stroke="#9CA3AF" stroke-width="3"/>
  <polygon points="${cx - s * 0.35},${cy - s * 0.3} ${cx},${cy} ${cx - s * 0.35},${cy + s * 0.3}" fill="#EF4444" opacity="0.7" stroke="#374151" stroke-width="1.5"/>
  <polygon points="${cx + s * 0.35},${cy - s * 0.3} ${cx},${cy} ${cx + s * 0.35},${cy + s * 0.3}" fill="#EF4444" opacity="0.7" stroke="#374151" stroke-width="1.5"/>
  <line x1="${cx}" y1="${cy - s * 0.35}" x2="${cx}" y2="${cy - s * 0.15}" stroke="#374151" stroke-width="2"/>
  <rect x="${cx - s * 0.15}" y="${cy - s * 0.45}" width="${s * 0.3}" height="${s * 0.12}" rx="2" fill="#EF4444" stroke="#374151" stroke-width="1"/>
  <text x="${cx}" y="${cy + s * 0.45}" text-anchor="middle" font-size="9" font-weight="600" fill="#EF4444" font-family="Arial, sans-serif">CLOSED</text>
  <text x="${cx}" y="${h - 4}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Valve</text>
</svg>`;
})();

// ─── LED ─────────────────────────────────────────────────────────────────────

const ledSvg = `<svg width="60" height="72" viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="led-glow" cx="40%" cy="35%" r="50%">
      <stop offset="0%" stop-color="#4ADE80"/>
      <stop offset="100%" stop-color="#22C55E"/>
    </radialGradient>
  </defs>
  <circle cx="30" cy="30" r="16" fill="url(#led-glow)" stroke="#22C55E" stroke-width="2"/>
  <circle cx="25" cy="24" r="4" fill="#fff" opacity="0.35"/>
  <text x="30" y="60" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">LED</text>
</svg>`;

// ─── Indicator ───────────────────────────────────────────────────────────────

const indicatorSvg = `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="36" r="20" fill="#22C55E" opacity="0.85" stroke="#16A34A" stroke-width="1.5"/>
  <text x="40" y="38" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="600" fill="#fff" font-family="Arial, sans-serif">Normal</text>
  <text x="40" y="72" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Indicator</text>
</svg>`;

// ─── Pipe ────────────────────────────────────────────────────────────────────

const pipeSvg = `<svg width="140" height="32" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="10" width="140" height="12" rx="2" fill="#94A3B8" stroke="#64748B" stroke-width="1"/>
  <rect x="0" y="8" width="4" height="16" rx="1" fill="#475569"/>
  <rect x="136" y="8" width="4" height="16" rx="1" fill="#475569"/>
</svg>`;

// ─── Slider ──────────────────────────────────────────────────────────────────

const sliderSvg = (() => {
  const w = 160, h = 48;
  const pad = 16, trackThick = 6;
  const trackLen = w - pad * 2;
  const ratio = 0.5;
  const trackY = 22;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w / 2}" y="12" text-anchor="middle" font-size="11" font-weight="600" fill="#374151" font-family="Arial, sans-serif">50</text>
  <rect x="${pad}" y="${trackY - trackThick / 2}" width="${trackLen}" height="${trackThick}" rx="${trackThick / 2}" fill="#E5E7EB"/>
  <rect x="${pad}" y="${trackY - trackThick / 2}" width="${trackLen * ratio}" height="${trackThick}" rx="${trackThick / 2}" fill="#3B82F6"/>
  <circle cx="${pad + trackLen * ratio}" cy="${trackY}" r="8" fill="#fff" stroke="#3B82F6" stroke-width="2"/>
  <text x="${w / 2}" y="${h - 3}" text-anchor="middle" font-size="10" fill="#6B7280" font-family="Arial, sans-serif">Slider</text>
</svg>`;
})();

// ─── Text ────────────────────────────────────────────────────────────────────

const textSvg = `<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <text x="60" y="20" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="normal" fill="#1F2937" font-family="Arial, sans-serif">Sample Text</text>
</svg>`;

// ─── Value Display ───────────────────────────────────────────────────────────

const valueDisplaySvg = `<svg width="160" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="158" height="78" rx="8" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1"/>
  <text x="80" y="24" text-anchor="middle" font-size="11" fill="#6B7280" font-family="Arial, sans-serif">Value</text>
  <text x="80" y="50" text-anchor="middle" font-size="22" font-weight="700" fill="#1F2937" font-family="Arial, sans-serif">0.00</text>
</svg>`;

// ─── Export All Templates ────────────────────────────────────────────────────

export const V2_WIDGET_TEMPLATES: V2WidgetTemplate[] = [
  {
    name: 'Button (V2)',
    description: 'Rectangular push button with confirm action support',
    type: 'BUTTON',
    category: 'Control',
    svg: buttonSvg,
    config: { bgColor: '#3B82F6', textColor: '#FFFFFF', text: 'Button', borderRadius: 6, confirmAction: false },
  },
  {
    name: 'Switch (V2)',
    description: 'Toggle switch for on/off control',
    type: 'INPUT',
    category: 'Control',
    svg: switchSvg,
    config: { onColor: '#22C55E', offColor: '#9CA3AF', showLabel: true },
  },
  {
    name: 'Slider (V2)',
    description: 'Horizontal/vertical slider for setpoint control',
    type: 'INPUT',
    category: 'Control',
    svg: sliderSvg,
    config: { min: 0, max: 100, value: 50, orientation: 'horizontal', fillColor: '#3B82F6', trackColor: '#E5E7EB' },
  },
  {
    name: 'Gauge (V2)',
    description: 'Circular gauge with needle and range colors',
    type: 'GAUGE',
    category: 'Display',
    svg: gaugeSvg,
    config: { min: 0, max: 100, value: 50, unit: '%', gaugeType: 'circular', arcColor: '#3B82F6' },
  },
  {
    name: 'Tank (V2)',
    description: 'Rectangular tank with animated fill level and scale marks',
    type: 'DISPLAY',
    category: 'Process',
    svg: tankSvg,
    config: { minLevel: 0, maxLevel: 100, level: 60, unit: '%', fillColor: '#3B82F6', tankShape: 'rectangular' },
  },
  {
    name: 'Pump (V2)',
    description: 'Pump symbol with impeller and discharge pipe indicator',
    type: 'DISPLAY',
    category: 'Process',
    svg: pumpSvg,
    config: { state: 'stopped', runningColor: '#22C55E', stoppedColor: '#6B7280', faultColor: '#EF4444' },
  },
  {
    name: 'Motor (V2)',
    description: 'Motor symbol with M label, shaft line, and rotation indicator',
    type: 'DISPLAY',
    category: 'Process',
    svg: motorSvg,
    config: { state: 'stopped', runningColor: '#22C55E', stoppedColor: '#6B7280', faultColor: '#EF4444', showRPM: true },
  },
  {
    name: 'Valve (V2)',
    description: 'Gate valve with open/closed state and handle actuator',
    type: 'DISPLAY',
    category: 'Process',
    svg: valveSvg,
    config: { state: 'closed', openPercent: 0, openColor: '#22C55E', closedColor: '#EF4444' },
  },
  {
    name: 'LED (V2)',
    description: 'LED indicator with radial gradient glow effect',
    type: 'DISPLAY',
    category: 'Indicator',
    svg: ledSvg,
    config: { state: true, onColor: '#22C55E', offColor: '#6B7280', shape: 'circle' },
  },
  {
    name: 'Indicator (V2)',
    description: 'Multi-state indicator with circle/rectangle/diamond shapes',
    type: 'DISPLAY',
    category: 'Indicator',
    svg: indicatorSvg,
    config: { shape: 'circle', states: [{ value: 'normal', color: '#22C55E', label: 'Normal' }, { value: 'warning', color: '#F59E0B', label: 'Warning' }, { value: 'alarm', color: '#EF4444', label: 'Alarm' }] },
  },
  {
    name: 'Pipe (V2)',
    description: 'Horizontal/vertical pipe with flow animation and end caps',
    type: 'DISPLAY',
    category: 'Process',
    svg: pipeSvg,
    config: { orientation: 'horizontal', pipeColor: '#94A3B8', flowColor: '#3B82F6', pipeWidth: 12, endCaps: true },
  },
  {
    name: 'Text Label (V2)',
    description: 'Static or dynamic text display with alignment and styling',
    type: 'DISPLAY',
    category: 'Display',
    svg: textSvg,
    config: { text: 'Sample Text', fontSize: 14, fontWeight: 'normal', textColor: '#1F2937', align: 'center' },
  },
  {
    name: 'Value Display (V2)',
    description: 'Numeric/text value display with label, unit, and threshold colors',
    type: 'DISPLAY',
    category: 'Display',
    svg: valueDisplaySvg,
    config: { label: 'Value', value: 0, unit: '', decimals: 2, thresholds: [] },
  },
];
