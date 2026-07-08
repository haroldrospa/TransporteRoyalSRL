import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, TrendingUp, PackageX } from 'lucide-react';
import { Region } from '@/types/conduces';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface OptimizedRegionCardsProps {
  norteBultos: number;
  surBultos: number;
  esteBultos: number;
  setRegionActual: (region: Region) => void;
}

export const OptimizedRegionCards = memo(({ 
  norteBultos, 
  surBultos, 
  esteBultos,
  setRegionActual 
}: OptimizedRegionCardsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userLab = user?.laboratorio || (user?.puesto === 'LAM' ? 'LAM' : null);

  const selectRegion = (region: Region) => {
    setRegionActual(region);
    navigate('/lam');
  };

  const showNorte = !userLab || norteBultos > 0;
  const showSur = !userLab || surBultos > 0;
  const showEste = !userLab || esteBultos > 0;
  
  const visibleCardsCount = [showNorte, showSur, showEste].filter(Boolean).length;

  if (visibleCardsCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 p-8 flex flex-col items-center justify-center text-center gap-3"
      >
        <div className="p-3 rounded-full bg-muted">
          <PackageX className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sin bultos en tránsito</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Actualmente no hay bultos en tránsito registrados para tu laboratorio en ninguna de las regiones.
          </p>
        </div>
      </motion.div>
    );
  }

  const gridClass = visibleCardsCount === 1 
    ? "grid gap-4 grid-cols-1 md:grid-cols-1 max-w-md mx-auto" 
    : visibleCardsCount === 2 
      ? "grid gap-4 grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" 
      : "grid gap-4 grid-cols-1 md:grid-cols-3";

  return (
    <div className={gridClass}>
      <AnimatePresence mode="popLayout">
        {/* Norte Card */}
        {showNorte && (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px -12px hsl(var(--primary) / 0.15)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/50 p-5 sm:p-6 cursor-pointer group"
        onClick={() => selectRegion('Norte')}
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-primary/60 rounded-l-2xl" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground/80">Región Norte</span>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{norteBultos}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
                <p className="text-sm text-muted-foreground">Bultos en tránsito</p>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
              size="sm"
              onClick={(e) => { e.stopPropagation(); selectRegion('Norte'); }}
            >
              Ver detalles
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
        )}

      {/* Sur Card */}
      {showSur && (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px -12px hsl(var(--secondary) / 0.2)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/5 via-card to-card border border-border/50 p-5 sm:p-6 cursor-pointer group"
        onClick={() => selectRegion('Sur')}
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-secondary to-secondary/60 rounded-l-2xl" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500" />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <MapPin className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm font-semibold text-foreground/80">Región Sur</span>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{surBultos}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="h-3.5 w-3.5 text-secondary/60" />
                <p className="text-sm text-muted-foreground">Bultos en tránsito</p>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20 gap-2"
              size="sm"
              onClick={(e) => { e.stopPropagation(); selectRegion('Sur'); }}
            >
              Ver detalles
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
        )}

      {/* Este Card */}
      {showEste && (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(168, 85, 247, 0.15)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/5 via-card to-card border border-border/50 p-5 sm:p-6 cursor-pointer group"
        onClick={() => selectRegion('Este')}
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-purple-500/60 rounded-l-2xl" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors duration-500" />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-foreground/80">Región Este</span>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{esteBultos}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="h-3.5 w-3.5 text-purple-500/60" />
                <p className="text-sm text-muted-foreground">Bultos en tránsito</p>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-600/90 text-white shadow-lg shadow-purple-500/20 gap-2"
              size="sm"
              onClick={(e) => { e.stopPropagation(); selectRegion('Este'); }}
            >
              Ver detalles
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

OptimizedRegionCards.displayName = 'OptimizedRegionCards';
