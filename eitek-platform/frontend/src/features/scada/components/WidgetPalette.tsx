import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { useScadaStore } from '../stores/scadaStore';
import type { WidgetType, Widget } from '../types';

// ==================== SVG Icon Components ====================

const IconButton: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="36" height="24" rx="6" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
    <text x="20" y="24" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">BTN</text>
  </svg>
);

const IconText: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="36" height="28" rx="3" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1"/>
    <text x="6" y="18" fill="#374151" fontSize="9" fontWeight="bold">Aa</text>
    <line x1="6" y1="24" x2="34" y2="24" stroke="#D1D5DB" strokeWidth="1.5"/>
    <line x1="6" y1="28" x2="24" y2="28" stroke="#D1D5DB" strokeWidth="1.5"/>
  </svg>
);

const IconImage: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="34" height="28" rx="3" fill="#E0F2FE" stroke="#7DD3FC" strokeWidth="1.5"/>
    <circle cx="13" cy="16" r="3" fill="#FBBF24"/>
    <path d="M6 30 L15 22 L20 26 L28 18 L34 24 V31 C34 32.6 32.6 34 31 34 H9 C7.4 34 6 32.6 6 31 Z" fill="#34D399" opacity="0.7"/>
  </svg>
);

const IconRectangle: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="32" height="24" rx="2" fill="#E5E7EB" stroke="#374151" strokeWidth="2"/>
  </svg>
);

const IconCircle: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
  </svg>
);

const IconLine: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="34" x2="34" y2="6" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="6" cy="34" r="2.5" fill="#3B82F6"/>
    <circle cx="34" cy="6" r="2.5" fill="#3B82F6"/>
  </svg>
);

const IconGauge: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 28 A16 16 0 0 1 34 28" fill="none" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round"/>
    <path d="M6 28 A16 16 0 0 1 20 12" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round"/>
    <path d="M20 12 A16 16 0 0 1 28 16" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 16 A16 16 0 0 1 34 28" fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/>
    <line x1="20" y1="28" x2="26" y2="18" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="28" r="2.5" fill="#1F2937"/>
    <text x="20" y="36" textAnchor="middle" fill="#6B7280" fontSize="7">75%</text>
  </svg>
);

const IconChart: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="34" height="32" rx="3" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1"/>
    <polyline points="8,28 14,20 20,24 26,14 32,18" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="8,30 14,26 20,28 26,22 32,24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    <line x1="6" y1="32" x2="34" y2="32" stroke="#9CA3AF" strokeWidth="1"/>
    <line x1="6" y1="8" x2="6" y2="32" stroke="#9CA3AF" strokeWidth="1"/>
  </svg>
);

const IconTable: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="34" height="28" rx="3" fill="white" stroke="#D1D5DB" strokeWidth="1"/>
    <rect x="3" y="6" width="34" height="8" rx="3" fill="#3B82F6"/>
    <line x1="3" y1="20" x2="37" y2="20" stroke="#E5E7EB" strokeWidth="1"/>
    <line x1="3" y1="27" x2="37" y2="27" stroke="#E5E7EB" strokeWidth="1"/>
    <line x1="15" y1="14" x2="15" y2="34" stroke="#E5E7EB" strokeWidth="1"/>
    <line x1="27" y1="14" x2="27" y2="34" stroke="#E5E7EB" strokeWidth="1"/>
  </svg>
);

const IconContainer: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="34" height="32" rx="4" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 2"/>
    <rect x="7" y="10" width="12" height="10" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1"/>
    <rect x="21" y="10" width="12" height="10" rx="2" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1"/>
    <rect x="7" y="24" width="26" height="8" rx="2" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1"/>
  </svg>
);

const IconVideo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="34" height="24" rx="3" fill="#1F2937" stroke="#4B5563" strokeWidth="1"/>
    <polygon points="16,14 16,26 28,20" fill="white" opacity="0.9"/>
  </svg>
);

const IconMap: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="34" height="32" rx="3" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1"/>
    <path d="M20 10 C20 10 28 18 28 22 C28 26.4 24.4 30 20 30 C15.6 30 12 26.4 12 22 C12 18 20 10 20 10Z" fill="#EF4444" opacity="0.8"/>
    <circle cx="20" cy="22" r="3" fill="white"/>
  </svg>
);

const IconAlarm: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4 L36 32 H4 Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
    <text x="20" y="27" textAnchor="middle" fill="#EF4444" fontSize="16" fontWeight="bold">!</text>
  </svg>
);

const IconCustom: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5"/>
    <path d="M20 10 L20 14 M20 26 L20 30 M10 20 L14 20 M26 20 L30 20" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="5" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
  </svg>
);

// SCADA-specific SVG widgets
const IconSwitch: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="12" width="32" height="16" rx="8" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5"/>
    <circle cx="28" cy="20" r="6" fill="white" stroke="#10B981" strokeWidth="1.5"/>
  </svg>
);

const IconSlider: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="20" x2="34" y2="20" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
    <line x1="6" y1="20" x2="24" y2="20" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="24" cy="20" r="5" fill="white" stroke="#3B82F6" strokeWidth="2"/>
  </svg>
);

const IconLED: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="12" fill="#10B981" opacity="0.3"/>
    <circle cx="20" cy="20" r="8" fill="#10B981" opacity="0.6"/>
    <circle cx="20" cy="20" r="5" fill="#10B981"/>
    <ellipse cx="17" cy="17" rx="2" ry="1.5" fill="white" opacity="0.5" transform="rotate(-30 17 17)"/>
  </svg>
);

const IconValueDisplay: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="34" height="24" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1"/>
    <text x="20" y="24" textAnchor="middle" fill="#10B981" fontSize="12" fontFamily="monospace" fontWeight="bold">24.5</text>
    <text x="33" y="16" textAnchor="middle" fill="#94A3B8" fontSize="6">°C</text>
  </svg>
);

const IconPipe: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="15" width="36" height="10" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
    <rect x="2" y="15" width="24" height="10" rx="2" fill="#60A5FA" opacity="0.5"/>
    <path d="M18 17 L22 20 L18 23" fill="none" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 17 L28 20 L24 23" fill="none" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconValve: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="18" width="12" height="6" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
    <rect x="26" y="18" width="12" height="6" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
    <polygon points="14,14 26,14 26,28 14,28" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
    <line x1="20" y1="8" x2="20" y2="14" stroke="#6B7280" strokeWidth="2"/>
    <line x1="16" y1="8" x2="24" y2="8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconTank: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="24" height="28" rx="3" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5"/>
    <rect x="8" y="18" width="24" height="16" rx="3" fill="#60A5FA" opacity="0.4"/>
    <line x1="10" y1="12" x2="30" y2="12" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2"/>
    <line x1="10" y1="18" x2="30" y2="18" stroke="#3B82F6" strokeWidth="1"/>
    <text x="20" y="28" textAnchor="middle" fill="#1E40AF" fontSize="7" fontWeight="bold">60%</text>
  </svg>
);

const IconMotor: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="14" fill="#F1F5F9" stroke="#6B7280" strokeWidth="1.5"/>
    <text x="20" y="24" textAnchor="middle" fill="#374151" fontSize="10" fontWeight="bold">M</text>
    <line x1="34" y1="20" x2="38" y2="20" stroke="#6B7280" strokeWidth="2"/>
    <rect x="36" y="16" width="3" height="8" fill="#6B7280" rx="1"/>
  </svg>
);

// Map of icon components
const widgetIcons: Record<string, React.FC<{ className?: string }>> = {
  button: IconButton,
  text: IconText,
  image: IconImage,
  rectangle: IconRectangle,
  circle: IconCircle,
  line: IconLine,
  gauge: IconGauge,
  chart: IconChart,
  table: IconTable,
  container: IconContainer,
  video: IconVideo,
  map: IconMap,
  alarm: IconAlarm,
  custom: IconCustom,
  switch: IconSwitch,
  slider: IconSlider,
  led: IconLED,
  valueDisplay: IconValueDisplay,
  pipe: IconPipe,
  valve: IconValve,
  tank: IconTank,
  motor: IconMotor,
};

interface PaletteWidget {
  type: WidgetType;
  name: string;
  iconKey: string;
  description: string;
  shapeVariant?: string; // For shapes: 'rectangle' | 'circle' | 'line'
}

const widgetPalette: Array<{
  category: string;
  widgets: PaletteWidget[];
}> = [
  {
    category: 'Basic Controls',
    widgets: [
      { type: 'button', name: 'Push Button', iconKey: 'button', description: 'Interactive push button' },
      { type: 'text', name: 'Label / Text', iconKey: 'text', description: 'Static or dynamic text' },
      { type: 'button', name: 'Toggle Switch', iconKey: 'switch', description: 'ON/OFF toggle switch' },
      { type: 'button', name: 'Slider', iconKey: 'slider', description: 'Value slider control' },
      { type: 'button', name: 'LED Indicator', iconKey: 'led', description: 'Status LED light' },
    ],
  },
  {
    category: 'Shapes',
    widgets: [
      { type: 'shape', name: 'Rectangle', iconKey: 'rectangle', description: 'Rectangle shape', shapeVariant: 'rectangle' },
      { type: 'shape', name: 'Circle', iconKey: 'circle', description: 'Circle/Ellipse shape', shapeVariant: 'circle' },
      { type: 'shape', name: 'Line', iconKey: 'line', description: 'Line connector', shapeVariant: 'line' },
    ],
  },
  {
    category: 'Data Display',
    widgets: [
      { type: 'gauge', name: 'Gauge', iconKey: 'gauge', description: 'Circular gauge meter' },
      { type: 'chart', name: 'Trend Chart', iconKey: 'chart', description: 'Real-time trend chart' },
      { type: 'table', name: 'Data Table', iconKey: 'table', description: 'Tabular data display' },
      { type: 'text', name: 'Value Display', iconKey: 'valueDisplay', description: 'Numeric value display' },
    ],
  },
  {
    category: 'SCADA Symbols',
    widgets: [
      { type: 'custom', name: 'Pipe', iconKey: 'pipe', description: 'Process pipe line' },
      { type: 'custom', name: 'Valve', iconKey: 'valve', description: 'Control valve' },
      { type: 'custom', name: 'Tank', iconKey: 'tank', description: 'Liquid storage tank' },
      { type: 'custom', name: 'Motor', iconKey: 'motor', description: 'Electric motor' },
    ],
  },
  {
    category: 'Media & Layout',
    widgets: [
      { type: 'image', name: 'Image', iconKey: 'image', description: 'Image display' },
      { type: 'video', name: 'Video / Camera', iconKey: 'video', description: 'Video stream / IP camera' },
      { type: 'map', name: 'Map', iconKey: 'map', description: 'Interactive map' },
      { type: 'container', name: 'Container', iconKey: 'container', description: 'Widget container' },
    ],
  },
  {
    category: 'Alerts',
    widgets: [
      { type: 'alarm', name: 'Alarm', iconKey: 'alarm', description: 'Alarm status indicator' },
      { type: 'custom', name: 'Custom Widget', iconKey: 'custom', description: 'Custom component' },
    ],
  },
];

export const WidgetPalette: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Basic Controls', 'Shapes', 'SCADA Symbols'])
  );

  const { addWidget, currentDashboard } = useScadaStore();

  const handleAddWidget = async (widgetType: WidgetType, widgetConfig?: { name?: string; iconKey?: string; shapeVariant?: string }) => {
    if (!currentDashboard) return;

    const currentWidgets = (currentDashboard as any)?.widgets ?? (currentDashboard as any)?.scadaWidgets ?? [];

    const widgetName = widgetConfig?.name || `New ${widgetType}`;
    const baseWidget = {
      type: widgetType as Widget['type'],
      name: widgetName,
      description: '',
      transform: {
        position: { x: 100 + currentWidgets.length * 20, y: 100 + currentWidgets.length * 20 },
        size: getDefaultSize(widgetType, widgetConfig?.iconKey),
        rotation: 0,
        scale: 1,
        zIndex: currentWidgets.length,
      },
      style: {
        backgroundColor: getDefaultBackgroundColor(widgetType, widgetConfig?.iconKey),
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 4,
        textColor: '#000000',
        fontSize: 14,
        fontFamily: 'Arial',
      },
      visible: true,
      enabled: true,
      locked: false,
      dataBindings: [],
      actions: [],
      properties: getDefaultProperties(widgetType, widgetConfig),
      createdBy: 'current-user',
    };

    try {
      await addWidget(baseWidget as any); // TODO: Fix widget type discriminated union
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const getDefaultSize = (type: WidgetType, iconKey?: string) => {
    // SCADA-specific sizes
    if (iconKey === 'switch') return { width: 80, height: 40 };
    if (iconKey === 'slider') return { width: 200, height: 30 };
    if (iconKey === 'led') return { width: 40, height: 40 };
    if (iconKey === 'valueDisplay') return { width: 160, height: 60 };
    if (iconKey === 'pipe') return { width: 200, height: 30 };
    if (iconKey === 'valve') return { width: 60, height: 60 };
    if (iconKey === 'tank') return { width: 100, height: 140 };
    if (iconKey === 'motor') return { width: 80, height: 80 };

    switch (type) {
      case 'button': return { width: 120, height: 40 };
      case 'text': return { width: 200, height: 30 };
      case 'gauge': return { width: 150, height: 150 };
      case 'chart': return { width: 300, height: 200 };
      case 'image': return { width: 200, height: 150 };
      case 'container': return { width: 250, height: 200 };
      case 'shape': return { width: 100, height: 100 };
      case 'table': return { width: 300, height: 200 };
      case 'video': return { width: 320, height: 240 };
      case 'map': return { width: 300, height: 200 };
      case 'alarm': return { width: 150, height: 50 };
      default: return { width: 100, height: 50 };
    }
  };

  const getDefaultBackgroundColor = (type: WidgetType, iconKey?: string) => {
    if (iconKey === 'switch') return '#D1FAE5';
    if (iconKey === 'led') return '#10B981';
    if (iconKey === 'valueDisplay') return '#1E293B';
    if (iconKey === 'pipe') return '#CBD5E1';
    if (iconKey === 'valve') return '#F59E0B';
    if (iconKey === 'tank') return '#F1F5F9';
    if (iconKey === 'motor') return '#F1F5F9';

    switch (type) {
      case 'button': return '#3B82F6';
      case 'gauge': return '#FFFFFF';
      case 'chart': return '#FFFFFF';
      case 'container': return '#F9FAFB';
      case 'alarm': return '#EF4444';
      default: return 'transparent';
    }
  };

  const getDefaultProperties = (type: WidgetType, config?: { name?: string; iconKey?: string; shapeVariant?: string }) => {
    const iconKey = config?.iconKey;

    // SCADA-specific widget properties
    if (iconKey === 'switch') {
      return { text: 'Switch', variant: 'toggle', state: false, onColor: '#10B981', offColor: '#D1D5DB' };
    }
    if (iconKey === 'slider') {
      return { min: 0, max: 100, value: 50, step: 1, showValue: true, trackColor: '#3B82F6' };
    }
    if (iconKey === 'led') {
      return { color: '#10B981', state: true, size: 'md', blinkOnAlarm: false };
    }
    if (iconKey === 'valueDisplay') {
      return { value: '24.5', unit: '°C', label: 'Temperature', format: '0.0', textColor: '#10B981' };
    }
    if (iconKey === 'pipe') {
      return { direction: 'horizontal', flowAnimated: true, flowColor: '#60A5FA', pipeColor: '#94A3B8' };
    }
    if (iconKey === 'valve') {
      return { state: 'open', valveType: 'gate', showLabel: true };
    }
    if (iconKey === 'tank') {
      return { level: 60, maxLevel: 100, unit: '%', showLevel: true, liquidColor: '#60A5FA' };
    }
    if (iconKey === 'motor') {
      return { state: 'running', speed: 1500, unit: 'RPM', showLabel: true };
    }
    switch (type) {
      case 'button':
        return {
          text: 'Button',
          variant: 'primary',
          size: 'md',
        };
      case 'text':
        return {
          text: 'Sample Text',
          autoSize: true,
        };
      case 'gauge':
        return {
          min: 0,
          max: 100,
          value: 0,
          unit: '%',
          showValue: true,
          showMinMax: true,
          gaugeType: 'circular',
        };
      case 'chart':
        return {
          chartType: 'line',
          datasets: [],
          xAxis: { type: 'time', title: 'Time' },
          yAxis: { type: 'linear', title: 'Value' },
          timeRange: { duration: 60, unit: 'minutes', realtime: true },
          legend: { show: true, position: 'top' },
          grid: { show: true, color: '#E5E7EB' },
        };
      case 'image':
        return {
          src: '/placeholder.png',
          alt: 'Image',
          objectFit: 'contain',
          loading: 'lazy',
        };
      case 'shape':
        return {
          shape: config?.shapeVariant || 'rectangle',
          fill: true,
          fillColor: '#E5E7EB',
          strokeColor: '#374151',
          strokeWidth: 1,
        };
      case 'container':
        return {
          layout: 'free',
          padding: 10,
          scrollable: false,
          children: [],
        };
      default:
        return {};
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredPalette = widgetPalette.map(category => ({
    ...category,
    widgets: category.widgets.filter(widget =>
      widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.widgets.length > 0);

  const renderWidgetIcon = (iconKey: string) => {
    const IconComponent = widgetIcons[iconKey];
    if (IconComponent) {
      return <IconComponent className="w-10 h-10 flex-shrink-0" />;
    }
    return <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">?</div>;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 mb-3">🧩 Widget Library</h3>
        <Input
          placeholder="Search widgets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Widget Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredPalette.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No widgets found matching "{searchTerm}"
          </div>
        ) : (
          filteredPalette.map(category => (
            <div key={category.category} className="mb-4">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-700">
                  {category.category}
                </span>
                <span className="text-gray-400">
                  {expandedCategories.has(category.category) ? '▼' : '▶'}
                </span>
              </button>

              {/* Category Widgets */}
              {expandedCategories.has(category.category) && (
                <div className="mt-2 space-y-1">
                  {category.widgets.map(widget => (
                    <Card
                      key={`${category.category}-${widget.iconKey}-${widget.name}`}
                      className="p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                      onClick={() => handleAddWidget(widget.type, { 
                        name: widget.name, 
                        iconKey: widget.iconKey,
                        ...(widget.shapeVariant ? { shapeVariant: widget.shapeVariant } : {}),
                      })}
                    >
                      <div className="flex items-center space-x-3">
                        {renderWidgetIcon(widget.iconKey)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">
                            {widget.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {widget.description}
                          </p>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-blue-500 text-lg transition-opacity">+</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Add */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500 mb-2 font-medium">Quick Add</p>
        <div className="grid grid-cols-4 gap-1">
          {[
            { type: 'button' as WidgetType, iconKey: 'button', name: 'Button', tip: 'Button' },
            { type: 'text' as WidgetType, iconKey: 'text', name: 'Text', tip: 'Text' },
            { type: 'gauge' as WidgetType, iconKey: 'gauge', name: 'Gauge', tip: 'Gauge' },
            { type: 'shape' as WidgetType, iconKey: 'rectangle', name: 'Rectangle', tip: 'Rect', shapeVariant: 'rectangle' },
            { type: 'shape' as WidgetType, iconKey: 'circle', name: 'Circle', tip: 'Circle', shapeVariant: 'circle' },
            { type: 'button' as WidgetType, iconKey: 'led', name: 'LED', tip: 'LED' },
            { type: 'custom' as WidgetType, iconKey: 'valve', name: 'Valve', tip: 'Valve' },
            { type: 'custom' as WidgetType, iconKey: 'tank', name: 'Tank', tip: 'Tank' },
          ].map((item) => (
            <button
              key={item.iconKey}
              onClick={() => handleAddWidget(item.type, { name: item.name, iconKey: item.iconKey, ...(item.shapeVariant ? { shapeVariant: item.shapeVariant } : {}) })}
              className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 transition-colors group"
              title={item.name}
            >
              {renderWidgetIcon(item.iconKey)}
              <span className="text-[10px] text-gray-500 group-hover:text-blue-600 mt-0.5">{item.tip}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};