/**
 * @deprecated V1 SCADA — This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { imageLibraryService, ImageCategoryItem, ImageItem } from '../services/imageLibraryService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/* ────── Reusable tiny styles ────── */
const btnSm = 'text-xs px-2 py-1 rounded border transition-colors';
const btnPrimary = `${btnSm} bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100`;
const btnGhost = 'p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors';
const inputCls = 'w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400';

/* ════════════════════════════════════════════════════════════════════════════ */
/*  CategoryTreeNode – recursive folder tree                                   */
/* ════════════════════════════════════════════════════════════════════════════ */

const CategoryTreeNode: React.FC<{
  cat: ImageCategoryItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}> = ({ cat, depth, selectedId, onSelect, onRefresh }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(cat.name);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const isSelected = selectedId === cat.id;

  const handleRename = async () => {
    if (!editName.trim()) return;
    try {
      await imageLibraryService.updateCategory(cat.id, { name: editName.trim() });
      onRefresh();
    } catch { /* noop */ }
    setEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete folder "${cat.name}"?`)) return;
    try {
      await imageLibraryService.deleteCategory(cat.id);
      onRefresh();
    } catch { /* noop */ }
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('New subfolder name:');
    if (!name?.trim()) return;
    try {
      await imageLibraryService.createCategory({ name: name.trim(), parentId: cat.id });
      setExpanded(true);
      onRefresh();
    } catch { /* noop */ }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 cursor-pointer py-1 px-1 rounded text-xs group ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => {
          onSelect(cat.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {/* Chevron */}
        <span className="w-3 text-center flex-shrink-0 text-[10px] text-gray-400">
          {hasChildren ? (expanded ? '▼' : '▶') : ''}
        </span>

        {/* Folder icon */}
        <span className="flex-shrink-0">{expanded && hasChildren ? '📂' : '📁'}</span>

        {/* Name */}
        {editing ? (
          <input
            className="flex-1 text-xs border rounded px-1"
            value={editName}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
          />
        ) : (
          <span className="flex-1 truncate" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            {cat.name}
          </span>
        )}

        {/* Count badge */}
        {(cat._count?.files ?? 0) > 0 && (
          <span className="text-[10px] text-gray-400 flex-shrink-0">{cat._count!.files}</span>
        )}

        {/* Actions (hover) */}
        <span className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          <button className={btnGhost} onClick={handleAddChild} title="Add subfolder">＋</button>
          <button className={btnGhost} onClick={handleDelete} title="Delete">🗑</button>
        </span>
      </div>

      {/* Children */}
      {expanded && cat.children?.map((child) => (
        <CategoryTreeNode
          key={child.id}
          cat={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════ */
/*  ImageLibraryPanel – main panel exported for the left sidebar               */
/* ════════════════════════════════════════════════════════════════════════════ */

interface ImageLibraryPanelProps {
  /** When set, clicking an image will call this with the full URL instead of
   *  the default "add to canvas" behaviour. Used by ImageUploadField picker. */
  onPickImage?: (url: string) => void;
  /** Compact mode hides some chrome when used inside a modal/popover. */
  compact?: boolean;
}

export const ImageLibraryPanel: React.FC<ImageLibraryPanelProps> = ({ onPickImage, compact }) => {
  const [categories, setCategories] = useState<ImageCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load categories on mount ──
  const loadCategories = async () => {
    try {
      const cats = await imageLibraryService.getCategories();
      setCategories(cats);
    } catch { /* noop */ }
  };

  useEffect(() => { loadCategories(); }, []);

  // ── Load images when category or search changes ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (searchTerm) params.search = searchTerm;
        const res = await imageLibraryService.getImages(params);
        if (!cancelled) setImages(res.data);
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [selectedCategory, searchTerm]);

  // ── Upload handler ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await imageLibraryService.uploadImage(files[i]!, selectedCategory ?? undefined);
      }
      // Reload images + categories (count changed)
      const params: any = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const res = await imageLibraryService.getImages(params);
      setImages(res.data);
      loadCategories();
    } catch { /* noop */ }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDeleteImage = async (img: ImageItem) => {
    if (!confirm(`Delete "${img.originalName}"?`)) return;
    try {
      await imageLibraryService.deleteImage(img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      loadCategories();
    } catch { /* noop */ }
  };

  const handleAddRootFolder = async () => {
    const name = prompt('New folder name:');
    if (!name?.trim()) return;
    try {
      await imageLibraryService.createCategory({ name: name.trim() });
      loadCategories();
    } catch { /* noop */ }
  };

  const imageUrl = (img: ImageItem) => {
    if (!img.url) return '';
    return img.url.startsWith('http') ? img.url : `${API_BASE}${img.url}`;
  };

  return (
    <div className={`h-full flex flex-col ${compact ? '' : 'bg-gray-50'}`}>
      {/* Header */}
      {!compact && (
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">🖼️ Image Library</h3>
          <input
            className={inputCls}
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Folder Tree + Content split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Folder tree */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Folders</span>
            <button className={btnGhost} onClick={handleAddRootFolder} title="New folder">＋</button>
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {/* "All Images" entry */}
            <div
              className={`flex items-center gap-1 cursor-pointer py-1 px-2 rounded text-xs ${
                selectedCategory === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              <span className="flex-shrink-0">📋</span>
              <span className="flex-1">All Images</span>
            </div>

            {categories.map((cat) => (
              <CategoryTreeNode
                key={cat.id}
                cat={cat}
                depth={0}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
                onRefresh={loadCategories}
              />
            ))}

            {categories.length === 0 && (
              <div className="text-center text-[11px] text-gray-400 py-2">No folders yet</div>
            )}
          </div>
        </div>

        {/* Upload bar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            className={`${btnPrimary} flex-1`}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '📤 Upload Images'}
          </button>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center text-xs text-gray-400 py-8">Loading…</div>
          ) : images.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-8">
              {searchTerm ? 'No images match your search' : 'No images in this folder'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => {
                const url = imageUrl(img);
                return (
                  <div
                    key={img.id}
                    className="group relative border border-gray-200 rounded overflow-hidden bg-white hover:border-blue-400 cursor-pointer transition-colors"
                    onClick={() => onPickImage?.(url)}
                    title={img.originalName}
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center">
                      <img
                        src={url}
                        alt={img.originalName}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="px-1 py-0.5 truncate text-[10px] text-gray-500">{img.originalName}</div>

                    {/* Delete overlay */}
                    <button
                      className="absolute top-0.5 right-0.5 bg-red-500/80 text-white rounded-full w-4 h-4 text-[9px] leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
