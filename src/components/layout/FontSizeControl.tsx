
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const FONT_SIZES = [
  { label: 'Pequeño', value: 13 },
  { label: 'Normal', value: 14 },
  { label: 'Mediano', value: 15 },
  { label: 'Grande', value: 16 },
  { label: 'Extra grande', value: 18 },
];

const STORAGE_KEY = 'app-font-size';

export const FontSizeControl = () => {
  const [sizeIndex, setSizeIndex] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const idx = FONT_SIZES.findIndex(s => s.value === Number(stored));
      return idx >= 0 ? idx : 1;
    }
    return 1; // Normal by default
  });

  useEffect(() => {
    const size = FONT_SIZES[sizeIndex];
    document.documentElement.style.fontSize = `${size.value}px`;
    localStorage.setItem(STORAGE_KEY, String(size.value));
  }, [sizeIndex]);

  const decrease = () => setSizeIndex(i => Math.max(0, i - 1));
  const increase = () => setSizeIndex(i => Math.min(FONT_SIZES.length - 1, i + 1));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/50" aria-label="Tamaño de letra">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2">Tamaño de letra</p>
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={decrease} disabled={sizeIndex === 0}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[70px] text-center">
            {FONT_SIZES[sizeIndex].label}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={increase} disabled={sizeIndex === FONT_SIZES.length - 1}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
