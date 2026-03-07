'use client';

import React, { useState } from 'react';
import { Plus, Search, /* Filter, */ Copy, Download, Upload, MoreVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  previewImage: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  downloads: number;
  rating: number;
  tags: string[];
  type: 'scada' | 'dashboard' | 'widget' | 'component';
}

const TemplatesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Mock data
  const templates: Template[] = [
    {
      id: '1',
      name: 'Industrial Control Panel',
      category: 'Industrial',
      description: 'Complete control panel template for industrial automation systems',
      previewImage: '/api/placeholder/300/200',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      author: 'EITEK Team',
      downloads: 245,
      rating: 4.8,
      tags: ['industrial', 'automation', 'control'],
      type: 'scada'
    },
    {
      id: '2',
      name: 'Water Treatment Dashboard',
      category: 'Water Management',
      description: 'Monitoring dashboard for water treatment facilities',
      previewImage: '/api/placeholder/300/200',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      author: 'Engineering Team',
      downloads: 156,
      rating: 4.6,
      tags: ['water', 'treatment', 'monitoring'],
      type: 'dashboard'
    },
    {
      id: '3',
      name: 'Temperature Gauge Widget',
      category: 'Widgets',
      description: 'Customizable temperature gauge with alarm thresholds',
      previewImage: '/api/placeholder/300/200',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-16',
      author: 'UI Team',
      downloads: 389,
      rating: 4.9,
      tags: ['temperature', 'gauge', 'widget'],
      type: 'widget'
    },
    {
      id: '4',
      name: 'HVAC Control System',
      category: 'HVAC',
      description: 'Complete HVAC monitoring and control interface',
      previewImage: '/api/placeholder/300/200',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-14',
      author: 'HVAC Solutions',
      downloads: 198,
      rating: 4.7,
      tags: ['hvac', 'climate', 'control'],
      type: 'scada'
    }
  ];

  const categories = [
    'all',
    'Industrial',
    'Water Management',
    'HVAC',
    'Energy',
    'Transportation',
    'Widgets'
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'scada', label: 'SCADA Templates' },
    { value: 'dashboard', label: 'Dashboard Templates' },
    { value: 'widget', label: 'Widgets' },
    { value: 'component', label: 'Components' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesType = selectedType === 'all' || template.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }

    return stars;
  };

  const handleUseTemplate = (template: Template) => {
    console.log('Using template:', template.name);
    // TODO: Implement template usage
  };

  const handleDownloadTemplate = (template: Template) => {
    console.log('Downloading template:', template.name);
    // TODO: Implement template download
  };

  const handleUploadTemplate = () => {
    console.log('Upload template');
    // TODO: Implement template upload
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse and use pre-built templates for your SCADA projects
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleUploadTemplate}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or create a new template
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Preview Image */}
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute top-2 right-2">
                    <Button size="sm" variant="ghost" className="p-1 bg-white/80">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      template.type === 'scada' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'dashboard' ? 'bg-green-100 text-green-800' :
                      template.type === 'widget' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.type.toUpperCase()}
                    </span>
                  </div>
                  {/* Placeholder for preview image */}
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <span className="text-primary-600 text-lg font-semibold">
                      {template.name.charAt(0)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                    <div className="flex items-center space-x-1 ml-2">
                      {renderStarRating(template.rating)}
                      <span className="text-xs text-gray-600 ml-1">({template.rating})</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>By {template.author}</span>
                    <span>{template.downloads} downloads</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadTemplate(template)}
                      className="p-2"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="p-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Total Templates: {templates.length}</span>
            <span>Downloads: {templates.reduce((sum, t) => sum + t.downloads, 0)}</span>
            <span>Categories: {categories.length - 1}</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;