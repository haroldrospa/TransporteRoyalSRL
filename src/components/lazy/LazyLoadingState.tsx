import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LazyLoadingStateProps {
  type?: 'table' | 'cards' | 'stats' | 'minimal';
  count?: number;
  message?: string;
}

export const LazyLoadingState = ({ 
  type = 'table', 
  count = 5,
  message = 'Cargando datos...'
}: LazyLoadingStateProps) => {
  if (type === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default table loading
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      
      <div className="rounded-lg border border-border/50 bg-card">
        {/* Table header */}
        <div className="flex items-center gap-4 p-4 border-b border-border/50">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        
        {/* Table rows */}
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-b-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface LoadMoreIndicatorProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore?: () => void;
}

export const LoadMoreIndicator = ({ loading, hasMore, onLoadMore }: LoadMoreIndicatorProps) => {
  if (!hasMore && !loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No hay más datos para mostrar</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando más datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <button
        onClick={onLoadMore}
        className="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        Cargar más datos
      </button>
    </div>
  );
};

export const EmptyState = ({ 
  title = "No hay datos disponibles",
  description = "No se encontraron resultados para mostrar.",
  action
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};