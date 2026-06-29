import { MapPin, X, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Conduce } from '@/types/conduces';

interface EntregasFiltersProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedLab: string;
  onLabChange: (lab: string) => void;
  onClearFilters: () => void;
  allConduces: Conduce[];
}

export const EntregasFilters = ({
  selectedCity,
  onCityChange,
  selectedLab,
  onLabChange,
  onClearFilters,
  allConduces
}: EntregasFiltersProps) => {
  // Get unique cities from all conduces
  const uniqueCities = Array.from(
    new Set(
      allConduces
        .map(conduce => conduce.ciudad)
        .filter(Boolean)
        .filter(city => city.trim() !== '')
    )
  ).sort();

  const laboratories = ['LAM', 'Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica'];
  const hasActiveFilters = selectedCity !== '' || selectedLab !== '';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
        
        {/* City Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={selectedCity ? "default" : "outline"} 
              size="sm" 
              className="h-8"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {selectedCity || "Ciudad"}
              {selectedCity && (
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:bg-muted rounded-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCityChange('');
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar ciudad..." />
              <CommandList>
                <CommandEmpty>No se encontraron ciudades.</CommandEmpty>
                <CommandGroup>
                  {uniqueCities.map((city) => (
                    <CommandItem
                      key={city}
                      value={city}
                      onSelect={() => onCityChange(city)}
                      className="cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Lab Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={selectedLab ? "default" : "outline"} 
              size="sm" 
              className="h-8"
            >
              <FlaskConical className="h-3 w-3 mr-1" />
              {selectedLab || "Laboratorio"}
              {selectedLab && (
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer hover:bg-muted rounded-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLabChange('');
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {laboratories.map((lab) => (
                    <CommandItem
                      key={lab}
                      value={lab}
                      onSelect={() => onLabChange(lab)}
                      className="cursor-pointer"
                    >
                      <FlaskConical className="h-4 w-4 mr-2" />
                      {lab}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCity && (
              <Badge variant="secondary" className="text-xs">
                Ciudad: {selectedCity}
              </Badge>
            )}
            {selectedLab && (
              <Badge variant="secondary" className="text-xs">
                Lab: {selectedLab}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpiar filtros
            </Button>
          </div>
        </>
      )}
    </div>
  );
};