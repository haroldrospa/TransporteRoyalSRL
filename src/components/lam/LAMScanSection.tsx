import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ScanResult {
  conduceNumber: string;
  razonSocial?: string;
  cantidadBultos?: number;
  success: boolean;
  message: string;
}

interface ScannedConduce {
  id: string;
  numero_conduce: string;
  razon_social: string | null;
  cantidad_bultos: number;
  scanned_at: string;
}

const LAMScanSection = () => {
  const { user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scannedConduces, setScannedConduces] = useState<ScannedConduce[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load today's scanned conduces
  useEffect(() => {
    loadTodayScans();
  }, []);

  const loadTodayScans = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('verified_shipments')
        .select('id, conduce_number, verified_at')
        .eq('scan_type', 'conduce_lam')
        .gte('verified_at', today)
        .order('verified_at', { ascending: false });

      if (error) throw error;

      // Get conduce details
      if (data && data.length > 0) {
        const conduceNumbers = data.map(d => d.conduce_number);
        const { data: conducesData } = await supabase
          .from('conduces')
          .select('numero_conduce, razon_social, cantidad_bultos')
          .in('numero_conduce', conduceNumbers);

        const mappedScans = data.map(scan => {
          const conduceInfo = conducesData?.find(c => c.numero_conduce === scan.conduce_number);
          return {
            id: scan.id,
            numero_conduce: scan.conduce_number,
            razon_social: conduceInfo?.razon_social || null,
            cantidad_bultos: conduceInfo?.cantidad_bultos || 0,
            scanned_at: scan.verified_at || ''
          };
        });

        setScannedConduces(mappedScans);
      }
    } catch (error) {
      console.error('Error loading today scans:', error);
    }
  };

  const handleScan = async () => {
    if (!scanValue.trim() || isProcessing) return;

    setIsProcessing(true);
    setScanResult(null);

    try {
      const conduceNumber = scanValue.trim().toUpperCase();

      // Check if conduce exists
      const { data: conduceData, error: conduceError } = await supabase
        .from('conduces')
        .select('*')
        .eq('numero_conduce', conduceNumber)
        .maybeSingle();

      if (conduceError) throw conduceError;

      if (!conduceData) {
        setScanResult({
          conduceNumber,
          success: false,
          message: 'Conduce no encontrado en el sistema'
        });
        toast.error('Conduce no encontrado');
        setScanValue('');
        inputRef.current?.focus();
        return;
      }

      // Check if already scanned for LAM
      const { data: existingScan, error: scanError } = await supabase
        .from('verified_shipments')
        .select('id')
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce_lam')
        .maybeSingle();

      if (scanError) throw scanError;

      if (existingScan) {
        setScanResult({
          conduceNumber,
          razonSocial: conduceData.razon_social,
          cantidadBultos: conduceData.cantidad_bultos,
          success: false,
          message: 'Este conduce ya fue escaneado para entrega a LAM'
        });
        toast.warning('Conduce ya escaneado');
        setScanValue('');
        inputRef.current?.focus();
        return;
      }

      // Register scan for LAM
      const { error: insertError } = await supabase
        .from('verified_shipments')
        .insert({
          conduce_number: conduceNumber,
          conduce_id: conduceData.id,
          scan_type: 'conduce_lam',
          encomendado: conduceData.encomendado || 'LAM',
          user_id: user?.id,
          user_name: user ? `${user.nombre} ${user.apellido}` : null
        });

      if (insertError) throw insertError;

      // Update conduce status to delivered
      const { error: updateError } = await supabase
        .from('conduces')
        .update({
          estado: 'Entregado',
          fecha_entrega: new Date().toISOString().split('T')[0],
          tiempo_entrega: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
          hora_entrega_exacta: new Date().toISOString(),
          nota: `Entregado a LAM por ${user?.nombre || 'Usuario'}`
        })
        .eq('id', conduceData.id);

      if (updateError) {
        console.error('Error updating conduce:', updateError);
      }

      setScanResult({
        conduceNumber,
        razonSocial: conduceData.razon_social,
        cantidadBultos: conduceData.cantidad_bultos,
        success: true,
        message: 'Conduce registrado para entrega a LAM'
      });

      toast.success(`Conduce ${conduceNumber} registrado correctamente`);

      // Add to local list
      setScannedConduces(prev => [{
        id: crypto.randomUUID(),
        numero_conduce: conduceNumber,
        razon_social: conduceData.razon_social,
        cantidad_bultos: conduceData.cantidad_bultos,
        scanned_at: new Date().toISOString()
      }, ...prev]);

      setScanValue('');
      inputRef.current?.focus();

    } catch (error) {
      console.error('Error processing scan:', error);
      setScanResult({
        conduceNumber: scanValue,
        success: false,
        message: 'Error al procesar el escaneo'
      });
      toast.error('Error al procesar el escaneo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const totalBultos = scannedConduces.reduce((sum, c) => sum + c.cantidad_bultos, 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanLine className="h-5 w-5 text-primary" />
          Escanear Conduces para LAM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escanea o escribe el número de conduce..."
            className="flex-1"
            disabled={isProcessing}
          />
          <Button 
            onClick={handleScan} 
            disabled={!scanValue.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`p-3 rounded-lg border ${
            scanResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20' 
              : 'bg-red-50 border-red-200 dark:bg-red-900/20'
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{scanResult.conduceNumber}</p>
                {scanResult.razonSocial && (
                  <p className="text-sm text-muted-foreground">{scanResult.razonSocial}</p>
                )}
                {scanResult.cantidadBultos && (
                  <p className="text-sm text-muted-foreground">{scanResult.cantidadBultos} bultos</p>
                )}
                <p className={`text-sm ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {scanResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{scannedConduces.length}</p>
            <p className="text-xs text-muted-foreground">Conduces hoy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalBultos}</p>
            <p className="text-xs text-muted-foreground">Bultos totales</p>
          </div>
        </div>

        {/* Recent Scans */}
        {scannedConduces.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Escaneos de hoy:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {scannedConduces.slice(0, 10).map((scan) => (
                <div 
                  key={scan.id} 
                  className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{scan.numero_conduce}</span>
                    {scan.razon_social && (
                      <span className="text-muted-foreground truncate max-w-32">
                        - {scan.razon_social}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {scan.cantidad_bultos} bultos
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LAMScanSection;
