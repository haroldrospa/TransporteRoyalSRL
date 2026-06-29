import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RelacionConduceInfo {
  relacionId: string;
  relacionNombre: string;
  fechaRelacion: string;
  conduceNumbers: string[];
}

export const organizarConducesEnRelaciones = async (): Promise<void> => {
  try {
    console.log('Iniciando organización de conduces en relaciones...');
    
    // 1. Obtener todos los conduces verificados que no están organizados
    const { data: verifiedShipments, error: verifiedError } = await supabase
      .from('verified_shipments')
      .select('conduce_number, encomendado, verified_at')
      .order('verified_at', { ascending: true });

    if (verifiedError) {
      throw verifiedError;
    }

    if (!verifiedShipments || verifiedShipments.length === 0) {
      console.log('No hay conduces verificados para organizar');
      return;
    }

    console.log(`Organizando ${verifiedShipments.length} conduces verificados...`);

    // 2. Obtener las relaciones base disponibles
    const { data: relaciones, error: relacionesError } = await supabase
      .from('relaciones_conduces')
      .select('id, nombre');

    if (relacionesError) {
      throw relacionesError;
    }

    if (!relaciones || relaciones.length === 0) {
      throw new Error('No hay relaciones base configuradas');
    }

    // 3. Agrupar conduces por fecha de verificación (usar fecha como relación)
    const gruposPorFecha = verifiedShipments.reduce((grupos, shipment) => {
      const fecha = new Date(shipment.verified_at || new Date()).toISOString().split('T')[0];
      
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      
      grupos[fecha].push(shipment.conduce_number);
      return grupos;
    }, {} as Record<string, string[]>);

    console.log('Grupos por fecha:', Object.keys(gruposPorFecha).length);

    // 4. Para cada fecha, crear o actualizar la relación
    for (const [fecha, conduceNumbers] of Object.entries(gruposPorFecha)) {
      // Usar la primera relación disponible como predeterminada
      const relacionPredeterminada = relaciones[0];
      
      console.log(`Procesando fecha ${fecha} con ${conduceNumbers.length} conduces`);
      
      // Verificar si ya existe una relación para esta fecha
      const { data: relacionExistente, error: existenteError } = await supabase
        .from('relacion_conduces_fechas')
        .select('*')
        .eq('relacion_id', relacionPredeterminada.id)
        .eq('fecha_relacion', fecha)
        .maybeSingle();

      if (existenteError && existenteError.code !== 'PGRST116') {
        console.error('Error checking existing relation:', existenteError);
        continue;
      }

      if (relacionExistente) {
        // Actualizar relación existente agregando nuevos conduces
        const nuevosConduces = [...new Set([...relacionExistente.lista_conduces, ...conduceNumbers])];
        
        const { error: updateError } = await supabase
          .from('relacion_conduces_fechas')
          .update({
            total_conduces: nuevosConduces.length,
            lista_conduces: nuevosConduces,
            conduces_pendientes: nuevosConduces.length - relacionExistente.conduces_entregados,
            updated_at: new Date().toISOString()
          })
          .eq('id', relacionExistente.id);

        if (updateError) {
          console.error('Error updating relation:', updateError);
        } else {
          console.log(`Actualizada relación existente para ${fecha}`);
        }
      } else {
        // Crear nueva relación
        const { error: insertError } = await supabase
          .from('relacion_conduces_fechas')
          .insert({
            relacion_id: relacionPredeterminada.id,
            fecha_relacion: fecha,
            total_conduces: conduceNumbers.length,
            lista_conduces: conduceNumbers,
            conduces_entregados: 0,
            conduces_pendientes: conduceNumbers.length,
            conduces_entregados_lista: []
          });

        if (insertError) {
          console.error('Error creating relation:', insertError);
        } else {
          console.log(`Creada nueva relación para ${fecha} con ${conduceNumbers.length} conduces`);
        }
      }

      // 5. Actualizar el campo 'relacion' en la tabla conduces
      const { error: updateConducesError } = await supabase
        .from('conduces')
        .update({ relacion: relacionPredeterminada.nombre })
        .in('numero_conduce', conduceNumbers);

      if (updateConducesError) {
        console.error('Error updating conduces relation field:', updateConducesError);
      }
    }

    console.log('Organización de conduces completada');
    
    toast({
      title: "Conduces organizados",
      description: `Se organizaron los conduces verificados en relaciones por fecha`,
    });

  } catch (error) {
    console.error('Error organizando conduces:', error);
    toast({
      title: "Error",
      description: "Error al organizar los conduces en relaciones",
      variant: "destructive"
    });
    throw error;
  }
};