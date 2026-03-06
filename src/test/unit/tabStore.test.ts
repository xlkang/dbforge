import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from '../../stores/tabStore';

describe('tabStore', () => {
  beforeEach(() => {
    // 重置 store
    useTabStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  it('should add a tab', () => {
    const { addTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Query 1' });
    
    const { tabs } = useTabStore.getState();
    expect(tabs.length).toBe(1);
    expect(tabs[0].title).toBe('Query 1');
    expect(id).toBeDefined();
  });

  it('should remove a tab', () => {
    const { addTab, removeTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Query 1' });
    
    removeTab(id);
    
    const { tabs } = useTabStore.getState();
    expect(tabs.length).toBe(0);
  });

  it('should set active tab', () => {
    const { addTab, setActiveTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Query 1' });
    addTab({ type: 'query', title: 'Query 2' });
    
    setActiveTab(id);
    
    const { activeTabId } = useTabStore.getState();
    expect(activeTabId).toBe(id);
  });

  it('should update tab', () => {
    const { addTab, updateTab } = useTabStore.getState();
    const id = addTab({ type: 'query', title: 'Original' });
    
    updateTab(id, { title: 'Updated' });
    
    const { tabs } = useTabStore.getState();
    expect(tabs[0].title).toBe('Updated');
  });

  it('should add multiple tabs without limit', () => {
    const { addTab } = useTabStore.getState();
    
    for (let i = 1; i <= 12; i++) {
      addTab({ type: 'query', title: `Query ${i}` });
    }
    
    const { tabs } = useTabStore.getState();
    // Currently no limit, tabs can be added indefinitely
    expect(tabs.length).toBe(12);
  });
});
