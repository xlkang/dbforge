import { useMemo, useState } from 'react';
import { X, BarChart3, PieChart, LineChart } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart as ReLineChart, Line, Legend
} from 'recharts';

interface ChartPanelProps {
  columns: string[];
  rows: Record<string, unknown>[];
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function ChartPanel({ columns, rows, onClose }: ChartPanelProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [yAxis, setYAxis] = useState(columns[1] || columns[0] || '');

  // Analyze columns for suitable chart data
  const columnStats = useMemo(() => {
    return columns.map(col => {
      const values = rows.map(r => r[col]);
      const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v))).map(v => Number(v));
      const isNumeric = numericValues.length > values.length * 0.5;
      const uniqueCount = new Set(values.map(String)).size;
      return { col, isNumeric, uniqueCount, sample: values[0] };
    });
  }, [columns, rows]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis) return [];
    
    if (chartType === 'bar' || chartType === 'line') {
      // Group by x-axis and sum y-axis
      const grouped: Record<string, number> = {};
      rows.forEach(row => {
        const xVal = String(row[xAxis] ?? 'NULL');
        const yVal = Number(row[yAxis]) || 0;
        grouped[xVal] = (grouped[xVal] || 0) + yVal;
      });
      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20); // Limit to 20 items
    } else {
      // Pie chart - show distribution
      const grouped: Record<string, number> = {};
      rows.forEach(row => {
        const xVal = String(row[xAxis] ?? 'NULL');
        grouped[xVal] = (grouped[xVal] || 0) + 1;
      });
      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
  }, [rows, xAxis, yAxis, chartType]);

  // Get numeric columns for y-axis
  const numericColumns = useMemo(() => {
    return columnStats.filter(c => c.isNumeric).map(c => c.col);
  }, [columnStats]);

  // Get categorical columns for x-axis
  const categoricalColumns = useMemo(() => {
    return columnStats.filter(c => !c.isNumeric || c.uniqueCount < 20).map(c => c.col);
  }, [columnStats]);

  return (
    <div className="absolute inset-0 bg-[var(--bg-primary)] z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-[var(--bg-primary)]/95">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[var(--accent)]" strokeWidth={2} />
          <h3 className="text-[var(--text-secondary)] font-semibold">查询结果图表</h3>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === 'bar' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            柱状图
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === 'pie' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            饼图
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === 'line' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            折线图
          </button>
        </div>

        {/* Axis Selectors */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)]">X轴:</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="px-2 py-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] focus:outline-none focus:border-blue-500/50"
            >
              {categoricalColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)]">Y轴:</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="px-2 py-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] focus:outline-none focus:border-blue-500/50"
            >
              {numericColumns.length > 0 ? numericColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              )) : (
                <option value={xAxis}>计数</option>
              )}
            </select>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-6">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" strokeWidth={1.5} />
              <p>无法生成图表，请选择合适的列</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'pie' ? (
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={200}
                  dataKey="value"
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend />
              </RePieChart>
            ) : (
              <ReLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ReLineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
