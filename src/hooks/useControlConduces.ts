import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/contexts/AuthContext';
import { Region } from '@/types/conduces';

interface RelacionConducesData {
  id: string;
  fecha: string;
  relacion: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  totalConduces: number;
  conducesRecibidosNave: number;
  conducesPendientesNave: number;
  conducesNoRecibidos: number;
  listaConduces: string[];
  conducesRecibidosLista: string[];
  conducesNoRecibidosLista: string[];
  conducesSinRelacion: string[];
  completado: boolean;
  region?: Region;
  enviadoLaboratorio?: boolean;
  fechaEnvioLaboratorio?: string;
}

interface ScanResult {
  conduceNumber: string;
  fechaCarga?: string;
  relacionNombre?: string;
  error?: boolean;
  errorMessage?: string;
}

export function useControlConduces(user: User | null) {
  const [relacionesPorFecha, setRelacionesPorFecha] = useState<Record<string, RelacionConducesData[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const loadRelacionesData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      // Obtener el total de conduces con relación
      console.log('🔍 Obteniendo conteo total de conduces con relación...');
      const { count: totalWithRelacion, error: countError } = await supabase
        .from('conduces')
        .select('numero_conduce', { count: 'exact', head: true })
        .not('relacion', 'is', null);

      if (countError) throw countError;

      const totalConducesConRelacion = totalWithRelacion || 0;
      console.log(`📊 Total conduces con relación en BD: ${totalConducesConRelacion}`);

      // Calcular cuántas páginas necesitamos (1000 registros por página)
      const pageSize = 1000;
      const totalPages = Math.ceil(totalConducesConRelacion / pageSize);
      console.log(`📄 Cargando ${totalPages} páginas de conduces con relación...`);

      // Cargar todos los conduces con relación usando paginación
      let allConduces: any[] = [];
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`📄 Cargando página ${page + 1}/${totalPages} (registros ${from}-${to})...`);
        
        const { data: pageData, error: pageError } = await supabase
          .from('conduces')
          .select('numero_conduce, fecha_carga, relacion, region')
          .not('relacion', 'is', null)
          .order('fecha_carga', { ascending: false })
          .range(from, to);

        if (pageError) throw pageError;
        
        allConduces = allConduces.concat(pageData || []);
        console.log(`✅ Página ${page + 1} cargada: ${pageData?.length || 0} conduces`);
      }

      console.log('🔍 TOTAL CONDUCES CON RELACIÓN CARGADOS:', allConduces.length);
      console.log('🔍 PRIMEROS 5 CONDUCES:', allConduces.slice(0, 5));
      const fechasUnicas = [...new Set(allConduces.map(c => c.fecha_carga))];
      console.log('🔍 FECHAS ÚNICAS EN BD:', fechasUnicas.sort());

      // Obtener total de conduces sin relación
      console.log('🔍 Obteniendo conteo total de conduces sin relación...');
      const { count: totalSinRelacion, error: countSinRelacionError } = await supabase
        .from('conduces')
        .select('numero_conduce', { count: 'exact', head: true })
        .or('relacion.is.null,relacion.eq.');

      if (countSinRelacionError) throw countSinRelacionError;

      const totalConducesSinRelacion = totalSinRelacion || 0;
      console.log(`📊 Total conduces sin relación en BD: ${totalConducesSinRelacion}`);

      // Calcular páginas para conduces sin relación
      const totalPagesSinRelacion = Math.ceil(totalConducesSinRelacion / pageSize);
      console.log(`📄 Cargando ${totalPagesSinRelacion} páginas de conduces sin relación...`);

      // Cargar todos los conduces sin relación usando paginación
      let conducesSinRelacion: any[] = [];
      for (let page = 0; page < totalPagesSinRelacion; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`📄 Cargando página sin relación ${page + 1}/${totalPagesSinRelacion}...`);
        
        const { data: pageData, error: pageError } = await supabase
          .from('conduces')
          .select('numero_conduce, fecha_carga, region')
          .or('relacion.is.null,relacion.eq.')
          .order('fecha_carga', { ascending: false })
          .range(from, to);

        if (pageError) throw pageError;
        
        conducesSinRelacion = conducesSinRelacion.concat(pageData || []);
      }

      console.log('✅ Total conduces sin relación cargados:', conducesSinRelacion.length);

      // Fetch todas las relaciones
      const { data: relaciones, error: relacionesError } = await supabase
        .from('relaciones_conduces')
        .select('id, nombre, descripcion');

      if (relacionesError) throw relacionesError;

      // Crear mapa de relaciones por nombre (el campo relacion en conduces contiene el nombre, no el ID)
      const relacionesMap = new Map(
        relaciones?.map(r => [r.nombre, { id: r.id, nombre: r.nombre, descripcion: r.descripcion }]) || []
      );
      
      console.log('📋 Relaciones disponibles:', Array.from(relacionesMap.keys()));
      console.log('📋 Total relaciones:', relaciones?.length);

      // Fetch verified_shipments con paginación para superar el límite de 1000
      console.log('🔍 Obteniendo verified_shipments con paginación...');
      let allVerifiedShipments: any[] = [];
      let vsPage = 0;
      const vsPageSize = 1000;
      while (true) {
        const from = vsPage * vsPageSize;
        const to = from + vsPageSize - 1;
        const { data: vsPageData, error: vsPageError } = await supabase
          .from('verified_shipments')
          .select('conduce_number, scan_type')
          .in('scan_type', ['conduce_nave', 'conduce_no_recibido'])
          .range(from, to);
        
        if (vsPageError) throw vsPageError;
        if (!vsPageData || vsPageData.length === 0) break;
        
        allVerifiedShipments = allVerifiedShipments.concat(vsPageData);
        vsPage++;
        if (vsPageData.length < vsPageSize) break;
      }
      console.log(`✅ Total verified_shipments cargados: ${allVerifiedShipments.length}`);
      const verifiedShipments = allVerifiedShipments;

      const verifiedSet = new Set(
        verifiedShipments?.filter(v => v.scan_type === 'conduce_nave').map(v => v.conduce_number) || []
      );
      
      const noRecibidosSet = new Set(
        verifiedShipments?.filter(v => v.scan_type === 'conduce_no_recibido').map(v => v.conduce_number) || []
      );

      // Fetch relacion_conduces_fechas para obtener estado de enviado a laboratorio
      const { data: relacionFechasData, error: relacionFechasError } = await supabase
        .from('relacion_conduces_fechas')
        .select('id, relacion_id, fecha_carga, enviado_laboratorio, fecha_envio_laboratorio');

      if (relacionFechasError) {
        console.error('Error fetching relacion_conduces_fechas:', relacionFechasError);
      }

      // Crear mapa para enviado_laboratorio por relacion_id y fecha
      const enviadoLabMap = new Map<string, { enviado: boolean; fecha?: string }>();
      relacionFechasData?.forEach((rf: any) => {
        const key = `${rf.fecha_carga}-${rf.relacion_id}`;
        enviadoLabMap.set(key, {
          enviado: rf.enviado_laboratorio || false,
          fecha: rf.fecha_envio_laboratorio
        });
      });

      // Helper para parsear fecha en formato dd/mm/yyyy o d/m/yyyy
      const parseFecha = (fechaStr: string): string => {
        try {
          if (!fechaStr || !fechaStr.includes('/')) return fechaStr;
          
          const parts = fechaStr.split('/');
          if (parts.length !== 3) return fechaStr;
          
          const [day, month, year] = parts;
          // Asegurar que el mes y día tengan dos dígitos
          const paddedDay = day.trim().padStart(2, '0');
          const paddedMonth = month.trim().padStart(2, '0');
          const cleanYear = year.trim();
          
          return `${cleanYear}-${paddedMonth}-${paddedDay}`;
        } catch (error) {
          console.error('Error parsing date:', fechaStr, error);
          return fechaStr;
        }
      };

      // Agrupar conduces sin relación por fecha y región
      const conducesSinRelacionPorFechaRegion = new Map<string, { numero_conduce: string; region: Region }[]>();
      conducesSinRelacion?.forEach((conduce: any) => {
        const fechaParsed = parseFecha(conduce.fecha_carga);
        if (!conducesSinRelacionPorFechaRegion.has(fechaParsed)) {
          conducesSinRelacionPorFechaRegion.set(fechaParsed, []);
        }
        conducesSinRelacionPorFechaRegion.get(fechaParsed)!.push({
          numero_conduce: conduce.numero_conduce,
          region: conduce.region || 'Norte'
        });
      });

      // Agrupar por fecha de carga y relación
      const grouped: Record<string, RelacionConducesData[]> = {};
      const relacionesAgrupadas = new Map<string, { 
        relacion: any; 
        conduces: string[]; 
        conducesRecibidos: string[];
        conducesNoRecibidos: string[];
        fechaCarga: string;
        fechaCargaOriginal: string;
        region: Region; // Track predominant region
      }>();

      allConduces?.forEach((conduce: any) => {
        const relacionInfo = relacionesMap.get(conduce.relacion);
        if (!relacionInfo) {
          console.log(`⚠️ Conduce ${conduce.numero_conduce} tiene relación "${conduce.relacion}" que no existe en relacionesMap`);
          return;
        }

        const fechaCargaParsed = parseFecha(conduce.fecha_carga);
        const key = `${fechaCargaParsed}-${relacionInfo.id}`;
        
        if (!relacionesAgrupadas.has(key)) {
          relacionesAgrupadas.set(key, {
            relacion: relacionInfo,
            conduces: [],
            conducesRecibidos: [],
            conducesNoRecibidos: [],
            fechaCarga: fechaCargaParsed,
            fechaCargaOriginal: conduce.fecha_carga,
            region: conduce.region || 'Norte'
          });
        }

        const rel = relacionesAgrupadas.get(key)!;
        rel.conduces.push(conduce.numero_conduce);
        
        if (verifiedSet.has(conduce.numero_conduce)) {
          rel.conducesRecibidos.push(conduce.numero_conduce);
        }
        
        if (noRecibidosSet.has(conduce.numero_conduce)) {
          rel.conducesNoRecibidos.push(conduce.numero_conduce);
        }
      });

      // Convertir a estructura final agrupada por fecha
      relacionesAgrupadas.forEach((rel, key) => {
        const fechaCarga = rel.fechaCarga;
        
        if (!grouped[fechaCarga]) {
          grouped[fechaCarga] = [];
        }

        const totalConduces = rel.conduces.length;
        const conducesRecibidos = rel.conducesRecibidos.length;
        const conducesNoRecibidos = rel.conducesNoRecibidos.length;

        // Check enviado laboratorio status
        const enviadoKey = `${fechaCarga}-${rel.relacion.id}`;
        const enviadoStatus = enviadoLabMap.get(enviadoKey);

        grouped[fechaCarga].push({
          id: key,
          fecha: fechaCarga,
          relacion: {
            id: rel.relacion.id,
            nombre: rel.relacion.nombre,
            descripcion: rel.relacion.descripcion
          },
          totalConduces,
          conducesRecibidosNave: conducesRecibidos,
          conducesPendientesNave: totalConduces - conducesRecibidos - conducesNoRecibidos,
          conducesNoRecibidos,
          listaConduces: rel.conduces,
          conducesRecibidosLista: rel.conducesRecibidos,
          conducesNoRecibidosLista: rel.conducesNoRecibidos,
          conducesSinRelacion: (conducesSinRelacionPorFechaRegion.get(fechaCarga) || [])
            .filter(c => c.region === rel.region)
            .map(c => c.numero_conduce),
          completado: totalConduces > 0 && (conducesRecibidos + conducesNoRecibidos) === totalConduces,
          region: rel.region,
          enviadoLaboratorio: enviadoStatus?.enviado || false,
          fechaEnvioLaboratorio: enviadoStatus?.fecha
        });
      });

      console.log('🔍 FECHAS AGRUPADAS FINAL:', Object.keys(grouped).sort());
      console.log('🔍 TOTAL FECHAS:', Object.keys(grouped).length);
      
      setRelacionesPorFecha(grouped);
    } catch (error: any) {
      console.error('Error loading relaciones:', error);
      toast.error('Error al cargar las relaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleScanConduce = async (conduceNumber: string) => {
    if (!conduceNumber.trim()) {
      toast.error('Ingrese un número de conduce válido');
      return;
    }

    setIsProcessing(true);

    try {
      // Consulta principal y verificación de nave en paralelo
      const [conduceResult, naveResult] = await Promise.all([
        supabase
          .from('conduces')
          .select('numero_conduce, relacion, fecha_carga, encomendado, region')
          .eq('numero_conduce', conduceNumber)
          .maybeSingle(),
        supabase
          .from('verified_shipments')
          .select('id')
          .eq('conduce_number', conduceNumber)
          .eq('scan_type', 'conduce_nave')
          .maybeSingle()
      ]);

      if (conduceResult.error) throw conduceResult.error;

      const conduceData = conduceResult.data;

      if (!conduceData) {
        setScanResult({
          conduceNumber: conduceNumber,
          error: true,
          errorMessage: 'El conduce no existe en el sistema'
        });
        toast.error('Conduce no encontrado');
        setIsProcessing(false);
        return;
      }

      if (!conduceData.relacion) {
        setScanResult({
          conduceNumber: conduceNumber,
          error: true,
          errorMessage: 'El conduce no tiene relación asignada'
        });
        toast.error('Conduce no tiene relación asignada');
        setIsProcessing(false);
        return;
      }

      if (naveResult.data) {
        setScanResult({
          conduceNumber: conduceData.numero_conduce,
          fechaCarga: conduceData.fecha_carga,
          relacionNombre: conduceData.relacion,
          error: true,
          errorMessage: 'Este conduce ya fue recibido en la nave'
        });
        toast.warning('Este conduce ya fue recibido en la nave');
        setIsProcessing(false);
        return;
      }

      // MOSTRAR RESULTADO INMEDIATAMENTE
      setScanResult({
        conduceNumber: conduceData.numero_conduce,
        fechaCarga: conduceData.fecha_carga,
        relacionNombre: conduceData.relacion
      });

      // Actualizar UI local inmediatamente
      setRelacionesPorFecha(prevState => {
        const newState = { ...prevState };
        let fechaCarga = conduceData.fecha_carga;
        if (fechaCarga && fechaCarga.includes('/')) {
          const parts = fechaCarga.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            fechaCarga = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        if (newState[fechaCarga]) {
          newState[fechaCarga] = newState[fechaCarga].map(relacion => {
            if (relacion.relacion.nombre === conduceData.relacion) {
              return {
                ...relacion,
                conducesRecibidosNave: relacion.conducesRecibidosNave + 1,
                conducesPendientesNave: relacion.conducesPendientesNave - 1,
                conducesRecibidosLista: [...relacion.conducesRecibidosLista, conduceNumber]
              };
            }
            return relacion;
          });
        }
        return newState;
      });

      toast.success('Conduce recibido correctamente');
      setIsProcessing(false);

      // OPERACIONES DE BD EN BACKGROUND (no bloquean UI)
      (async () => {
        try {
          // Registrar en verified_shipments
          await supabase
            .from('verified_shipments')
            .insert({
              conduce_number: conduceNumber,
              scan_type: 'conduce_nave',
              encomendado: conduceData.encomendado || 'Sin asignar',
              user_id: user?.id,
              user_name: user ? `${user.nombre} ${user.apellido}` : null
            });

          // Actualizar relacion_conduces_fechas
          if (conduceData.relacion && conduceData.fecha_carga) {
            let fechaCarga = conduceData.fecha_carga;
            if (fechaCarga.includes('/')) {
              const [day, month, year] = fechaCarga.split('/');
              fechaCarga = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            const { data: relacionData } = await supabase
              .from('relaciones_conduces')
              .select('id')
              .eq('nombre', conduceData.relacion)
              .maybeSingle();

            if (relacionData) {
              const { data: relacionFecha } = await supabase
                .from('relacion_conduces_fechas')
                .select('*')
                .eq('relacion_id', relacionData.id)
                .eq('fecha_carga', fechaCarga)
                .maybeSingle();

              if (relacionFecha) {
                const nuevaListaNave = [...(relacionFecha.conduces_entregados_nave_list || [])];
                if (!nuevaListaNave.includes(conduceNumber)) {
                  nuevaListaNave.push(conduceNumber);
                }
                const nuevosPendientes = relacionFecha.total_conduces - nuevaListaNave.length;

                await supabase
                  .from('relacion_conduces_fechas')
                  .update({
                    conduces_entregados_nave: nuevaListaNave.length,
                    conduces_entregados_nave_list: nuevaListaNave,
                    conduces_pendientes: nuevosPendientes
                  })
                  .eq('id', relacionFecha.id);
              }
            }
          }
        } catch (bgError) {
          console.error('Error en actualización background:', bgError);
        }
      })();

    } catch (error: any) {
      console.error('Error scanning conduce:', error);
      toast.error('Error al procesar el escaneo');
      setIsProcessing(false);
    }
  };

  const refreshData = useCallback((showRefreshing = false) => {
    loadRelacionesData(!showRefreshing);
  }, [loadRelacionesData]);

  useEffect(() => {
    loadRelacionesData();
  }, [loadRelacionesData]);

  return {
    relacionesPorFecha,
    loading,
    refreshing,
    isProcessing,
    handleScanConduce,
    refreshData,
    scanResult
  };
}
