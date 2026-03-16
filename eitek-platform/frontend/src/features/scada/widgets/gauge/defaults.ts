/**
 * Gauge Widget Defaults & Presets
 *
 * Default configuration and example presets for all gauge variants.
 */

import type { GaugeConfig, GaugeThreshold, GaugeVariant, GaugeValidationResult } from './types';

// ────────────────────────────────────────────────────────────────────────────────
// Default Thresholds
// ────────────────────────────────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
  { value: 0, color: '#22C55E', label: 'Normal' },
  { value: 60, color: '#F59E0B', label: 'Warning' },
  { value: 80, color: '#EF4444', label: 'Critical' },
];

// ────────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ────────────────────────────────────────────────────────────────────────────────

export const DEFAULT_GAUGE_CONFIG: GaugeConfig = {
  // Identity
  id: '',
  type: 'gauge',

  // Variant
  variant: 'radial',

  // Data
  title: '',
  value: 0,
  min: 0,
  max: 100,
  unit: '',
  precision: 0,

  // Display Options
  showTitle: false,
  showValue: true,
  showUnit: true,
  showMinMax: true,

  // Geometry
  startAngle: 135,
  endAngle: 405,
  thickness: 12,

  // Colors
  trackColor: '#E5E7EB',
  fillColor: '#3B82F6',
  backgroundColor: 'transparent',
  needleColor: '#374151',
  textColor: '#1F2937',
  titleColor: '#6B7280',

  // Thresholds
  thresholdEnabled: true,
  thresholds: [...DEFAULT_THRESHOLDS],

  // Needle
  showNeedle: true,
  needleWidth: 3,

  // Layout
  width: 160,
  height: 160,
};

// ────────────────────────────────────────────────────────────────────────────────
// Variant Angle Presets
// ────────────────────────────────────────────────────────────────────────────────

/** Angle configurations for each variant */
export const VARIANT_ANGLES: Record<GaugeVariant, { startAngle: number; endAngle: number }> = {
  radial: { startAngle: 135, endAngle: 405 },      // 270° sweep
  semicircle: { startAngle: 180, endAngle: 360 },  // 180° sweep (top half)
  arc: { startAngle: 150, endAngle: 390 },         // 240° sweep
  linear: { startAngle: 0, endAngle: 0 },          // Not applicable
};

// ────────────────────────────────────────────────────────────────────────────────
// Example Presets
// ────────────────────────────────────────────────────────────────────────────────

/** Radial Gauge Preset (full circle, 270° sweep) */
export const RADIAL_GAUGE_PRESET: Partial<GaugeConfig> = {
  variant: 'radial',
  title: 'Temperature',
  min: 0,
  max: 100,
  unit: '°C',
  precision: 1,
  startAngle: 135,
  endAngle: 405,
  showNeedle: true,
  thickness: 12,
  thresholds: [
    { value: 0, color: '#3B82F6', label: 'Cold' },
    { value: 25, color: '#22C55E', label: 'Normal' },
    { value: 60, color: '#F59E0B', label: 'Warm' },
    { value: 80, color: '#EF4444', label: 'Hot' },
  ],
};

/** Semicircle Gauge Preset (half circle, 180° sweep) */
export const SEMICIRCLE_GAUGE_PRESET: Partial<GaugeConfig> = {
  variant: 'semicircle',
  title: 'Speed',
  min: 0,
  max: 200,
  unit: 'km/h',
  precision: 0,
  startAngle: 180,
  endAngle: 360,
  showNeedle: true,
  thickness: 14,
  thresholds: [
    { value: 0, color: '#22C55E', label: 'Safe' },
    { value: 80, color: '#F59E0B', label: 'Caution' },
    { value: 120, color: '#EF4444', label: 'Danger' },
  ],
};

/** Arc Gauge Preset (240° sweep, no needle) */
export const ARC_GAUGE_PRESET: Partial<GaugeConfig> = {
  variant: 'arc',
  title: 'Pressure',
  min: 0,
  max: 10,
  unit: 'bar',
  precision: 1,
  startAngle: 150,
  endAngle: 390,
  showNeedle: false,
  thickness: 16,
  thresholds: [
    { value: 0, color: '#22C55E', label: 'Low' },
    { value: 4, color: '#3B82F6', label: 'Normal' },
    { value: 7, color: '#F59E0B', label: 'High' },
    { value: 9, color: '#EF4444', label: 'Critical' },
  ],
};

/** Linear Gauge Preset (horizontal bar) */
export const LINEAR_GAUGE_PRESET: Partial<GaugeConfig> = {
  variant: 'linear',
  title: 'Tank Level',
  min: 0,
  max: 100,
  unit: '%',
  precision: 0,
  thickness: 20,
  showNeedle: false,
  showMinMax: true,
  thresholds: [
    { value: 0, color: '#EF4444', label: 'Empty' },
    { value: 20, color: '#F59E0B', label: 'Low' },
    { value: 50, color: '#22C55E', label: 'Normal' },
  ],
};

/** All presets indexed by variant */
export const GAUGE_PRESETS: Record<GaugeVariant, Partial<GaugeConfig>> = {
  radial: RADIAL_GAUGE_PRESET,
  semicircle: SEMICIRCLE_GAUGE_PRESET,
  arc: ARC_GAUGE_PRESET,
  linear: LINEAR_GAUGE_PRESET,
};

// ────────────────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Validate a gauge configuration
 */
export function validateGaugeConfig(config: Partial<GaugeConfig>): GaugeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (config.min === undefined) errors.push('min is required');
  if (config.max === undefined) errors.push('max is required');

  // Range validation
  if (config.min !== undefined && config.max !== undefined) {
    if (config.max <= config.min) {
      errors.push('max must be greater than min');
    }
  }

  // Value range check
  if (config.value !== undefined && config.min !== undefined && config.max !== undefined) {
    if (config.value < config.min || config.value > config.max) {
      warnings.push(`value (${config.value}) is outside range [${config.min}, ${config.max}]`);
    }
  }

  // Threshold validation
  if (config.thresholds && config.thresholds.length > 0) {
    const sortedCheck = [...config.thresholds].sort((a, b) => a.value - b.value);
    const isSorted = config.thresholds.every((t, i) => t.value === sortedCheck[i]?.value);
    if (!isSorted) {
      warnings.push('thresholds should be sorted by value ascending');
    }
  }

  // Angle validation (for non-linear variants)
  if (config.variant !== 'linear') {
    if (config.startAngle !== undefined && config.endAngle !== undefined) {
      const sweep = config.endAngle - config.startAngle;
      if (Math.abs(sweep) > 360) {
        warnings.push('angle sweep exceeds 360°');
      }
    }
  }

  // Precision validation
  if (config.precision !== undefined && (config.precision < 0 || config.precision > 6)) {
    errors.push('precision must be between 0 and 6');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Normalize Config
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Normalize partial config with defaults
 */
export function normalizeGaugeConfig(partial: Partial<GaugeConfig>): GaugeConfig {
  const variant = partial.variant || DEFAULT_GAUGE_CONFIG.variant;

  // Get variant-specific angles if not provided
  const variantAngles = VARIANT_ANGLES[variant];

  const config: GaugeConfig = {
    ...DEFAULT_GAUGE_CONFIG,
    ...partial,
    // Apply variant angles if not overridden
    startAngle: partial.startAngle ?? variantAngles.startAngle,
    endAngle: partial.endAngle ?? variantAngles.endAngle,
    // Ensure thresholds is always an array
    thresholds: partial.thresholds ?? [...DEFAULT_THRESHOLDS],
  };

  // Clamp value to range
  config.value = Math.max(config.min, Math.min(config.max, config.value));

  // Sort thresholds by value
  config.thresholds = [...config.thresholds].sort((a, b) => a.value - b.value);

  return config;
}

// ────────────────────────────────────────────────────────────────────────────────
// Create Config Helpers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Create a new gauge config with defaults
 */
export function createGaugeConfig(partial?: Partial<GaugeConfig>): GaugeConfig {
  return normalizeGaugeConfig({
    id: partial?.id || `gauge_${Date.now()}`,
    ...partial,
  });
}

/**
 * Create a gauge config from a preset
 */
export function createFromPreset(variant: GaugeVariant, overrides?: Partial<GaugeConfig>): GaugeConfig {
  const preset = GAUGE_PRESETS[variant];
  return normalizeGaugeConfig({
    ...preset,
    ...overrides,
    id: overrides?.id || `gauge_${Date.now()}`,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Get color for a value based on thresholds
 */
export function getColorForValue(
  value: number,
  thresholds: GaugeThreshold[],
  fallbackColor: string
): string {
  if (!thresholds.length) return fallbackColor;

  // Sort descending to find highest matching threshold
  const sorted = [...thresholds].sort((a, b) => b.value - a.value);

  for (const threshold of sorted) {
    if (value >= threshold.value) {
      return threshold.color;
    }
  }

  // Return first threshold color if below all
  return sorted[sorted.length - 1]?.color || fallbackColor;
}

/**
 * Calculate value as fraction (0-1) of range
 */
export function calculateFraction(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Convert value to angle (for radial gauges)
 */
export function valueToAngle(
  value: number,
  min: number,
  max: number,
  startAngle: number,
  endAngle: number
): number {
  const fraction = calculateFraction(value, min, max);
  return startAngle + fraction * (endAngle - startAngle);
}
