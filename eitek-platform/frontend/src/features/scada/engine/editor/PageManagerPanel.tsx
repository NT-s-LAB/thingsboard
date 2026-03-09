/**
 * PageManagerPanel — UI for managing pages within a SCADA project.
 *
 * Features:
 *   - List all pages (normal + popup)
 *   - Add new page / popup page
 *   - Rename, duplicate, delete pages
 *   - Set home page (★ indicator)
 *   - Click to switch active editing page
 *   - Different visual style for popup pages
 */

'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import '../../styles/scada.css';

export const PageManagerPanel: React.FC = () => {
  const project = useScadaProjectStore((s) => s.project);
  const activePageId = useScadaProjectStore((s) => s.activePageId);
  const addPage = useScadaProjectStore((s) => s.addPage);
  const renamePage = useScadaProjectStore((s) => s.renamePage);
  const duplicatePage = useScadaProjectStore((s) => s.duplicatePage);
  const removePage = useScadaProjectStore((s) => s.removePage);
  const setHomePageId = useScadaProjectStore((s) => s.setHomePageId);
  const setActivePage = useScadaProjectStore((s) => s.setActivePage);

  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const pages = project?.pages ?? [];
  const homePageId = project?.homePageId;
  const normalPages = pages.filter((p) => p.pageType === 'normal').sort((a, b) => a.order - b.order);
  const popupPages = pages.filter((p) => p.pageType === 'popup').sort((a, b) => a.order - b.order);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  const handleAddPage = useCallback(() => {
    addPage(`Page ${pages.length + 1}`);
  }, [addPage, pages.length]);

  const handleAddPopup = useCallback(() => {
    addPage(`Popup ${popupPages.length + 1}`, 'popup');
  }, [addPage, popupPages.length]);

  const handleContextMenu = useCallback((e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
  }, []);

  const handleContextAction = useCallback((action: 'rename' | 'duplicate' | 'delete' | 'setHome') => {
    if (!contextMenu) return;
    const { pageId } = contextMenu;
    switch (action) {
      case 'rename': {
        const page = pages.find((p) => p.id === pageId);
        if (!page) break;
        const newName = window.prompt('Rename page:', page.name);
        if (newName && newName.trim()) renamePage(pageId, newName.trim());
        break;
      }
      case 'duplicate':
        duplicatePage(pageId);
        break;
      case 'delete':
        if (pages.length > 1 && window.confirm('Delete this page?')) {
          removePage(pageId);
        }
        break;
      case 'setHome':
        setHomePageId(pageId);
        break;
    }
    setContextMenu(null);
  }, [contextMenu, pages, renamePage, duplicatePage, removePage, setHomePageId]);

  if (!project) return null;

  return (
    <div className="scada-panel" style={{ width: '100%' }}>
      <div className="scada-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Pages</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={handleAddPage} style={addBtnStyle} title="Add page">
            + Page
          </button>
          <button onClick={handleAddPopup} style={{ ...addBtnStyle, color: '#8B5CF6' }} title="Add popup page">
            + Popup
          </button>
        </div>
      </div>

      <div className="scada-panel__body" style={{ maxHeight: 280 }}>
        {/* Normal pages */}
        {normalPages.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div style={sectionLabelStyle}>Pages</div>
            {normalPages.map((page) => (
              <PageRow
                key={page.id}
                name={page.name}
                isActive={activePageId === page.id}
                isHome={homePageId === page.id}
                pageType="normal"
                onClick={() => setActivePage(page.id)}
                onContextMenu={(e) => handleContextMenu(e, page.id)}
              />
            ))}
          </div>
        )}

        {/* Popup pages */}
        {popupPages.length > 0 && (
          <div>
            <div style={sectionLabelStyle}>Popups</div>
            {popupPages.map((page) => (
              <PageRow
                key={page.id}
                name={page.name}
                isActive={activePageId === page.id}
                isHome={false}
                pageType="popup"
                onClick={() => setActivePage(page.id)}
                onContextMenu={(e) => handleContextMenu(e, page.id)}
              />
            ))}
          </div>
        )}

        {pages.length === 0 && (
          <div style={{ fontSize: 10, color: '#9CA3AF', padding: '8px 4px', textAlign: 'center' }}>
            No pages yet. Click + to add.
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 50000,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '4px 0',
            minWidth: 140,
          }}
        >
          <ContextMenuItem onClick={() => handleContextAction('rename')}>
            ✏️ Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextAction('duplicate')}>
            📋 Duplicate
          </ContextMenuItem>
          {pages.find((p) => p.id === contextMenu.pageId)?.pageType === 'normal' && (
            <ContextMenuItem onClick={() => handleContextAction('setHome')}>
              ⭐ Set as Home
            </ContextMenuItem>
          )}
          {pages.length > 1 && (
            <>
              <div style={{ borderTop: '1px solid #f3f4f6', margin: '2px 0' }} />
              <ContextMenuItem onClick={() => handleContextAction('delete')} danger>
                🗑️ Delete
              </ContextMenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const PageRow: React.FC<{
  name: string;
  isActive: boolean;
  isHome: boolean;
  pageType: 'normal' | 'popup';
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ name, isActive, isHome, pageType, onClick, onContextMenu }) => (
  <div
    onClick={onClick}
    onContextMenu={onContextMenu}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 8px',
      cursor: 'pointer',
      background: isActive ? '#EFF6FF' : 'transparent',
      borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
      borderBottom: '1px solid #f9fafb',
      transition: 'background 0.1s',
    }}
  >
    {/* Icon */}
    <span style={{ fontSize: 12, opacity: 0.7, flexShrink: 0 }}>
      {pageType === 'popup' ? '◻' : '📄'}
    </span>

    {/* Name */}
    <span
      style={{
        flex: 1,
        fontSize: 11,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#1E40AF' : '#374151',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>

    {/* Home indicator */}
    {isHome && (
      <span style={{ fontSize: 10, color: '#F59E0B', flexShrink: 0 }} title="Home page">
        ★
      </span>
    )}

    {/* Type badge for popups */}
    {pageType === 'popup' && (
      <span
        style={{
          fontSize: 8,
          color: '#8B5CF6',
          background: '#EDE9FE',
          padding: '1px 4px',
          borderRadius: 3,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        POPUP
      </span>
    )}
  </div>
);

const ContextMenuItem: React.FC<{
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, danger, children }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      padding: '6px 12px',
      fontSize: 11,
      textAlign: 'left',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: danger ? '#EF4444' : '#374151',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = danger ? '#FEF2F2' : '#F3F4F6'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
  >
    {children}
  </button>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const addBtnStyle: React.CSSProperties = {
  fontSize: 10,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  color: '#3B82F6',
  fontWeight: 600,
  padding: '2px 4px',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '4px 8px 2px',
};
