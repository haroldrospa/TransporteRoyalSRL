
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import * as conduceService from '@/services/conduceService';
import { calculateBusinessHours, calculateRegularHours, calculateTransitTime } from '@/utils/time';
import { calculateDeliveryTime } from '@/utils/time/deliveryTime';
import { supabase } from '@/integrations/supabase/client';

export const useConduceOperations = (
  conduces: Conduce[], 
  setConduces: React.Dispatch<React.SetStateAction<Conduce[]>>
) => {
  
  const addConduce = async (conduce: Omit<Conduce, 'id'>) => {
    const newConduce = await conduceService.addConduce(conduce);
    if (newConduce) {
      setConduces([...conduces, newConduce]);
    }
  };

  const updateConduce = async (id: string, updates: Partial<Conduce>) => {
    await conduceService.updateConduce(id, updates);
    setConduces(conduces.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const asignarEncomendado = async (conduceIds: string[], encomendado: string, prioridad: boolean = false) => {
    await conduceService.asignarEncomendado(conduceIds, encomendado, prioridad);
    
    setConduces(conduces.map(c => 
      conduceIds.includes(c.id) ? { ...c, encomendado, prioridad: prioridad || c.prioridad } : c
    ));
  };

  const entregarConduce = async (id: string, firma: string, nota?: string, imagen?: string) => {
    console.log('entregarConduce called with:', { id, hasSignature: !!firma, hasImage: !!imagen, noteLength: nota?.length || 0 });
    
    if (!firma) {
      const error = new Error('La firma es requerida para completar la entrega');
      console.error('Validation error:', error.message);
      throw error;
    }
    
    if (!imagen) {
      const error = new Error('La imagen es requerida para completar la entrega');
      console.error('Validation error:', error.message);
      throw error;
    }
    
    const now = new Date();
    
    // Buscar el conduce tanto en el array local como hacer una consulta directa
    let conduce = conduces.find(c => c.id === id);
    
    if (!conduce) {
      console.warn(`Conduce con ID ${id} no encontrado en el array local. Buscando en la base de datos...`);
      try {
        // Hacer una consulta directa a la base de datos
        const { data: conduceData, error: fetchError } = await supabase
          .from('conduces')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError || !conduceData) {
          const error = new Error(`No se encontró el conduce con ID: ${id}`);
          console.error('Conduce not found in database:', error.message);
          throw error;
        }
        
        // Mapear los datos de la base de datos al formato del conduce
        conduce = {
          id: conduceData.id,
          numeroConduce: conduceData.numero_conduce,
          numeroFactura: conduceData.numero_factura,
          numeroCliente: conduceData.numero_cliente,
          cantidadBultos: conduceData.cantidad_bultos,
          fechaCarga: conduceData.fecha_carga,
          fechaEntrega: conduceData.fecha_entrega,
          razonSocial: conduceData.razon_social || '',
          ciudad: conduceData.ciudad || '',
          estado: conduceData.estado as any, // Temporal fix para el tipo
          laboratorio: conduceData.laboratorio,
          encomendado: conduceData.encomendado || '',
          region: conduceData.region as any, // Temporal fix para el tipo
          prioridad: conduceData.prioridad || false,
          tiempoEntrega: conduceData.tiempo_entrega,
          firma: conduceData.firma,
          nota: conduceData.nota,
          imagen: conduceData.imagen,
          excepcion: conduceData.excepcion || false,
          motivoExcepcion: conduceData.motivo_excepcion,
          cantidadEntregados: conduceData.cantidad_entregados,
          bultoModificado: conduceData.bulto_modificado || false,
          // notaModificacionBulto: conduceData.nota_modificacion_bulto, // Comentado hasta que se añada al tipo
          relacion: conduceData.relacion
        };
        
        console.log('Conduce encontrado en la base de datos:', { 
          id: conduce.id, 
          numeroConduce: conduce.numeroConduce,
          fechaEntrega: conduce.fechaEntrega,
          encomendado: conduce.encomendado
        });
      } catch (error) {
        console.error('Error fetching conduce from database:', error);
        throw new Error(`No se encontró el conduce con ID: ${id}`);
      }
    } else {
      console.log('Found conduce in local array:', { 
        id: conduce.id, 
        numeroConduce: conduce.numeroConduce,
        fechaEntrega: conduce.fechaEntrega,
        encomendado: conduce.encomendado
      });
    }
    
    try {
      // Calcular el tiempo real de entrega (negativo si se entregó antes de tiempo)
      const tiempoEntrega = calculateDeliveryTime(conduce.fechaEntrega, now);
      
      console.log('Tiempo de entrega calculado:', tiempoEntrega);
      
      // Get the current encomendado from the auth context or the conduce itself
      const currentEncomendado = conduce.encomendado;
      
      console.log('Calling conduceService.entregarConduce...');
      
      // Crear fecha y hora exacta de entrega
      const horaEntregaExacta = new Date().toISOString();
      
      await conduceService.entregarConduce(id, firma, nota, imagen, currentEncomendado, horaEntregaExacta, tiempoEntrega);
      
      console.log('Service call completed successfully');
      
      const updateData: Partial<Conduce> = {
        estado: 'Entregado' as const,
        firma,
        nota,
        imagen,
        tiempoEntrega,
        encomendado: currentEncomendado,
        horaEntregaExacta
      };
      
      console.log('Datos de actualización local:', updateData);
      
      // Update local state
      setConduces(conduces.map(c => 
        c.id === id ? { ...c, ...updateData } : c
      ));

      console.log(`Conduce ${conduce.numeroConduce} entregado con tiempo total: ${tiempoEntrega}`);
    } catch (error) {
      console.error('Error in entregarConduce:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : undefined);
      
      // Re-throw the error with more context
      const contextualError = new Error(`Error entregando conduce ${conduce.numeroConduce}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw contextualError;
    }
  };

  const devolverConduce = async (id: string, nota: string) => {
    console.log('devolverConduce called with:', { id, noteLength: nota?.length || 0 });
    
    try {
      await conduceService.devolverConduce(id, nota);
      
      console.log('Service call completed successfully for return');
      
      setConduces(conduces.map(c => 
        c.id === id ? { ...c, estado: 'Devuelto' as const, nota } : c
      ));
    } catch (error) {
      console.error('Error in devolverConduce:', error);
      throw error;
    }
  };

  return {
    addConduce,
    updateConduce,
    asignarEncomendado,
    entregarConduce,
    devolverConduce
  };
};
