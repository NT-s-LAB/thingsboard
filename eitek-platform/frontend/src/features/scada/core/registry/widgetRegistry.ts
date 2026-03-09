/**
 * Widget Registry
 *
 * Central registry that maps widget type strings to their WidgetDefinition.
 * All built-in and custom widgets must be registered here before use.
 *
 * Usage:
 *   import { widgetRegistry } from '@/features/scada/core/registry';
 *
 *   // Register a new widget type
 *   widgetRegistry.register(tankDefinition);
 *
 *   // Get a widget definition for rendering
 *   const def = widgetRegistry.get('tank');
 *
 *   // List all widgets for the palette
 *   const all = widgetRegistry.getAll();
 */

import type { WidgetCategory, WidgetDefinition } from '../types';

class WidgetRegistry {
  private definitions = new Map<string, WidgetDefinition>();

  /** Register a widget definition. Throws if the type is already registered. */
  register(definition: WidgetDefinition): void {
    if (this.definitions.has(definition.type)) {
      console.warn(
        `[WidgetRegistry] Overwriting existing widget definition: "${definition.type}"`,
      );
    }
    this.definitions.set(definition.type, definition);
  }

  /** Register multiple definitions at once. */
  registerAll(definitions: WidgetDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /** Retrieve a single definition by type.  Returns undefined if not found. */
  get(type: string): WidgetDefinition | undefined {
    return this.definitions.get(type);
  }

  /** Retrieve a definition or throw. */
  getOrThrow(type: string): WidgetDefinition {
    const def = this.definitions.get(type);
    if (!def) {
      throw new Error(`[WidgetRegistry] Unknown widget type: "${type}"`);
    }
    return def;
  }

  /** All registered definitions. */
  getAll(): WidgetDefinition[] {
    return Array.from(this.definitions.values());
  }

  /** All definitions in a given category. */
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAll().filter((d) => d.category === category);
  }

  /** All known categories that have at least one widget. */
  getCategories(): WidgetCategory[] {
    const cats = new Set<WidgetCategory>();
    Array.from(this.definitions.values()).forEach((def) => {
      cats.add(def.category);
    });
    return Array.from(cats);
  }

  /** Check whether a type is registered. */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /** Unregister a type (useful for hot-reloading custom widgets). */
  unregister(type: string): boolean {
    return this.definitions.delete(type);
  }

  /** Total count of registered widget types. */
  get size(): number {
    return this.definitions.size;
  }
}

/** Singleton instance used across the application. */
export const widgetRegistry = new WidgetRegistry();
