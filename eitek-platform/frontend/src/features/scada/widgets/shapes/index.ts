/**
 * Basic Shapes System
 *
 * Exports shape types, renderers, definitions, and registration function.
 *
 * Usage:
 *   // At app initialization
 *   import { registerShapeWidgets } from '@/features/scada/widgets/shapes';
 *   registerShapeWidgets();
 *
 *   // To use shapes in custom code
 *   import { shapeDefinitions, RectangleRenderer } from '@/features/scada/widgets/shapes';
 */

// Types
export * from './types';

// Renderers
export * from './renderers';

// Definitions & Registration
export {
  shapeDefinitions,
  registerShapeWidgets,
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
} from './definitions';
