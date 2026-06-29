import React, { memo, useMemo } from 'react';
import { calculateTransitTime } from '@/utils/time/transitTime';

interface LazyTransitTimeDisplayProps {
  fechaEntrega: string;
  estado: string;
}

export const LazyTransitTimeDisplay = memo(({ fechaEntrega, estado }: LazyTransitTimeDisplayProps) => {
  const transitInfo = useMemo(() => {
    return calculateTransitTime(fechaEntrega);
  }, [fechaEntrega]);

  const getTimeColor = useMemo(() => {
    switch (transitInfo.status) {
      case 'normal':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-200/50';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border border-amber-200/50';
      case 'expired':
        return 'text-rose-700 bg-rose-50 border border-rose-200/50';
      default:
        return 'text-slate-700 bg-slate-50 border border-slate-200/50';
    }
  }, [transitInfo.status]);

  // Only show transit time for "En tránsito" status
  if (estado !== 'En tránsito') {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  return (
    <div className={`px-2.5 py-0.5 rounded-md text-xs font-bold inline-flex items-center ${getTimeColor}`}>
      {transitInfo.displayText}
    </div>
  );
});

LazyTransitTimeDisplay.displayName = 'LazyTransitTimeDisplay';