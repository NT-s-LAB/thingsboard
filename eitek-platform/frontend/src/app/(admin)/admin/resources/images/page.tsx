'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Upload, Trash2, Edit2, FolderPlus,
  Grid, List, ChevronRight, ChevronDown, Folder, FolderOpen, ImageIcon, X,
  Shield, Building2, RefreshCw, Download,
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
  const isSystem = cat.isSystem || !cat.tenantId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSystem) {
      if (!confirm(`Delete system folder "${cat.name}"? This will affect ALL tenants.`)) return;
    } else {
      if (!confirm(`Delete folder "${cat.name}" and unlink all images in it?`)) return;
    }
    try {
      await imageLibraryService.deleteCategory(cat.id);
      onRefresh();
    } catch {
      alert('Failed to delete category. You may not have permission.');
    }
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
            ? 'bg-red-50 text-red-700 font-medium'
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

        {/* Name + system badge + count */}
        <span className="flex-1 truncate flex items-center gap-1.5">
          {cat.name}
          {isSystem && (
            <span title="System category">
              <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />
            </span>
          )}
        </span>
        {count > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{count}</span>
        )}

        {/* Hover actions */}
        <span className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
            onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
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

const AdminImageLibraryPage: React.FC = () => {
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
  const loadCategories = useCallback(async () => {
    try {
      const cats = await imageLibraryService.getCategories();
      setCategories(cats);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Load images ──
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchQuery) params.search = searchQuery;
      const res = await imageLibraryService.getImages(params);
      setImages(res.data);
    } catch { /* noop */ }
    setLoading(false);
  }, [selectedCategoryId, searchQuery]);

  useEffect(() => { loadImages(); }, [loadImages]);

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
    const isSystem = img.isSystem || !img.tenantId;
    if (isSystem) {
      if (!confirm(`Delete system image "${img.originalName}"? This will affect ALL tenants.`)) return;
    } else {
      if (!confirm(`Delete image "${img.originalName}"?`)) return;
    }
    try {
      await imageLibraryService.deleteImage(img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      await loadCategories();
    } catch {
      alert('Failed to delete image. You may not have permission.');
    }
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
    return find(categories);
  })();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-full">
      {/* ─────────────── Left Sidebar: Category Tree ─────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Folders</h2>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              onClick={handleAddCategory}
              title="Add folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-500" />
            <span>= System (visible to all tenants)</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* All Images */}
          <div
            className={`flex items-center gap-2 cursor-pointer py-2 px-3 rounded-lg text-sm mx-2 transition-colors ${
              selectedCategoryId === null
                ? 'bg-red-50 text-red-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCategoryId(null)}
          >
            <span className="w-4" />
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <span>All Images</span>
          </div>

          {/* Category Tree */}
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

      {/* ─────────────── Main Content ─────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                System Image Library
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedCategoryName ?? 'All Images'} •{' '}
                {images.length} image{images.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className="pl-9 w-64"
                />
              </div>

              {/* View mode toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                onClick={() => { loadCategories(); loadImages(); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Upload */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </div>
        </div>

        {/* Image Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
              <p>No images found</p>
              <p className="text-sm">Upload images to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((img) => {
                const isSystem = img.isSystem || !img.tenantId;
                return (
                  <Card
                    key={img.id}
                    className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setPreviewImage(img)}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={imageUrl(img)}
                        alt={img.originalName}
                        className="w-full h-full object-contain"
                      />
                      {/* System badge */}
                      {isSystem && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          System
                        </div>
                      )}
                      {/* Tenant badge */}
                      {!isSystem && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Tenant
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(imageUrl(img), '_blank');
                          }}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-white rounded-full hover:bg-red-100 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(img);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={img.originalName}>
                        {img.originalName}
                      </p>
                      <p className="text-xs text-gray-400">{formatFileSize(img.size)}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {images.map((img) => {
                    const isSystem = img.isSystem || !img.tenantId;
                    return (
                      <tr key={img.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div
                            className="w-12 h-12 bg-gray-100 rounded overflow-hidden cursor-pointer"
                            onClick={() => setPreviewImage(img)}
                          >
                            <img
                              src={imageUrl(img)}
                              alt={img.originalName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{img.originalName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">{img.mimetype}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">{formatFileSize(img.size)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isSystem ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                              <Shield className="w-3 h-3" />
                              System
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              <Building2 className="w-3 h-3" />
                              Tenant
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                              onClick={() => window.open(imageUrl(img), '_blank')}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-red-100 text-red-600"
                              onClick={() => handleDeleteImage(img)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────── Image Preview Modal ─────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageUrl(previewImage)}
            alt={previewImage.originalName}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">{previewImage.originalName}</p>
            <p className="text-xs text-gray-300">
              {formatFileSize(previewImage.size)} • {previewImage.mimetype}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────── Category Dialog ─────────────── */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Folder' : 'Create Folder'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Folder name"
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
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? 'Save' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminImageLibraryPage;
