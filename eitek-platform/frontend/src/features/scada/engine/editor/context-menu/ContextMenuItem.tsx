/**
 * Context Menu Item Component
 * 
 * Renders individual menu items including separators, action items, and submenus.
 * Uses CSS classes for theme-aware styling (see contextMenu.css).
 */

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  ContextMenuItem as MenuItemType,
  ContextMenuActionItem,
  ContextMenuSubmenu,
  ContextMenuContext,
} from './types';
import { isSeparator, isSubmenu, isActionItem, resolveCondition } from './types';
import { useContextMenuStore } from './contextMenuStore';
import * as Icons from 'lucide-react';
import './contextMenu.css';

// ─── Icon Component ──────────────────────────────────────────────────────────

interface MenuIconProps {
  name: string | undefined;
  size?: number;
}

const MenuIcon = memo<MenuIconProps>(({ name, size = 16 }) => {
  if (!name) return <span className="context-menu-icon" />;

  // Get icon from Lucide
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name];
  if (IconComponent) {
    return (
      <span className="context-menu-icon">
        <IconComponent size={size} strokeWidth={2} />
      </span>
    );
  }

  // Fallback: empty space
  return <span className="context-menu-icon" />;
});

MenuIcon.displayName = 'MenuIcon';

// ─── Separator Component ─────────────────────────────────────────────────────

const Separator = memo(() => (
  <div className="context-menu-separator" role="separator" />
));

Separator.displayName = 'Separator';

// ─── Action Item Component ───────────────────────────────────────────────────

interface ActionItemProps {
  item: ContextMenuActionItem;
  context: ContextMenuContext;
}

const ActionItem = memo<ActionItemProps>(({ item, context }) => {
  const executeAction = useContextMenuStore((s) => s.executeAction);
  const isEnabled = resolveCondition(item.enabled, context, true);

  const handleClick = useCallback(() => {
    if (!isEnabled) return;
    executeAction(item);
  }, [isEnabled, item, executeAction]);

  const classNames = [
    'context-menu-item',
    !isEnabled && 'disabled',
    item.danger && 'danger',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={handleClick}
      role="menuitem"
      aria-disabled={!isEnabled}
    >
      <MenuIcon name={item.icon} />
      <span className="context-menu-label">{item.label}</span>
      {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
    </div>
  );
});

ActionItem.displayName = 'ActionItem';

// ─── Submenu Item Component ──────────────────────────────────────────────────

interface SubmenuItemProps {
  item: ContextMenuSubmenu;
  context: ContextMenuContext;
}

const SubmenuItem = memo<SubmenuItemProps>(({ item, context }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEnabled = resolveCondition(item.enabled, context, true);

  // Show submenu on hover with small delay
  const handleMouseEnter = useCallback(() => {
    if (!isEnabled) return;
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSubmenu(true);
    }, 100);
  }, [isEnabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small delay before hiding to allow moving to submenu
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSubmenu(false);
    }, 100);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Calculate submenu position
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!showSubmenu || !itemRef.current) return;

    const rect = itemRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimate submenu size (will adjust on actual render)
    const estimatedWidth = 200;
    const estimatedHeight = item.children.length * 32;

    let x = rect.right;
    let y = rect.top - 4;

    // If would overflow right, open to the left
    if (x + estimatedWidth > viewportWidth - 8) {
      x = rect.left - estimatedWidth;
    }

    // If would overflow bottom, adjust up
    if (y + estimatedHeight > viewportHeight - 8) {
      y = viewportHeight - estimatedHeight - 8;
    }
    y = Math.max(8, y);

    setSubmenuPosition({ x, y });
  }, [showSubmenu, item.children.length]);

  const classNames = [
    'context-menu-item',
    !isEnabled && 'disabled',
    isHovered && 'hover',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={itemRef}
      className={classNames}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="menuitem"
      aria-haspopup="true"
      aria-expanded={showSubmenu}
      aria-disabled={!isEnabled}
    >
      <MenuIcon name={item.icon} />
      <span className="context-menu-label">{item.label}</span>
      <span className="context-menu-arrow">
        <Icons.ChevronRight size={14} />
      </span>

      {/* Render submenu via portal */}
      {showSubmenu &&
        createPortal(
          <div
            className="context-menu-submenu"
            style={{
              left: submenuPosition.x,
              top: submenuPosition.y,
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              setShowSubmenu(true);
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              setShowSubmenu(false);
              setIsHovered(false);
            }}
          >
            {item.children.map((child) => (
              <ContextMenuItem key={child.id} item={child} context={context} />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
});

SubmenuItem.displayName = 'SubmenuItem';

// ─── Main Context Menu Item Component ────────────────────────────────────────

interface ContextMenuItemProps {
  item: MenuItemType;
  context: ContextMenuContext;
}

export const ContextMenuItem = memo<ContextMenuItemProps>(({ item, context }) => {
  if (isSeparator(item)) {
    return <Separator />;
  }

  if (isSubmenu(item)) {
    return <SubmenuItem item={item} context={context} />;
  }

  if (isActionItem(item)) {
    return <ActionItem item={item} context={context} />;
  }

  return null;
});

ContextMenuItem.displayName = 'ContextMenuItem';

export default ContextMenuItem;
