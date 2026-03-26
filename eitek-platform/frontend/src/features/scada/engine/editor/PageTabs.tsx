/**
 * PageTabs — Horizontal tab bar showing all pages for quick switching.
 *
 * Displayed below the toolbar in the editor. Shows page name + type icon.
 * Active page is highlighted. Right-click for context menu actions.
 */

'use client';

import React from 'react';
import { useScadaProjectStore } from '../../stores/scadaProjectStore';
import { PopupIcon, StarIcon } from './EditorIcons';

export const PageTabs: React.FC = () => {
  const project = useScadaProjectStore((s) => s.project);
  const activePageId = useScadaProjectStore((s) => s.activePageId);
  const setActivePage = useScadaProjectStore((s) => s.setActivePage);
  const addPage = useScadaProjectStore((s) => s.addPage);

  if (!project) return null;

  const sortedPages = [...project.pages].sort((a, b) => a.order - b.order);
  const homePageId = project.homePageId;

  return (
    <div style={containerStyle}>
      {sortedPages.map((page) => (
        <PageTab
          key={page.id}
          name={page.name}
          isActive={activePageId === page.id}
          isHome={homePageId === page.id}
          isPopup={page.pageType === 'popup'}
          onClick={() => setActivePage(page.id)}
        />
      ))}
      <button
        onClick={() => addPage(`Page ${project.pages.length + 1}`)}
        style={addTabBtnStyle}
        title="Add page"
      >
        +
      </button>
    </div>
  );
};

// ─── Sub-component ───────────────────────────────────────────────────────────

const PageTab: React.FC<{
  name: string;
  isActive: boolean;
  isHome: boolean;
  isPopup: boolean;
  onClick: () => void;
}> = ({ name, isActive, isHome, isPopup, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 12px',
      fontSize: 11,
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#1D4ED8' : '#6B7280',
      background: isActive ? '#fff' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s',
    }}
  >
    {isPopup && <span style={{ fontSize: 10, opacity: 0.6 }}><PopupIcon size={10} /></span>}
    <span>{name}</span>
    {isHome && <span style={{ fontSize: 9, color: '#F59E0B' }}><StarIcon size={9} filled color="#F59E0B" /></span>}
  </button>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 0,
  background: '#F3F4F6',
  borderBottom: '1px solid #e5e7eb',
  overflowX: 'auto',
  minHeight: 30,
  flexShrink: 0,
};

const addTabBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 14,
  background: 'none',
  border: 'none',
  color: '#9CA3AF',
  cursor: 'pointer',
  fontWeight: 600,
};
