import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '../../stores/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    const store = useToastStore.getState();
    store.toasts.forEach(t => store.removeToast(t.id));
  });

  it('should add a toast', () => {
    const { addToast } = useToastStore.getState();
    addToast('Test message', 'success');
    expect(useToastStore.getState().toasts.length).toBe(1);
  });

  it('should remove a toast', () => {
    const { addToast, removeToast } = useToastStore.getState();
    addToast('Test', 'info');
    const newId = useToastStore.getState().toasts[0]?.id;
    if (newId) removeToast(newId);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
