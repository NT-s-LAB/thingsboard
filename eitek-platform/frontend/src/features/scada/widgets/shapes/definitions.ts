/**
 * Shape Widget Definitions
 *
 * Register all basic shape widgets with the WidgetRegistry.
 * Shapes follow the same pattern as other widgets but have a dedicated category.
 *
 * Each shape has:
 *   - propSchema: drives the property panel
 *   - bindingSchema: allows dynamic styling
 *   - renderer: SVG-based React component
 */

import type { WidgetDefinition, PropField } from '../../core/types';
import { widgetRegistry } from '../../core/registry';

import {
  RectangleRenderer,
  CircleRenderer,
  EllipseRenderer,
  LineRenderer,
  ArrowRenderer,
  TriangleRenderer,
  DiamondRenderer,
  PolygonRenderer,
  TextShapeRenderer,
} from './renderers';

// ─── Common PropSchema Fields ────────────────────────────────────────────────

/**
 * Base style properties shared by all shapes
 */
const baseStyleProps: PropField[] = [
  {
    key: 'fillColor',
    label: 'Fill Color',
    type: 'color',
    defaultValue: '#ffffff',
    group: 'Style',
  },
  {
    key: 'strokeColor',
    label: 'Stroke Color',
    type: 'color',
    defaultValue: '#1f2937',
    group: 'Style',
  },
  {
    key: 'strokeWidth',
    label: 'Stroke Width',
    type: 'number',
    defaultValue: 2,
    min: 0,
    max: 20,
    group: 'Style',
  },
  {
    key: 'strokeStyle',
    label: 'Stroke Style',
    type: 'select',
    defaultValue: 'solid',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
    ],
    group: 'Style',
  },
  {
    key: 'opacity',
    label: 'Opacity',
    type: 'range',
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Style',
  },
];

/**
 * Shadow properties (optional for all shapes)
 */
const shadowProps: PropField[] = [
  {
    key: 'shadow',
    label: 'Enable Shadow',
    type: 'boolean',
    defaultValue: false,
    group: 'Shadow',
  },
  {
    key: 'shadowColor',
    label: 'Shadow Color',
    type: 'color',
    defaultValue: 'rgba(0,0,0,0.25)',
    group: 'Shadow',
  },
  {
    key: 'shadowBlur',
    label: 'Shadow Blur',
    type: 'number',
    defaultValue: 4,
    min: 0,
    max: 30,
    group: 'Shadow',
  },
  {
    key: 'shadowOffsetX',
    label: 'Shadow X',
    type: 'number',
    defaultValue: 2,
    min: -20,
    max: 20,
    group: 'Shadow',
  },
  {
    key: 'shadowOffsetY',
    label: 'Shadow Y',
    type: 'number',
    defaultValue: 2,
    min: -20,
    max: 20,
    group: 'Shadow',
  },
];

// ─── Rectangle Shape ─────────────────────────────────────────────────────────

const rectangleShape: WidgetDefinition = {
  type: 'shape-rectangle',
  name: 'Rectangle',
  icon: '▬',
  category: 'shapes',
  defaultSize: { width: 120, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    {
      key: 'cornerRadius',
      label: 'Corner Radius',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 50,
      group: 'Shape',
      description: 'Rounded corners (0 = sharp)',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: RectangleRenderer,
};

// ─── Rounded Rectangle Shape ─────────────────────────────────────────────────

const roundedRectangleShape: WidgetDefinition = {
  type: 'shape-rounded-rectangle',
  name: 'Rounded Rectangle',
  icon: '▭',
  category: 'shapes',
  defaultSize: { width: 120, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    {
      key: 'cornerRadius',
      label: 'Corner Radius',
      type: 'number',
      defaultValue: 12,
      min: 0,
      max: 50,
      group: 'Shape',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: RectangleRenderer, // Same renderer, different defaults
};

// ─── Circle Shape ────────────────────────────────────────────────────────────

const circleShape: WidgetDefinition = {
  type: 'shape-circle',
  name: 'Circle',
  icon: '●',
  category: 'shapes',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: CircleRenderer,
};

// ─── Ellipse Shape ───────────────────────────────────────────────────────────

const ellipseShape: WidgetDefinition = {
  type: 'shape-ellipse',
  name: 'Ellipse',
  icon: '⬭',
  category: 'shapes',
  defaultSize: { width: 120, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: EllipseRenderer,
};

// ─── Line Shape ──────────────────────────────────────────────────────────────

const lineShape: WidgetDefinition = {
  type: 'shape-line',
  name: 'Line',
  icon: '━',
  category: 'shapes',
  defaultSize: { width: 150, height: 30 },
  supportsSvg: false,
  propSchema: [
    {
      key: 'strokeColor',
      label: 'Line Color',
      type: 'color',
      defaultValue: '#1f2937',
      group: 'Style',
    },
    {
      key: 'strokeWidth',
      label: 'Line Width',
      type: 'number',
      defaultValue: 2,
      min: 1,
      max: 20,
      group: 'Style',
    },
    {
      key: 'strokeStyle',
      label: 'Line Style',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ],
      group: 'Style',
    },
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'range',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
      group: 'Style',
    },
    {
      key: 'lineCap',
      label: 'Line Cap',
      type: 'select',
      defaultValue: 'round',
      options: [
        { value: 'butt', label: 'Flat' },
        { value: 'round', label: 'Round' },
        { value: 'square', label: 'Square' },
      ],
      group: 'Shape',
    },
    {
      key: 'arrowStart',
      label: 'Arrow Start',
      type: 'boolean',
      defaultValue: false,
      group: 'Arrows',
    },
    {
      key: 'arrowEnd',
      label: 'Arrow End',
      type: 'boolean',
      defaultValue: false,
      group: 'Arrows',
    },
    {
      key: 'arrowSize',
      label: 'Arrow Size',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      step: 0.1,
      group: 'Arrows',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'strokeColor', label: 'Line Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: LineRenderer,
};

// ─── Arrow Shape ─────────────────────────────────────────────────────────────

const arrowShape: WidgetDefinition = {
  type: 'shape-arrow',
  name: 'Arrow',
  icon: '➡',
  category: 'shapes',
  defaultSize: { width: 120, height: 40 },
  supportsSvg: false,
  propSchema: [
    {
      key: 'fillColor',
      label: 'Fill Color',
      type: 'color',
      defaultValue: '#3b82f6',
      group: 'Style',
    },
    {
      key: 'strokeColor',
      label: 'Stroke Color',
      type: 'color',
      defaultValue: '#1e40af',
      group: 'Style',
    },
    {
      key: 'strokeWidth',
      label: 'Stroke Width',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 10,
      group: 'Style',
    },
    {
      key: 'strokeStyle',
      label: 'Stroke Style',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ],
      group: 'Style',
    },
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'range',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
      group: 'Style',
    },
    {
      key: 'headWidth',
      label: 'Head Width',
      type: 'number',
      defaultValue: 10,
      min: 5,
      max: 30,
      group: 'Shape',
    },
    {
      key: 'headLength',
      label: 'Head Length',
      type: 'number',
      defaultValue: 15,
      min: 5,
      max: 40,
      group: 'Shape',
    },
    {
      key: 'doubleHeaded',
      label: 'Double Headed',
      type: 'boolean',
      defaultValue: false,
      group: 'Shape',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: ArrowRenderer,
};

// ─── Triangle Shape ──────────────────────────────────────────────────────────

const triangleShape: WidgetDefinition = {
  type: 'shape-triangle',
  name: 'Triangle',
  icon: '▲',
  category: 'shapes',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      defaultValue: 'up',
      options: [
        { value: 'up', label: 'Up' },
        { value: 'down', label: 'Down' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
      group: 'Shape',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: TriangleRenderer,
};

// ─── Diamond Shape ───────────────────────────────────────────────────────────

const diamondShape: WidgetDefinition = {
  type: 'shape-diamond',
  name: 'Diamond',
  icon: '◆',
  category: 'shapes',
  defaultSize: { width: 80, height: 100 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: DiamondRenderer,
};

// ─── Polygon Shape ───────────────────────────────────────────────────────────

const polygonShape: WidgetDefinition = {
  type: 'shape-polygon',
  name: 'Polygon',
  icon: '⬡',
  category: 'shapes',
  defaultSize: { width: 80, height: 80 },
  supportsSvg: false,
  propSchema: [
    ...baseStyleProps,
    {
      key: 'sides',
      label: 'Sides',
      type: 'number',
      defaultValue: 6,
      min: 3,
      max: 12,
      group: 'Shape',
      description: 'Number of sides (3-12)',
    },
    {
      key: 'star',
      label: 'Star Shape',
      type: 'boolean',
      defaultValue: false,
      group: 'Shape',
    },
    {
      key: 'innerRadiusRatio',
      label: 'Inner Radius',
      type: 'range',
      defaultValue: 0.5,
      min: 0.1,
      max: 0.9,
      step: 0.05,
      group: 'Shape',
      description: 'Star inner radius ratio',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'fillColor', label: 'Fill Color', valueType: 'string' },
    { key: 'strokeColor', label: 'Stroke Color', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
    { key: 'sides', label: 'Sides', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: PolygonRenderer,
};

// ─── Text Shape ──────────────────────────────────────────────────────────────

const textShape: WidgetDefinition = {
  type: 'shape-text',
  name: 'Text',
  icon: '𝐓',
  category: 'shapes',
  defaultSize: { width: 150, height: 60 },
  supportsSvg: false,
  propSchema: [
    // Text content
    {
      key: 'text',
      label: 'Text',
      type: 'string',
      defaultValue: 'Text',
      group: 'Text',
    },
    {
      key: 'fontSize',
      label: 'Font Size',
      type: 'number',
      defaultValue: 16,
      min: 8,
      max: 72,
      group: 'Text',
    },
    {
      key: 'fontFamily',
      label: 'Font Family',
      type: 'select',
      defaultValue: 'Inter, Arial, sans-serif',
      options: [
        { value: 'Inter, Arial, sans-serif', label: 'Inter' },
        { value: 'Arial, sans-serif', label: 'Arial' },
        { value: 'Helvetica, sans-serif', label: 'Helvetica' },
        { value: 'Times New Roman, serif', label: 'Times' },
        { value: 'Georgia, serif', label: 'Georgia' },
        { value: 'Courier New, monospace', label: 'Courier' },
        { value: 'Roboto Mono, monospace', label: 'Roboto Mono' },
      ],
      group: 'Text',
    },
    {
      key: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { value: '300', label: 'Light' },
        { value: 'normal', label: 'Normal' },
        { value: '500', label: 'Medium' },
        { value: '600', label: 'Semi Bold' },
        { value: 'bold', label: 'Bold' },
        { value: '700', label: 'Extra Bold' },
      ],
      group: 'Text',
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#1f2937',
      group: 'Text',
    },
    {
      key: 'textAlign',
      label: 'Align',
      type: 'select',
      defaultValue: 'center',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      group: 'Text',
    },
    {
      key: 'verticalAlign',
      label: 'V-Align',
      type: 'select',
      defaultValue: 'middle',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'middle', label: 'Middle' },
        { value: 'bottom', label: 'Bottom' },
      ],
      group: 'Text',
    },
    {
      key: 'letterSpacing',
      label: 'Letter Spacing',
      type: 'number',
      defaultValue: 0,
      min: -5,
      max: 20,
      group: 'Text',
    },
    {
      key: 'lineHeight',
      label: 'Line Height',
      type: 'number',
      defaultValue: 1.4,
      min: 0.8,
      max: 3,
      step: 0.1,
      group: 'Text',
    },
    {
      key: 'textDecoration',
      label: 'Decoration',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'underline', label: 'Underline' },
        { value: 'line-through', label: 'Strikethrough' },
      ],
      group: 'Text',
    },
    // Background
    {
      key: 'fillColor',
      label: 'Background',
      type: 'color',
      defaultValue: 'transparent',
      group: 'Style',
    },
    {
      key: 'strokeColor',
      label: 'Border Color',
      type: 'color',
      defaultValue: 'transparent',
      group: 'Style',
    },
    {
      key: 'strokeWidth',
      label: 'Border Width',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      group: 'Style',
    },
    {
      key: 'cornerRadius',
      label: 'Border Radius',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 30,
      group: 'Style',
    },
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'range',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
      group: 'Style',
    },
    {
      key: 'padding',
      label: 'Padding',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 40,
      group: 'Style',
    },
    ...shadowProps,
  ],
  bindingSchema: [
    { key: 'text', label: 'Text', valueType: 'string' },
    { key: 'textColor', label: 'Text Color', valueType: 'string' },
    { key: 'fillColor', label: 'Background', valueType: 'string' },
    { key: 'opacity', label: 'Opacity', valueType: 'number' },
  ],
  actionSchema: [{ trigger: 'click', label: 'On Click' }],
  renderer: TextShapeRenderer,
};

// ─── All Shape Definitions ───────────────────────────────────────────────────

export const shapeDefinitions: WidgetDefinition[] = [
  rectangleShape,
  roundedRectangleShape,
  circleShape,
  ellipseShape,
  lineShape,
  arrowShape,
  triangleShape,
  diamondShape,
  polygonShape,
  textShape,
];

// ─── Register Function ───────────────────────────────────────────────────────

/**
 * Register all shape widgets with the global WidgetRegistry.
 * Call this once at app initialization.
 */
export function registerShapeWidgets(): void {
  widgetRegistry.registerAll(shapeDefinitions);
  console.log(`[ShapeWidgets] Registered ${shapeDefinitions.length} shape widgets`);
}

// ─── Export Individual Shapes (for testing/customization) ───────────────────

export {
  rectangleShape,
  roundedRectangleShape,
  circleShape,
  ellipseShape,
  lineShape,
  arrowShape,
  triangleShape,
  diamondShape,
  polygonShape,
  textShape,
};
