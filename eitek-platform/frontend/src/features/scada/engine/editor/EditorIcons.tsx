/**
 * EditorIcons — SVG icon components for SCADA Editor.
 * Clean, professional icons replacing emojis.
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultSize = 14;
const defaultColor = 'currentColor';

// ─── Play / Stop Icons ───────────────────────────────────────────────────────

export const PlayIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

// ─── Page / Document Icons ───────────────────────────────────────────────────

export const PageIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M14 2v6h6" />
  </svg>
);

export const PopupIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="10" height="10" rx="1" fill={color} fillOpacity="0.2" />
  </svg>
);

// ─── Edit / Action Icons ─────────────────────────────────────────────────────

export const EditIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const DuplicateIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ─── Folder / Category Icons ─────────────────────────────────────────────────

export const FolderIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const PackageIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);

// ─── Eye / Visibility Icons ──────────────────────────────────────────────────

export const EyeIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ─── Lock Icons ──────────────────────────────────────────────────────────────

export const LockIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const UnlockIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

// ─── Link / Binding Icons ────────────────────────────────────────────────────

export const LinkIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ─── Grid / Selection Icons ──────────────────────────────────────────────────

export const GridIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export const GroupIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <line x1="11" y1="7" x2="13" y2="7" />
    <line x1="11" y1="17" x2="13" y2="17" />
    <line x1="7" y1="11" x2="7" y2="13" />
    <line x1="17" y1="11" x2="17" y2="13" />
  </svg>
);

// ─── Tab Icons (Basic, Visual, Properties, Config) ───────────────────────────

export const BasicIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </svg>
);

export const VisualIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="13.5" cy="6.5" r="2.5" />
    <path d="M21 3H3v18h18V3z" />
    <path d="M3 15.5l4-4 3.5 3.5 4-4 6 6" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const CodeIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

// ─── Image / Upload Icons ────────────────────────────────────────────────────

export const ImageIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ─── Widget Type Icons ───────────────────────────────────────────────────────

export const PaletteIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="13.5" cy="6.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="8" cy="18.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64" />
  </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const GaugeIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v2" />
    <path d="M16.24 7.76l-1.42 1.42" />
    <path d="M18 12h-2" />
    <path d="M12 12l-3 3" />
  </svg>
);

export const GearIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const ToggleIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="1" y="5" width="22" height="14" rx="7" />
    <circle cx="16" cy="12" r="4" />
  </svg>
);

// ─── Chevron / Arrow Icons ───────────────────────────────────────────────────

export const ChevronRightIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Star Icon ───────────────────────────────────────────────────────────────

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ 
  size = defaultSize, 
  color = defaultColor, 
  style,
  filled = false 
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);

// ─── Thermometer Icon (for templates) ────────────────────────────────────────

export const ThermometerIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

// ─── Window / Popup Icon ─────────────────────────────────────────────────────

export const WindowIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="2" y1="8" x2="22" y2="8" />
    <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" strokeLinecap="round" />
    <line x1="9" y1="6" x2="9.01" y2="6" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─── Widget Icons (for palette) ──────────────────────────────────────────────

/** Value Display - shows a value with label */
export const ValueDisplayIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <text x="12" y="14" fontSize="8" fontWeight="bold" textAnchor="middle" fill={color} stroke="none">123</text>
  </svg>
);

/** Gauge - radial meter */
export const GaugeMeterIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6v2" />
    <path d="M18 12h-2" />
    <path d="M12 18v-2" />
    <path d="M6 12h2" />
    <path d="M12 12l4-4" strokeLinecap="round" />
  </svg>
);

/** Tank - cylindrical container */
export const TankIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <ellipse cx="12" cy="5" rx="7" ry="3" />
    <path d="M5 5v14c0 1.657 3.134 3 7 3s7-1.343 7-3V5" />
    <path d="M5 14c0 1.657 3.134 3 7 3s7-1.343 7-3" strokeOpacity="0.4" />
  </svg>
);

/** Pump - industrial pump symbol */
export const PumpIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 6v-4" />
    <path d="M12 22v-4" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

/** Valve - gate valve symbol */
export const ValveIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M4 12h4l4-6 4 6h4" />
    <path d="M8 12l4 6 4-6" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <circle cx="12" cy="2" r="1" fill={color} />
  </svg>
);

/** Motor - rotating motor symbol */
export const MotorIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="8" />
    <text x="12" y="16" fontSize="10" fontWeight="bold" textAnchor="middle" fill={color} stroke="none">M</text>
  </svg>
);

/** LED - indicator light */
export const LedIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="10" r="6" />
    <path d="M8 16h8v4H8z" />
    <line x1="12" y1="4" x2="12" y2="2" />
    <line x1="18" y1="10" x2="20" y2="10" />
    <line x1="4" y1="10" x2="6" y2="10" />
  </svg>
);

/** Switch - toggle switch */
export const SwitchIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="2" y="8" width="20" height="8" rx="4" />
    <circle cx="16" cy="12" r="3" fill={color} />
  </svg>
);

/** Slider - range slider control */
export const SliderIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <line x1="2" y1="12" x2="22" y2="12" />
    <rect x="8" y="8" width="8" height="8" rx="2" fill={color} fillOpacity="0.3" />
    <line x1="12" y1="6" x2="12" y2="18" />
  </svg>
);

/** Button - clickable button */
export const ButtonIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

/** Pipe - horizontal pipe */
export const PipeIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="2" y="9" width="20" height="6" rx="1" />
  </svg>
);

/** SVG Symbol - custom SVG */
export const SvgSymbolIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 17l4-5 3 3 3-4" />
    <circle cx="16" cy="8" r="2" />
  </svg>
);

/** Status Indicator - diamond shape */
export const StatusIndicatorIcon: React.FC<IconProps> = ({ size = defaultSize, color = '#F59E0B', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" style={style}>
    <path d="M12 2l9 9-9 9-9-9z" />
  </svg>
);

/** Progress Bar - horizontal progress */
export const ProgressBarIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <rect x="4" y="10" width="10" height="4" rx="1" fill={color} fillOpacity="0.5" />
  </svg>
);

/** Image Widget */
export const ImageWidgetIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

/** Number Input - numeric input field */
export const NumberInputIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <text x="7" y="15" fontSize="7" fontWeight="bold" fill={color} stroke="none">123</text>
    <path d="M17 8l2 0M17 12l2 0M17 16l2 0" strokeWidth="1.5" />
  </svg>
);

/** Custom Widget - package/box */
export const CustomWidgetIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// ─── Chart Icons ─────────────────────────────────────────────────────────────

/** Time Series Chart - line trending up */
export const TimeSeriesChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <polyline points="3 18 7 14 11 16 15 10 21 6" />
    <polyline points="17 6 21 6 21 10" />
  </svg>
);

/** Line Chart */
export const LineChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <line x1="3" y1="20" x2="3" y2="4" />
    <line x1="3" y1="20" x2="21" y2="20" />
    <polyline points="5 16 9 12 13 14 17 8 21 10" />
  </svg>
);

/** Bar Chart - vertical bars */
export const BarChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="4" y="10" width="4" height="10" rx="1" fill={color} fillOpacity="0.3" />
    <rect x="10" y="6" width="4" height="14" rx="1" fill={color} fillOpacity="0.3" />
    <rect x="16" y="13" width="4" height="7" rx="1" fill={color} fillOpacity="0.3" />
  </svg>
);

/** Pie Chart */
export const PieChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l6.5 6.5" fill={color} fillOpacity="0.2" />
  </svg>
);

/** Doughnut Chart - ring chart */
export const DoughnutChartIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v5" />
  </svg>
);

/** Value Card - card with value */
export const ValueCardIcon: React.FC<IconProps> = ({ size = defaultSize, color = defaultColor, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="7" y1="8" x2="17" y2="8" strokeOpacity="0.5" />
    <text x="12" y="16" fontSize="8" fontWeight="bold" textAnchor="middle" fill={color} stroke="none">42</text>
  </svg>
);

// ─── Helper function for icon mapping ────────────────────────────────────────

export function getWidgetTypeIcon(type: string): React.ReactNode {
  const t = (type || '').toLowerCase();
  if (t.includes('svg') || t.includes('symbol')) return <PaletteIcon size={12} />;
  if (t.includes('chart') || t.includes('graph')) return <ChartIcon size={12} />;
  if (t.includes('button') || t.includes('switch')) return <ToggleIcon size={12} />;
  if (t.includes('gauge') || t.includes('meter')) return <GaugeIcon size={12} />;
  if (t.includes('pump') || t.includes('motor') || t.includes('valve')) return <GearIcon size={12} />;
  return <PackageIcon size={12} />;
}
