/**
 * Context Menu Component
 * 
 * Professional context menu with submenus, icons, and keyboard shortcuts.
 * Uses React Portal to render outside of scroll containers.
 * Supports both light and dark themes via CSS variables.
 */

import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenuStore } from './contextMenuStore';
import { ContextMenuItem } from './ContextMenuItem';
import './contextMenu.css';

// ─── Main Context Menu Component ─────────────────────────────────────────────

export const ContextMenu = memo(() => {
  const { isOpen, position, items, context, close } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 8) {
      x = viewportWidth - rect.width - 8;
    }
    x = Math.max(8, x);

    // Adjust vertical position
    if (y + rect.height > viewportHeight - 8) {
      y = viewportHeight - rect.height - 8;
    }
    y = Math.max(8, y);

    setMenuPosition({ x, y });
  }, [isOpen, position]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          close();
          break;
        // TODO: Arrow key navigation
      }
    },
    [isOpen, close]
  );

  // Click outside to close
  const handleBackdropClick = useCallback(() => {
    close();
  }, [close]);

  // Register keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen || !context) return null;

  const menuElement = (
    <>
      {/* Backdrop for click-outside */}
      <div className="context-menu-backdrop" onClick={handleBackdropClick} />
      
      {/* Main menu */}
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          left: menuPosition.x,
          top: menuPosition.y,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
        aria-label="Context menu"
      >
        {items.map((item) => (
          <ContextMenuItem key={item.id} item={item} context={context} />
        ))}
      </div>
    </>
  );

  // Render via portal to escape any scroll containers
  return createPortal(menuElement, document.body);
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
