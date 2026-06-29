import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fetchAppConfig, saveAppConfig, AppConfig } from '@/services/configService';
import { Settings, Save, Trash2, Plus, Mail, Fuel } from 'lucide-react';
import Layout from '@/components/Layout';

const AdminConfiguracion = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gasoilPrice, setGasoilPrice] = useState<number>(195.50);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await fetchAppConfig();
      if (config) {
        setGasoilPrice(config.gasoil_price);
        setAdminEmails(config.admin_emails);
      } else {
        setAdminEmails(['Haroldrospa@gmail.com']); // Default
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await saveAppConfig(gasoilPrice, adminEmails);
      if (success) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios se han guardado exitosamente.",
        });
      } else {
        throw new Error("No se pudo guardar");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error guardando la configuración.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Correo inválido",
        description: "Por favor, ingrese un correo válido.",
        variant: "destructive",
      });
      return;
    }
    if (adminEmails.includes(newEmail)) return;
    
    setAdminEmails([...adminEmails, newEmail]);
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setAdminEmails(adminEmails.filter(email => email !== emailToRemove));
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="h-6 w-6 text-royal-blue" />
                Configuración Administrativa
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Modifique los parámetros globales del sistema.
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={loading || saving}
              className="bg-royal-blue hover:bg-royal-blue/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Combustible */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fuel className="h-5 w-5 text-slate-500" />
                    Precio del Combustible
                  </CardTitle>
                  <CardDescription>
                    Costo por galón para el cálculo del presupuesto en rutas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gasoil Premium (RD$ / galón)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={gasoilPrice} 
                      onChange={(e) => setGasoilPrice(parseFloat(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Correos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-slate-500" />
                    Correos de Notificación
                  </CardTitle>
                  <CardDescription>
                    Estos administradores recibirán los reportes al comenzar una ruta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="admin@transporteroyal.com" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                    />
                    <Button variant="outline" onClick={addEmail}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {adminEmails.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-md">
                        No hay correos configurados.
                      </p>
                    ) : (
                      adminEmails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-border">
                          <span className="text-sm font-medium">{email}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeEmail(email)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminConfiguracion;
