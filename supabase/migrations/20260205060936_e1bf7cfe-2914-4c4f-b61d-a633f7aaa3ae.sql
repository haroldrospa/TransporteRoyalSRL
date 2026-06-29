-- Eliminar el trigger duplicado
DROP TRIGGER IF EXISTS trigger_update_conduces_after_cliente_update ON public.clientes;

-- Recrear la función optimizada para solo actualizar cuando hay cambios relevantes
CREATE OR REPLACE FUNCTION public.update_conduces_on_cliente_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar conduces si los campos relevantes cambiaron
  IF (OLD.razon_social IS DISTINCT FROM NEW.razon_social) OR 
     (OLD.ciudad IS DISTINCT FROM NEW.ciudad) OR 
     (OLD.encomendado IS DISTINCT FROM NEW.encomendado) THEN
    
    -- Update matching conduces when a cliente is updated
    UPDATE conduces
    SET 
      razon_social = NEW.razon_social,
      ciudad = NEW.ciudad,
      encomendado = COALESCE(conduces.encomendado, NEW.encomendado)
    WHERE numero_cliente = NEW.numero_cliente
      AND (razon_social IS DISTINCT FROM NEW.razon_social
           OR ciudad IS DISTINCT FROM NEW.ciudad
           OR (encomendado IS NULL AND NEW.encomendado IS NOT NULL));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;