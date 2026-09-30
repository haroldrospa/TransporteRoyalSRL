import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Save, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { isConduceDelayed } from '@/utils/time/conduceDelay';

const ConducesAtrasadosEditor = () => {
  const { toast } = useToast();
  const { conduces, updateConduce } = useData();

  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('conducesAtrasadosEditor_isOpen');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('conducesAtrasadosEditor_isOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const atrasados = useMemo(() => {
    return conduces
      .filter(c => isConduceDelayed(c))
      .sort((a, b) => a.numeroConduce.localeCompare(b.numeroConduce));
  }, [conduces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return atrasados;
    return atrasados.filter(c =>
      c.numeroConduce.toLowerCase().includes(q) ||
      (c.razonSocial || '').toLowerCase().includes(q)
    );
  }, [atrasados, search]);

  const handleSave = async (id: string, current: string) => {
    const newValue = (edits[id] ?? current).trim();
    if (!newValue) {
      toast({ title: 'Tiempo inválido', description: 'Debe ingresar un tiempo (ej: 24h 15m)', variant: 'destructive' });
      return;
    }
    try {
      setSavingId(id);
      await updateConduce(id, { tiempoEntrega: newValue });
      toast({ title: 'Tiempo actualizado', description: `Conduce actualizado a ${newValue}` });
      setEdits(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('Error updating tiempoEntrega', err);
      toast({ title: 'Error', description: 'No se pudo actualizar el tiempo', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="w-full border-border/60 shadow-xs">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-2.5 px-3 sm:px-4">
            <CardTitle className="flex items-center justify-between text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>Modificar Horas Atrasados</span>
                <Badge 
                  variant={atrasados.length > 0 ? "destructive" : "secondary"} 
                  className={`text-xs px-1.5 py-0 h-4 sm:h-5 ${atrasados.length === 0 ? 'text-muted-foreground' : ''}`}
                >
                  {atrasados.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-3 sm:px-4 pb-3 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar conduce o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs sm:text-sm pl-8 border-border/60"
              />
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {atrasados.length === 0 ? 'No hay conduces atrasados' : 'Sin resultados'}
                </p>
              ) : (
                filtered.map(c => {
                  const current = c.tiempoEntrega || '';
                  const value = edits[c.id] ?? current;
                  const dirty = value !== current;
                  return (
                    <div key={c.id} className="p-2.5 bg-background border border-border/60 rounded-md space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold truncate">{c.numeroConduce}</span>
                            {c.encomendado && (
                              <span className="text-[10px] text-muted-foreground font-medium">({c.encomendado})</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.razonSocial || 'Sin cliente'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium border-border/70">
                          {c.estado}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={value}
                          onChange={(e) => setEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Ej: 24h 15m"
                          className="h-8 text-xs sm:text-sm border-border/60 flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(c.id, current)}
                          disabled={!dirty || savingId === c.id}
                          className="h-8 px-2.5 text-xs shrink-0"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          {savingId === c.id ? '...' : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-0.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>💡</span>
              <span>Edita el tiempo (ej: <code className="px-1 py-0.2 bg-muted rounded font-mono text-[10px]">24h 15m</code>) para corregir el atraso.</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ConducesAtrasadosEditor;
