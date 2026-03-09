/**
 * @deprecated V1 SCADA - This file belongs to the legacy V1 engine (Konva-based).
 * Replaced by V2 engine in /engine/ and /core/. Scheduled for removal.
 */
'use client';

import React from 'react';
import { Section, Field, inputCls, selectCls, numCls, checkCls, colorCls } from '../PropertyPanel';
import { ImageUploadField } from './ImageUploadField';
import type { Widget, WidgetType } from '../../types';

interface GeneralTabProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ widget, onUpdate }) => {
  const props = widget.properties || {};

  const setProp = (key: string, value: any) => {
    onUpdate({ properties: { ...props, [key]: value } } as any);
  };

  const setTransform = (key: string, value: any) => {
    onUpdate({ transform: { ...widget.transform, [key]: value } } as any);
  };

  const setPosition = (axis: 'x' | 'y', value: number) => {
    onUpdate({
      transform: { ...widget.transform, position: { ...widget.transform.position, [axis]: value } },
    } as any);
  };

  const setSize = (dim: 'width' | 'height', value: number) => {
    onUpdate({
      transform: { ...widget.transform, size: { ...widget.transform.size, [dim]: value } },
    } as any);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Widget Identity */}
      <Section title="Widget Info">
        <Field label="Name">
          <input
            className={inputCls}
            value={widget.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <input
            className={inputCls}
            value={widget.description || ''}
            placeholder="Optional description"
            onChange={(e) => { const v = e.target.value; onUpdate(v ? { description: v } : { description: '' }); }}
          />
        </Field>
      </Section>

      {/* Transform */}
      <Section title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <input type="number" className={numCls + ' w-full'} value={Math.round(widget.transform.position.x)} onChange={(e) => setPosition('x', Number(e.target.value))} />
          </Field>
          <Field label="Y">
            <input type="number" className={numCls + ' w-full'} value={Math.round(widget.transform.position.y)} onChange={(e) => setPosition('y', Number(e.target.value))} />
          </Field>
          <Field label="Width">
            <input type="number" className={numCls + ' w-full'} value={Math.round(widget.transform.size.width)} min={10} onChange={(e) => setSize('width', Math.max(10, Number(e.target.value)))} />
          </Field>
          <Field label="Height">
            <input type="number" className={numCls + ' w-full'} value={Math.round(widget.transform.size.height)} min={10} onChange={(e) => setSize('height', Math.max(10, Number(e.target.value)))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Rotation">
            <div className="flex items-center gap-1">
              <input type="number" className={numCls + ' w-full'} value={widget.transform.rotation || 0} onChange={(e) => setTransform('rotation', Number(e.target.value))} />
              <span className="text-[10px] text-gray-400">°</span>
            </div>
          </Field>
          <Field label="Z-Index">
            <input type="number" className={numCls + ' w-full'} value={widget.transform.zIndex || 0} onChange={(e) => setTransform('zIndex', Number(e.target.value))} />
          </Field>
        </div>
      </Section>

      {/* Visibility & Lock */}
      <Section title="State">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className={checkCls} checked={widget.visible} onChange={(e) => onUpdate({ visible: e.target.checked })} />
            <span className="text-xs text-gray-700">Visible</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className={checkCls} checked={widget.enabled} onChange={(e) => onUpdate({ enabled: e.target.checked })} />
            <span className="text-xs text-gray-700">Enabled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className={checkCls} checked={widget.locked} onChange={(e) => onUpdate({ locked: e.target.checked })} />
            <span className="text-xs text-gray-700">Locked</span>
          </label>
        </div>
      </Section>

      {/* Widget-Type Specific Properties */}
      <Section title="Widget Properties">
        <WidgetTypeProperties type={widget.type} properties={props} onChange={setProp} />
      </Section>
    </div>
  );
};

/* ────── Widget-type specific property editors ────── */

const WidgetTypeProperties: React.FC<{
  type: WidgetType;
  properties: Record<string, any>;
  onChange: (key: string, value: any) => void;
}> = ({ type, properties, onChange }) => {
  switch (type) {
    case 'button':
      return (
        <>
          <Field label="Text"><input className={inputCls} value={properties.text || ''} onChange={(e) => onChange('text', e.target.value)} /></Field>
          <Field label="Variant">
            <select className={selectCls} value={properties.variant || 'primary'} onChange={(e) => onChange('variant', e.target.value)}>
              <option value="primary">Primary</option><option value="secondary">Secondary</option>
              <option value="success">Success</option><option value="warning">Warning</option><option value="danger">Danger</option>
            </select>
          </Field>
          <Field label="Size">
            <select className={selectCls} value={properties.size || 'md'} onChange={(e) => onChange('size', e.target.value)}>
              <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
            </select>
          </Field>
          <Field label="Icon"><input className={inputCls} value={properties.icon || ''} placeholder="e.g. ⚡ or icon name" onChange={(e) => onChange('icon', e.target.value)} /></Field>
          <Field label="RPC Method"><input className={inputCls} value={properties.rpcMethod || ''} placeholder="e.g. setValue" onChange={(e) => onChange('rpcMethod', e.target.value)} /></Field>
        </>
      );

    case 'text':
      return (
        <>
          <Field label="Content"><textarea className={inputCls + ' min-h-[60px] resize-y'} value={properties.text || ''} onChange={(e) => onChange('text', e.target.value)} /></Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.wordWrap ?? true} onChange={(e) => onChange('wordWrap', e.target.checked)} /><span className="text-xs text-gray-700">Word Wrap</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.autoSize ?? false} onChange={(e) => onChange('autoSize', e.target.checked)} /><span className="text-xs text-gray-700">Auto Size</span></label>
          <Field label="Telemetry Pattern"><input className={inputCls} value={properties.telemetryPattern || ''} placeholder="${temperature}°C" onChange={(e) => onChange('telemetryPattern', e.target.value)} /></Field>
        </>
      );

    case 'gauge':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min"><input type="number" className={numCls + ' w-full'} value={properties.min ?? 0} onChange={(e) => onChange('min', Number(e.target.value))} /></Field>
            <Field label="Max"><input type="number" className={numCls + ' w-full'} value={properties.max ?? 100} onChange={(e) => onChange('max', Number(e.target.value))} /></Field>
          </div>
          <Field label="Unit"><input className={inputCls} value={properties.unit || ''} placeholder="°C, %, psi..." onChange={(e) => onChange('unit', e.target.value)} /></Field>
          <Field label="Gauge Type">
            <select className={selectCls} value={properties.gaugeType || 'circular'} onChange={(e) => onChange('gaugeType', e.target.value)}>
              <option value="circular">Circular</option><option value="linear">Linear</option><option value="donut">Donut</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showValue ?? true} onChange={(e) => onChange('showValue', e.target.checked)} /><span className="text-xs text-gray-700">Show Value</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showMinMax ?? true} onChange={(e) => onChange('showMinMax', e.target.checked)} /><span className="text-xs text-gray-700">Show Min/Max</span></label>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="temperature" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
        </>
      );

    case 'switch':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ON Label"><input className={inputCls} value={properties.onLabel || 'ON'} onChange={(e) => onChange('onLabel', e.target.value)} /></Field>
            <Field label="OFF Label"><input className={inputCls} value={properties.offLabel || 'OFF'} onChange={(e) => onChange('offLabel', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ON Color"><input type="color" className={colorCls} value={properties.onColor || '#22C55E'} onChange={(e) => onChange('onColor', e.target.value)} /></Field>
            <Field label="OFF Color"><input type="color" className={colorCls} value={properties.offColor || '#9CA3AF'} onChange={(e) => onChange('offColor', e.target.value)} /></Field>
          </div>
          <Section title="State Images (PNG)" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <ImageUploadField label="ON Image" value={properties.onImageUrl} onChange={(url) => onChange('onImageUrl', url)} />
              <ImageUploadField label="OFF Image" value={properties.offImageUrl} onChange={(url) => onChange('offImageUrl', url)} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">When images are set, they replace the default switch graphics.</p>
          </Section>
          <Field label="RPC Method"><input className={inputCls} value={properties.rpcMethod || ''} placeholder="setSwitch" onChange={(e) => onChange('rpcMethod', e.target.value)} /></Field>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="switchState" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
          <Field label="Attribute Key"><input className={inputCls} value={properties.attributeKey || ''} placeholder="switchConfig" onChange={(e) => onChange('attributeKey', e.target.value)} /></Field>
        </>
      );

    case 'slider':
      return (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Min"><input type="number" className={numCls + ' w-full'} value={properties.min ?? 0} onChange={(e) => onChange('min', Number(e.target.value))} /></Field>
            <Field label="Max"><input type="number" className={numCls + ' w-full'} value={properties.max ?? 100} onChange={(e) => onChange('max', Number(e.target.value))} /></Field>
            <Field label="Step"><input type="number" className={numCls + ' w-full'} value={properties.step ?? 1} min={0.01} step={0.01} onChange={(e) => onChange('step', Number(e.target.value))} /></Field>
          </div>
          <Field label="Unit"><input className={inputCls} value={properties.unit || ''} onChange={(e) => onChange('unit', e.target.value)} /></Field>
          <Field label="Orientation">
            <select className={selectCls} value={properties.orientation || 'horizontal'} onChange={(e) => onChange('orientation', e.target.value)}>
              <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showValue ?? true} onChange={(e) => onChange('showValue', e.target.checked)} /><span className="text-xs text-gray-700">Show Value</span></label>
          <Field label="RPC Method"><input className={inputCls} value={properties.rpcMethod || ''} placeholder="setLevel" onChange={(e) => onChange('rpcMethod', e.target.value)} /></Field>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="level" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
        </>
      );

    case 'led':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ON Color"><input type="color" className={colorCls} value={properties.onColor || '#22C55E'} onChange={(e) => onChange('onColor', e.target.value)} /></Field>
            <Field label="OFF Color"><input type="color" className={colorCls} value={properties.offColor || '#6B7280'} onChange={(e) => onChange('offColor', e.target.value)} /></Field>
          </div>
          <Field label="Shape">
            <select className={selectCls} value={properties.shape || 'circle'} onChange={(e) => onChange('shape', e.target.value)}>
              <option value="circle">Circle</option><option value="square">Square</option>
            </select>
          </Field>
          <Field label="Size">
            <select className={selectCls} value={properties.size || 'md'} onChange={(e) => onChange('size', e.target.value)}>
              <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.blinkOnAlarm ?? false} onChange={(e) => onChange('blinkOnAlarm', e.target.checked)} /><span className="text-xs text-gray-700">Blink on Alarm</span></label>
          <Field label="Label"><input className={inputCls} value={properties.label || ''} onChange={(e) => onChange('label', e.target.value)} /></Field>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="status" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
        </>
      );

    case 'valueDisplay':
      return (
        <>
          <Field label="Label"><input className={inputCls} value={properties.label || ''} onChange={(e) => onChange('label', e.target.value)} /></Field>
          <Field label="Icon">
            <div className="flex gap-1">
              <input className={inputCls + ' flex-1'} value={properties.icon || ''} placeholder="🌡️ ⚡ 💧 🔥 💨 ..." onChange={(e) => onChange('icon', e.target.value)} />
              <div className="flex gap-0.5 flex-wrap max-w-[100px]">
                {['🌡️', '⚡', '💧', '🔥', '💨', '📊', '⚙️', '🔋', '☀️', '💡'].map(ic => (
                  <button key={ic} type="button" className="text-sm hover:bg-gray-100 rounded p-0.5" onClick={() => onChange('icon', ic)}>{ic}</button>
                ))}
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Decimals"><input type="number" className={numCls + ' w-full'} value={properties.decimals ?? 2} min={0} max={10} onChange={(e) => onChange('decimals', Number(e.target.value))} /></Field>
            <Field label="Unit"><input className={inputCls} value={properties.unit || ''} onChange={(e) => onChange('unit', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Prefix"><input className={inputCls} value={properties.prefix || ''} onChange={(e) => onChange('prefix', e.target.value)} /></Field>
            <Field label="Suffix"><input className={inputCls} value={properties.suffix || ''} onChange={(e) => onChange('suffix', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showTrend ?? false} onChange={(e) => onChange('showTrend', e.target.checked)} /><span className="text-xs text-gray-700">Show Trend Arrow</span></label>
          {properties.showTrend && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Up Color"><input type="color" className={colorCls} value={properties.trendUpColor || '#22C55E'} onChange={(e) => onChange('trendUpColor', e.target.value)} /></Field>
              <Field label="Down Color"><input type="color" className={colorCls} value={properties.trendDownColor || '#EF4444'} onChange={(e) => onChange('trendDownColor', e.target.value)} /></Field>
            </div>
          )}
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="temperature" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
          {/* Thresholds */}
          <Field label="Color Thresholds">
            <div className="space-y-1">
              {(properties.thresholds || []).map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400">≥</span>
                  <input type="number" className={numCls + ' w-14'} value={t.value} onChange={(e) => {
                    const arr = [...(properties.thresholds || [])];
                    arr[i] = { ...arr[i], value: Number(e.target.value) };
                    onChange('thresholds', arr);
                  }} />
                  <input type="color" className={colorCls} value={t.color || '#EF4444'} onChange={(e) => {
                    const arr = [...(properties.thresholds || [])];
                    arr[i] = { ...arr[i], color: e.target.value };
                    onChange('thresholds', arr);
                  }} />
                  <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={() => {
                    const arr = [...(properties.thresholds || [])];
                    arr.splice(i, 1);
                    onChange('thresholds', arr);
                  }}>✕</button>
                </div>
              ))}
              <button type="button" className="text-[10px] text-blue-600 hover:text-blue-800" onClick={() => {
                const arr = [...(properties.thresholds || []), { value: 0, color: '#EF4444' }];
                onChange('thresholds', arr);
              }}>+ Add Threshold</button>
            </div>
          </Field>
        </>
      );

    case 'valve':
      return (
        <>
          <Field label="Valve Type">
            <select className={selectCls} value={properties.valveType || 'gate'} onChange={(e) => onChange('valveType', e.target.value)}>
              <option value="gate">Gate Valve</option><option value="butterfly">Butterfly</option><option value="ball">Ball Valve</option><option value="check">Check Valve</option>
            </select>
          </Field>
          <Field label="Orientation">
            <select className={selectCls} value={properties.orientation || 'horizontal'} onChange={(e) => onChange('orientation', e.target.value)}>
              <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Open Color"><input type="color" className={colorCls} value={properties.openColor || '#22C55E'} onChange={(e) => onChange('openColor', e.target.value)} /></Field>
            <Field label="Closed Color"><input type="color" className={colorCls} value={properties.closedColor || '#EF4444'} onChange={(e) => onChange('closedColor', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showLabel ?? true} onChange={(e) => onChange('showLabel', e.target.checked)} /><span className="text-xs text-gray-700">Show Label</span></label>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="valveState" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
          <Field label="RPC Open"><input className={inputCls} value={properties.rpcMethodOpen || ''} placeholder="openValve" onChange={(e) => onChange('rpcMethodOpen', e.target.value)} /></Field>
          <Field label="RPC Close"><input className={inputCls} value={properties.rpcMethodClose || ''} placeholder="closeValve" onChange={(e) => onChange('rpcMethodClose', e.target.value)} /></Field>
        </>
      );

    case 'tank':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min Level"><input type="number" className={numCls + ' w-full'} value={properties.minLevel ?? 0} onChange={(e) => onChange('minLevel', Number(e.target.value))} /></Field>
            <Field label="Max Level"><input type="number" className={numCls + ' w-full'} value={properties.maxLevel ?? 100} onChange={(e) => onChange('maxLevel', Number(e.target.value))} /></Field>
          </div>
          <Field label="Unit"><input className={inputCls} value={properties.unit || '%'} onChange={(e) => onChange('unit', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fill Color"><input type="color" className={colorCls} value={properties.fillColor || '#3B82F6'} onChange={(e) => onChange('fillColor', e.target.value)} /></Field>
            <Field label="Empty Color"><input type="color" className={colorCls} value={properties.emptyColor || '#F3F4F6'} onChange={(e) => onChange('emptyColor', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Warning Lvl"><input type="number" className={numCls + ' w-full'} value={properties.warningLevel ?? 80} onChange={(e) => onChange('warningLevel', Number(e.target.value))} /></Field>
            <Field label="Critical Lvl"><input type="number" className={numCls + ' w-full'} value={properties.criticalLevel ?? 95} onChange={(e) => onChange('criticalLevel', Number(e.target.value))} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showLevel ?? true} onChange={(e) => onChange('showLevel', e.target.checked)} /><span className="text-xs text-gray-700">Show Level</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showScale ?? true} onChange={(e) => onChange('showScale', e.target.checked)} /><span className="text-xs text-gray-700">Show Scale</span></label>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="tankLevel" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
        </>
      );

    case 'motor':
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Running Color"><input type="color" className={colorCls} value={properties.runningColor || '#22C55E'} onChange={(e) => onChange('runningColor', e.target.value)} /></Field>
            <Field label="Stopped Color"><input type="color" className={colorCls} value={properties.stoppedColor || '#6B7280'} onChange={(e) => onChange('stoppedColor', e.target.value)} /></Field>
          </div>
          <Field label="Fault Color"><input type="color" className={colorCls} value={properties.faultColor || '#EF4444'} onChange={(e) => onChange('faultColor', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Rated RPM"><input type="number" className={numCls + ' w-full'} value={properties.ratedRPM ?? 1800} onChange={(e) => onChange('ratedRPM', Number(e.target.value))} /></Field>
            <Field label="Rated Power"><input className={inputCls} value={properties.ratedPower || ''} placeholder="5.5 kW" onChange={(e) => onChange('ratedPower', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showRPM ?? true} onChange={(e) => onChange('showRPM', e.target.checked)} /><span className="text-xs text-gray-700">Show RPM</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showStatus ?? true} onChange={(e) => onChange('showStatus', e.target.checked)} /><span className="text-xs text-gray-700">Show Status</span></label>
          <Field label="Status Telemetry"><input className={inputCls} value={properties.telemetryKeyStatus || ''} placeholder="motorStatus" onChange={(e) => onChange('telemetryKeyStatus', e.target.value)} /></Field>
          <Field label="RPM Telemetry"><input className={inputCls} value={properties.telemetryKeyRPM || ''} placeholder="motorRPM" onChange={(e) => onChange('telemetryKeyRPM', e.target.value)} /></Field>
          <Field label="RPC Start"><input className={inputCls} value={properties.rpcMethodStart || ''} placeholder="startMotor" onChange={(e) => onChange('rpcMethodStart', e.target.value)} /></Field>
          <Field label="RPC Stop"><input className={inputCls} value={properties.rpcMethodStop || ''} placeholder="stopMotor" onChange={(e) => onChange('rpcMethodStop', e.target.value)} /></Field>
        </>
      );

    case 'pipe':
      return (
        <>
          <Field label="Flow Direction">
            <select className={selectCls} value={properties.flowDirection || 'left-to-right'} onChange={(e) => onChange('flowDirection', e.target.value)}>
              <option value="left-to-right">Left → Right</option><option value="right-to-left">Right → Left</option>
              <option value="top-to-bottom">Top → Bottom</option><option value="bottom-to-top">Bottom → Top</option>
            </select>
          </Field>
          <Field label="Pipe Width"><input type="number" className={numCls + ' w-full'} value={properties.pipeWidth ?? 8} min={2} max={30} onChange={(e) => onChange('pipeWidth', Number(e.target.value))} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Pipe Color"><input type="color" className={colorCls} value={properties.pipeColor || '#6B7280'} onChange={(e) => onChange('pipeColor', e.target.value)} /></Field>
            <Field label="Flow Color"><input type="color" className={colorCls} value={properties.flowColor || '#3B82F6'} onChange={(e) => onChange('flowColor', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showFlow ?? true} onChange={(e) => onChange('showFlow', e.target.checked)} /><span className="text-xs text-gray-700">Show Flow Animation</span></label>
          <Field label="Flow Speed"><input type="number" className={numCls + ' w-full'} value={properties.flowSpeed ?? 1} min={0.1} max={5} step={0.1} onChange={(e) => onChange('flowSpeed', Number(e.target.value))} /></Field>
          <Field label="Flow Telemetry"><input className={inputCls} value={properties.telemetryKeyFlow || ''} placeholder="flowRate" onChange={(e) => onChange('telemetryKeyFlow', e.target.value)} /></Field>
        </>
      );

    case 'pump':
      return (
        <>
          <Field label="Pump Type">
            <select className={selectCls} value={properties.pumpType || 'centrifugal'} onChange={(e) => onChange('pumpType', e.target.value)}>
              <option value="centrifugal">Centrifugal</option><option value="reciprocating">Reciprocating</option><option value="submersible">Submersible</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Running Color"><input type="color" className={colorCls} value={properties.runningColor || '#22C55E'} onChange={(e) => onChange('runningColor', e.target.value)} /></Field>
            <Field label="Stopped Color"><input type="color" className={colorCls} value={properties.stoppedColor || '#6B7280'} onChange={(e) => onChange('stoppedColor', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showStatus ?? true} onChange={(e) => onChange('showStatus', e.target.checked)} /><span className="text-xs text-gray-700">Show Status</span></label>
          <Field label="Status Telemetry"><input className={inputCls} value={properties.telemetryKeyStatus || ''} placeholder="pumpStatus" onChange={(e) => onChange('telemetryKeyStatus', e.target.value)} /></Field>
          <Field label="RPC Start"><input className={inputCls} value={properties.rpcMethodStart || ''} placeholder="startPump" onChange={(e) => onChange('rpcMethodStart', e.target.value)} /></Field>
          <Field label="RPC Stop"><input className={inputCls} value={properties.rpcMethodStop || ''} placeholder="stopPump" onChange={(e) => onChange('rpcMethodStop', e.target.value)} /></Field>
        </>
      );

    case 'indicator':
      return (
        <>
          <Field label="Indicator Type">
            <select className={selectCls} value={properties.indicatorType || 'status'} onChange={(e) => onChange('indicatorType', e.target.value)}>
              <option value="status">Status Light</option><option value="traffic-light">Traffic Light</option><option value="bar">Bar</option><option value="ring">Ring</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showLabel ?? true} onChange={(e) => onChange('showLabel', e.target.checked)} /><span className="text-xs text-gray-700">Show Label</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.showValue ?? false} onChange={(e) => onChange('showValue', e.target.checked)} /><span className="text-xs text-gray-700">Show Value</span></label>
          <Field label="Telemetry Key"><input className={inputCls} value={properties.telemetryKey || ''} placeholder="machineState" onChange={(e) => onChange('telemetryKey', e.target.value)} /></Field>
        </>
      );

    case 'shape':
      return (
        <>
          <Field label="Shape">
            <select className={selectCls} value={properties.shape || 'rectangle'} onChange={(e) => onChange('shape', e.target.value)}>
              <option value="rectangle">Rectangle</option><option value="circle">Circle</option><option value="ellipse">Ellipse</option>
              <option value="line">Line</option><option value="arrow">Arrow</option><option value="polygon">Polygon</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.fill ?? true} onChange={(e) => onChange('fill', e.target.checked)} /><span className="text-xs text-gray-700">Fill</span></label>
          {properties.fill && <Field label="Fill Color"><input type="color" className={colorCls} value={properties.fillColor || '#E5E7EB'} onChange={(e) => onChange('fillColor', e.target.value)} /></Field>}
          <Field label="Stroke Color"><input type="color" className={colorCls} value={properties.strokeColor || '#374151'} onChange={(e) => onChange('strokeColor', e.target.value)} /></Field>
          <Field label="Stroke Width"><input type="number" className={numCls + ' w-full'} value={properties.strokeWidth ?? 1} min={0} max={20} onChange={(e) => onChange('strokeWidth', Number(e.target.value))} /></Field>
          <Field label="Stroke Style">
            <select className={selectCls} value={properties.strokeStyle || 'solid'} onChange={(e) => onChange('strokeStyle', e.target.value)}>
              <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
            </select>
          </Field>
        </>
      );

    case 'image':
      return (
        <>
          <Field label="Image URL"><input className={inputCls} value={properties.src || ''} placeholder="https://..." onChange={(e) => onChange('src', e.target.value)} /></Field>
          <Field label="Alt Text"><input className={inputCls} value={properties.alt || ''} onChange={(e) => onChange('alt', e.target.value)} /></Field>
          <Field label="Object Fit">
            <select className={selectCls} value={properties.objectFit || 'contain'} onChange={(e) => onChange('objectFit', e.target.value)}>
              <option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option><option value="none">None</option>
            </select>
          </Field>
        </>
      );

    case 'chart':
      return (
        <>
          <Field label="Chart Type">
            <select className={selectCls} value={properties.chartType || 'line'} onChange={(e) => onChange('chartType', e.target.value)}>
              <option value="line">Line</option><option value="bar">Bar</option><option value="pie">Pie</option>
              <option value="area">Area</option><option value="scatter">Scatter</option><option value="doughnut">Doughnut</option>
            </select>
          </Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.legend?.show ?? true} onChange={(e) => onChange('legend', { ...properties.legend, show: e.target.checked })} /><span className="text-xs text-gray-700">Show Legend</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.grid?.show ?? true} onChange={(e) => onChange('grid', { ...properties.grid, show: e.target.checked })} /><span className="text-xs text-gray-700">Show Grid</span></label>
        </>
      );

    case 'container':
      return (
        <>
          <Field label="Layout">
            <select className={selectCls} value={properties.layout || 'free'} onChange={(e) => onChange('layout', e.target.value)}>
              <option value="free">Free</option><option value="grid">Grid</option><option value="flex">Flex</option>
            </select>
          </Field>
          <Field label="Padding"><input type="number" className={numCls + ' w-full'} value={properties.padding ?? 8} min={0} onChange={(e) => onChange('padding', Number(e.target.value))} /></Field>
          <label className="flex items-center gap-2"><input type="checkbox" className={checkCls} checked={properties.scrollable ?? false} onChange={(e) => onChange('scrollable', e.target.checked)} /><span className="text-xs text-gray-700">Scrollable</span></label>
        </>
      );

    default:
      return <p className="text-xs text-gray-500 italic">No specific properties for this widget type.</p>;
  }
};
