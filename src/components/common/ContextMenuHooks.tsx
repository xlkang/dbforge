import { useState } from 'react';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface UseContextMenuReturn {
  contextMenu: { x: number; y: number; items: MenuItem[] } | null;
  showContextMenu: (e: React.MouseEvent, items: MenuItem[]) => void;
  hideContextMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const showContextMenu = (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    const menuX = Math.min(e.clientX, window.innerWidth - 200);
    const menuY = Math.min(e.clientY, window.innerHeight - 300);
    setContextMenu({ x: menuX, y: menuY, items });
  };

  const hideContextMenu = () => setContextMenu(null);

  return { contextMenu, showContextMenu, hideContextMenu };
}
