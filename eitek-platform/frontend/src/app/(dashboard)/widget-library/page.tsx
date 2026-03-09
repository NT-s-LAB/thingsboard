'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Upload, Trash2, Edit2, FolderPlus,
  Grid, List, MoreVertical, Image, FileCode, Eye, Copy, X,
  ChevronRight, ChevronDown, Package, Download, Folder, FolderOpen,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/components/ui/Dialog';
import {
  widgetCategoryService,
  widgetService,
  fileUploadService,
  type WidgetCategoryItem,
  type WidgetItem,
} from '@/features/scada/services/widgetLibraryService';
import { V2_WIDGET_TEMPLATES } from '@/features/scada/services/v2WidgetTemplates';

// ─── Widget Type Options ─────────────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

const WidgetLibraryPage: React.FC = () => {
  // ── State ──
  const [categories, setCategories] = useState<WidgetCategoryItem[]>([]);
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(false);

  // Dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WidgetCategoryItem | null>(null);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewWidget, setPreviewWidget] = useState<WidgetItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'widget' | 'category'; id: string; name: string } | null>(null);

  // Tree state
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [parentCategoryIdForNew, setParentCategoryIdForNew] = useState<string | null>(null);

  // ── Load Categories ──
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const result = await widgetCategoryService.list({ pageSize: 100 });
      const data = Array.isArray(result) ? result : result.data ?? [];
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load Widgets ──
  const loadWidgets = useCallback(async () => {
    try {
      setWidgetLoading(true);
      const params: { pageSize: number; categoryId?: string; search?: string } = { pageSize: 100 };
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchQuery) params.search = searchQuery;
      const result = await widgetService.list(params);
      const data = Array.isArray(result) ? result : result.data ?? [];
      setWidgets(data);
    } catch (err) {
      console.error('Failed to load widgets:', err);
    } finally {
      setWidgetLoading(false);
    }
  }, [selectedCategoryId, searchQuery]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadWidgets(); }, [loadWidgets]);

  // ── Handlers ──
  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;
    try {
      if (showDeleteConfirm.type === 'category') {
        await widgetCategoryService.delete(showDeleteConfirm.id);
        if (selectedCategoryId === showDeleteConfirm.id) setSelectedCategoryId(null);
        loadCategories();
        loadWidgets();
      } else {
        await widgetService.delete(showDeleteConfirm.id);
        loadWidgets();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setShowDeleteConfirm(null);
  };

  const handleDuplicateWidget = async (widget: WidgetItem) => {
    try {
      await widgetService.create({
        name: `${widget.name} (Copy)`,
        description: widget.description,
        type: widget.type,
        config: widget.config,
        template: widget.template,
        preview: widget.preview,
        categoryId: widget.categoryId,
      });
      loadWidgets();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const [importingV2, setImportingV2] = useState(false);

  const handleImportV2Widgets = async () => {
    if (importingV2) return;
    setImportingV2(true);
    try {
      // Group templates by category
      const categoryMap = new Map<string, typeof V2_WIDGET_TEMPLATES>();
      for (const tpl of V2_WIDGET_TEMPLATES) {
        const list = categoryMap.get(tpl.category);
        if (list) {
          list.push(tpl);
        } else {
          categoryMap.set(tpl.category, [tpl]);
        }
      }

      // Create categories and collect their IDs
      const categoryIdMap = new Map<string, string>();
      const categoryEntries = Array.from(categoryMap.keys());
      for (const catName of categoryEntries) {
        try {
          const cat = await widgetCategoryService.create({
            name: `SCADA — ${catName}`,
            description: `Built-in ${catName.toLowerCase()} widgets from SCADA`,
            icon: catName === 'Control' ? '🎛️' : catName === 'Display' ? '📊' : catName === 'Process' ? '⚙️' : '💡',
          });
          categoryIdMap.set(catName, cat.id);
        } catch {
          // Category may already exist — try to find it
          const existing = await widgetCategoryService.list({ search: `SCADA — ${catName}`, pageSize: 1 });
          const data = Array.isArray(existing) ? existing : existing.data ?? [];
          if (data.length > 0) {
            categoryIdMap.set(catName, data[0].id);
          }
        }
      }

      // Create widgets
      let created = 0;
      for (const tpl of V2_WIDGET_TEMPLATES) {
        try {
          await widgetService.create({
            name: tpl.name,
            description: tpl.description,
            type: tpl.type,
            config: tpl.config,
            template: { svg: tpl.svg },
            preview: tpl.svg,
            categoryId: categoryIdMap.get(tpl.category),
          });
          created++;
        } catch {
          // Widget with same name may already exist — skip
        }
      }

      alert(`Imported ${created} widget(s) from SCADA successfully!`);
      loadCategories();
      loadWidgets();
    } catch (err) {
      console.error('Import V2 widgets failed:', err);
      alert('Failed to import V2 widgets. Check console for details.');
    } finally {
      setImportingV2(false);
    }
  };

  // ── Render ──
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Widget Library</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage & customize widgets for SCADA V1
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleImportV2Widgets} disabled={importingV2}>
              <Download className="w-4 h-4 mr-2" />
              {importingV2 ? 'Importing...' : 'Import V2 Widgets'}
            </Button>
            <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload SVG/PNG
            </Button>
            <Button variant="outline" onClick={() => { setEditingCategory(null); setShowCategoryDialog(true); }}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Group
            </Button>
            <Button onClick={() => { setEditingWidget(null); setShowWidgetDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Widget
            </Button>
          </div>
        </div>
      </div>

      {/* Search + View Mode */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{widgets.length} widgets</span>
            <div className="flex border border-gray-200 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Category Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Widget Groups</span>
          </div>
          {/* All widgets */}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 ${
              selectedCategoryId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>All Widgets</span>
            </div>
            <span className="text-xs text-gray-400">{widgets.length}</span>
          </button>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
          ) : (
            categories.map((cat) => (
              <CategoryTreeNode
                key={cat.id}
                category={cat}
                depth={0}
                selectedCategoryId={selectedCategoryId}
                expandedIds={expandedCategoryIds}
                onSelect={(id) => setSelectedCategoryId(id)}
                onToggleExpand={(id) => {
                  setExpandedCategoryIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) { next.delete(id); } else { next.add(id); }
                    return next;
                  });
                }}
                onEdit={(cat_) => { setEditingCategory(cat_); setShowCategoryDialog(true); }}
                onDelete={(cat_) => setShowDeleteConfirm({ type: 'category', id: cat_.id, name: cat_.name })}
                onAddSubfolder={(parentId) => {
                  setParentCategoryIdForNew(parentId);
                  setEditingCategory(null);
                  setShowCategoryDialog(true);
                }}
              />
            ))
          )}
        </div>

        {/* Right: Widget Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {widgetLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading widgets...</div>
          ) : widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No widgets found</p>
              <Button size="sm" onClick={() => { setEditingWidget(null); setShowWidgetDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Create Widget
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  onEdit={() => { setEditingWidget(widget); setShowWidgetDialog(true); }}
                  onDelete={() => setShowDeleteConfirm({ type: 'widget', id: widget.id, name: widget.name })}
                  onDuplicate={() => handleDuplicateWidget(widget)}
                  onPreview={() => { setPreviewWidget(widget); setShowPreviewDialog(true); }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget) => (
                <WidgetListRow
                  key={widget.id}
                  widget={widget}
                  onEdit={() => { setEditingWidget(widget); setShowWidgetDialog(true); }}
                  onDelete={() => setShowDeleteConfirm({ type: 'widget', id: widget.id, name: widget.name })}
                  onDuplicate={() => handleDuplicateWidget(widget)}
                  onPreview={() => { setPreviewWidget(widget); setShowPreviewDialog(true); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Dialogs ═══ */}

      {/* Category Dialog */}
      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={(v) => { setShowCategoryDialog(v); if (!v) setParentCategoryIdForNew(null); }}
        category={editingCategory}
        parentCategoryId={parentCategoryIdForNew}
        allCategories={categories}
        onSaved={() => { setShowCategoryDialog(false); setParentCategoryIdForNew(null); loadCategories(); }}
      />

      {/* Widget Dialog */}
      <WidgetDialog
        open={showWidgetDialog}
        onOpenChange={setShowWidgetDialog}
        widget={editingWidget}
        categories={categories}
        onSaved={() => { setShowWidgetDialog(false); loadWidgets(); }}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        categories={categories}
        onSaved={() => { setShowUploadDialog(false); loadWidgets(); }}
      />

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewWidget?.name ?? 'Widget Preview'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg border p-4">
            {previewWidget?.preview ? (
              previewWidget.preview.trim().startsWith('<') ? (
                <div
                  className="max-w-full max-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: previewWidget.preview }}
                />
              ) : (
                <img src={previewWidget.preview} alt={previewWidget.name} className="max-h-[300px] object-contain" />
              )
            ) : previewWidget?.template?.svg ? (
              <div
                className="max-w-full max-h-[300px]"
                dangerouslySetInnerHTML={{ __html: String(previewWidget.template.svg) }}
              />
            ) : (
              <div className="text-gray-400 text-sm">No preview available</div>
            )}
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>Type:</strong> {previewWidget?.type}</p>
            <p><strong>Version:</strong> {previewWidget?.version}</p>
            {previewWidget?.category && <p><strong>Group:</strong> {previewWidget.category.name}</p>}
            {previewWidget?.description && <p><strong>Description:</strong> {previewWidget.description}</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure to delete <strong>{showDeleteConfirm?.name}</strong>?
            {showDeleteConfirm?.type === 'category' && ' All widgets in this group will be unlinked.'}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Helper: Flatten category tree for <select> dropdowns ───

function flattenCategoryTree(
  cats: WidgetCategoryItem[],
  depth: number = 0,
  excludeId?: string,
): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  for (const c of cats) {
    if (excludeId && c.id === excludeId) continue;
    const prefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth) + '└ ' : '';
    result.push({ id: c.id, label: prefix + c.name });
    if (c.children && c.children.length > 0) {
      result.push(...flattenCategoryTree(c.children, depth + 1, excludeId));
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Widget Card (Grid View)
// ═══════════════════════════════════════════════════════════════════════════════

const WidgetCard: React.FC<{
  widget: WidgetItem;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}> = ({ widget, onEdit, onDelete, onDuplicate, onPreview }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group relative">
      {/* Preview */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center p-4 relative cursor-pointer" onClick={onPreview}>
        {widget.preview ? (
          widget.preview.trim().startsWith('<') ? (
            <div className="max-w-full max-h-full" dangerouslySetInnerHTML={{ __html: widget.preview }} />
          ) : (
            <img src={widget.preview} alt={widget.name} className="max-w-full max-h-full object-contain" />
          )
        ) : widget.template?.svg ? (
          <div className="max-w-full max-h-full" dangerouslySetInnerHTML={{ __html: String(widget.template.svg) }} />
        ) : (
          <Package className="w-8 h-8 text-gray-300" />
        )}

        {/* Type badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
          {widget.type}
        </span>

        {/* Menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border py-1 min-w-[140px]">
                <MenuBtn icon={<Eye className="w-3.5 h-3.5" />} label="Preview" onClick={() => { setShowMenu(false); onPreview(); }} />
                <MenuBtn icon={<Edit2 className="w-3.5 h-3.5" />} label="Edit" onClick={() => { setShowMenu(false); onEdit(); }} />
                <MenuBtn icon={<Copy className="w-3.5 h-3.5" />} label="Duplicate" onClick={() => { setShowMenu(false); onDuplicate(); }} />
                <hr className="my-1 border-gray-100" />
                <MenuBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={() => { setShowMenu(false); onDelete(); }} danger />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 truncate">{widget.name}</h4>
        {widget.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{widget.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {widget.category ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 truncate max-w-[80%]">{widget.category.name}</span>
          ) : (
            <span className="text-[10px] text-gray-400">Uncategorized</span>
          )}
          <span className="text-[10px] text-gray-400">v{widget.version}</span>
        </div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Widget List Row
// ═══════════════════════════════════════════════════════════════════════════════

const WidgetListRow: React.FC<{
  widget: WidgetItem;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}> = ({ widget, onEdit, onDelete, onDuplicate, onPreview }) => (
  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
    {/* Icon */}
    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 mr-3 cursor-pointer" onClick={onPreview}>
      {widget.preview ? (
        widget.preview.trim().startsWith('<') ? (
          <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: widget.preview }} />
        ) : (
          <img src={widget.preview} alt="" className="w-8 h-8 object-contain" />
        )
      ) : (
        <Package className="w-5 h-5 text-gray-300" />
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0 mr-4">
      <h4 className="text-sm font-medium text-gray-900 truncate">{widget.name}</h4>
      <p className="text-xs text-gray-500 truncate">{widget.description ?? widget.type}</p>
    </div>

    {/* Category */}
    <div className="flex-shrink-0 w-28 mr-4">
      {widget.category ? (
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{widget.category.name}</span>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </div>

    {/* Type */}
    <span className="flex-shrink-0 w-16 text-xs text-gray-500">{widget.type}</span>

    {/* Version */}
    <span className="flex-shrink-0 w-12 text-xs text-gray-400">v{widget.version}</span>

    {/* Actions */}
    <div className="flex items-center space-x-1 ml-2">
      <button onClick={onPreview} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
      <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
      <button onClick={onDuplicate} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Copy className="w-4 h-4" /></button>
      <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Context Menu Button
// ═══════════════════════════════════════════════════════════════════════════════

const MenuBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-2 px-3 py-1.5 text-xs hover:bg-gray-50 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Category Tree Node (Recursive)
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryTreeNode: React.FC<{
  category: WidgetCategoryItem;
  depth: number;
  selectedCategoryId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: WidgetCategoryItem) => void;
  onDelete: (cat: WidgetCategoryItem) => void;
  onAddSubfolder: (parentId: string) => void;
}> = ({ category, depth, selectedCategoryId, expandedIds, onSelect, onToggleExpand, onEdit, onDelete, onAddSubfolder }) => {
  const hasChildren = (category.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedCategoryId === category.id;
  const paddingLeft = 16 + depth * 16;

  return (
    <div>
      <div className="group relative">
        <button
          onClick={() => onSelect(category.id)}
          className={`w-full flex items-center justify-between py-2 pr-4 text-sm hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft }}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            {/* Expand/collapse toggle */}
            <span
              onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleExpand(category.id); }}
              className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded ${hasChildren ? 'cursor-pointer hover:bg-gray-200' : ''}`}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3" />
              )}
            </span>
            {/* Folder icon */}
            {hasChildren || depth > 0 ? (
              isExpanded ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" /> : <Folder className="w-3.5 h-3.5 flex-shrink-0 text-yellow-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{category.name}</span>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{category._count?.widgets ?? 0}</span>
        </button>
        {/* Hover actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-0.5 bg-white/80 rounded shadow-sm px-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onAddSubfolder(category.id); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600"
            title="Add subfolder"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title="Edit"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(category); }}
            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedCategoryId={selectedCategoryId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubfolder={onAddSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Category Dialog (Create / Edit)
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: WidgetCategoryItem | null;
  parentCategoryId: string | null;
  allCategories: WidgetCategoryItem[];
  onSaved: () => void;
}> = ({ open, onOpenChange, category, parentCategoryId, allCategories, onSaved }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState(0);
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  // Flatten categories tree for parent selector dropdown
  const flattenCategories = (cats: WidgetCategoryItem[], depth: number = 0): Array<{ id: string; name: string; depth: number }> => {
    const result: Array<{ id: string; name: string; depth: number }> = [];
    for (const c of cats) {
      // Exclude self and descendants when editing
      if (category && c.id === category.id) continue;
      result.push({ id: c.id, name: c.name, depth });
      if (c.children && c.children.length > 0) {
        result.push(...flattenCategories(c.children, depth + 1));
      }
    }
    return result;
  };
  const flatOptions = flattenCategories(allCategories);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setIcon(category?.icon ?? '');
      setOrder(category?.order ?? 0);
      setParentId(category?.parentId ?? parentCategoryId ?? '');
    }
  }, [open, category, parentCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      if (category) {
        await widgetCategoryService.update(category.id, {
          name: name.trim(),
          description: description || undefined,
          icon: icon || undefined,
          order,
          parentId: parentId || null,
        });
      } else {
        await widgetCategoryService.create({
          name: name.trim(),
          description: description || undefined,
          icon: icon || undefined,
          order,
          parentId: parentId || undefined,
        });
      }
      onSaved();
    } catch (err) {
      console.error('Save category failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Group' : parentCategoryId ? 'New Subfolder' : 'New Widget Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Industrial Controls" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Group</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Root (no parent) —</option>
              {flatOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {'  '.repeat(opt.depth) + (opt.depth > 0 ? '└ ' : '') + opt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (lucide name)</label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. Gauge" />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Widget Dialog (Create / Edit)
// ═══════════════════════════════════════════════════════════════════════════════

const WidgetDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  widget: WidgetItem | null;
  categories: WidgetCategoryItem[];
  onSaved: () => void;
}> = ({ open, onOpenChange, widget, categories, onSaved }) => {
  const [tab, setTab] = useState<'basic' | 'visual' | 'config'>('basic');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [categoryId, setCategoryId] = useState('');
  const [svgContent, setSvgContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [config, setConfig] = useState('{}');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTab('basic');
      setName(widget?.name ?? '');
      setDescription(widget?.description ?? '');
      setType(widget?.type ?? 'CUSTOM');
      setCategoryId(widget?.categoryId ?? '');
      setSvgContent(typeof widget?.template?.svg === 'string' ? widget.template.svg : '');
      setPreviewUrl(widget?.preview ?? '');
      setConfig(widget?.config ? JSON.stringify(widget.config, null, 2) : '{}');
    }
  }, [open, widget]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const isPng = file.type === 'image/png';

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setSvgContent(text);
        setPreviewUrl('');
      };
      reader.readAsText(file);
    } else if (isPng) {
      // Upload PNG to server
      fileUploadService.upload(file).then((result) => {
        const url = result.url.startsWith('http') ? result.url : `${window.location.origin}${result.url}`;
        setPreviewUrl(url);
        setSvgContent('');
      }).catch((err) => console.error('Upload failed:', err));
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      let parsedConfig: Record<string, unknown>;
      try { parsedConfig = JSON.parse(config); } catch { parsedConfig = {}; }

      const template: Record<string, unknown> = {};
      if (svgContent) template.svg = svgContent;

      const payload = {
        name: name.trim(),
        description: description || undefined,
        type,
        config: parsedConfig,
        template,
        preview: previewUrl || (svgContent ? svgContent : undefined),
        categoryId: categoryId || undefined,
      };

      if (widget) {
        await widgetService.update(widget.id, payload);
      } else {
        await widgetService.create(payload);
      }
      onSaved();
    } catch (err) {
      console.error('Save widget failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'basic' as const, label: 'Basic Info' },
    { key: 'visual' as const, label: 'SVG / Visual' },
    { key: 'config' as const, label: 'Config' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit Widget' : 'New Custom Widget'}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mx-6 px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* BASIC TAB */}
          {tab === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Widget name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {WIDGET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">No group</option>
                    {flattenCategoryTree(categories).map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* VISUAL TAB */}
          {tab === 'visual' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload SVG or PNG</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,.png,image/svg+xml,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center space-x-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Choose File
                  </Button>
                  <span className="text-xs text-gray-500">
                    {svgContent ? 'SVG loaded' : previewUrl ? 'PNG uploaded' : 'No file selected'}
                  </span>
                </div>
              </div>

              {/* SVG Editor */}
              {(!previewUrl || svgContent) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SVG Content</label>
                  <textarea
                    value={svgContent}
                    onChange={(e) => setSvgContent(e.target.value)}
                    placeholder="<svg>...</svg>"
                    rows={6}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center min-h-[120px] p-4">
                  {svgContent ? (
                    <div className="max-w-full max-h-[160px]" dangerouslySetInnerHTML={{ __html: svgContent }} />
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[160px] object-contain" />
                  ) : (
                    <span className="text-sm text-gray-400">Upload an SVG or PNG to preview</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CONFIG TAB */}
          {tab === 'config' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
              <textarea
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder='{ "min": 0, "max": 100, "unit": "°C" }'
              />
              <p className="text-xs text-gray-400 mt-1">
                Define widget-specific configuration. This JSON will be available as widget config in SCADA V1.
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : widget ? 'Update Widget' : 'Create Widget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Upload Dialog (Quick upload SVG/PNG → create widget)
// ═══════════════════════════════════════════════════════════════════════════════

const UploadDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: WidgetCategoryItem[];
  onSaved: () => void;
}> = ({ open, onOpenChange, categories, onSaved }) => {
  const [files, setFiles] = useState<{ file: File; name: string; preview: string; isSvg: boolean }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setFiles([]); setCategoryId(''); }
  }, [open]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    Array.from(selected).forEach((file) => {
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
      const nameWithoutExt = file.name.replace(/\.(svg|png)$/i, '');

      if (isSvg) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((prev) => [...prev, { file, name: nameWithoutExt, preview: reader.result as string, isSvg: true }]);
        };
        reader.readAsText(file);
      } else {
        const url = URL.createObjectURL(file);
        setFiles((prev) => [...prev, { file, name: nameWithoutExt, preview: url, isSvg: false }]);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;
    try {
      setSaving(true);

      for (const item of files) {
        let preview: string | undefined;
        const template: Record<string, unknown> = {};

        if (item.isSvg) {
          template.svg = item.preview;
          preview = item.preview;
        } else {
          // Upload PNG
          const result = await fileUploadService.upload(item.file);
          preview = result.url;
        }

        await widgetService.create({
          name: item.name,
          type: 'CUSTOM',
          config: {},
          template,
          preview,
          categoryId: categoryId || undefined,
        });
      }

      onSaved();
    } catch (err) {
      console.error('Batch upload failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Widgets (SVG / PNG)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to select SVG or PNG files</p>
            <p className="text-xs text-gray-400 mt-1">Multiple files supported</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,image/svg+xml,image/png"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to group</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No group</option>
              {flattenCategoryTree(categories).map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {files.map((item, idx) => (
                <div key={idx} className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                    {item.isSvg ? (
                      <FileCode className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Image className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.name}
                      onChange={(e) => setFiles((prev) => prev.map((f, i) => i === idx ? { ...f, name: e.target.value } : f))}
                      className="h-7 text-sm"
                    />
                  </div>
                  <span className="text-xs text-gray-400 mx-2 flex-shrink-0">
                    {item.isSvg ? 'SVG' : 'PNG'}
                  </span>
                  <button onClick={() => removeFile(idx)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUploadAll} disabled={saving || files.length === 0}>
            {saving ? 'Uploading...' : `Upload ${files.length} Widget${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetLibraryPage;
