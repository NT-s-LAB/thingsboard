import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';
import { useScadaStore } from '../stores/scadaStore';
import type { WidgetType, Widget } from '../types';

const widgetPalette: Array<{
  category: string;
  widgets: Array<{
    type: WidgetType;
    name: string;
    icon: string;
    description: string;
  }>;
}> = [
  {
    category: 'Basic Controls',
    widgets: [
      {
        type: 'button',
        name: 'Button',
        icon: '🔳',
        description: 'Interactive button for user actions',
      },
      {
        type: 'text',
        name: 'Text',
        icon: '📝',
        description: 'Static or dynamic text display',
      },
      {
        type: 'image',
        name: 'Image',
        icon: '🖼️',
        description: 'Image display with dynamic source',
      },
    ],
  },
  {
    category: 'Shapes',
    widgets: [
      {
        type: 'shape',
        name: 'Rectangle',
        icon: '⬛',
        description: 'Rectangle shape for layouts',
      },
      {
        type: 'shape',
        name: 'Circle',
        icon: '⭕',
        description: 'Circle shape for indicators',
      },
      {
        type: 'shape',
        name: 'Line',
        icon: '📏',
        description: 'Line for connections',
      },
    ],
  },
  {
    category: 'Data Visualization',
    widgets: [
      {
        type: 'gauge',
        name: 'Gauge',
        icon: '📊',
        description: 'Circular or linear gauge',
      },
      {
        type: 'chart',
        name: 'Chart',
        icon: '📈',
        description: 'Line, bar, or pie chart',
      },
      {
        type: 'table',
        name: 'Table',
        icon: '📋',
        description: 'Data table display',
      },
    ],
  },
  {
    category: 'Containers',
    widgets: [
      {
        type: 'container',
        name: 'Container',
        icon: '📦',
        description: 'Container for grouping widgets',
      },
    ],
  },
  {
    category: 'Media',
    widgets: [
      {
        type: 'video',
        name: 'Video',
        icon: '🎥',
        description: 'Video player widget',
      },
      {
        type: 'map',
        name: 'Map',
        icon: '🗺️',
        description: 'Interactive map display',
      },
    ],
  },
  {
    category: 'Advanced',
    widgets: [
      {
        type: 'alarm',
        name: 'Alarm',
        icon: '🚨',
        description: 'Alarm status display',
      },
      {
        type: 'custom',
        name: 'Custom',
        icon: '⚙️',
        description: 'Custom widget component',
      },
    ],
  },
];

export const WidgetPalette: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Basic Controls', 'Shapes'])
  );

  const { addWidget, currentDashboard } = useScadaStore();

  const handleAddWidget = async (widgetType: WidgetType, _widgetConfig?: any) => {
    if (!currentDashboard) return;

    const baseWidget = {
      type: widgetType as Widget['type'],
      name: `New ${widgetType}`,
      description: '',
      transform: {
        position: { x: 100, y: 100 },
        size: getDefaultSize(widgetType),
        rotation: 0,
        scale: 1,
        zIndex: currentDashboard.widgets.length,
      },
      style: {
        backgroundColor: getDefaultBackgroundColor(widgetType),
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
      properties: getDefaultProperties(widgetType),
      createdBy: 'current-user', // TODO: Get from auth store
    };

    try {
      await addWidget(baseWidget as any); // TODO: Fix widget type discriminated union
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const getDefaultSize = (type: WidgetType) => {
    switch (type) {
      case 'button':
        return { width: 120, height: 40 };
      case 'text':
        return { width: 200, height: 30 };
      case 'gauge':
        return { width: 150, height: 150 };
      case 'chart':
        return { width: 300, height: 200 };
      case 'image':
        return { width: 200, height: 150 };
      case 'container':
        return { width: 250, height: 200 };
      case 'shape':
        return { width: 100, height: 100 };
      case 'table':
        return { width: 300, height: 200 };
      case 'video':
        return { width: 320, height: 240 };
      case 'map':
        return { width: 300, height: 200 };
      case 'alarm':
        return { width: 150, height: 50 };
      default:
        return { width: 100, height: 50 };
    }
  };

  const getDefaultBackgroundColor = (type: WidgetType) => {
    switch (type) {
      case 'button':
        return '#3B82F6';
      case 'gauge':
        return '#FFFFFF';
      case 'chart':
        return '#FFFFFF';
      case 'container':
        return '#F9FAFB';
      case 'alarm':
        return '#EF4444';
      default:
        return 'transparent';
    }
  };

  const getDefaultProperties = (type: WidgetType) => {
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
          shape: 'rectangle',
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 mb-3">Widget Palette</h3>
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
                      key={`${category.category}-${widget.type}-${widget.name}`}
                      className="p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      onClick={() => handleAddWidget(widget.type)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{widget.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {widget.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('button')}
            className="flex items-center space-x-1"
          >
            <span>🔳</span>
            <span>Button</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('text')}
            className="flex items-center space-x-1"
          >
            <span>📝</span>
            <span>Text</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('gauge')}
            className="flex items-center space-x-1"
          >
            <span>📊</span>
            <span>Gauge</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('chart')}
            className="flex items-center space-x-1"
          >
            <span>📈</span>
            <span>Chart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};