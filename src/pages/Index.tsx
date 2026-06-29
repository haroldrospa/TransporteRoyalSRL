import Layout from '@/components/layout/Layout';
import { OptimizedRegionCards } from '@/components/dashboard/OptimizedRegionCards';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Crown } from 'lucide-react';
import { useFastDashboardData } from '@/hooks/useFastDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const Index = () => {
  const { user } = useAuth();
  const { 
    norteBultos,
    surBultos,
    delayedCount,
    delayedConduces,
    recentDeliveries,
    camionesStats,
    regionActual,
    setRegionActual,
    isLoading,
    refreshData
  } = useFastDashboardData();
  
  const handleRefresh = () => refreshData(true);
  // Ocultar conduces atrasados para usuarios de laboratorios (LAM, Laboratorio, nivel 6)
  const isLabUser = user?.puesto === 'LAM' || user?.puesto === 'Laboratorio' || user?.nivel === 6;

  return (
    <Layout>
      {isLoading ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-5 sm:space-y-6"
        >
          <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Crown className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Panel de Control</h1>
                <p className="text-xs text-muted-foreground">Resumen general de operaciones</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={item}>
            <OptimizedRegionCards 
              norteBultos={norteBultos}
              surBultos={surBultos}
              setRegionActual={setRegionActual}
            />
          </motion.div>

          <motion.div variants={item}>
            <DashboardCards 
              camionesStats={camionesStats}
              delayedCount={delayedCount}
              delayedConduces={delayedConduces}
              recentDeliveries={recentDeliveries}
              showDelayed={!isLabUser}
            />
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
};

export default Index;
