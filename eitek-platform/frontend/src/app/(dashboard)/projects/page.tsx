'use client';

import React, { useEffect, useState } from 'react';
import { Plus, FolderTree, Search, Filter, Grid, List, MoreVertical } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useProjectsStore } from '@/features/projects/stores/projectsStore';
import { ProjectNode } from '@/features/projects/types';

const ProjectsPage: React.FC = () => {
  const {
    tree,
    currentPath,
    selectedNodeIds,
    loading,
    error,
    
    // Actions
    fetchProjectTree,
    navigateToNode,
    selectNode,
    // createProject, // Unused
    // createFolder, // Unused
  } = useProjectsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    fetchProjectTree();
  }, [fetchProjectTree]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  const handleCreateProject = () => {
    // TODO: Open create project dialog
    setShowCreateMenu(false);
    console.log('Create new project');
  };

  const handleCreateFolder = () => {
    // TODO: Open create folder dialog
    setShowCreateMenu(false);
    console.log('Create new folder');
  };

  const renderBreadcrumbs = () => {
    if (!currentPath || currentPath.length === 0) {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <FolderTree className="w-4 h-4 mr-1" />
          Root
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-sm">
        <FolderTree className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => navigateToNode('')}
          className="text-primary-600 hover:text-primary-800"
        >
          Root
        </button>
        {currentPath.map((pathItem, index) => (
          <React.Fragment key={pathItem.id}>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => navigateToNode(pathItem.id)}
              className={`${
                index === currentPath.length - 1
                  ? 'text-gray-900 font-medium'
                  : 'text-primary-600 hover:text-primary-800'
              }`}
            >
              {pathItem.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderTreeNode = (node: ProjectNode, level: number = 0) => {
    const isSelected = selectedNodeIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-2 hover:bg-gray-50 cursor-pointer rounded ${
            isSelected ? 'bg-primary-50 border border-primary-200' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => selectNode(node.id)}
          onDoubleClick={() => {
            if (node.type === 'folder') {
              navigateToNode(node.id);
            }
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 mr-2">
              {node.type === 'folder' ? (
                <FolderTree className="w-4 h-4 text-blue-500" />
              ) : (
                <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
              )}
            </div>

            {/* Name and metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">{node.name}</span>
                {node.type === 'project' && (
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {node.metadata?.version || 'v1.0.0'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      node.metadata?.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                    }`}></span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Modified {node.updatedTime ? new Date(node.updatedTime).toLocaleDateString() : 'Unknown'}
                {node.description && ` • ${node.description}`}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 ml-2">
              <Button size="sm" variant="ghost" className="p-1">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && (
          <div>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    const currentNodes = tree || [];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {currentNodes.map((node) => (
          <div
            key={node.id}
            className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
              selectedNodeIds.includes(node.id) ? 'border-primary-300 shadow-md' : ''
            }`}
            onClick={() => selectNode(node.id)}
            onDoubleClick={() => {
              if (node.type === 'folder') {
                navigateToNode(node.id);
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {node.type === 'folder' ? (
                  <FolderTree className="w-8 h-8 text-blue-500" />
                ) : (
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded"></div>
                  </div>
                )}
              </div>
              <Button size="sm" variant="ghost" className="p-1">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 truncate">{node.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {node.description || 'No description'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Modified {node.updatedTime ? new Date(node.updatedTime).toLocaleDateString() : 'Unknown'}</span>
                {node.type === 'project' && node.status && (
                  <span className={`px-2 py-1 rounded ${
                    node.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {node.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your SCADA projects and organize them in folders
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </Button>

              {showCreateMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleCreateProject}
                  >
                    📊 New Project
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleCreateFolder}
                  >
                    📁 New Folder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs and Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderBreadcrumbs()}
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded p-1">
              <Button
                size="sm"
                variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('tree')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter */}
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading projects</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => fetchProjectTree()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : !tree ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <FolderTree className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first project</p>
              <Button onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="bg-white">
            {tree && tree.length > 0 ? (
              <div className="p-4">
                {tree.map((node) => renderTreeNode(node))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <FolderTree className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">This folder is empty</h3>
                  <p className="text-gray-500 mb-4">Create a project or folder to get started</p>
                  <div className="space-x-2">
                    <Button onClick={handleCreateProject}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                    <Button variant="outline" onClick={handleCreateFolder}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Folder
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          renderGridView()
        )}
      </div>

      {/* Status Bar */}
      {tree && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {tree ? tree.length : 0} items
              {selectedNodeIds.length > 0 && ` • ${selectedNodeIds.length} selected`}
            </span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowCreateMenu(false)}
        />
      )}
    </div>
  );
};

export default ProjectsPage;