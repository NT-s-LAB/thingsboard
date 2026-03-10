/**
 * SCADA Project Migration — Converts legacy single-page ScreenDefinition
 * to the new multi-page ScadaProject format.
 *
 * Strategy:
 *   - schemaVersion 1 (or absent) = legacy single-page ScreenDefinition
 *   - schemaVersion 2 = multi-page ScadaProject
 *
 * Legacy data is preserved: all widgets, layers, variables, bindings,
 * and actions are migrated into a single "Main Page" within the project.
 */

import type { ScreenDefinition } from '../types/screen.types';
import type { ScadaProject, ScadaPage } from '../types/project.types';
import { CURRENT_SCHEMA_VERSION } from '../types/project.types';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Detect whether raw data is a legacy ScreenDefinition or a ScadaProject.
 * If legacy, migrate it to the current schema version.
 * If already current, return as-is.
 */
export function migrateToCurrentSchema(data: unknown): ScadaProject {
  const raw = data as Record<string, unknown>;

  // Already a multi-page project
  if (raw.schemaVersion === CURRENT_SCHEMA_VERSION && Array.isArray(raw.pages)) {
    return raw as unknown as ScadaProject;
  }

  // Legacy ScreenDefinition → ScadaProject
  return migrateFromScreenDefinition(raw as unknown as ScreenDefinition);
}

/**
 * Check if data needs migration.
 */
export function needsMigration(data: unknown): boolean {
  const raw = data as Record<string, unknown>;
  return !raw.schemaVersion || Number(raw.schemaVersion) < CURRENT_SCHEMA_VERSION;
}

// ─── Migration: ScreenDefinition → ScadaProject ─────────────────────────────

function migrateFromScreenDefinition(screen: ScreenDefinition): ScadaProject {
  const now = new Date().toISOString();

  // Build the home page from the screen's data
  const homePage: ScadaPage = {
    id: `page_main_${screen.id}`,
    name: screen.name || 'Main Page',
    pageType: 'normal',
    canvasSize: screen.canvasSize ?? { width: 1920, height: 1080 },
    background: screen.background ?? { type: 'color', color: '#f8fafc' },
    layers: screen.layers?.length
      ? screen.layers
      : [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }],
    widgets: screen.widgets ?? [],
    variables: screen.variables ?? [],
    events: [],
    order: 0,
    createdAt: screen.metadata?.createdAt ?? now,
    updatedAt: screen.metadata?.updatedAt ?? now,
  };

  // If the screen had windows, convert them to additional pages
  const additionalPages: ScadaPage[] = (screen.windows ?? []).map((win, idx) => ({
    id: win.id,
    name: win.name,
    pageType: 'normal' as const,
    canvasSize: win.canvasSize,
    background: win.background,
    layers: win.layers,
    widgets: win.widgets,
    variables: [],
    events: [],
    order: idx + 1,
    createdAt: now,
    updatedAt: now,
  }));

  const allPages = [homePage, ...additionalPages];

  return {
    id: screen.id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name: screen.name || 'Untitled Project',
    description: screen.description ?? '',
    homePageId: homePage.id,
    pages: allPages,
    globalVariables: [],
    metadata: {
      createdAt: screen.metadata?.createdAt ?? now,
      updatedAt: screen.metadata?.updatedAt ?? now,
      createdBy: screen.metadata?.createdBy ?? '',
      tags: screen.metadata?.tags ?? [],
      version: screen.version ?? 1,
    },
    settings: {
      defaultCanvasSize: screen.canvasSize ?? { width: 1920, height: 1080 },
      defaultBackground: screen.background ?? { type: 'color', color: '#f8fafc' },
      transition: 'none',
    },
  };
}

// ─── Serialize Project back to ScreenDefinition for backend compatibility ───

/**
 * Convert a ScadaProject back to a ScreenDefinition for backward-compatible
 * persistence to the existing `/scada-views` backend endpoint.
 *
 * The project structure is stored as a JSON blob inside the ScreenDefinition,
 * so the backend doesn't need schema changes.
 */
export function projectToScreenDefinition(project: ScadaProject): ScreenDefinition {
  const homePage = project.pages.find((p) => p.id === project.homePageId) ?? project.pages[0];
  if (!homePage) {
    throw new Error('Project has no pages');
  }

  return {
    id: project.id,
    version: project.metadata.version,
    name: project.name,
    description: project.description,
    canvasSize: homePage.canvasSize,
    background: homePage.background,
    layers: homePage.layers,
    widgets: homePage.widgets,
    variables: [...(project.globalVariables ?? []), ...(homePage.variables ?? [])],
    metadata: {
      createdAt: project.metadata.createdAt,
      updatedAt: project.metadata.updatedAt,
      createdBy: project.metadata.createdBy,
      tags: project.metadata.tags,
    },
    // Store the full project structure so we can round-trip
    _projectData: project,
  } as ScreenDefinition & { _projectData: ScadaProject };
}

/**
 * Extract a ScadaProject from a ScreenDefinition that was saved with
 * projectToScreenDefinition(). Falls back to migration if necessary.
 */
export function screenDefinitionToProject(screen: ScreenDefinition): ScadaProject {
  const raw = screen as ScreenDefinition & { _projectData?: ScadaProject };
  if (raw._projectData && raw._projectData.schemaVersion === CURRENT_SCHEMA_VERSION) {
    // Debug: Log events from home page widgets
    if (typeof window !== 'undefined') {
      const homePage = raw._projectData.pages.find(p => p.id === raw._projectData!.homePageId);
      console.log('[ProjectMigration] Loading from _projectData, homePageId:', raw._projectData.homePageId);
      console.log('[ProjectMigration] Home page widgets with events:', 
        homePage?.widgets.filter((w: any) => w.events?.length > 0).map((w: any) => ({
          id: w.id,
          name: w.name,
          eventCount: w.events?.length
        }))
      );
    }
    return raw._projectData;
  }
  console.log('[ProjectMigration] Migrating from legacy ScreenDefinition');
  return migrateFromScreenDefinition(screen);
}
