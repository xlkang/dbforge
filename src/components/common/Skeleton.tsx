// 骨架屏加载效果组件
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height, 
  animation = 'pulse' 
}: SkeletonProps) {
  const baseClasses = 'bg-[var(--bg-hover)]';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };
  
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// 表格式骨架屏
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-2">
      {/* 表头 */}
      <div className="flex gap-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="32px" className="flex-1" />
        ))}
      </div>
      {/* 表行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="28px" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// 卡片骨架屏
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 space-y-3">
      <Skeleton height="24px" width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" />
      ))}
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-1">
            <Skeleton height="14px" width="40%" />
            <Skeleton height="12px" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 内容区域骨架屏
export function ContentSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton height="28px" width="200px" />
        <Skeleton height="36px" width="100px" />
      </div>
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}

// Schema 面板骨架屏
export function SchemaSkeleton() {
  return (
    <div className="p-2 space-y-2">
      <Skeleton height="20px" width="80px" />
      <ListSkeleton items={8} />
    </div>
  );
}
