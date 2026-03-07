/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'VND', locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format bytes as human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Clamp a number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Generate a random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Round a number to specified decimal places
 */
export function roundTo(num: number, decimals: number): number {
  return Number(num.toFixed(decimals));
}

/**
 * Convert percentage to decimal
 */
export function percentageToDecimal(percentage: number): number {
  return percentage / 100;
}

/**
 * Convert decimal to percentage
 */
export function decimalToPercentage(decimal: number): number {
  return decimal * 100;
}

/**
 * Calculate percentage change
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
}