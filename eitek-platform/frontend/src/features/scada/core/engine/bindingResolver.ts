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
    const formatted = applyFormat(rawValue, binding.format);
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
