import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '../../stores/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // 重置 store
    useToastStore.setState({
      toasts: [],
    });
  });

  it('should add a toast', () => {
    const { addToast } = useToastStore.getState();
    addToast('Test message', 'info');
    
    const { toasts } = useToastStore.getState();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('info');
  });

  it('should add toast with default type', () => {
    const { addToast } = useToastStore.getState();
    addToast('Default type');
    
    const { toasts } = useToastStore.getState();
    expect(toasts[0].type).toBe('info');
  });

  it('should remove a toast', () => {
    const { addToast, removeToast } = useToastStore.getState();
    addToast('Test', 'info');
    
    const { toasts: initial } = useToastStore.getState();
    const id = initial[0].id;
    
    removeToast(id);
    
    const { toasts } = useToastStore.getState();
    expect(toasts.length).toBe(0);
  });

  it('should support different toast types', () => {
    const { addToast } = useToastStore.getState();
    
    addToast('Info message', 'info');
    addToast('Success message', 'success');
    addToast('Warning message', 'warning');
    addToast('Error message', 'error');
    
    const { toasts } = useToastStore.getState();
    expect(toasts.length).toBe(4);
    expect(toasts.map(t => t.type)).toEqual(['info', 'success', 'warning', 'error']);
  });

  it('should generate unique ids for toasts', () => {
    const { addToast } = useToastStore.getState();
    
    addToast('First', 'info');
    addToast('Second', 'info');
    
    const { toasts } = useToastStore.getState();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
