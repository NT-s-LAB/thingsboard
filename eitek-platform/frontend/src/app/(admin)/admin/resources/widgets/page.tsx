'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, Edit2, FolderPlus,
  Grid, List, ChevronRight, ChevronDown, Folder, FolderOpen, Puzzle, X,
  Shield, Building2, RefreshCw, Eye, Copy,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import {
  widgetCategoryService,
  widgetService,
  type WidgetCategoryItem,
  type WidgetItem,
} from '@/features/scada/services/widgetLibraryService';

// ────────────────────────────────────────────────────────────────────────────
//  Widget Type Options
// ────────────────────────────────────────────────────────────────────────────

const WIDGET_TYPES = [
  { value: 'GAUGE', label: 'Gauge' },
  { value: 'CHART', label: 'Chart' },
  { value: 'TABLE', label: 'Table' },
  { value: 'BUTTON', label: 'Button' },
  { value: 'INPUT', label: 'Input' },
  { value: 'DISPLAY', label: 'Display' },
  { value: 'ALARM', label: 'Alarm' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'MAP', label: 'Map' },
  { value: 'CUSTOM', label: 'Custom' },
];

// ────────────────────────────────────────────────────────────────────────────
//  Category Tree Node (recursive)
// ────────────────────────────────────────────────────────────────────────────

const CategoryTreeNode: React.FC<{
  cat: WidgetCategoryItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
  onEdit: (cat: WidgetCategoryItem) => void;
}> = ({ cat, depth, selectedId, onSelect, onRefresh, onEdit }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = (cat.children?.length ?? 0) > 0;
  const isSelected = selectedId === cat.id;
  const count = cat._count?.widgets ?? 0;
  const isSystem = cat.isSystem || !cat.tenantId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSystem) {
      if (!confirm(`Delete system category "${cat.name}"? This will affect ALL tenants.`)) return;
    } else {
      if (!confirm(`Delete category "${cat.name}"?`)) return;
    }
    try {
      await widgetCategoryService.delete(cat.id);
      onRefresh();
    } catch {
      alert('Failed to delete category. You may not have permission.');
    }
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('New subcategory name:');
    if (!name?.trim()) return;
    try {
      await widgetCategoryService.create({ name: name.trim(), parentId: cat.id });
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
          <FolderOpen className="w-4 h-4 text-purple-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-purple-500 flex-shrink-0" />
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
            title="Add subcategory"
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

const AdminWidgetLibraryPage: React.FC = () => {
  const [categories, setCategories] = useState<WidgetCategoryItem[]>([]);
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [, setLoading] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(false);

  // Category edit dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WidgetCategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Widget create/edit dialog
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null);
  const [widgetForm, setWidgetForm] = useState({
    name: '',
    description: '',
    type: 'CUSTOM',
    config: '{}',
    template: '{}',
  });

  // Preview
  const [previewWidget, setPreviewWidget] = useState<WidgetItem | null>(null);

  // ── Load categories ──
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const result = await widgetCategoryService.list({ pageSize: 100 });
      const data = Array.isArray(result) ? result : result.data ?? [];
      setCategories(data);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Load widgets ──
  const loadWidgets = useCallback(async () => {
    setWidgetLoading(true);
    try {
      const params: { pageSize: number; categoryId?: string; search?: string } = { pageSize: 100 };
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchQuery) params.search = searchQuery;
      const result = await widgetService.list(params);
      const data = Array.isArray(result) ? result : result.data ?? [];
      setWidgets(data);
    } catch { /* noop */ }
    setWidgetLoading(false);
  }, [selectedCategoryId, searchQuery]);

  useEffect(() => { loadWidgets(); }, [loadWidgets]);

  // ── Delete widget ──
  const handleDeleteWidget = async (widget: WidgetItem) => {
    const isSystem = widget.isSystem || !widget.tenantId;
    if (isSystem) {
      if (!confirm(`Delete system widget "${widget.name}"? This will affect ALL tenants.`)) return;
    } else {
      if (!confirm(`Delete widget "${widget.name}"?`)) return;
    }
    try {
      await widgetService.delete(widget.id);
      setWidgets((prev) => prev.filter((w) => w.id !== widget.id));
    } catch {
      alert('Failed to delete widget. You may not have permission.');
    }
  };

  // ── Duplicate widget ──
  const handleDuplicateWidget = async (widget: WidgetItem) => {
    try {
      await widgetService.create({
        name: `${widget.name} (Copy)`,
        description: widget.description,
        type: widget.type,
        config: widget.config,
        template: widget.template,
        preview: widget.preview,
        categoryId: widget.categoryId ?? undefined,
      });
      loadWidgets();
    } catch {
      alert('Failed to duplicate widget');
    }
  };

  // ── Category CRUD ──
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (cat: WidgetCategoryItem) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      if (editingCategory) {
        await widgetCategoryService.update(editingCategory.id, categoryForm);
      } else {
        await widgetCategoryService.create({
          name: categoryForm.name.trim(),
          ...(categoryForm.description ? { description: categoryForm.description } : {}),
          ...(selectedCategoryId ? { parentId: selectedCategoryId } : {}),
        });
      }
      await loadCategories();
      setShowCategoryDialog(false);
    } catch { /* noop */ }
  };

  // ── Widget CRUD ──
  const handleAddWidget = () => {
    setEditingWidget(null);
    setWidgetForm({
      name: '',
      description: '',
      type: 'CUSTOM',
      config: '{}',
      template: '{}',
    });
    setShowWidgetDialog(true);
  };

  const handleEditWidget = (widget: WidgetItem) => {
    setEditingWidget(widget);
    setWidgetForm({
      name: widget.name,
      description: widget.description || '',
      type: widget.type,
      config: JSON.stringify(widget.config, null, 2),
      template: JSON.stringify(widget.template, null, 2),
    });
    setShowWidgetDialog(true);
  };

  const handleSaveWidget = async () => {
    if (!widgetForm.name.trim()) return;
    try {
      let config = {};
      let template = {};
      try {
        config = JSON.parse(widgetForm.config);
        template = JSON.parse(widgetForm.template);
      } catch {
        alert('Invalid JSON in config or template');
        return;
      }

      if (editingWidget) {
        await widgetService.update(editingWidget.id, {
          name: widgetForm.name.trim(),
          description: widgetForm.description || undefined,
          type: widgetForm.type,
          config,
          template,
        });
      } else {
        await widgetService.create({
          name: widgetForm.name.trim(),
          description: widgetForm.description || undefined,
          type: widgetForm.type,
          config,
          template,
          categoryId: selectedCategoryId ?? undefined,
        });
      }
      await loadWidgets();
      setShowWidgetDialog(false);
    } catch { /* noop */ }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      GAUGE: 'bg-blue-100 text-blue-700',
      CHART: 'bg-green-100 text-green-700',
      TABLE: 'bg-yellow-100 text-yellow-700',
      BUTTON: 'bg-purple-100 text-purple-700',
      INPUT: 'bg-pink-100 text-pink-700',
      DISPLAY: 'bg-cyan-100 text-cyan-700',
      ALARM: 'bg-red-100 text-red-700',
      IMAGE: 'bg-orange-100 text-orange-700',
      MAP: 'bg-teal-100 text-teal-700',
      CUSTOM: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || colors.CUSTOM;
  };

  return (
    <div className="flex h-full">
      {/* ─────────────── Left Sidebar: Category Tree ─────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              onClick={handleAddCategory}
              title="Add category"
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
          {/* All Widgets */}
          <div
            className={`flex items-center gap-2 cursor-pointer py-2 px-3 rounded-lg text-sm mx-2 transition-colors ${
              selectedCategoryId === null
                ? 'bg-red-50 text-red-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCategoryId(null)}
          >
            <span className="w-4" />
            <Puzzle className="w-4 h-4 text-gray-400" />
            <span>All Widgets</span>
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
                System Widget Library
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search widgets..."
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
                onClick={() => { loadCategories(); loadWidgets(); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Create Widget */}
              <Button onClick={handleAddWidget}>
                <Plus className="w-4 h-4 mr-2" />
                Create Widget
              </Button>
            </div>
          </div>
        </div>

        {/* Widget Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {widgetLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Puzzle className="w-12 h-12 mb-3 opacity-50" />
              <p>No widgets found</p>
              <p className="text-sm">Create a widget to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {widgets.map((widget) => {
                const isSystem = widget.isSystem || !widget.tenantId;
                return (
                  <Card
                    key={widget.id}
                    className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setPreviewWidget(widget)}
                  >
                    <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
                      {widget.preview ? (
                        <img
                          src={widget.preview}
                          alt={widget.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Puzzle className="w-16 h-16 text-gray-300" />
                      )}
                      {/* System/Tenant badge */}
                      {isSystem ? (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          System
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Tenant
                        </div>
                      )}
                      {/* Type badge */}
                      <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-xs rounded ${getTypeColor(widget.type)}`}>
                        {widget.type}
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewWidget(widget);
                          }}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWidget(widget);
                          }}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateWidget(widget);
                          }}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-white rounded-full hover:bg-red-100 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWidget(widget);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={widget.name}>
                        {widget.name}
                      </p>
                      {widget.description && (
                        <p className="text-xs text-gray-500 truncate">{widget.description}</p>
                      )}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {widgets.map((widget) => {
                    const isSystem = widget.isSystem || !widget.tenantId;
                    return (
                      <tr key={widget.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{widget.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(widget.type)}`}>
                            {widget.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 truncate max-w-xs block">
                            {widget.description || '-'}
                          </span>
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
                              onClick={() => setPreviewWidget(widget)}
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                              onClick={() => handleEditWidget(widget)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                              onClick={() => handleDuplicateWidget(widget)}
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-red-100 text-red-600"
                              onClick={() => handleDeleteWidget(widget)}
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

      {/* ─────────────── Widget Preview Modal ─────────────── */}
      {previewWidget && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewWidget(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
            onClick={() => setPreviewWidget(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <Card className="w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{previewWidget.name}</h2>
            {previewWidget.description && (
              <p className="text-gray-600 mb-4">{previewWidget.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                <span className={`px-2 py-0.5 rounded ${getTypeColor(previewWidget.type)}`}>
                  {previewWidget.type}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Owner:</span>{' '}
                {previewWidget.isSystem || !previewWidget.tenantId ? 'System' : 'Tenant'}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Config</h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(previewWidget.config, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Template</h3>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(previewWidget.template, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────── Category Dialog ─────────────── */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Category name"
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

      {/* ─────────────── Widget Dialog ─────────────── */}
      {showWidgetDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingWidget ? 'Edit Widget' : 'Create Widget'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    value={widgetForm.name}
                    onChange={(e) => setWidgetForm({ ...widgetForm, name: e.target.value })}
                    placeholder="Widget name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={widgetForm.type}
                    onChange={(e) => setWidgetForm({ ...widgetForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {WIDGET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={widgetForm.description}
                  onChange={(e) => setWidgetForm({ ...widgetForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Config (JSON)</label>
                <textarea
                  value={widgetForm.config}
                  onChange={(e) => setWidgetForm({ ...widgetForm, config: e.target.value })}
                  placeholder="{}"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template (JSON)</label>
                <textarea
                  value={widgetForm.template}
                  onChange={(e) => setWidgetForm({ ...widgetForm, template: e.target.value })}
                  placeholder="{}"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowWidgetDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWidget}>
                {editingWidget ? 'Save' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminWidgetLibraryPage;
