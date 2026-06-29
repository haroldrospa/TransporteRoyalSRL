import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EntregasFilters } from './EntregasFilters';
import { Conduce } from '@/types/conduces';

interface EntregasSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
  totalResults?: number;
  isFiltered?: boolean;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedLab: string;
  onLabChange: (lab: string) => void;
  onClearFilters: () => void;
  allConduces: Conduce[];
}

export const EntregasSearchBar = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  totalResults,
  isFiltered = false,
  selectedCity,
  onCityChange,
  selectedLab,
  onLabChange,
  onClearFilters,
  allConduces
}: EntregasSearchBarProps) => {
  return <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por número de conduce, cliente, ciudad, razón social..." className="pl-10 h-12 text-base bg-background border-2 focus:border-primary" value={searchTerm} onChange={e => onSearchChange(e.target.value)} />
        </div>
        
        {searchTerm && <Button variant="outline" size="lg" onClick={onClearSearch} className="h-12 px-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>}
      </div>

      {/* Filters */}
      <EntregasFilters 
        selectedCity={selectedCity} 
        onCityChange={onCityChange} 
        selectedLab={selectedLab}
        onLabChange={onLabChange}
        onClearFilters={onClearFilters} 
        allConduces={allConduces} 
      />

      {/* Search Results Info */}
      
    </div>;
};