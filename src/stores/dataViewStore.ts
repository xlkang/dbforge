import { create } from 'zustand';

interface DataViewState {
  // Data viewer state
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filterColumn: string | null;
  filterValue: string;
  
  // Data editing
  editedRows: Map<string, Record<string, any>>;
  pendingChanges: number;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: string | null, direction: 'asc' | 'desc') => void;
  setFilter: (column: string | null, value: string) => void;
  updateEditedRow: (rowKey: string, data: Record<string, any>) => void;
  clearEdits: () => void;
}

export const useDataViewStore = create<DataViewState>((set, get) => ({
  currentPage: 1,
  pageSize: 50,
  sortColumn: null,
  sortDirection: 'asc',
  filterColumn: null,
  filterValue: '',
  
  editedRows: new Map(),
  pendingChanges: 0,
  
  setPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setSort: (column, direction) => set({ sortColumn: column, sortDirection: direction }),
  setFilter: (column, value) => set({ filterColumn: column, filterValue: value, currentPage: 1 }),
  
  updateEditedRow: (rowKey, data) => {
    const { editedRows } = get();
    const newMap = new Map(editedRows);
    newMap.set(rowKey, data);
    set({ editedRows: newMap, pendingChanges: newMap.size });
  },
  
  clearEdits: () => set({ editedRows: new Map(), pendingChanges: 0 }),
}));
