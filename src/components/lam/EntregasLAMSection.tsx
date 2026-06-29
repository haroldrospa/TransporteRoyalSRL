import { useState, useEffect, lazy, Suspense } from 'react';
import { EntregasLAMTable } from './EntregasLAMTable';
import { fetchEntregasLAM } from '@/services/entregasLamService';
import { EntregaLAM } from '@/types/entregasLam';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const LAMScanSection = lazy(() => import('./LAMScanSection'));

const EntregasLAMSection = () => {
  const { toast } = useToast();
  const [entregas, setEntregas] = useState<EntregaLAM[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntregas = async () => {
    try {
      const data = await fetchEntregasLAM();
      setEntregas(data);
    } catch (error) {
      console.error('Error loading entregas LAM:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las entregas LAM',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntregas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-40 bg-muted/50 animate-pulse rounded-lg" />}>
        <LAMScanSection />
      </Suspense>
      <EntregasLAMTable entregas={entregas} onRefresh={loadEntregas} />
    </div>
  );
};

export default EntregasLAMSection;
