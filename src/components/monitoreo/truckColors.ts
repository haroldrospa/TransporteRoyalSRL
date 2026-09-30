// Configuración de colores para cada camión en el mapa y en la lista de flota
export interface TruckColorConfig {
  bg: string;
  border: string;
  text: string;
  hex: string;
}

export const TRUCK_COLORS: Record<string, TruckColorConfig> = {
  'R-01': { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', hex: '#2563eb' },
  'R-02': { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', hex: '#4f46e5' },
  'R-03': { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', hex: '#059669' },
  'R-04': { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', hex: '#d97706' },
  'R-05': { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700', hex: '#7c3aed' },
  'R-06': { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-700', hex: '#e11d48' },
  'R-07': { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', hex: '#0891b2' },
  'R-08': { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', hex: '#ea580c' },
  'R-09': { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-700', hex: '#0d9488' },
  'C-01': { bg: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-700', hex: '#6d28d9' },
};

export const getTruckColor = (truckName?: string | null): TruckColorConfig => {
  if (!truckName) {
    return { bg: 'bg-slate-100', border: 'border-slate-500', text: 'text-slate-700', hex: '#64748b' };
  }
  const clean = truckName.trim().toUpperCase();
  return TRUCK_COLORS[clean] || { bg: 'bg-slate-100', border: 'border-slate-500', text: 'text-slate-700', hex: '#475569' };
};
