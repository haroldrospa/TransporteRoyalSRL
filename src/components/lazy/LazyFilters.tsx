import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter, Calendar } from 'lucide-react';
import { LazyDataFilters } from '@/services/lazy/lazyDataService';
import { useDebounce } from 'use-debounce';

interface LazyFiltersProps {
  onFiltersChange: (filters: LazyDataFilters) => void;
  loading?: boolean;
  enabledFilters?: ('search' | 'region' | 'estado' | 'encomendado' | 'dateRange' | 'prioridad')[];
  placeholder?: string;
  className?: string;
}

export const LazyFilters = ({
  onFiltersChange,
  loading = false,
  enabledFilters = ['search', 'estado', 'encomendado'],
  placeholder = "Buscar por número, cliente, razón social...",
  className = ''
}: LazyFiltersProps) => {
  const [filters, setFilters] = useState<LazyDataFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search to avoid too many API calls
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // Apply filters when debounced search changes
  useEffect(() => {
    const newFilters = { ...filters, search: debouncedSearchTerm || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [debouncedSearchTerm]);

  const updateFilter = useCallback((key: keyof LazyDataFilters, value: any) => {
    const newFilters = { 
      ...filters, 
      [key]: value === '' || value === undefined ? undefined : value 
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    onFiltersChange({});
  }, [onFiltersChange]);

  const getActiveFiltersCount = useCallback(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={`border-border/50 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search */}
          {enabledFilters.includes('search') && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
                disabled={loading}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Region filter */}
            {enabledFilters.includes('region') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Región:</span>
                <Select 
                  value={filters.region || ''} 
                  onValueChange={(value) => updateFilter('region', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Sur">Sur</SelectItem>
                    <SelectItem value="Este">Este</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Estado filter */}
            {enabledFilters.includes('estado') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Estado:</span>
                <Select 
                  value={filters.estado || ''} 
                  onValueChange={(value) => updateFilter('estado', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="En tránsito">En tránsito</SelectItem>
                    <SelectItem value="Entregado">Entregado</SelectItem>
                    <SelectItem value="Devuelto">Devuelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Encomendado filter */}
            {enabledFilters.includes('encomendado') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Camión:</span>
                <Select 
                  value={filters.encomendado || ''} 
                  onValueChange={(value) => updateFilter('encomendado', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="R-03">R-03</SelectItem>
                    <SelectItem value="R-04">R-04</SelectItem>
                    <SelectItem value="R-05">R-05</SelectItem>
                    <SelectItem value="R-06">R-06</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prioridad filter */}
            {enabledFilters.includes('prioridad') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Prioridad:</span>
                <Select 
                  value={filters.prioridad?.toString() || ''} 
                  onValueChange={(value) => updateFilter('prioridad', value === 'true')}
                  disabled={loading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="true">Prioritarias</SelectItem>
                    <SelectItem value="false">Normales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={loading}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground">Filtros activos:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let displayValue = value;
                if (key === 'prioridad') {
                  displayValue = value ? 'Prioritarias' : 'Normales';
                }
                
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => updateFilter(key as keyof LazyDataFilters, undefined)}
                  >
                    {key}: {displayValue.toString()}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};