import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { useDatabaseStore } from '../../stores/databaseStore';
import { BarChart3, LineChartIcon, PieChartIcon, Table, X } from 'lucide-react';

type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'table';

const COLORS = ['#00a8e8', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

interface ChartPanelProps {
  onClose?: () => void;
}

export function ChartPanel({ onClose }: ChartPanelProps) {
  const { queryResult } = useDatabaseStore();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');

  // 获取可用的列
  const columns = queryResult?.columns || [];
  
  // 自动选择 x 和 y 轴
  useMemo(() => {
    if (columns.length > 0 && !xAxis) {
      setXAxis(columns[0]);
    }
    if (columns.length > 1 && !yAxis) {
      // 尝试选择一个数值列
      const numericCol = columns.find(col => 
        queryResult?.rows?.some((row: any) => typeof row[col] === 'number')
      );
      setYAxis(numericCol || columns[1]);
    }
  }, [columns]);

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!queryResult?.rows?.length || !xAxis) return [];
    
    return queryResult.rows.slice(0, 100).map((row: any) => ({
      name: row[xAxis]?.toString() || 'Unknown',
      value: yAxis ? Number(row[yAxis]) || 0 : 1,
      ...Object.fromEntries(
        columns.map(col => [col, row[col]])
      )
    }));
  }, [queryResult, xAxis, yAxis, columns]);

  if (!queryResult || !queryResult.isSelect || !queryResult.rows?.length) {
    return (
      <div className="p-4 text-center text-[var(--text-muted)]">
        <p>暂无查询结果，请先执行 SELECT 查询</p>
      </div>
    );
  }

  const renderChart = () => {
    if (!chartData.length) return null;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00a8e8" 
                strokeWidth={2}
                dot={{ fill: '#00a8e8', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name={yAxis || '数值'}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#00a8e8" radius={[4, 4, 0, 0]} name={yAxis || '数值'} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#00a8e8" 
                fill="#00a8e8" 
                fillOpacity={0.3}
                name={yAxis || '数值'}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 图表工具栏 */}
      <div className="flex items-center gap-4 p-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-md p-1">
          <button
            onClick={() => setChartType('table')}
            className={`p-1.5 rounded ${chartType === 'table' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            title="表格视图"
          >
            <Table size={16} />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded ${chartType === 'line' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            title="折线图"
          >
            <LineChartIcon size={16} />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            title="柱状图"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded ${chartType === 'area' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            title="面积图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M3 15l4-4 4 4 6-6 4 4" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            title="饼图"
          >
            <PieChartIcon size={16} />
          </button>
        </div>

        {/* 轴选择器 */}
        {chartType !== 'table' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">X轴:</label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm px-2 py-1 rounded border border-[var(--border-color)]"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">Y轴:</label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm px-2 py-1 rounded border border-[var(--border-color)]"
              >
                <option value="">计数</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 图表内容 */}
      <div className="flex-1 p-4 overflow-auto">
        {chartType === 'table' ? (
          <div className="text-sm text-[var(--text-muted)]">
            请在数据查看器中查看表格数据
          </div>
        ) : chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="text-center text-[var(--text-muted)] py-8">
            <p>选择 X 轴和 Y 轴字段来生成图表</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartPanel;
