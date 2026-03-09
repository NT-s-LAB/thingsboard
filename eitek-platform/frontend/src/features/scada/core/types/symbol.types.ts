/**
 * SVG Symbol Library Types
 *
 * The symbol library manages user-uploaded SVG assets.
 * Each SVG can be used as:
 *   1) A widget symbol (placed inside a widget instance)
 *   2) A screen background
 */

export interface SvgAsset {
  id: string;
  /** Display name */
  name: string;
  /** Raw SVG markup */
  svgContent: string;
  /** Classification */
  category: SvgCategory;
  /** Searchable tags */
  tags: string[];
  /** Intrinsic viewBox dimensions */
  viewBox: { width: number; height: number };
  /** User-visible description */
  description?: string;
  /** Small base64-encoded PNG for palette thumbnails (generated server-side) */
  thumbnailUrl?: string;
  /** File size in bytes */
  fileSize: number;
  /** Version counter */
  version: number;
  /** Metadata */
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type SvgCategory =
  | 'pump'
  | 'valve'
  | 'tank'
  | 'motor'
  | 'sensor'
  | 'pipe'
  | 'gauge'
  | 'indicator'
  | 'switch'
  | 'building'
  | 'piping'
  | 'electrical'
  | 'hvac'
  | 'background'
  | 'custom';

/** Query params for listing SVG assets */
export interface SvgAssetQuery {
  search?: string;
  category?: SvgCategory;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Upload request payload */
export interface SvgAssetUpload {
  name: string;
  svgContent: string;
  category: SvgCategory;
  tags?: string[];
  description?: string;
}
