import React, { useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInfiniteScroll } from '@/hooks/lazy/useInfiniteScroll';
import { LazyLoadingState, LoadMoreIndicator, EmptyState } from './LazyLoadingState';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface LazyTableColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  width?: string;
  className?: string;
}

interface LazyTableProps<T> {
  data: T[];
  columns: LazyTableColumn<T>[];
  loading: boolean;
  loadingMore: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  enableInfiniteScroll?: boolean;
  className?: string;
}

export function LazyTable<T extends { id: string }>({
  data,
  columns,
  loading,
  loadingMore,
  hasNextPage,
  onLoadMore,
  onRefresh,
  error,
  emptyTitle,
  emptyDescription,
  emptyAction,
  enableInfiniteScroll = true,
  className = ''
}: LazyTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const { loadingRef } = useInfiniteScroll({
    hasNextPage,
    loading: loadingMore,
    onLoadMore,
    enabled: enableInfiniteScroll
  });

  // Show initial loading state
  if (loading && data.length === 0) {
    return <LazyLoadingState type="table" count={8} message="Cargando datos..." />;
  }

  // Show error state
  if (error && data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-destructive mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`} ref={tableContainerRef}>
      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {data.length} elementos
            {hasNextPage && ` de muchos más`}
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={loading || loadingMore}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading || loadingMore ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.className}
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={item.id}
                className="hover:bg-muted/20 transition-colors border-b border-border/30"
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${item.id}-${column.key}`}
                    className={column.className}
                  >
                    {column.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Loading more indicator */}
      <div ref={loadingRef}>
        <LoadMoreIndicator
          loading={loadingMore}
          hasMore={hasNextPage}
          onLoadMore={enableInfiniteScroll ? undefined : onLoadMore}
        />
      </div>

      {/* Error notification for load more */}
      {error && data.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-destructive mb-2">Error al cargar más datos</p>
          <Button onClick={onLoadMore} variant="outline" size="sm">
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}