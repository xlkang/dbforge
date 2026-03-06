import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from '../../stores/tabStore';

describe('tabStore', () => {
  beforeEach(() => {
    useTabStore.setState({ tabs: [], activeTabId: null });
  });

  it('should add a tab', () => {
    const { addTab } = useTabStore.getState();
    addTab({ type: 'query', title: 'Query 1' });
    expect(useTabStore.getState().tabs.length).toBe(1);
  });

  it('should remove a tab', () => {
    const { addTab, removeTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Query 1' });
    removeTab(id);
    expect(useTabStore.getState().tabs.length).toBe(0);
  });

  it('should set active tab', () => {
    const { addTab, setActiveTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Query 1' });
    setActiveTab(id);
    expect(useTabStore.getState().activeTabId).toBe(id);
  });
});
