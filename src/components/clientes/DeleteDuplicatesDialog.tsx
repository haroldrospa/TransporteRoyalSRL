import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';
import { Cliente } from '@/types/cliente';
import { Input } from '@/components/ui/input';

interface DuplicateGroup {
  key: string;
  reason: 'RNC' | 'Razón Social';
  value: string;
  members: Cliente[];
  keepId: string | null; // null = no decidido aún
}

interface DeleteDuplicatesDialogProps {
  onComplete: () => Promise<void>;
}

const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const DeleteDuplicatesDialog = ({ onComplete }: DeleteDuplicatesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const scanDuplicates = useCallback(async () => {
    setScanning(true);
    setGroups([]);
    try {
      const BATCH = 1000;
      let from = 0;
      let all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: true })
          .range(from, from + BATCH - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < BATCH) break;
        from += BATCH;
      }

      const clientes = all.map(mapDbClienteToCliente);
      const byRnc = new Map<string, Cliente[]>();
      const byName = new Map<string, Cliente[]>();

      clientes.forEach(c => {
        if (c.rnc && c.rnc.trim()) {
          const k = c.rnc.trim();
          byRnc.set(k, [...(byRnc.get(k) || []), c]);
        }
        if (c.razonSocial && c.razonSocial.trim()) {
          const k = normalizeName(c.razonSocial);
          byName.set(k, [...(byName.get(k) || []), c]);
        }
      });

      const result: DuplicateGroup[] = [];
      const seen = new Set<string>();

      byRnc.forEach((members, key) => {
        if (members.length > 1) {
          const ids = members.map(m => m.id).sort().join('|');
          if (!seen.has(ids)) {
            seen.add(ids);
            result.push({ key: `rnc-${key}`, reason: 'RNC', value: key, members, keepId: null });
          }
        }
      });

      byName.forEach((members, key) => {
        if (members.length > 1) {
          const ids = members.map(m => m.id).sort().join('|');
          if (!seen.has(ids)) {
            seen.add(ids);
            result.push({ key: `name-${key}`, reason: 'Razón Social', value: members[0].razonSocial, members, keepId: null });
          }
        }
      });

      setGroups(result);
      toast({
        title: `${result.length} grupo(s) de duplicados encontrados`,
        description: result.length === 0 ? 'No hay clientes duplicados por RNC o Razón Social.' : `Total clientes analizados: ${clientes.length}`,
      });
    } catch (err: any) {
      toast({ title: 'Error al escanear duplicados', description: err.message, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  }, []);

  const setKeep = (groupKey: string, id: string) => {
    setGroups(prev => prev.map(g => g.key === groupKey ? { ...g, keepId: id } : g));
  };

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const t = search.toLowerCase();
    return groups.filter(g =>
      g.value.toLowerCase().includes(t) ||
      g.members.some(m =>
        m.razonSocial.toLowerCase().includes(t) ||
        m.numeroCliente.toLowerCase().includes(t) ||
        (m.rnc || '').toLowerCase().includes(t)
      )
    );
  }, [groups, search]);

  const groupsReady = useMemo(() => groups.filter(g => g.keepId), [groups]);
  const totalToDelete = useMemo(
    () => groupsReady.reduce((sum, g) => sum + (g.members.length - 1), 0),
    [groupsReady]
  );

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      let deleted = 0;
      let reassigned = 0;

      for (const g of groupsReady) {
        const keep = g.members.find(m => m.id === g.keepId);
        if (!keep) continue;
        const toRemove = g.members.filter(m => m.id !== g.keepId);
        const removeNumeros = toRemove.map(m => m.numeroCliente).filter(n => n && n !== keep.numeroCliente);

        // Reasignar conduces de los clientes a eliminar al sobreviviente
        if (removeNumeros.length > 0) {
          const { error: updErr, count } = await supabase
            .from('conduces')
            .update({ numero_cliente: keep.numeroCliente }, { count: 'exact' })
            .in('numero_cliente', removeNumeros);
          if (updErr) throw updErr;
          reassigned += count || 0;
        }

        // Eliminar los duplicados
        const removeIds = toRemove.map(m => m.id);
        const { error: delErr } = await supabase
          .from('clientes')
          .delete()
          .in('id', removeIds);
        if (delErr) throw delErr;
        deleted += removeIds.length;
      }

      toast({
        title: 'Duplicados eliminados',
        description: `${deleted} cliente(s) eliminado(s). ${reassigned} conduce(s) reasignado(s).`,
      });
      setConfirmOpen(false);
      setOpen(false);
      setGroups([]);
      await onComplete();
    } catch (err: any) {
      toast({ title: 'Error al eliminar duplicados', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && groups.length === 0) scanDuplicates(); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200">
            <Trash2 className="h-4 w-4 text-red-600" />
            <span>Eliminar Duplicados</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Eliminar Clientes Duplicados
            </DialogTitle>
            <DialogDescription>
              Detecta clientes duplicados por <strong>RNC</strong> o <strong>Razón Social</strong>. Selecciona cuál conservar en cada grupo. Los conduces de los eliminados se reasignarán al sobreviviente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en grupos por nombre, RNC o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                disabled={scanning || groups.length === 0}
              />
            </div>
            <Button variant="outline" size="sm" onClick={scanDuplicates} disabled={scanning}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Re-escanear'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{groups.length} grupo(s)</Badge>
            <Badge className="bg-red-600">{totalToDelete} a eliminar</Badge>
            <span className="text-muted-foreground">
              {groupsReady.length} de {groups.length} grupos con selección
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto border rounded-md">
            {scanning ? (
              <div className="p-10 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Escaneando todos los clientes...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                {groups.length === 0 ? 'No se encontraron duplicados.' : 'Sin coincidencias para la búsqueda.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredGroups.map(g => (
                  <div key={g.key} className="p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {g.reason}: {g.value}
                      </Badge>
                      <Badge variant="outline">{g.members.length} clientes</Badge>
                      {g.keepId && <Badge className="bg-green-600">Listo</Badge>}
                    </div>
                    <RadioGroup
                      value={g.keepId || ''}
                      onValueChange={(val) => setKeep(g.key, val)}
                      className="space-y-1"
                    >
                      {g.members.map(m => (
                        <Label
                          key={m.id}
                          htmlFor={`${g.key}-${m.id}`}
                          className={`flex items-start gap-3 p-2 rounded-md cursor-pointer border transition-colors ${
                            g.keepId === m.id
                              ? 'bg-green-50 border-green-300'
                              : g.keepId
                                ? 'bg-red-50/50 border-red-200'
                                : 'hover:bg-accent/50 border-transparent'
                          }`}
                        >
                          <RadioGroupItem value={m.id} id={`${g.key}-${m.id}`} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{m.razonSocial}</span>
                              {g.keepId === m.id && (
                                <Badge className="bg-green-600 text-xs">Conservar</Badge>
                              )}
                              {g.keepId && g.keepId !== m.id && (
                                <Badge variant="destructive" className="text-xs">Se eliminará</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-1">
                              <span>No. {m.numeroCliente}</span>
                              {m.rnc && <span>RNC: {m.rnc}</span>}
                              <span>{m.ciudad}</span>
                              <span>{m.zona}</span>
                              {m.contacto && <span>📞 {m.contacto}</span>}
                              {m.ubicacion && <span>📍 GPS</span>}
                            </div>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={groupsReady.length === 0 || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar {totalToDelete} duplicado(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{totalToDelete}</strong> cliente(s) duplicado(s) de <strong>{groupsReady.length}</strong> grupo(s).
              Los conduces vinculados se reasignarán automáticamente al cliente que conservaste.
              <br /><br />
              <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteDuplicatesDialog;
