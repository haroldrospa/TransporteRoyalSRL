import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { mapDbClienteToCliente } from '@/utils/mappers/clienteMappers';
import { useAuth } from '@/contexts/AuthContext';
import { fetchClientes } from '@/services/clienteService';
import { Cliente } from '@/types/cliente';
import { Conduce } from '@/types/conduces';
import { printConducesA4, printConduceLabels } from '@/utils/printConducesTemplates';
import { supabase } from '@/integrations/supabase/client';
import { mapConduceToDbConduce } from '@/utils/mappers/conduceMappers';
import { toast } from '@/hooks/use-toast';
import { FileText, Printer, Plus, Trash2, CheckCircle2, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

const LABORATORIOS = ['Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica'];

export const CrearConduces: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const labParam = searchParams.get('lab');
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  
  // Form States
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [numeroConduce, setNumeroConduce] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [cantidadBultos, setCantidadBultos] = useState('1');
  const [fechaCarga, setFechaCarga] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // List of conduces created in this session
  const [conducesCreados, setConducesCreados] = useState<Conduce[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [direccionEscrita, setDireccionEscrita] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  // Create Client Dialog States
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [newClientCode, setNewClientCode] = useState('');
  const [newClientSocial, setNewClientSocial] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientZone, setNewClientZone] = useState<'Norte' | 'Sur'>('Norte');
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if laboratory is locked (either by user profile or query param)
  const lockedLab = useMemo(() => {
    if (user?.laboratorio && LABORATORIOS.includes(user.laboratorio)) {
      return user.laboratorio;
    }
    if (labParam && LABORATORIOS.includes(labParam)) {
      return labParam;
    }
    return null;
  }, [user, labParam]);

  // Set initial laboratory
  useEffect(() => {
    if (lockedLab) {
      setSelectedLab(lockedLab);
    } else {
      setSelectedLab('Fersuaz');
    }
  }, [lockedLab]);

  // Check if string is a GPS coordinate format (e.g. "19.227348, -70.531705")
  const isCoordinate = (str: string): boolean => {
    if (!str) return false;
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(str);
  };

  // Determine current textual address (filtering out coordinates)
  const currentTextAddress = useMemo(() => {
    if (!selectedClient || !selectedClient.ubicacion) return '';
    return isCoordinate(selectedClient.ubicacion) ? '' : selectedClient.ubicacion;
  }, [selectedClient]);

  // Sync written address when client selection changes
  useEffect(() => {
    setDireccionEscrita(currentTextAddress);
  }, [currentTextAddress]);

  // Save address update to DB
  const handleSaveAddress = async () => {
    if (!selectedClient) return;
    
    setIsSavingAddress(true);
    try {
      console.log(`Saving address for client ${selectedClient.numeroCliente}:`, direccionEscrita);
      const newAddress = direccionEscrita.trim();
      
      const { error } = await supabase
        .from('clientes')
        .update({ 
          ubicacion: newAddress,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedClient.id);
        
      if (error) throw error;
      
      // Update local client states
      setSelectedClient(prev => prev ? { ...prev, ubicacion: newAddress } : null);
      setClientes(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ubicacion: newAddress } : c));
      
      toast({
        title: "Dirección guardada",
        description: "La dirección del cliente ha sido actualizada en la base de datos.",
      });
    } catch (e) {
      console.error('Error updating client address:', e);
      toast({
        title: "Error al guardar dirección",
        description: (e as Error).message || "No se pudo actualizar la dirección.",
        variant: "destructive"
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Create Client Handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClientCode.trim()) {
      toast({
        title: "Campo requerido",
        description: "El RNC del cliente es obligatorio.",
        variant: "destructive"
      });
      return;
    }
    if (!newClientSocial.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre o razón social es obligatorio.",
        variant: "destructive"
      });
      return;
    }
    if (!newClientCity.trim()) {
      toast({
        title: "Campo requerido",
        description: "La ciudad es obligatoria.",
        variant: "destructive"
      });
      return;
    }
    if (!newClientAddress.trim()) {
      toast({
        title: "Campo requerido",
        description: "La dirección física es obligatoria.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingClient(true);
    try {
      const rncUpper = newClientCode.trim().toUpperCase();
      if (clientes.some(c => c.rnc && c.rnc.toUpperCase() === rncUpper)) {
        toast({
          title: "RNC duplicado",
          description: "Ya existe un cliente con este RNC en el sistema.",
          variant: "destructive"
        });
        setIsCreatingClient(false);
        return;
      }

      const newClientObj = {
        rnc: rncUpper,
        numero_cliente: rncUpper,
        razon_social: newClientSocial.trim(),
        ciudad: newClientCity.trim().toUpperCase(),
        ubicacion: newClientAddress.trim(),
        zona: newClientZone,
        encomendado: '',
        ruta: '',
        contacto: ''
      };

      const { data, error } = await supabase
        .from('clientes')
        .insert(newClientObj)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const createdClient = mapDbClienteToCliente(data);

        // Update local list
        setClientes(prev => [createdClient, ...prev]);
        
        // Select the newly created client in the form
        setSelectedClient(createdClient);
        setSearchQuery(createdClient.razonSocial);
        
        toast({
          title: "Cliente creado",
          description: `El cliente "${createdClient.razonSocial}" se ha registrado con éxito.`,
        });

        // Reset dialog states
        setNewClientCode('');
        setNewClientSocial('');
        setNewClientCity('');
        setNewClientAddress('');
        setNewClientZone('Norte');
        setIsCreateClientOpen(false);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error al crear cliente",
        description: (error as Error).message || "No se pudo registrar el cliente.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingClient(false);
    }
  };

  // Fetch clients on load
  useEffect(() => {
    const loadClientes = async () => {
      setLoadingClientes(true);
      try {
        const data = await fetchClientes();
        setClientes(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoadingClientes(false);
      }
    };
    loadClientes();
  }, []);

  // Handle clicking outside the client search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter clients based on name/searchQuery/RNC
  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return clientes.filter(c => 
      c.razonSocial.toLowerCase().includes(query) || 
      c.numeroCliente.toLowerCase().includes(query) ||
      (c.rnc && c.rnc.toLowerCase().includes(query))
    ).slice(0, 10); // Limit to top 10 results for performance
  }, [clientes, searchQuery]);

  // Totals calculations
  const totalBultosCount = useMemo(() => {
    return conducesCreados.reduce((sum, item) => sum + item.cantidadBultos, 0);
  }, [conducesCreados]);

  // Handle adding a conduce to the list
  const handleAddConduce = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      toast({
        title: "Cliente no seleccionado",
        description: "Debe buscar y seleccionar un cliente de la lista.",
        variant: "destructive"
      });
      return;
    }

    const cleanedAddress = direccionEscrita.trim();
    if (!cleanedAddress) {
      toast({
        title: "Dirección requerida",
        description: "Por favor escriba la dirección física del cliente para poder crear el conduce.",
        variant: "destructive"
      });
      return;
    }
    
    if (!numeroConduce.trim()) {
      toast({
        title: "Número de Conduce vacío",
        description: "El número de conduce es un campo requerido.",
        variant: "destructive"
      });
      return;
    }

    const bultosNum = Number(cantidadBultos);
    if (isNaN(bultosNum) || bultosNum < 1) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad de bultos debe ser mayor o igual a 1.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate Conduce Numbers in current session
    if (conducesCreados.some(c => c.numeroConduce === numeroConduce.trim())) {
      toast({
        title: "Conduce duplicado",
        description: "Ya ha agregado un conduce con este número en el lote actual.",
        variant: "destructive"
      });
      return;
    }

    // Auto-save the written address to the database if it changed
    if (cleanedAddress !== currentTextAddress) {
      const clientId = selectedClient.id;
      supabase
        .from('clientes')
        .update({ 
          ubicacion: cleanedAddress,
          updated_at: new Date().toISOString() 
        })
        .eq('id', clientId)
        .then(({ error }) => {
          if (error) {
            console.error('Error auto-updating client address:', error);
          } else {
            console.log(`Address auto-updated successfully for client ${clientId} to: ${cleanedAddress}`);
            setClientes(prev => prev.map(c => c.id === clientId ? { ...c, ubicacion: cleanedAddress } : c));
          }
        });
    }

    const newConduce: Conduce = {
      id: Math.random().toString(36).substr(2, 9), // temporary client-side ID
      numeroConduce: numeroConduce.trim(),
      numeroFactura: (numeroFactura.trim() || numeroConduce.trim()),
      numeroCliente: selectedClient.numeroCliente,
      razonSocial: selectedClient.razonSocial,
      ciudad: selectedClient.ciudad,
      ubicacion: cleanedAddress,
      cantidadBultos: bultosNum,
      laboratorio: selectedLab,
      region: selectedClient.zona === 'Sur' ? 'Sur' : 'Norte',
      estado: 'Pendiente',
      fechaCarga: fechaCarga,
      fechaEntrega: fechaCarga, // Placeholder delivery date, equal to load date
    };

    setConducesCreados(prev => [newConduce, ...prev]);
    
    // Reset specific form fields
    setNumeroConduce('');
    setNumeroFactura('');
    setCantidadBultos('1');
    setSelectedClient(null);
    setSearchQuery('');
    
    toast({
      title: "Conduce agregado",
      description: "Se agregó el conduce al lote actual con éxito.",
    });
  };

  // Handle removing a conduce from the list
  const handleRemoveConduce = (id: string) => {
    setConducesCreados(prev => prev.filter(c => c.id !== id));
  };

  // Action: Close Load batch and upload to Database as 'Pendiente'
  const handleCloseLoad = async () => {
    if (conducesCreados.length === 0) {
      toast({
        title: "Lote vacío",
        description: "Agregue al menos un conduce antes de cerrar la carga.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Inserting batch of pending conduces:', conducesCreados);
      
      // Map all conduces to DB format
      const dbRows = conducesCreados.map(conduce => {
        const mapped = mapConduceToDbConduce(conduce);
        // Delete temporary client-side ID so database generates a proper UUID
        delete mapped.id;
        return mapped;
      });

      const { error } = await supabase
        .from('conduces')
        .insert(dbRows);

      if (error) throw error;

      toast({
        title: "Carga enviada",
        description: `Se han registrado ${conducesCreados.length} conduces pendientes de aprobación por el administrador.`,
      });

      // Clear batch list
      setConducesCreados([]);
      
      // Redirect back to laboratory or dashboard
      const destLab = lockedLab || user?.laboratorio;
      if (destLab === 'Fersuaz') navigate('/fersuaz');
      else if (destLab === 'Taapharmaceutica') navigate('/taapharmaceutica');
      else if (destLab === 'Innovacion Quimica') navigate('/innovacion-quimica');
      else navigate('/control-bultos');
      
    } catch (error) {
      console.error('Error saving pending conduces:', error);
      toast({
        title: "Error al guardar la carga",
        description: (error as Error).message || "Ocurrió un error inesperado al subir la información.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back navigation destination
  const handleGoBack = () => {
    const destLab = lockedLab || user?.laboratorio;
    if (destLab === 'Fersuaz') navigate('/fersuaz');
    else if (destLab === 'Taapharmaceutica') navigate('/taapharmaceutica');
    else if (destLab === 'Innovacion Quimica') navigate('/innovacion-quimica');
    else navigate('/control-bultos');
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Crear Archivo de Conduces</h1>
              <p className="text-sm text-muted-foreground">
                {lockedLab ? `Crea conduces manualmente para el lote de carga de ${lockedLab}.` : 'Crea conduces manualmente para el lote de carga del laboratorio.'}
              </p>
            </div>
          </div>
          
          <Badge className="bg-royal-blue text-white px-3 py-1 font-bold">
            {lockedLab ? `Lab: ${lockedLab}` : user?.laboratorio ? `Lab: ${user.laboratorio}` : 'Rol: Administrador'}
          </Badge>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Column 1: Form (1/3 width) */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="border-border/40 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold text-royal-blue dark:text-white uppercase tracking-wider">
                  Nuevo Conduce
                </CardTitle>
                <CardDescription className="text-xs">
                  Completa los datos del conduce de entrega.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleAddConduce} className="space-y-4">
                  
                  {/* Lab Selector (visible only for admin/users without lab lock) */}
                  {!lockedLab && (
                    <div className="space-y-1.5">
                      <Label htmlFor="lab-select" className="text-xs font-semibold">Laboratorio Destinatario</Label>
                      <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger id="lab-select">
                          <SelectValue placeholder="Seleccione laboratorio" />
                        </SelectTrigger>
                        <SelectContent>
                          {LABORATORIOS.map(lab => (
                            <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Client Search */}
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="client-search" className="text-xs font-semibold">Buscar Cliente (Nombre o Código)</Label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewClientSocial(searchQuery);
                          setIsCreateClientOpen(true);
                        }}
                        className="text-xs text-royal-blue hover:text-royal-blue/80 font-bold flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nuevo
                      </button>
                    </div>
                    <Input 
                      id="client-search" 
                      placeholder={loadingClientes ? "Cargando clientes..." : "Escriba nombre del cliente..."}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        if (selectedClient) {
                          setSelectedClient(null);
                        }
                      }}
                      disabled={loadingClientes}
                      autoComplete="off"
                    />
                    
                    {showDropdown && filteredClientes.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-[220px] overflow-y-auto divide-y">
                        {filteredClientes.map(client => (
                          <div
                            key={client.id}
                            className="p-2.5 text-xs hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedClient(client);
                              setSearchQuery(client.razonSocial);
                              setShowDropdown(false);
                            }}
                          >
                            <p className="font-bold">{client.razonSocial}</p>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                              <span>RNC: {client.rnc || client.numeroCliente || 'No registrado'}</span>
                              <span>Ciudad: {client.ciudad}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showDropdown && searchQuery.trim() && filteredClientes.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg p-3 text-center text-xs">
                        <p className="text-muted-foreground mb-2">No se encontró el cliente "{searchQuery}"</p>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-royal-blue text-white w-full text-xs font-bold"
                          onClick={() => {
                            setNewClientSocial(searchQuery);
                            setIsCreateClientOpen(true);
                            setShowDropdown(false);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Crear nuevo cliente
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Client Metadata Displays */}
                  {selectedClient && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/80 text-xs space-y-1.5 animate-scale-in">
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">RNC:</span>
                        <span className="font-bold">{selectedClient.rnc || selectedClient.numeroCliente || 'No registrado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-muted-foreground">Ciudad:</span>
                        <span className="font-bold text-royal-blue dark:text-royal-yellow">{selectedClient.ciudad}</span>
                      </div>
                      <div className="flex flex-col pt-0.5">
                        <span className="font-semibold text-muted-foreground mb-1">Dirección:</span>
                        <div className="flex gap-1.5 items-center">
                          <Input 
                            id="client-address"
                            className="text-xs h-8 bg-background border-border/80 grow"
                            placeholder="Escriba la dirección escrita del cliente..."
                            value={direccionEscrita}
                            onChange={(e) => setDireccionEscrita(e.target.value)}
                          />
                          {direccionEscrita !== currentTextAddress && (
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={handleSaveAddress}
                              disabled={isSavingAddress}
                              className="h-8 text-[10px] px-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors shrink-0"
                            >
                              {isSavingAddress ? '...' : 'Guardar'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conduce Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="num-conduce" className="text-xs font-semibold">No. Conduce</Label>
                      <Input 
                        id="num-conduce" 
                        placeholder="Ej: 80894700" 
                        value={numeroConduce}
                        onChange={(e) => setNumeroConduce(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="num-factura" className="text-xs font-semibold">No. Factura <span className="text-[10px] text-muted-foreground">(Opcional)</span></Label>
                      <Input 
                        id="num-factura" 
                        placeholder="Ej: 1002345" 
                        value={numeroFactura}
                        onChange={(e) => setNumeroFactura(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quantity and Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cant-bultos" className="text-xs font-semibold">Cantidad de Bultos</Label>
                      <Input 
                        id="cant-bultos" 
                        type="number"
                        min="1"
                        value={cantidadBultos}
                        onChange={(e) => setCantidadBultos(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha-carga" className="text-xs font-semibold">Fecha de Carga</Label>
                      <Input 
                        id="fecha-carga" 
                        type="date"
                        value={fechaCarga}
                        onChange={(e) => setFechaCarga(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Add Button */}
                  <Button type="submit" className="w-full bg-royal-blue hover:bg-royal-blue/90 font-semibold flex items-center justify-center gap-1.5 mt-2">
                    <Plus className="h-4 w-4" />
                    Agregar Conduce
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Column 2 & 3: List & Operations (2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Totals Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-4 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Conduces</span>
                  <span className="text-2xl font-extrabold text-royal-blue mt-1">{conducesCreados.length}</span>
                </CardContent>
              </Card>
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-4 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bultos Totales</span>
                  <span className="text-2xl font-extrabold text-green-600 mt-1">{totalBultosCount}</span>
                </CardContent>
              </Card>
              
              <div className="col-span-2 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => printConducesA4(conducesCreados)}
                  disabled={conducesCreados.length === 0}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir A4</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => printConduceLabels(conducesCreados)}
                  disabled={conducesCreados.length === 0}
                  className="flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  <span>Imprimir Etiquetas</span>
                </Button>
                <Button
                  onClick={handleCloseLoad}
                  disabled={conducesCreados.length === 0 || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-1.5 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Cerrar Carga</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* List Table Card */}
            <Card className="border-border/40 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold text-royal-blue dark:text-white uppercase tracking-wider">
                  Listado de Conduces Creados
                </CardTitle>
                <CardDescription className="text-xs">
                  Conduces acumulados en el lote de carga actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-4 hover:bg-transparent"></TableHead>
                        <TableHead className="font-bold">No. Conduce</TableHead>
                        <TableHead className="font-bold">No. Factura</TableHead>
                        <TableHead className="font-bold">Cliente</TableHead>
                        <TableHead className="font-bold">Ciudad</TableHead>
                        <TableHead className="font-bold text-right">Bultos</TableHead>
                        <TableHead className="w-10 hover:bg-transparent"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conducesCreados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-xs">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FileText className="h-8 w-8 text-muted-foreground/45" />
                              <p className="font-semibold">No se han creado conduces aún</p>
                              <p className="text-[11px] text-muted-foreground/80">Completa el formulario de la izquierda para agregar conduces.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        conducesCreados.map((item, index) => (
                          <TableRow key={item.id} className="hover:bg-muted/20">
                            <TableCell className="text-muted-foreground font-semibold text-[10px] text-center">
                              {conducesCreados.length - index}
                            </TableCell>
                            <TableCell className="font-bold">{item.numeroConduce}</TableCell>
                            <TableCell className="font-semibold text-muted-foreground">{item.numeroFactura}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-bold text-xs">{item.razonSocial}</p>
                                <span className="text-[9px] text-muted-foreground">Cód: {item.numeroCliente}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-royal-blue dark:text-royal-yellow">{item.ciudad}</TableCell>
                            <TableCell className="font-bold text-right text-green-600">{item.cantidadBultos}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveConduce(item.id)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Create Client Dialog */}
        <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
          <DialogContent className="max-w-md rounded-xl p-5 border border-border/40 shadow-lg bg-card">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="text-base font-bold text-royal-blue dark:text-white">
                Crear Nuevo Cliente
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registra un nuevo cliente en el sistema para poder crearle conduces.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-client-rnc" className="text-xs font-semibold">RNC del Cliente</Label>
                  <Input 
                    id="new-client-rnc" 
                    placeholder="Ej: 131-12345-6" 
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-client-zone" className="text-xs font-semibold">Zona</Label>
                  <Select 
                    value={newClientZone} 
                    onValueChange={(value) => setNewClientZone(value as 'Norte' | 'Sur')}
                  >
                    <SelectTrigger id="new-client-zone">
                      <SelectValue placeholder="Seleccione zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Norte">Norte</SelectItem>
                      <SelectItem value="Sur">Sur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-client-social" className="text-xs font-semibold">Nombre / Razón Social</Label>
                <Input 
                  id="new-client-social" 
                  placeholder="Ej: Farmacia Santa Fe" 
                  value={newClientSocial}
                  onChange={(e) => setNewClientSocial(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-client-city" className="text-xs font-semibold">Ciudad</Label>
                <Input 
                  id="new-client-city" 
                  placeholder="Ej: LA VEGA" 
                  value={newClientCity}
                  onChange={(e) => setNewClientCity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-client-address" className="text-xs font-semibold">Dirección Física (Calle, Sector, Ciudad)</Label>
                <Input 
                  id="new-client-address" 
                  placeholder="Ej: Calle Federico Basilis, Bayacanes, La Vega" 
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateClientOpen(false)}
                  disabled={isCreatingClient}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  className="bg-royal-blue hover:bg-royal-blue/90 font-bold"
                  disabled={isCreatingClient}
                >
                  {isCreatingClient ? 'Guardando...' : 'Guardar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
};

export default CrearConduces;
