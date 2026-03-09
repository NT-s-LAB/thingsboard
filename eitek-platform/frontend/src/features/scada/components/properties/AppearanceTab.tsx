/**
 * @deprecated V1 SCADA - This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React from 'react';
import { Section, Field, inputCls, selectCls, numCls, checkCls, colorCls } from '../PropertyPanel';
import type { Widget, WidgetStyle } from '../../types';

interface AppearanceTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ widget, onUpdate }) => {
  const style: WidgetStyle = widget.style || {};

  const setStyle = (key: string, value: any) => {
    onUpdate({ style: { ...style, [key]: value } });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Fill */}
      <Section title="Fill">
        <Field label="Background Color" inline>
          <div className="flex items-center gap-2">
            <input type="color" className={colorCls} value={style.backgroundColor || '#FFFFFF'} onChange={(e) => setStyle('backgroundColor', e.target.value)} />
            <input className="w-20 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded font-mono" value={style.backgroundColor || '#FFFFFF'} onChange={(e) => setStyle('backgroundColor', e.target.value)} />
          </div>
        </Field>
        <Field label="Opacity" inline>
          <div className="flex items-center gap-2">
            <input type="range" className="flex-1 h-1.5 accent-blue-500" min={0} max={1} step={0.05} value={style.opacity ?? 1} onChange={(e) => setStyle('opacity', Number(e.target.value))} />
            <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round((style.opacity ?? 1) * 100)}%</span>
          </div>
        </Field>
      </Section>

      {/* Border */}
      <Section title="Border">
        <Field label="Color" inline>
          <div className="flex items-center gap-2">
            <input type="color" className={colorCls} value={style.borderColor || '#D1D5DB'} onChange={(e) => setStyle('borderColor', e.target.value)} />
            <input className="w-20 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded font-mono" value={style.borderColor || '#D1D5DB'} onChange={(e) => setStyle('borderColor', e.target.value)} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width">
            <div className="flex items-center gap-1">
              <input type="number" className={numCls + ' w-full'} value={style.borderWidth ?? 0} min={0} max={20} onChange={(e) => setStyle('borderWidth', Number(e.target.value))} />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </Field>
          <Field label="Radius">
            <div className="flex items-center gap-1">
              <input type="number" className={numCls + ' w-full'} value={style.borderRadius ?? 0} min={0} max={100} onChange={(e) => setStyle('borderRadius', Number(e.target.value))} />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </Field>
        </div>
        <Field label="Style">
          <select className={selectCls} value={style.borderStyle || 'solid'} onChange={(e) => setStyle('borderStyle', e.target.value)}>
            <option value="solid">Solid ─────</option>
            <option value="dashed">Dashed - - - -</option>
            <option value="dotted">Dotted · · · · ·</option>
            <option value="none">None</option>
          </select>
        </Field>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <Field label="Font Family">
          <select className={selectCls} value={style.fontFamily || 'Arial'} onChange={(e) => setStyle('fontFamily', e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="monospace">Monospace</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <div className="flex items-center gap-1">
              <input type="number" className={numCls + ' w-full'} value={style.fontSize ?? 14} min={6} max={120} onChange={(e) => setStyle('fontSize', Number(e.target.value))} />
              <span className="text-[10px] text-gray-400">px</span>
            </div>
          </Field>
          <Field label="Weight">
            <select className={selectCls} value={style.fontWeight || 'normal'} onChange={(e) => setStyle('fontWeight', e.target.value)}>
              <option value="100">Thin (100)</option>
              <option value="200">Extra Light</option>
              <option value="300">Light (300)</option>
              <option value="normal">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi Bold</option>
              <option value="bold">Bold (700)</option>
              <option value="800">Extra Bold</option>
              <option value="900">Black (900)</option>
            </select>
          </Field>
        </div>
        <Field label="Text Color" inline>
          <div className="flex items-center gap-2">
            <input type="color" className={colorCls} value={style.textColor || '#000000'} onChange={(e) => setStyle('textColor', e.target.value)} />
            <input className="w-20 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded font-mono" value={style.textColor || '#000000'} onChange={(e) => setStyle('textColor', e.target.value)} />
          </div>
        </Field>
        <Field label="Alignment">
          <div className="flex gap-1">
            {(['left', 'center', 'right', 'justify'] as const).map((align) => (
              <button
                key={align}
                className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                  style.textAlign === align ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setStyle('textAlign', align)}
              >
                {align === 'left' ? '⫷' : align === 'center' ? '☰' : align === 'right' ? '⫸' : '⊞'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Style">
          <div className="flex gap-1">
            <button
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${style.fontStyle === 'italic' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setStyle('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic')}
            >
              <em>I</em>
            </button>
            <button
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${style.textDecoration === 'underline' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setStyle('textDecoration', style.textDecoration === 'underline' ? 'none' : 'underline')}
            >
              <u>U</u>
            </button>
            <button
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${style.textDecoration === 'line-through' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setStyle('textDecoration', style.textDecoration === 'line-through' ? 'none' : 'line-through')}
            >
              <s>S</s>
            </button>
          </div>
        </Field>
      </Section>

      {/* Padding */}
      <Section title="Spacing">
        <Field label="Padding" inline>
          <div className="flex items-center gap-1">
            <input type="number" className={numCls + ' w-full'} value={style.padding ?? 0} min={0} max={100} onChange={(e) => setStyle('padding', Number(e.target.value))} />
            <span className="text-[10px] text-gray-400">px</span>
          </div>
        </Field>
      </Section>

      {/* Shadow */}
      <Section title="Shadow" defaultOpen={false}>
        <Field label="Box Shadow">
          <input className={inputCls} value={style.boxShadow || ''} placeholder="0 2px 8px rgba(0,0,0,0.15)" onChange={(e) => setStyle('boxShadow', e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'None', value: '' },
            { label: 'SM', value: '0 1px 2px rgba(0,0,0,0.05)' },
            { label: 'MD', value: '0 4px 6px rgba(0,0,0,0.1)' },
            { label: 'LG', value: '0 10px 15px rgba(0,0,0,0.1)' },
            { label: 'XL', value: '0 20px 25px rgba(0,0,0,0.15)' },
            { label: 'Inner', value: 'inset 0 2px 4px rgba(0,0,0,0.1)' },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setStyle('boxShadow', preset.value)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                style.boxShadow === preset.value ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Animation */}
      <Section title="Animation" defaultOpen={false}>
        <Field label="Type">
          <select className={selectCls} value={style.animation?.type || 'none'} onChange={(e) => setStyle('animation', { ...style.animation, type: e.target.value })}>
            <option value="none">None</option>
            <option value="blink">Blink</option>
            <option value="pulse">Pulse</option>
            <option value="rotate">Rotate</option>
            <option value="bounce">Bounce</option>
            <option value="fade">Fade</option>
            <option value="glow">Glow</option>
            <option value="slide">Slide</option>
          </select>
        </Field>
        {style.animation?.type && style.animation.type !== 'none' && (
          <>
            <Field label="Duration (ms)">
              <input type="number" className={numCls + ' w-full'} value={style.animation?.duration ?? 1000} min={100} step={100} onChange={(e) => setStyle('animation', { ...style.animation, duration: Number(e.target.value) })} />
            </Field>
            <label className="flex items-center gap-2">
              <input type="checkbox" className={checkCls} checked={style.animation?.infinite ?? true} onChange={(e) => setStyle('animation', { ...style.animation, infinite: e.target.checked })} />
              <span className="text-xs text-gray-700">Infinite loop</span>
            </label>
          </>
        )}
      </Section>
    </div>
  );
};
