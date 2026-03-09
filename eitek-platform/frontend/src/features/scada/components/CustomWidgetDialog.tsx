/**
 * @deprecated V1 SCADA — This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React, { useState, useRef } from 'react';
import type { CustomWidgetDefinition, Size } from '../types';

interface CustomWidgetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (definition: Omit<CustomWidgetDefinition, 'id' | 'createdTime' | 'createdBy'>) => void;
  editingWidget?: CustomWidgetDefinition | null;
}

const CATEGORIES = [
  'Industrial', 'HVAC', 'Electrical', 'Plumbing', 'Sensors',
  'Indicators', 'Controls', 'Displays', 'Custom',
];

const PROPERTY_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'color', label: 'Color' },
  { value: 'select', label: 'Select' },
  { value: 'json', label: 'JSON' },
] as const;

type PropSchemaType = typeof PROPERTY_TYPES[number]['value'];

interface PropertySchema {
  key: string;
  label: string;
  type: PropSchemaType;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const selectCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white';
const btnCls = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors';

export const CustomWidgetDialog: React.FC<CustomWidgetDialogProps> = ({ open, onClose, onSave, editingWidget }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'svg' | 'properties'>('basic');

  // Form state
  const [name, setName] = useState(editingWidget?.name || '');
  const [description, setDescription] = useState(editingWidget?.description || '');
  const [category, setCategory] = useState(editingWidget?.category || 'Custom');
  const [icon, setIcon] = useState(editingWidget?.icon || '🧩');
  const [svgContent, setSvgContent] = useState(editingWidget?.svgContent || '');
  const [defaultSize, setDefaultSize] = useState<Size>(editingWidget?.defaultSize || { width: 100, height: 100 });
  const [propertySchema, setPropertySchema] = useState<PropertySchema[]>(editingWidget?.propertySchema || []);
  const [dataBindingSupport, setDataBindingSupport] = useState(editingWidget?.dataBindingSupport ?? true);
  const [rpcSupport, setRpcSupport] = useState(editingWidget?.rpcSupport ?? true);

  if (!open) return null;

  const handleSvgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) setSvgContent(content);
    };
    reader.readAsText(file);
  };

  const addProperty = () => {
    setPropertySchema([...propertySchema, {
      key: `prop_${propertySchema.length + 1}`,
      label: `Property ${propertySchema.length + 1}`,
      type: 'string',
    }]);
  };

  const updateProperty = (index: number, updates: Partial<PropertySchema>) => {
    setPropertySchema(propertySchema.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const removeProperty = (index: number) => {
    setPropertySchema(propertySchema.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const defProps: Record<string, any> = {};
    for (const prop of propertySchema) {
      if (prop.defaultValue !== undefined) {
        defProps[prop.key] = prop.defaultValue;
      }
    }

    onSave({
      name: name.trim(),
      description: description.trim() || '',
      category,
      icon,
      svgContent: svgContent || '',
      defaultSize,
      defaultProperties: defProps,
      defaultStyle: {},
      propertySchema,
      dataBindingSupport,
      rpcSupport,
    });
    onClose();
  };

  const TABS = [
    { id: 'basic' as const, label: 'Basic Info', icon: '📋' },
    { id: 'svg' as const, label: 'SVG / Visual', icon: '🎨' },
    { id: 'properties' as const, label: 'Properties', icon: '⚙️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingWidget ? 'Edit Custom Widget' : 'Create Custom Widget'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Define a reusable custom widget component</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Custom Flowmeter" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className={inputCls + ' resize-none'} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the widget" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                  <input className={inputCls} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🧩" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Width</label>
                  <input type="number" className={inputCls} value={defaultSize.width} min={20} max={2000} onChange={(e) => setDefaultSize({ ...defaultSize, width: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Height</label>
                  <input type="number" className={inputCls} value={defaultSize.height} min={20} max={2000} onChange={(e) => setDefaultSize({ ...defaultSize, height: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={dataBindingSupport} onChange={(e) => setDataBindingSupport(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Data Binding Support
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={rpcSupport} onChange={(e) => setRpcSupport(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  RPC Support
                </label>
              </div>
            </div>
          )}

          {activeTab === 'svg' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SVG Content</label>
                <p className="text-xs text-gray-500 mb-2">Upload an SVG file or paste SVG code below. The SVG will be rendered as the widget visual.</p>
                <div className="flex gap-2 mb-2">
                  <input ref={fileInputRef} type="file" accept=".svg" onChange={handleSvgFile} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className={`${btnCls} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
                    📁 Upload SVG
                  </button>
                  {svgContent && (
                    <button onClick={() => setSvgContent('')} className={`${btnCls} bg-red-50 text-red-700 hover:bg-red-100`}>
                      🗑️ Clear
                    </button>
                  )}
                </div>
                <textarea
                  className={inputCls + ' font-mono text-xs resize-none'}
                  rows={10}
                  value={svgContent}
                  onChange={(e) => setSvgContent(e.target.value)}
                  placeholder='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">&#10;  <rect width="100" height="100" fill="#3B82F6" rx="10" />&#10;</svg>'
                />
              </div>
              {/* SVG Preview */}
              {svgContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center" style={{ minHeight: 120 }}>
                    <div
                      style={{ width: Math.min(defaultSize.width, 200), height: Math.min(defaultSize.height, 200) }}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Custom Properties</h3>
                  <p className="text-xs text-gray-500">Define configurable properties for this widget</p>
                </div>
                <button onClick={addProperty} className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700`}>
                  + Add Property
                </button>
              </div>

              {propertySchema.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No custom properties defined</p>
                  <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add Property&rdquo; to define widget-specific settings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {propertySchema.map((prop, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">#{idx + 1}</span>
                        <button onClick={() => removeProperty(idx)} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Key</label>
                          <input className={inputCls + ' !py-1.5 !text-xs'} value={prop.key} onChange={(e) => updateProperty(idx, { key: e.target.value })} placeholder="property_key" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Label</label>
                          <input className={inputCls + ' !py-1.5 !text-xs'} value={prop.label} onChange={(e) => updateProperty(idx, { label: e.target.value })} placeholder="Display Label" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Type</label>
                          <select className={selectCls + ' !py-1.5 !text-xs'} value={prop.type} onChange={(e) => updateProperty(idx, { type: e.target.value as PropSchemaType })}>
                            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-0.5">Default Value</label>
                          {prop.type === 'boolean' ? (
                            <select className={selectCls + ' !py-1.5 !text-xs'} value={String(prop.defaultValue ?? false)} onChange={(e) => updateProperty(idx, { defaultValue: e.target.value === 'true' })}>
                              <option value="false">False</option>
                              <option value="true">True</option>
                            </select>
                          ) : prop.type === 'color' ? (
                            <div className="flex items-center gap-2">
                              <input type="color" className="w-8 h-8 rounded border border-gray-300 cursor-pointer" value={prop.defaultValue || '#3B82F6'} onChange={(e) => updateProperty(idx, { defaultValue: e.target.value })} />
                              <span className="text-xs text-gray-500 font-mono">{prop.defaultValue || '#3B82F6'}</span>
                            </div>
                          ) : (
                            <input className={inputCls + ' !py-1.5 !text-xs'} type={prop.type === 'number' ? 'number' : 'text'} value={prop.defaultValue ?? ''} onChange={(e) => updateProperty(idx, { defaultValue: prop.type === 'number' ? Number(e.target.value) : e.target.value })} />
                          )}
                        </div>
                        {prop.type === 'number' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Min</label>
                              <input type="number" className={inputCls + ' !py-1.5 !text-xs'} value={prop.min ?? ''} onChange={(e) => updateProperty(idx, e.target.value ? { min: Number(e.target.value) } : {} as any)} />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-0.5">Max</label>
                              <input type="number" className={inputCls + ' !py-1.5 !text-xs'} value={prop.max ?? ''} onChange={(e) => updateProperty(idx, e.target.value ? { max: Number(e.target.value) } : {} as any)} />
                            </div>
                          </div>
                        )}
                        {prop.type === 'select' && (
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Options (one per line: value|label)</label>
                            <textarea
                              className={inputCls + ' !py-1.5 !text-xs resize-none'}
                              rows={3}
                              value={(prop.options || []).map(o => `${o.value}|${o.label}`).join('\n')}
                              onChange={(e) => {
                                const opts = e.target.value.split('\n').filter(Boolean).map(line => {
                                  const [value, label] = line.split('|');
                                  return { value: value?.trim() || '', label: label?.trim() || value?.trim() || '' };
                                });
                                updateProperty(idx, { options: opts });
                              }}
                              placeholder="value1|Label 1&#10;value2|Label 2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className={`${btnCls} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {editingWidget ? '💾 Update Widget' : '✨ Create Widget'}
          </button>
        </div>
      </div>
    </div>
  );
};
