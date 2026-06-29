
import { supabase } from '@/integrations/supabase/client';

export async function updateConduceRelation(conduceNumber: string, selectedRelacion: string) {
  console.log('Updating conduce relation:', conduceNumber, 'to relation:', selectedRelacion);

  const { error: updateError } = await supabase
    .from('conduces')
    .update({ relacion: selectedRelacion })
    .eq('numero_conduce', conduceNumber);

  if (updateError) {
    console.error('Error updating conduce relation:', updateError);
    throw new Error('Error al actualizar la relación del conduce');
  }

  console.log('Successfully updated conduce relation in database');
}

export async function saveConduceRelation(conduceNumber: string, relacionNombre: string, userId: string) {
  try {
    // First, get the relation ID by name
    const { data: relacion, error: relacionError } = await supabase
      .from('relaciones_conduces')
      .select('id')
      .eq('nombre', relacionNombre)
      .single();

    if (relacionError || !relacion) {
      // If relation doesn't exist, create it
      const { data: newRelacion, error: createError } = await supabase
        .from('relaciones_conduces')
        .insert({ nombre: relacionNombre })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }
      relacion.id = newRelacion.id;
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if there's already a relation for this date
    const { data: existingRelacionFecha, error: fechaError } = await supabase
      .from('relacion_conduces_fechas')
      .select('*')
      .eq('relacion_id', relacion.id)
      .eq('fecha_relacion', today)
      .single();

    if (fechaError && fechaError.code !== 'PGRST116') {
      throw fechaError;
    }

    if (existingRelacionFecha) {
      // Update existing relation with the new conduce (avoid duplicates)
      const updatedConduces = [...existingRelacionFecha.lista_conduces];
      if (!updatedConduces.includes(conduceNumber)) {
        updatedConduces.push(conduceNumber);
        
        const { error: updateError } = await supabase
          .from('relacion_conduces_fechas')
          .update({
            total_conduces: updatedConduces.length,
            conduces_pendientes: updatedConduces.length - existingRelacionFecha.conduces_entregados,
            lista_conduces: updatedConduces
          })
          .eq('id', existingRelacionFecha.id);

        if (updateError) {
          throw updateError;
        }
      }
    } else {
      // Create new relation for today
      const { error: createFechaError } = await supabase
        .from('relacion_conduces_fechas')
        .insert({
          relacion_id: relacion.id,
          fecha_relacion: today,
          total_conduces: 1,
          conduces_pendientes: 1,
          lista_conduces: [conduceNumber]
        });

      if (createFechaError) {
        throw createFechaError;
      }
    }

    // Handle control_conduces - Update existing or insert new
    const { data: existingControl, error: controlSelectError } = await supabase
      .from('control_conduces')
      .select('*')
      .eq('conduce_number', conduceNumber)
      .maybeSingle();

    if (controlSelectError) {
      console.warn('Warning checking existing control_conduces:', controlSelectError);
    }

    if (existingControl) {
      // Update existing record with new relation
      const { error: controlUpdateError } = await supabase
        .from('control_conduces')
        .update({
          relacion_id: relacion.id,
          fecha_entrega: new Date().toISOString(),
          estado: 'registrado',
          notas: `Actualizado vía escaneo en relación ${relacionNombre}`
        })
        .eq('id', existingControl.id);

      if (controlUpdateError) {
        console.warn('Warning updating control_conduces:', controlUpdateError);
      }
    } else {
      // Insert new record
      const { error: controlError } = await supabase
        .from('control_conduces')
        .insert({
          conduce_number: conduceNumber,
          relacion_id: relacion.id,
          fecha_entrega: new Date().toISOString(),
          estado: 'registrado',
          notas: `Registrado vía escaneo en relación ${relacionNombre}`
        });

      if (controlError && controlError.code !== '23505') {
        console.warn('Warning inserting into control_conduces:', controlError);
      }
    }

  } catch (error) {
    console.error('Error saving conduce relation:', error);
    throw error;
  }
}
