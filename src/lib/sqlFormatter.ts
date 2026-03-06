// 简单的 SQL 格式化函数
export function formatSQL(sql: string): string {
  if (!sql) return '';
  
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
    'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
    'INNER JOIN', 'OUTER JOIN', 'ON', 'AS', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE',
    'DROP TABLE', 'INDEX', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL',
    'DEFAULT', 'UNIQUE', 'CHECK', 'CONSTRAINT', 'CASCADE'
  ];
  
  // 大写关键字
  let formatted = sql;
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  });
  
  // 换行
  const lineBreaks = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
    'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'];
  
  lineBreaks.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${kw}`);
  });
  
  // 缩进
  formatted = formatted
    .split('\n')
    .map((line, i) => {
      if (i === 0) return line.trim();
      if (line.includes('WHERE') || line.includes('AND') || line.includes('OR')) {
        return '  ' + line.trim();
      }
      return '    ' + line.trim();
    })
    .join('\n')
    .trim();
  
  return formatted;
}