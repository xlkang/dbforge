import { useEffect, useRef, useState } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';

interface ERDiagramProps {
  width?: number;
  height?: number;
}

interface TableNode {
  name: string;
  x: number;
  y: number;
  columns: { name: string; type: string; pk: boolean }[];
  width: number;
  height: number;
}

export function ERDiagram({ width = 800, height = 600 }: ERDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tables, tableColumns, connection } = useDatabaseStore();
  const [nodes, setNodes] = useState<TableNode[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Generate initial layout
  useEffect(() => {
    if (tables.length === 0) return;

    const cols = Math.ceil(Math.sqrt(tables.length));
    const nodeWidth = 180;
    const nodeHeight = 120;
    const padding = 40;

    const newNodes: TableNode[] = tables.map((table, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      return {
        name: table.name,
        x: col * (nodeWidth + padding) + padding,
        y: row * (nodeHeight + padding) + padding,
        columns: tableColumns.slice(0, 4).map(tc => ({
          name: tc.name,
          type: tc.type,
          pk: tc.pk || false,
        })),
        width: nodeWidth,
        height: nodeHeight,
      };
    });

    setNodes(newNodes);
  }, [tables, tableColumns, connection]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw table nodes
    nodes.forEach(node => {
      const isSelected = node.name === selectedTable;
      
      // Table header
      ctx.fillStyle = isSelected ? '#3b82f6' : '#4b5563';
      ctx.fillRect(node.x, node.y, node.width, 28);
      
      // Table name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(node.name, node.x + 10, node.y + 18);
      
      // Table body
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(node.x, node.y + 28, node.width, node.height - 28);
      
      // Border
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
      ctx.lineWidth = 2;
      ctx.strokeRect(node.x, node.y, node.width, node.height);
      
      // Columns
      ctx.font = '12px monospace';
      node.columns.forEach((col, i) => {
        const y = node.y + 48 + i * 18;
        
        // PK indicator
        if (col.pk) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('🔑', node.x + 8, y);
        }
        
        // Column name
        ctx.fillStyle = '#e5e7eb';
        ctx.fillText(col.name, node.x + 28, y);
        
        // Column type
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(col.type.substring(0, 12), node.x + 100, y);
      });
    });
  }, [nodes, selectedTable, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a node
    for (const node of nodes) {
      if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
        setSelectedTable(node.name);
        setDragging(node.name);
        setOffset({ x: x - node.x, y: y - node.y });
        return;
      }
    }

    setSelectedTable(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;

    setNodes(prev => prev.map(node => 
      node.name === dragging ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  if (!connection) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        请先连接数据库
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-[var(--border-color)] rounded cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-2 right-2 text-xs text-[var(--text-muted)]">
        共 {tables.length} 张表 • 点击选中 • 拖拽移动
      </div>
    </div>
  );
}
