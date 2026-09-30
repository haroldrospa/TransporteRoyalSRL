import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Calendar, Save, RotateCcw, Loader2, Check, ChevronDown, ChevronUp, Sparkles, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  DIAS_SEMANA, 
  CAMIONES_DEFECTO, 
  ProgramacionSemanal, 
  PROGRAMACION_PREDETERMINADA, 
  fetchProgramacionSemanal, 
  saveProgramacionSemanal 
} from '@/services/rutasProgramacionService';

interface ProgramacionRutasChoferesProps {
  onScheduleChanged?: (newSchedule: ProgramacionSemanal) => void;
}

const ProgramacionRutasChoferes = ({ onScheduleChanged }: ProgramacionRutasChoferesProps) => {
  const [schedule, setSchedule] = useState<ProgramacionSemanal>(PROGRAMACION_PREDETERMINADA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [regionFilter, setRegionFilter] = useState<'Todas' | 'Norte' | 'Sur' | 'Este'>('Todas');

  // Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const diaHoy = new Date().getDay();
  const diaHoyInfo = DIAS_SEMANA.find(d => d.numero === diaHoy);

  useEffect(() => {
    let mounted = true;
    fetchProgramacionSemanal().then((data) => {
      if (mounted) {
        setSchedule(data);
        setLoading(false);
        if (onScheduleChanged) onScheduleChanged(data);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleChangeRoute = (camion: string, dia: number, ruta: string) => {
    setSchedule(prev => {
      const next = {
        ...prev,
        [camion]: {
          ...(prev[camion] || {}),
          [dia]: ruta
        }
      };
      setHasChanges(true);
      if (onScheduleChanged) onScheduleChanged(next);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveProgramacionSemanal(schedule);
      if (ok) {
        setHasChanges(false);
        toast({
          title: "Programación guardada",
          description: "La programación semanal de rutas ha sido actualizada con éxito.",
        });
        if (onScheduleChanged) onScheduleChanged(schedule);
      } else {
        toast({
          title: "Error al guardar",
          description: "No se pudo actualizar la programación.",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Deseas restablecer la programación a los valores predeterminados?")) {
      setSchedule(PROGRAMACION_PREDETERMINADA);
      setHasChanges(true);
      if (onScheduleChanged) onScheduleChanged(PROGRAMACION_PREDETERMINADA);
    }
  };

  const filteredTrucks = CAMIONES_DEFECTO.filter(t => 
    regionFilter === 'Todas' ? true : t.region === regionFilter
  );

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader 
        className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between cursor-pointer select-none bg-slate-50/50 dark:bg-slate-900/50" 
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-7 w-7 rounded-lg bg-royal-blue/10 dark:bg-royal-blue/20 flex items-center justify-center text-royal-blue">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Programación Semanal de Rutas (L - D)
            </CardTitle>
            {diaHoyInfo && (
              <Badge variant="outline" className="bg-royal-blue/5 text-royal-blue border-royal-blue/20 text-[10px] font-semibold px-2 py-0.5">
                Hoy: {diaHoyInfo.nombre}
              </Badge>
            )}
            {hasChanges && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                ● Cambios sin guardar
              </span>
            )}
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Haz clic en cualquier celda para cambiar la ruta asignada al chofer en cada día.
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1"
            onClick={handleReset}
            disabled={loading || saving}
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Restablecer</span>
          </Button>

          <Button
            size="sm"
            className={`h-7 text-xs font-semibold px-3 flex items-center gap-1.5 transition-all ${
              hasChanges 
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs ring-1 ring-amber-400/50' 
                : 'bg-royal-blue hover:bg-blue-700 text-white'
            }`}
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Guardar
          </Button>

          <button
            type="button"
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 ml-0.5"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-label="Alternar expansión"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {/* Barra Minimalista de Filtros y Leyenda */}
          <div className="py-2 px-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Filtro por Zona */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Zona:</span>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700">
                {(['Todas', 'Norte', 'Sur', 'Este'] as const).map(reg => {
                  const count = CAMIONES_DEFECTO.filter(t => reg === 'Todas' ? true : t.region === reg).length;
                  const isSelected = regionFilter === reg;
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setRegionFilter(reg)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {reg} <span className="text-[10px] text-slate-400">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leyenda Minimalista */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Ruta 1
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Ruta 2
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Ruta 0
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Todas
              </span>
              <span className="flex items-center gap-1">
                <span className="text-slate-300 dark:text-slate-600 font-bold">—</span> Libre
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-royal-blue mr-2" />
              <span className="text-xs text-slate-400">Cargando programación semanal...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-4 font-semibold min-w-[160px]">Chofer / Camión</th>
                    <th className="py-2 px-2 font-semibold text-center w-16">Zona</th>
                    {DIAS_SEMANA.map(d => {
                      const isToday = d.numero === diaHoy;
                      return (
                        <th 
                          key={d.numero} 
                          className={`py-2 px-1.5 text-center font-semibold min-w-[90px] transition-colors ${
                            isToday 
                              ? 'bg-royal-blue/[0.04] dark:bg-royal-blue/[0.12] text-royal-blue dark:text-blue-300 font-bold' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px]">{d.nombre}</span>
                            {isToday && (
                              <span className="h-1.5 w-1.5 rounded-full bg-royal-blue shrink-0" title="Hoy" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTrucks.map(truck => {
                    const truckSchedule = schedule[truck.camion] || PROGRAMACION_PREDETERMINADA[truck.camion] || {};
                    return (
                      <tr key={truck.camion} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-1.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              {truck.camion}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[140px]">
                              {truck.chofer}
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {truck.region}
                          </span>
                        </td>
                        {DIAS_SEMANA.map(d => {
                          const isToday = d.numero === diaHoy;
                          const currentVal = truckSchedule[d.numero] || 'Todas';

                          return (
                            <td 
                              key={d.numero} 
                              className={`py-1 px-1 text-center ${
                                isToday ? 'bg-royal-blue/[0.02] dark:bg-royal-blue/[0.06]' : ''
                              }`}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className={`group mx-auto py-1 px-2 rounded-md text-[11px] font-medium inline-flex items-center justify-center gap-1 transition-all cursor-pointer border select-none ${
                                      currentVal === '1'
                                        ? 'bg-blue-50/70 text-blue-700 border-blue-200/60 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40'
                                        : currentVal === '2'
                                        ? 'bg-amber-50/70 text-amber-700 border-amber-200/60 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40'
                                        : currentVal === '0'
                                        ? 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
                                        : currentVal === 'Todas'
                                        ? 'bg-purple-50/70 text-purple-700 border-purple-200/60 hover:bg-purple-100/70 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40'
                                        : 'text-slate-300 dark:text-slate-600 border-transparent hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-normal'
                                    }`}
                                  >
                                    <span className="truncate">
                                      {currentVal === 'Todas' ? 'Todas' : currentVal === 'Descanso' ? '—' : `Ruta ${currentVal}`}
                                    </span>
                                    {currentVal !== 'Descanso' && (
                                      <ChevronDown className="h-2.5 w-2.5 opacity-40 group-hover:opacity-90 shrink-0 ml-0.5" />
                                    )}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="min-w-[130px] text-xs">
                                  {truck.rutasDisponibles.map(r => (
                                    <DropdownMenuItem
                                      key={r}
                                      onClick={() => handleChangeRoute(truck.camion, d.numero, r)}
                                      className="flex items-center justify-between cursor-pointer py-1.5 px-2 text-xs"
                                    >
                                      <span className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                          r === '1' ? 'bg-blue-500' :
                                          r === '2' ? 'bg-amber-500' :
                                          r === '0' ? 'bg-slate-400' :
                                          r === 'Todas' ? 'bg-purple-500' : 'bg-slate-300'
                                        }`} />
                                        <span>{r === 'Todas' ? 'Todas las rutas' : r === 'Descanso' ? 'Descanso / Libre' : `Ruta ${r}`}</span>
                                      </span>
                                      {currentVal === r && <Check className="h-3.5 w-3.5 text-royal-blue shrink-0" />}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ProgramacionRutasChoferes;
