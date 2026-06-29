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
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>Modificar Horas Atrasados</span>
                <Badge variant="destructive" className="text-xs">
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
          <CardContent className="pt-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar conduce o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm pl-7"
              />
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
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
                    <div key={c.id} className="p-2 bg-background border rounded-md space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{c.numeroConduce}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.razonSocial || 'Sin cliente'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {c.estado}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => setEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Ej: 24h 15m"
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(c.id, current)}
                          disabled={!dirty || savingId === c.id}
                          className="h-8 px-2"
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

            <div className="text-xs text-muted-foreground bg-info/10 p-2 rounded border-l-4 border-info">
              <p className="font-medium mb-1">ℹ️ Información:</p>
              <p>Edita el tiempo de entrega (ej: <code>24h 15m</code>) para corregir conduces marcados como atrasados.</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ConducesAtrasadosEditor;
