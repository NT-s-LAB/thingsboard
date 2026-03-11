/**
 * Shape Types & Interfaces
 *
 * Type definitions for the Basic Shapes System.
 * Shapes are implemented as widgets but have specialized style properties.
 */

// ─── Stroke Style ────────────────────────────────────────────────────────────

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export const STROKE_DASH_ARRAYS: Record<StrokeStyle, string> = {
  solid: '',
  dashed: '8,4',
  dotted: '2,2',
};

// ─── Line Cap & Join ─────────────────────────────────────────────────────────

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

// ─── Shape Style (Applied to all shapes) ────────────────────────────────────

export interface ShapeStyle {
  /** Fill color (hex, rgb, or 'transparent') */
  fillColor: string;
  /** Stroke/border color */
  strokeColor: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Stroke line style */
  strokeStyle: StrokeStyle;
  /** Overall opacity (0-1) */
  opacity: number;

  // Shadow properties (optional)
  /** Enable shadow */
  shadow?: boolean;
  /** Shadow color */
  shadowColor?: string;
  /** Shadow blur radius */
  shadowBlur?: number;
  /** Shadow X offset */
  shadowOffsetX?: number;
  /** Shadow Y offset */
  shadowOffsetY?: number;
}

// ─── Shape-Specific Properties ───────────────────────────────────────────────

export interface RectangleProps {
  /** Corner radius for rounded rectangles */
  cornerRadius: number;
}

export interface EllipseProps {
  // No extra props — rx/ry derived from width/height
}

export interface LineProps {
  /** Show arrowhead at start */
  arrowStart: boolean;
  /** Show arrowhead at end */
  arrowEnd: boolean;
  /** Arrow size multiplier */
  arrowSize: number;
  /** Line cap style */
  lineCap: LineCap;
}

export interface ArrowProps {
  /** Arrow head width */
  headWidth: number;
  /** Arrow head length */
  headLength: number;
  /** Double-headed arrow */
  doubleHeaded: boolean;
}

export interface TriangleProps {
  /** Direction the triangle points */
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface PolygonProps {
  /** Number of sides (3-12) */
  sides: number;
  /** Star shape (alternating vertex radius) */
  star: boolean;
  /** Inner radius ratio for star (0.1-0.9) */
  innerRadiusRatio: number;
}

export interface TextShapeProps {
  /** Text content */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Font weight */
  fontWeight: 'normal' | 'bold' | '300' | '500' | '600' | '700';
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right';
  /** Vertical alignment */
  verticalAlign: 'top' | 'middle' | 'bottom';
  /** Text color (overrides strokeColor for text) */
  textColor: string;
  /** Letter spacing */
  letterSpacing: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Text decoration */
  textDecoration: 'none' | 'underline' | 'line-through';
}

// ─── Default Values ──────────────────────────────────────────────────────────

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fillColor: '#ffffff',
  strokeColor: '#1f2937',
  strokeWidth: 2,
  strokeStyle: 'solid',
  opacity: 1,
  shadow: false,
  shadowColor: 'rgba(0,0,0,0.25)',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
};

export const DEFAULT_RECTANGLE_PROPS: RectangleProps = {
  cornerRadius: 0,
};

export const DEFAULT_LINE_PROPS: LineProps = {
  arrowStart: false,
  arrowEnd: false,
  arrowSize: 1,
  lineCap: 'round',
};

export const DEFAULT_ARROW_PROPS: ArrowProps = {
  headWidth: 10,
  headLength: 15,
  doubleHeaded: false,
};

export const DEFAULT_TRIANGLE_PROPS: TriangleProps = {
  direction: 'up',
};

export const DEFAULT_POLYGON_PROPS: PolygonProps = {
  sides: 6,
  star: false,
  innerRadiusRatio: 0.5,
};

export const DEFAULT_TEXT_SHAPE_PROPS: TextShapeProps = {
  text: 'Text',
  fontSize: 16,
  fontFamily: 'Inter, Arial, sans-serif',
  fontWeight: 'normal',
  textAlign: 'center',
  verticalAlign: 'middle',
  textColor: '#1f2937',
  letterSpacing: 0,
  lineHeight: 1.4,
  textDecoration: 'none',
};

// ─── Shape Widget Type Union ─────────────────────────────────────────────────

export type ShapeType =
  | 'shape-rectangle'
  | 'shape-rounded-rectangle'
  | 'shape-circle'
  | 'shape-ellipse'
  | 'shape-line'
  | 'shape-arrow'
  | 'shape-triangle'
  | 'shape-diamond'
  | 'shape-polygon'
  | 'shape-text';

// ─── Helper: Generate SVG Filter for Shadow ──────────────────────────────────

export function generateShadowFilter(
  id: string,
  shadowColor: string,
  shadowBlur: number,
  offsetX: number,
  offsetY: number,
): string {
  return `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${offsetX}" dy="${offsetY}" stdDeviation="${shadowBlur / 2}" flood-color="${shadowColor}" />
    </filter>
  `;
}

// ─── Helper: Calculate Polygon Points ────────────────────────────────────────

export function calculatePolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  star: boolean = false,
  innerRadiusRatio: number = 0.5,
): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2; // Start from top

  if (star) {
    // Star shape: alternate between outer and inner radius
    for (let i = 0; i < sides * 2; i++) {
      const angle = startAngle + (i * angleStep) / 2;
      const r = i % 2 === 0 ? radius : radius * innerRadiusRatio;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
  } else {
    // Regular polygon
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
  }

  return points.join(' ');
}

// ─── Helper: Calculate Triangle Points ───────────────────────────────────────

export function calculateTrianglePoints(
  width: number,
  height: number,
  direction: 'up' | 'down' | 'left' | 'right',
): string {
  switch (direction) {
    case 'up':
      return `${width / 2},0 ${width},${height} 0,${height}`;
    case 'down':
      return `0,0 ${width},0 ${width / 2},${height}`;
    case 'left':
      return `${width},0 ${width},${height} 0,${height / 2}`;
    case 'right':
      return `0,0 ${width},${height / 2} 0,${height}`;
  }
}

// ─── Helper: Calculate Diamond Points ────────────────────────────────────────

export function calculateDiamondPoints(width: number, height: number): string {
  return `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
}

// ─── Helper: Build Arrow Path ────────────────────────────────────────────────

export function buildArrowPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  headWidth: number,
  headLength: number,
  doubleHeaded: boolean,
): string {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return '';

  // Unit vector
  const ux = dx / length;
  const uy = dy / length;

  // Perpendicular vector
  const px = -uy;
  const py = ux;

  // End arrow points
  const arrowTipX = endX;
  const arrowTipY = endY;
  const arrowBase1X = endX - headLength * ux + (headWidth / 2) * px;
  const arrowBase1Y = endY - headLength * uy + (headWidth / 2) * py;
  const arrowBase2X = endX - headLength * ux - (headWidth / 2) * px;
  const arrowBase2Y = endY - headLength * uy - (headWidth / 2) * py;

  let path = `M ${startX} ${startY} L ${endX - headLength * ux} ${endY - headLength * uy}`;
  path += ` M ${arrowBase1X} ${arrowBase1Y} L ${arrowTipX} ${arrowTipY} L ${arrowBase2X} ${arrowBase2Y}`;

  if (doubleHeaded) {
    const startArrowTipX = startX;
    const startArrowTipY = startY;
    const startArrowBase1X = startX + headLength * ux + (headWidth / 2) * px;
    const startArrowBase1Y = startY + headLength * uy + (headWidth / 2) * py;
    const startArrowBase2X = startX + headLength * ux - (headWidth / 2) * px;
    const startArrowBase2Y = startY + headLength * uy - (headWidth / 2) * py;

    path = `M ${startX + headLength * ux} ${startY + headLength * uy} L ${endX - headLength * ux} ${endY - headLength * uy}`;
    path += ` M ${startArrowBase1X} ${startArrowBase1Y} L ${startArrowTipX} ${startArrowTipY} L ${startArrowBase2X} ${startArrowBase2Y}`;
    path += ` M ${arrowBase1X} ${arrowBase1Y} L ${arrowTipX} ${arrowTipY} L ${arrowBase2X} ${arrowBase2Y}`;
  }

  return path;
}
