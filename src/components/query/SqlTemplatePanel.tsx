import { useState } from 'react';
import { BookTemplate, X, Copy, Check } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { useDatabaseStore } from '../../stores/databaseStore';

interface SqlTemplate {
  name: string;
  category: string;
  sql: string;
  description: string;
}

const SQL_TEMPLATES: SqlTemplate[] = [
  // 查询类
  { name: '查询所有数据', category: '查询', sql: 'SELECT * FROM ${table} LIMIT 100', description: '查询表的前100条数据' },
  { name: '统计记录数', category: '查询', sql: 'SELECT COUNT(*) as total FROM ${table}', description: '统计表的总记录数' },
  { name: '去重查询', category: '查询', sql: 'SELECT DISTINCT ${column} FROM ${table}', description: '查询不重复的值' },
  { name: '分页查询', category: '查询', sql: 'SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset}', description: '分页查询数据' },
  
  // 筛选类
  { name: '条件查询', category: '筛选', sql: 'SELECT * FROM ${table} WHERE ${column} = \'${value}\'', description: '按条件查询数据' },
  { name: '模糊搜索', category: '筛选', sql: 'SELECT * FROM ${table} WHERE ${column} LIKE \'%${keyword}%\'', description: '模糊匹配搜索' },
  { name: '范围查询', category: '筛选', sql: 'SELECT * FROM ${table} WHERE ${column} BETWEEN ${start} AND ${end}', description: '范围查询' },
  { name: '空值查询', category: '筛选', sql: 'SELECT * FROM ${table} WHERE ${column} IS NULL', description: '查询空值记录' },
  
  // 排序类
  { name: '升序排列', category: '排序', sql: 'SELECT * FROM ${table} ORDER BY ${column} ASC', description: '按指定字段升序' },
  { name: '降序排列', category: '排序', sql: 'SELECT * FROM ${table} ORDER BY ${column} DESC', description: '按指定字段降序' },
  { name: '多字段排序', category: '排序', sql: 'SELECT * FROM ${table} ORDER BY ${column1} ASC, ${column2} DESC', description: '多字段组合排序' },
  
  // 聚合类
  { name: '分组统计', category: '聚合', sql: 'SELECT ${column}, COUNT(*) as count FROM ${table} GROUP BY ${column}', description: '分组统计数量' },
  { name: '求和计算', category: '聚合', sql: 'SELECT SUM(${column}) as total FROM ${table}', description: '求和计算' },
  { name: '平均值', category: '聚合', sql: 'SELECT AVG(${column}) as avg FROM ${table}', description: '计算平均值' },
  { name: '最大最小值', category: '聚合', sql: 'SELECT MAX(${column}) as max, MIN(${column}) as min FROM ${table}', description: '查询最大最小值' },
  
  // 表结构
  { name: '查看表结构', category: '表结构', sql: 'PRAGMA table_info(${table})', description: '查看表的所有字段信息' },
  { name: '查看索引', category: '表结构', sql: 'PRAGMA index_list(${table})', description: '查看表的索引列表' },
  { name: '查看创建语句', category: '表结构', sql: 'SELECT sql FROM sqlite_master WHERE type=\'table\' AND name=\'${table}\'', description: '查看表的创建语句' },
];

interface SqlTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sql: string) => void;
}

export function SqlTemplatePanel({ isOpen, onClose, onSelect }: SqlTemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  const categories = ['全部', ...Array.from(new Set(SQL_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = SQL_TEMPLATES.filter(t => {
    const matchesCategory = selectedCategory === '全部' || t.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = async (template: SqlTemplate) => {
    await navigator.clipboard.writeText(template.sql);
    setCopiedId(template.name);
    addToast(`已复制: ${template.name}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <BookTemplate className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">SQL 模板</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-[var(--border-color)] space-y-3">
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3">
            {filteredTemplates.map(template => (
              <div
                key={template.name}
                className="p-3 bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]/30 hover:border-[var(--accent)]/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded">
                      {template.category}
                    </span>
                    <h3 className="text-sm font-medium text-[var(--text-primary)] mt-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {template.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(template)}
                    className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                    title="复制"
                  >
                    {copiedId === template.name ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </button>
                </div>
                <code className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded block overflow-x-auto">
                  {template.sql}
                </code>
                <button
                  onClick={() => {
                    onSelect(template.sql);
                    onClose();
                  }}
                  className="mt-2 w-full py-1.5 text-xs bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] rounded transition-colors"
                >
                  使用此模板
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for using SQL templates
export function useSqlTemplates() {
  const [isOpen, setIsOpen] = useState(false);
  const setQuery = useDatabaseStore((s) => s.setQuery);
  
  const handleSelect = (templateSql: string) => {
    setQuery(templateSql);
  };
  
  return {
    isOpen,
    setIsOpen,
    handleSelect,
    SqlTemplatePanel: () => (
      <SqlTemplatePanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSelect={handleSelect}
      />
    ),
  };
}
