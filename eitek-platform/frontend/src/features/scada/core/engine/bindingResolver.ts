/**
 * Binding Resolver
 *
 * Given a screen definition, resolves all widget bindings into:
 *   1. DataPoint[] — the aggregated list of all data subscriptions needed
 *   2. A resolve() function that merges static props with live data values
 *
 * The runtime engine calls:
 *   const { dataPoints, resolve } = createBindingResolver(screen);
 *   subscriptionManager.subscribe(dataPoints);
 *   // on each data update:
 *   const resolvedProps = resolve(widgetInstance, latestValueMap);
 */

import type {
  ScreenDefinition,
  WidgetInstance,
  WidgetBinding,
  BindingFormat,
} from '../types/screen.types';
import type { DataPoint, DataValue } from './subscriptionManager';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Collect all DataPoints that this screen needs.
 */
export function collectDataPoints(screen: ScreenDefinition): DataPoint[] {
  const points: DataPoint[] = [];
  const seen = new Set<string>();

  for (const widget of screen.widgets) {
    for (const binding of widget.bindings) {
      const src = binding.source;
      if (!src.entityId || !src.key) continue;
      if (src.type !== 'telemetry' && src.type !== 'attribute') continue;

      const dedupKey = `${src.entityId}::${src.key}::${src.type}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const point: DataPoint = {
        entityId: src.entityId,
        entityType: src.entityType ?? 'DEVICE',
        key: src.key,
        kind: src.type === 'attribute' ? 'attribute' : 'telemetry',
      };
      if (src.attributeScope) {
        point.attributeScope = src.attributeScope;
      }
      points.push(point);
    }
  }

  return points;
}

/**
 * Resolve widget properties by overlaying bound live values onto static props.
 *
 * @param widget      The widget instance
 * @param getLatest   A function that returns the latest known value for (entityId, key)
 * @param variables   Screen-level variables (for variable-type bindings)
 */
export function resolveWidgetProperties(
  widget: WidgetInstance,
  getLatest: (entityId: string, key: string) => DataValue | undefined,
  variables: Record<string, unknown> = {},
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...widget.properties };

  for (const binding of widget.bindings) {
    const rawValue = resolveRawValue(binding, getLatest, variables);
    // Apply converter function if enabled (ThingsBoard style)
    const converted = applyConverter(rawValue, binding);
    // Apply format transformation
    const formatted = applyFormat(converted, binding.format);
    result[binding.targetProperty] = formatted ?? binding.defaultValue;
  }

  return result;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function resolveRawValue(
  binding: WidgetBinding,
  getLatest: (entityId: string, key: string) => DataValue | undefined,
  variables: Record<string, unknown>,
): DataValue | undefined {
  const src = binding.source;

  switch (src.type) {
    case 'telemetry':
    case 'attribute':
      if (!src.entityId || !src.key) return undefined;
      return getLatest(src.entityId, src.key);

    case 'variable':
      if (!src.key) return undefined;
      return variables[src.key] as DataValue;

    case 'static':
      return src.staticValue as DataValue;

    case 'calculated':
      return evaluateExpression(src.expression, getLatest, variables);

    case 'alarm':
      // Alarm state is handled separately by the AlarmOverlay layer
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Apply ThingsBoard-style converter function and onWhenResultType.
 * This transforms the raw value to a boolean (for 'state' property on switches etc.)
 */
function applyConverter(
  value: DataValue | undefined,
  binding: WidgetBinding,
): DataValue | undefined {
  if (value === undefined || value === null) return undefined;

  const src = binding.source;
  let result: DataValue = value;

  // Apply converter function if enabled
  if (src.converterEnabled && src.converterFunction) {
    try {
      // Create a safe function from the converter (function body expects 'data' as input)
      // eslint-disable-next-line no-new-func
      const converterFn = new Function('data', src.converterFunction) as (data: unknown) => unknown;
      result = converterFn(value) as DataValue;
    } catch (e) {
      console.warn('[bindingResolver] Converter function error:', e);
      return value;
    }
  }

  // Apply onWhenResultType to convert value to boolean (for 'state' property)
  // This is only applied when targetProperty is 'state' (switch, valve, etc.)
  if (binding.targetProperty === 'state' && src.onWhenResultType) {
    result = convertToBoolean(result, src.onWhenResultType);
  }

  return result;
}

/**
 * Convert a value to boolean based on the expected type (ThingsBoard style).
 */
function convertToBoolean(
  value: DataValue | undefined,
  resultType: 'string' | 'integer' | 'double' | 'boolean' | 'json',
): boolean {
  if (value === undefined || value === null) return false;

  switch (resultType) {
    case 'boolean':
      // Interpret as boolean
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1' || value === 'on';
      if (typeof value === 'number') return value !== 0;
      return Boolean(value);

    case 'string':
      // String must be truthy and not "false", "0", "off", etc.
      const strVal = String(value).toLowerCase().trim();
      return strVal !== '' && strVal !== 'false' && strVal !== '0' && strVal !== 'off';

    case 'integer':
    case 'double':
      // Numeric: non-zero is true
      const numVal = Number(value);
      return !isNaN(numVal) && numVal !== 0;

    case 'json':
      // JSON: try to parse if string, then check truthy
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Boolean(parsed);
        } catch {
          return Boolean(value);
        }
      }
      return Boolean(value);

    default:
      return Boolean(value);
  }
}

/**
 * Very simple safe expression evaluator (no eval).
 * Supports variable references like `${temperature} * 1.8 + 32`.
 */
function evaluateExpression(
  expression: string | undefined,
  getLatest: (entityId: string, key: string) => DataValue | undefined,
  variables: Record<string, unknown>,
): DataValue | undefined {
  if (!expression) return undefined;

  try {
    // Replace ${entityId::key} references with actual values
    let expr = expression.replace(
      /\$\{([^:}]+)::([^}]+)\}/g,
      (_, entityId: string, key: string) => {
        const val = getLatest(entityId.trim(), key.trim());
        if (val === undefined || val === null) return '0';
        return String(val);
      },
    );

    // Replace ${variableName} references
    expr = expr.replace(/\$\{(\w+)\}/g, (_, name: string) => {
      const val = variables[name];
      if (val === undefined || val === null) return '0';
      return String(val);
    });

    // Simple arithmetic evaluation (safe — only numbers and operators)
    if (/^[\d\s+\-*/().]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      return new Function(`return (${expr})`)() as number;
    }

    return expr;
  } catch {
    return undefined;
  }
}

function applyFormat(
  value: DataValue | undefined,
  format: BindingFormat | undefined,
): DataValue | undefined {
  if (value === undefined || value === null) return undefined;
  if (!format) return value;

  let current: DataValue = value;

  // Apply multiplier first (shared with mobile)
  if (format.multiplier !== undefined && typeof current === 'number') {
    current = current * format.multiplier;
  } else if (format.multiplier !== undefined) {
    const num = Number(current);
    if (!isNaN(num)) current = num * format.multiplier;
  }

  // Apply offset (shared with mobile)
  if (format.offset !== undefined && typeof current === 'number') {
    current = current + format.offset;
  } else if (format.offset !== undefined) {
    const num = Number(current);
    if (!isNaN(num)) current = num + format.offset;
  }

  // Value map (e.g. 0→"OFF", 1→"ON")
  if (format.valueMap) {
    const mapped = format.valueMap[String(current)];
    if (mapped !== undefined) return mapped;
  }

  // Numeric formatting
  if (format.type === 'number') {
    const num = Number(current);
    if (isNaN(num)) return current;

    let formatted = format.decimals !== undefined ? num.toFixed(format.decimals) : String(num);
    const prefix = format.prefix ?? '';
    const suffix = format.suffix ?? '';
    const unit = format.unit ? ` ${format.unit}` : '';
    return `${prefix}${formatted}${suffix}${unit}`;
  }

  return current;
}
