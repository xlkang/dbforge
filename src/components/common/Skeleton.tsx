import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = ''
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
      </div>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <Skeleton width={100} />
          <Skeleton width={100} />
          <Skeleton width={80} />
          <Skeleton width={60} />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3">
            <Skeleton width={100} />
            <Skeleton width={100} />
            <Skeleton width={80} />
            <Skeleton width={60} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SchemaSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton width={16} height={16} borderRadius="50%" />
          <Skeleton width="60%" height={16} />
        </div>
      ))}
    </div>
  );
};

export const QueryResultSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={28} className="flex-1" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-1">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} height={24} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
