-- Eliminar el constraint existente de scan_type
ALTER TABLE verified_shipments 
DROP CONSTRAINT IF EXISTS verified_shipments_scan_type_check;

-- Agregar nuevo constraint que incluya 'conduce_nave'
ALTER TABLE verified_shipments
ADD CONSTRAINT verified_shipments_scan_type_check 
CHECK (scan_type IN ('conduce', 'bulto', 'conduce_nave'));