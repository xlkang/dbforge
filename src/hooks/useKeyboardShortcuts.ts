import { useEffect, useCallback } from 'react';

interface KeyCombo {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

type KeyboardAction = 'executeQuery' | 'saveQuery' | 'clearEditor' | 'toggleComment' | 'closeModal' | 'toggleHistory' | 'formatSql' | 'copyResults' | 'openCommandPalette' | 'toggleTheme' | 'focusSearch' | 'nextTab' | 'prevTab' | 'newTab' | 'closeTab';

interface ShortcutConfig {
  combo: KeyCombo;
  action: KeyboardAction;
}

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { combo: { key: 'Enter', ctrl: true }, action: 'executeQuery' },
  { combo: { key: 's', ctrl: true }, action: 'saveQuery' },
  { combo: { key: 'l', ctrl: true }, action: 'clearEditor' },
  { combo: { key: '/', ctrl: true }, action: 'toggleComment' },
  { combo: { key: 'Escape' }, action: 'closeModal' },
  { combo: { key: 'h', ctrl: true }, action: 'toggleHistory' },
  { combo: { key: 'd', ctrl: true, shift: true }, action: 'formatSql' },
  { combo: { key: 'c', ctrl: true, shift: true }, action: 'copyResults' },
  { combo: { key: 'k', ctrl: true }, action: 'openCommandPalette' },
  { combo: { key: 't', ctrl: true }, action: 'toggleTheme' },
  { combo: { key: 'f', ctrl: true }, action: 'focusSearch' },
  { combo: { key: 'Tab', ctrl: true }, action: 'nextTab' },
  { combo: { key: 'Tab', ctrl: true, shift: true }, action: 'prevTab' },
  { combo: { key: 't', ctrl: true, shift: true }, action: 'newTab' },
  { combo: { key: 'w', ctrl: true }, action: 'closeTab' },
];

function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const matchesKey = event.key.toLowerCase() === combo.key.toLowerCase() || 
    (combo.key === ' ' && event.key === ' ');
  const matchesCtrl = !!combo.ctrl === (event.ctrlKey || event.metaKey);
  const matchesShift = !!combo.shift === event.shiftKey;
  const matchesAlt = !!combo.alt === event.altKey;
  
  return matchesKey && matchesCtrl && matchesShift && matchesAlt;
}

interface UseKeyboardShortcutOptions {
  onExecuteQuery?: () => void;
  onSaveQuery?: () => void;
  onClearEditor?: () => void;
  onToggleComment?: () => void;
  onCloseModal?: () => void;
  onToggleHistory?: () => void;
  onFormatSql?: () => void;
  onCopyResults?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleTheme?: () => void;
  onFocusSearch?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onNewTab?: () => void;
  onCloseTab?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onExecuteQuery,
  onSaveQuery,
  onClearEditor,
  onToggleComment,
  onCloseModal,
  onToggleHistory,
  onFormatSql,
  onCopyResults,
  onOpenCommandPalette,
  onToggleTheme,
  onFocusSearch,
  onNextTab,
  onPrevTab,
  onNewTab,
  onCloseTab,
  enabled = true,
}: UseKeyboardShortcutOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    for (const { combo, action } of DEFAULT_SHORTCUTS) {
      if (matchesKeyCombo(event, combo)) {
        const inputAllowed = ['toggleComment', 'clearEditor'].includes(action);
        
        if (isInput && !inputAllowed) continue;
        
        switch (action) {
          case 'executeQuery':
            event.preventDefault();
            onExecuteQuery?.();
            break;
          case 'saveQuery':
            event.preventDefault();
            onSaveQuery?.();
            break;
          case 'clearEditor':
            event.preventDefault();
            onClearEditor?.();
            break;
          case 'toggleComment':
            event.preventDefault();
            onToggleComment?.();
            break;
          case 'closeModal':
            if (!isInput) {
              event.preventDefault();
              onCloseModal?.();
            }
            break;
          case 'toggleHistory':
            event.preventDefault();
            onToggleHistory?.();
            break;
          case 'formatSql':
            event.preventDefault();
            onFormatSql?.();
            break;
          case 'copyResults':
            event.preventDefault();
            onCopyResults?.();
            break;
          case 'openCommandPalette':
            event.preventDefault();
            onOpenCommandPalette?.();
            break;
          case 'toggleTheme':
            event.preventDefault();
            onToggleTheme?.();
            break;
          case 'focusSearch':
            event.preventDefault();
            onFocusSearch?.();
            break;
          case 'nextTab':
            event.preventDefault();
            onNextTab?.();
            break;
          case 'prevTab':
            event.preventDefault();
            onPrevTab?.();
            break;
          case 'newTab':
            event.preventDefault();
            onNewTab?.();
            break;
          case 'closeTab':
            event.preventDefault();
            onCloseTab?.();
            break;
        }
        break;
      }
    }
  }, [enabled, onExecuteQuery, onSaveQuery, onClearEditor, onToggleComment, onCloseModal, onToggleHistory, onFormatSql, onCopyResults, onOpenCommandPalette, onToggleTheme, onFocusSearch, onNextTab, onPrevTab, onNewTab, onCloseTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function getShortcutDisplay(action: KeyboardAction): string {
  const shortcuts: Record<KeyboardAction, string> = {
    executeQuery: 'Ctrl + Enter',
    saveQuery: 'Ctrl + S',
    clearEditor: 'Ctrl + L',
    toggleComment: 'Ctrl + /',
    closeModal: 'Escape',
    toggleHistory: 'Ctrl + H',
    formatSql: 'Ctrl + Shift + D',
    copyResults: 'Ctrl + Shift + C',
    openCommandPalette: 'Ctrl + K',
    toggleTheme: 'Ctrl + T',
    focusSearch: 'Ctrl + F',
    nextTab: 'Ctrl + Tab',
    prevTab: 'Ctrl + Shift + Tab',
    newTab: 'Ctrl + Shift + T',
    closeTab: 'Ctrl + W',
  };
  return shortcuts[action] || '';
}
