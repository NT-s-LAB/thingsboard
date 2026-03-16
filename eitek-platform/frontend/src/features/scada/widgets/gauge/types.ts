/**
 * Gauge Widget Type Definitions
 *
 * Shared schema for both Web and Mobile platforms.
 * Mobile reads the same JSON config and renders accordingly.
 */

// ────────────────────────────────────────────────────────────────────────────────
// Enums & Union Types
// ────────────────────────────────────────────────────────────────────────────────

/** Gauge visual variant */
export type GaugeVariant = 'radial' | 'semicircle' | 'arc' | 'linear';

// ────────────────────────────────────────────────────────────────────────────────
// Sub-Types
// ────────────────────────────────────────────────────────────────────────────────

/** Threshold definition for color zones */
export interface GaugeThreshold {
  /** Threshold value (when value >= this, use this color) */
  value: number;
  /** Color for this zone */
  color: string;
  /** Optional label */
  label?: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// Main Gauge Config Interface
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Gauge Widget Configuration
 *
 * This is the canonical schema used by both Web and Mobile.
 * When serialized to JSON, Mobile can parse and render identically.
 */
export interface GaugeConfig {
  // ─── Identity ─────────────────────────────────────────────────────────────
  /** Unique widget instance ID */
  id: string;
  /** Widget type (always 'gauge') */
  type: 'gauge';

  // ─── Variant ──────────────────────────────────────────────────────────────
  /** Gauge variant: radial, semicircle, arc, or linear */
  variant: GaugeVariant;

  // ─── Data ─────────────────────────────────────────────────────────────────
  /** Title displayed above or inside gauge */
  title: string;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Unit label (e.g., '°C', '%', 'PSI') */
  unit: string;
  /** Decimal precision for value display */
  precision: number;

  // ─── Display Options ──────────────────────────────────────────────────────
  /** Show title */
  showTitle: boolean;
  /** Show value */
  showValue: boolean;
  /** Show unit */
  showUnit: boolean;
  /** Show min/max labels */
  showMinMax: boolean;

  // ─── Geometry (for radial/arc variants) ───────────────────────────────────
  /** Start angle in degrees (0 = right, 90 = bottom, 180 = left, 270 = top) */
  startAngle: number;
  /** End angle in degrees */
  endAngle: number;
  /** Arc/track thickness in pixels */
  thickness: number;

  // ─── Colors ───────────────────────────────────────────────────────────────
  /** Background track color */
  trackColor: string;
  /** Fill/progress color (used when thresholds disabled) */
  fillColor: string;
  /** Widget background color */
  backgroundColor: string;
  /** Needle/pointer color */
  needleColor: string;
  /** Text color for value/labels */
  textColor: string;
  /** Title text color */
  titleColor: string;

  // ─── Thresholds ───────────────────────────────────────────────────────────
  /** Enable threshold-based coloring */
  thresholdEnabled: boolean;
  /** Threshold definitions (sorted by value ascending) */
  thresholds: GaugeThreshold[];

  // ─── Needle/Pointer ───────────────────────────────────────────────────────
  /** Show needle (for radial variants) */
  showNeedle: boolean;
  /** Needle width in pixels */
  needleWidth: number;

  // ─── Layout ───────────────────────────────────────────────────────────────
  /** Widget width */
  width: number;
  /** Widget height */
  height: number;
}

// ────────────────────────────────────────────────────────────────────────────────
// Partial Config (for updates)
// ────────────────────────────────────────────────────────────────────────────────

export type GaugeConfigPartial = Partial<GaugeConfig>;

// ────────────────────────────────────────────────────────────────────────────────
// Validation Result
// ────────────────────────────────────────────────────────────────────────────────

export interface GaugeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
