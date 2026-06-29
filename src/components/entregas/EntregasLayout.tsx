import { ReactNode } from 'react';

interface EntregasLayoutProps {
  header: ReactNode;
  stats: ReactNode;
  search: ReactNode;
  content: ReactNode;
  alerts?: ReactNode;
  loading?: boolean;
}

export const EntregasLayout = ({ 
  header, 
  stats, 
  search, 
  content,
  alerts,
  loading = false 
}: EntregasLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          {header}
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts Section */}
        {alerts && (
          <div>
            {alerts}
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          {stats}
        </div>

        {/* Search and Filters */}
        {search && (
          <div className="bg-card rounded-lg border shadow-sm p-4">
            {search}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-card rounded-lg border shadow-sm">
          {content}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Actualizando...</p>
          </div>
        </div>
      )}
    </div>
  );
};