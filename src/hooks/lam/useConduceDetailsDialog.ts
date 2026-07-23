
import { useState, useEffect } from 'react';
import { Conduce } from '@/types/conduces';
import { EditDataType } from '@/components/lam/dialog/DeliveryDetailsForm';

interface UseConduceDetailsDialogProps {
  selectedConduce: Conduce | null;
  onSaveChanges: (
    updates: {
      tiempoEntrega: string;
      nota: string;
      excepcion: boolean;
      motivoExcepcion: string | null;
      firma: string;
      imagen: string;
      cantidadEntregados?: number;
      bultoModificacionNota?: string;
      bultoModificado?: boolean;
      laboratorio?: string;
    }
  ) => Promise<void>;
  loadConduceImage?: (conduceId: string) => Promise<string | null>;
}

export const useConduceDetailsDialog = ({ 
  selectedConduce, 
  onSaveChanges,
  loadConduceImage
}: UseConduceDetailsDialogProps) => {
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState<EditDataType>({
    tiempoEntrega: '',
    nota: '',
    excepcion: false,
    motivoExcepcion: '',
    cantidadEntregados: 0,
    bultoModificacionNota: '',
    laboratorio: '',
  });
  const [signatureData, setSignatureData] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    if (selectedConduce) {
      setEditData({
        tiempoEntrega: selectedConduce.tiempoEntrega || '',
        nota: selectedConduce.nota || '',
        excepcion: selectedConduce.excepcion || false,
        motivoExcepcion: selectedConduce.motivoExcepcion || '',
        cantidadEntregados: selectedConduce.cantidadEntregados !== undefined 
          ? selectedConduce.cantidadEntregados 
          : selectedConduce.cantidadBultos,
        bultoModificacionNota: selectedConduce.bultoModificacionNota || '',
        laboratorio: selectedConduce.laboratorio || '',
      });
      setSignatureData(selectedConduce.firma || '');
      
      // Cargar imagen inmediatamente si existe, o intentar cargarla bajo demanda
      if (selectedConduce.imagen) {
        setImageData(selectedConduce.imagen);
      } else if (loadConduceImage && selectedConduce.estado === 'Entregado') {
        console.log(`🔄 Loading image for conduce ${selectedConduce.numeroConduce}...`);
        loadConduceImage(selectedConduce.id).then((imageUrl) => {
          if (imageUrl) {
            setImageData(imageUrl);
            console.log(`✅ Image loaded for conduce ${selectedConduce.numeroConduce}`);
          }
        }).catch((error) => {
          console.error(`❌ Error loading image for conduce ${selectedConduce.numeroConduce}:`, error);
          setImageData('');
        });
      } else {
        setImageData('');
      }
    } else {
      // Solo resetear cuando no hay conduce seleccionado
      setEditData({
        tiempoEntrega: '',
        nota: '',
        excepcion: false,
        motivoExcepcion: '',
        cantidadEntregados: 0,
        bultoModificacionNota: '',
        laboratorio: '',
      });
      setSignatureData('');
      setImageData('');
    }
    // No resetear editMode aquí para permitir que el usuario entre en modo edición
  }, [selectedConduce]);

  // Resetear editMode solo cuando se cierra el diálogo
  useEffect(() => {
    if (!selectedConduce) {
      setEditMode(false);
    }
  }, [selectedConduce]);

  const handleBultosChange = (value: number, note: string) => {
    setEditData(prev => ({
      ...prev,
      cantidadEntregados: value,
      bultoModificacionNota: note
    }));
  };

  const handleSetEditData = (data: EditDataType) => {
    setEditData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedConduce) return;
    
    // Check if bultos were actually modified and if reducing, require a note
    const originalBultos = selectedConduce.cantidadEntregados !== undefined 
      ? selectedConduce.cantidadEntregados 
      : selectedConduce.cantidadBultos;
    const isModifyingBultos = editData.cantidadEntregados !== originalBultos;
    const isReducingBultos = editData.cantidadEntregados < selectedConduce.cantidadBultos;
    
    if (isModifyingBultos && isReducingBultos && !editData.bultoModificacionNota) {
      alert("Se requiere una nota cuando se reduce la cantidad de bultos entregados.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bultoModificado = editData.cantidadEntregados !== selectedConduce.cantidadBultos;
      
      const updates: any = {
        tiempoEntrega: editData.tiempoEntrega,
        nota: editData.nota,
        excepcion: editData.excepcion,
        motivoExcepcion: editData.excepcion ? editData.motivoExcepcion : null,
        firma: signatureData || selectedConduce.firma || '',
        imagen: imageData || selectedConduce.imagen || '',
        cantidadEntregados: editData.cantidadEntregados,
        bultoModificacionNota: bultoModificado ? editData.bultoModificacionNota : undefined,
        bultoModificado
      };

      if (editData.laboratorio) {
        updates.laboratorio = editData.laboratorio;
      }
      
      await onSaveChanges(updates);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating conduce:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    editMode,
    editData,
    isSubmitting,
    signatureData,
    imageData,
    setEditMode,
    handleBultosChange,
    handleSetEditData,
    handleSaveChanges,
    setSignatureData,
    setImageData
  };
};
