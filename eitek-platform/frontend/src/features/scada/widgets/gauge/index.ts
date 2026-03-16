/**
 * Gauge Widget Module
 *
 * Complete implementation of Gauge widget for SCADA Editor.
 * Supports radial, semicircle, arc, and linear variants.
 */

// Types
export type {
  GaugeConfig,
  GaugeConfigPartial,
  GaugeThreshold,
  GaugeVariant,
  GaugeValidationResult,
} from './types';

// Defaults & Helpers
export {
  DEFAULT_GAUGE_CONFIG,
  DEFAULT_THRESHOLDS,
  VARIANT_ANGLES,
  GAUGE_PRESETS,
  RADIAL_GAUGE_PRESET,
  SEMICIRCLE_GAUGE_PRESET,
  ARC_GAUGE_PRESET,
  LINEAR_GAUGE_PRESET,
  normalizeGaugeConfig,
  validateGaugeConfig,
  createGaugeConfig,
  createFromPreset,
  getColorForValue,
  calculateFraction,
  valueToAngle,
} from './defaults';

// Components
export { GaugeWidget, GaugeWidgetRenderer } from './GaugeWidget';
export { default } from './GaugeWidget';
