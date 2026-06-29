import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, Unlink, Search, Users } from 'lucide-react';
import { Cliente } from '@/types/cliente';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MergeClientesDialogProps {
  clientes: Cliente[];
  onMergeComplete: () => Promise<void>;
}

const MergeClientesDialog = ({ clientes, onMergeComplete }: MergeClientesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'merge' | 'view'>('merge');

  const groups = useMemo(() => {
    const groupMap = new Map<string, Cliente[]>();
    clientes.forEach(c => {
      if (c.grupo_cliente) {
        const existing = groupMap.get(c.grupo_cliente) || [];
        existing.push(c);
        groupMap.set(c.grupo_cliente, existing);
      }
    });
    return Array.from(groupMap.entries()).map(([groupId, members]) => ({
      groupId,
      members,
      mainName: members[0].razonSocial
    }));
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 50);
    const term = search.toLowerCase();
    return clientes.filter(c =>
      c.razonSocial.toLowerCase().includes(term) ||
      c.numeroCliente.toLowerCase().includes(term) ||
      (c.rnc && c.rnc.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [clientes, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleMerge = async () => {
    if (selectedIds.size < 2) {
      toast({ title: 'Selecciona al menos 2 clientes para unir', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const selectedClientes = clientes.filter(c => selectedIds.has(c.id));
      const existingGroupId = selectedClientes.find(c => c.grupo_cliente)?.grupo_cliente;
      const groupId = existingGroupId || crypto.randomUUID();

      const { error } = await supabase
        .from('clientes')
        .update({ grupo_cliente: groupId })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({ title: `${selectedIds.size} clientes unidos exitosamente` });
      setSelectedIds(new Set());
      setSearch('');
      await onMergeComplete();
    } catch (err: any) {
      toast({ title: 'Error al unir clientes', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnmerge = async (groupId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ grupo_cliente: null })
        .eq('grupo_cliente', groupId);

      if (error) throw error;

      toast({ title: 'Grupo de clientes separado exitosamente' });
      await onMergeComplete();
    } catch (err: any) {
      toast({ title: 'Error al separar clientes', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200">
          <Users className="h-4 w-4 text-purple-600" />
          <span>Unir Clientes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-purple-600" />
            Unir Clientes Duplicados
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <Button 
            variant={mode === 'merge' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setMode('merge')}
          >
            Unir Clientes
          </Button>
          <Button 
            variant={mode === 'view' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setMode('view')}
          >
            Grupos Existentes ({groups.length})
          </Button>
        </div>

        {mode === 'merge' ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, número o RNC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-md border border-purple-200">
                <Badge className="bg-purple-600">{selectedIds.size} seleccionados</Badge>
                <span className="text-sm text-muted-foreground">Selecciona al menos 2 clientes para unir</span>
              </div>
            )}

            <ScrollArea className="h-[350px] border rounded-md">
              <div className="divide-y">
                {filteredClientes.map(cliente => (
                  <label 
                    key={cliente.id} 
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedIds.has(cliente.id) ? 'bg-purple-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(cliente.id)}
                      onCheckedChange={() => toggleSelect(cliente.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{cliente.razonSocial}</span>
                        {cliente.grupo_cliente && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            Unido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>No. {cliente.numeroCliente}</span>
                        {cliente.rnc && <span>RNC: {cliente.rnc}</span>}
                        <span>{cliente.ciudad}</span>
                        <span>{cliente.zona}</span>
                      </div>
                    </div>
                  </label>
                ))}
                {filteredClientes.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="h-[400px]">
            {groups.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay grupos de clientes unidos
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.groupId} className="border rounded-lg p-3 bg-purple-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{group.mainName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnmerge(group.groupId)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Separar
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {group.members.map(m => (
                        <div key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                          <span className="font-mono">{m.numeroCliente}</span>
                          <span>—</span>
                          <span>{m.razonSocial}</span>
                          {m.rnc && <Badge variant="outline" className="text-[10px] h-4">{m.rnc}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          {mode === 'merge' && (
            <Button 
              onClick={handleMerge} 
              disabled={selectedIds.size < 2 || loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Link2 className="h-4 w-4 mr-2" />
              {loading ? 'Uniendo...' : `Unir ${selectedIds.size} Clientes`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeClientesDialog;
