'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Upload, Trash2, Edit2, FolderPlus,
  Grid, List, ChevronRight, ChevronDown, Folder, FolderOpen, ImageIcon, X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import {
  imageLibraryService,
  type ImageCategoryItem,
  type ImageItem,
} from '@/features/scada/services/imageLibraryService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ────────────────────────────────────────────────────────────────────────────
//  Category Tree Node (recursive)
// ────────────────────────────────────────────────────────────────────────────

const CategoryTreeNode: React.FC<{
  cat: ImageCategoryItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
  onEdit: (cat: ImageCategoryItem) => void;
}> = ({ cat, depth, selectedId, onSelect, onRefresh, onEdit }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const isSelected = selectedId === cat.id;
  const count = cat._count?.files ?? 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete folder "${cat.name}" and unlink all images in it?`)) return;
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
        className={`group flex items-center gap-2 cursor-pointer py-2 px-3 rounded-lg text-sm transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: 12 + depth * 20 }}
        onClick={() => {
          onSelect(cat.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {/* Chevron */}
        <span className="w-4 flex-shrink-0">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : null}
        </span>

        {/* Folder icon */}
        {expanded && hasChildren ? (
          <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        )}

        {/* Name + count */}
        <span className="flex-1 truncate">{cat.name}</span>
        {count > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{count}</span>
        )}

        {/* Hover actions */}
        <span className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button
            className="p-0.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
            onClick={handleAddChild}
            title="Add subfolder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  Main Page Component
// ════════════════════════════════════════════════════════════════════════════

const ImageLibraryPage: React.FC = () => {
  const [categories, setCategories] = useState<ImageCategoryItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Category edit dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ImageCategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Preview
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load categories ──
  const loadCategories = async () => {
    try {
      const cats = await imageLibraryService.getCategories();
      setCategories(cats);
    } catch { /* noop */ }
  };

  useEffect(() => { loadCategories(); }, []);

  // ── Load images ──
  const loadImages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchQuery) params.search = searchQuery;
      const res = await imageLibraryService.getImages(params);
      setImages(res.data);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { loadImages(); }, [selectedCategoryId, searchQuery]);

  // ── Upload handler ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await imageLibraryService.uploadImage(files[i]!, selectedCategoryId ?? undefined);
      }
      await loadImages();
      await loadCategories();
    } catch { /* noop */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Delete image ──
  const handleDeleteImage = async (img: ImageItem) => {
    if (!confirm(`Delete image "${img.originalName}"?`)) return;
    try {
      await imageLibraryService.deleteImage(img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      await loadCategories();
    } catch { /* noop */ }
  };

  // ── Category CRUD ──
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (cat: ImageCategoryItem) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      if (editingCategory) {
        await imageLibraryService.updateCategory(editingCategory.id, categoryForm);
      } else {
        await imageLibraryService.createCategory({
          name: categoryForm.name.trim(),
          ...(categoryForm.description ? { description: categoryForm.description } : {}),
          ...(selectedCategoryId ? { parentId: selectedCategoryId } : {}),
        });
      }
      await loadCategories();
      setShowCategoryDialog(false);
    } catch { /* noop */ }
  };

  const imageUrl = (img: ImageItem) => {
    if (!img.url) return '';
    return img.url.startsWith('http') ? img.url : `${API_BASE}${img.url}`;
  };

  const selectedCategoryName = (() => {
    const find = (cats: ImageCategoryItem[]): string | null => {
      for (const c of cats) {
        if (c.id === selectedCategoryId) return c.name;
        if (c.children?.length) {
          const found = find(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    return selectedCategoryId ? (find(categories) ?? 'Selected Folder') : 'All Images';
  })();

  return (
    <div className="h-full flex">
      {/* ── Left Sidebar: Category Tree ── */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Folders</h2>
            <Button variant="outline" size="sm" onClick={handleAddCategory}>
              <FolderPlus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* All Images */}
          <div
            className={`flex items-center gap-2 cursor-pointer py-2 px-4 text-sm transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCategoryId(null)}
          >
            <ImageIcon className="w-4 h-4" />
            <span>All Images</span>
          </div>

          {categories.map((cat) => (
            <CategoryTreeNode
              key={cat.id}
              cat={cat}
              depth={0}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onRefresh={loadCategories}
              onEdit={handleEditCategory}
            />
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">
              Image Library
              <span className="text-sm font-normal text-gray-500 ml-2">— {selectedCategoryName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center border border-gray-200 rounded-md">
              <button
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>

        {/* Image Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Loading images…</div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No images found</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Upload images to get started'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((img) => {
                const url = imageUrl(img);
                return (
                  <Card key={img.id} className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div
                      className="aspect-square bg-gray-100 flex items-center justify-center relative"
                      onClick={() => setPreviewImage(img)}
                    >
                      <img
                        src={url}
                        alt={img.originalName}
                        className="max-w-full max-h-full object-contain p-2"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-end p-1">
                        <button
                          className="bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-700 truncate" title={img.originalName}>
                        {img.originalName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(img.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {images.map((img) => {
                const url = imageUrl(img);
                return (
                  <div
                    key={img.id}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer group"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <img src={url} alt={img.originalName} className="max-w-full max-h-full object-contain" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{img.originalName}</p>
                      <p className="text-xs text-gray-400">{img.mimetype} · {(img.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Dialog ── */}
      {showCategoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Folder' : 'New Folder'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Folder name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCategory} disabled={!categoryForm.name.trim()}>
                {editingCategory ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{previewImage.originalName}</h3>
                <p className="text-xs text-gray-400">
                  {previewImage.mimetype} · {(previewImage.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')]">
              <img
                src={imageUrl(previewImage)}
                alt={previewImage.originalName}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageLibraryPage;
