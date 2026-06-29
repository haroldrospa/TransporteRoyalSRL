import * as XLSX from 'xlsx';
import { Cliente } from '@/types/cliente';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const COLUMN_MAP = {
  export: ['Razon social', 'RNC', 'TELEFONO', 'REGION', 'Ciudad'],
};

/**
 * Export clientes to Excel with specified column order
 */
export const exportClientesToExcel = async () => {
  try {
    // Fetch all clientes in batches to bypass Supabase's 1000 row default limit
    const BATCH_SIZE = 1000;
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('clientes')
        .select('razon_social, rnc, contacto, zona, ciudad')
        .order('razon_social')
        .range(from, from + BATCH_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += BATCH_SIZE;
        hasMore = data.length === BATCH_SIZE;
      } else {
        hasMore = false;
      }
    }

    const rows = allData.map(c => ({
      'Razon social': c.razon_social || '',
      'RNC': c.rnc || '',
      'TELEFONO': c.contacto || '',
      'REGION': c.zona || '',
      'Ciudad': c.ciudad || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMN_MAP.export });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Auto-width columns
    const colWidths = COLUMN_MAP.export.map(h => ({ wch: Math.max(h.length, 20) }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({ title: 'Exportación completada', description: `${rows.length} clientes exportados.` });
  } catch (err) {
    console.error('Export error:', err);
    toast({ title: 'Error', description: 'No se pudo exportar los clientes.', variant: 'destructive' });
  }
};

/**
 * Import clientes from Excel file
 */
export const importClientesFromExcel = async (
  file: File,
  onComplete: () => void
): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> => {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (jsonRows.length === 0) {
      toast({ title: 'Archivo vacío', description: 'El archivo no contiene datos.', variant: 'destructive' });
      return result;
    }

    // Normalize header keys
    const rows = jsonRows.map(row => {
      const normalized: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim().toLowerCase()] = String(row[key] ?? '').trim();
      }
      return normalized;
    });

    // Fetch existing clientes for duplicate detection
    const { data: existing } = await supabase
      .from('clientes')
      .select('id, razon_social, rnc');

    const existingByRnc = new Map<string, string>();
    const existingByName = new Map<string, string>();
    (existing || []).forEach(c => {
      if (c.rnc) existingByRnc.set(c.rnc.trim(), c.id);
      existingByName.set(c.razon_social.toLowerCase(), c.id);
    });

    // Track RNCs seen in THIS import to skip duplicates within the file
    const seenRncs = new Set<string>();

    const toInsert: any[] = [];
    const toUpdate: { id: string; data: any }[] = [];

    for (const row of rows) {
      const razonSocial = row['razon social'] || row['razonsocial'] || row['razon_social'] || '';
      const rnc = row['rnc'] || '';
      const telefono = row['telefono'] || row['contacto'] || '';
      const region = row['region'] || row['zona'] || '';
      const ciudad = row['ciudad'] || row['provincia'] || '';

      if (!razonSocial) {
        result.errors++;
        continue;
      }

      // Duplicate check by RNC within file
      if (rnc) {
        if (seenRncs.has(rnc)) {
          result.skipped++;
          continue;
        }
        seenRncs.add(rnc);
      }

      // Normalize zona - leave blank if not recognized
      let zona = '';
      if (region) {
        const regionLower = region.toLowerCase();
        if (regionLower.includes('sur')) zona = 'Sur';
        else if (regionLower.includes('norte') || regionLower.includes('ciudad')) zona = 'Norte';
        else zona = region;
      }

      const uniqueId = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${Math.floor(Math.random() * 10000)}`;
      const clienteData = {
        razon_social: razonSocial.toUpperCase(),
        rnc: rnc || null,
        contacto: telefono || null,
        zona: zona || 'Norte',
        ciudad: ciudad ? ciudad.toUpperCase() : null,
        numero_cliente: rnc || uniqueId,
      };

      // Check duplicate by RNC in DB first, then by name
      const existingId = (rnc && existingByRnc.get(rnc)) || existingByName.get(razonSocial.toUpperCase().toLowerCase());
      if (existingId) {
        toUpdate.push({ id: existingId, data: { rnc: clienteData.rnc, contacto: clienteData.contacto, zona: clienteData.zona, ciudad: clienteData.ciudad } });
      } else {
        toInsert.push(clienteData);
      }
    }

    // Insert new clientes one by one to handle individual conflicts
    if (toInsert.length > 0) {
      for (const item of toInsert) {
        const { error } = await supabase.from('clientes').insert(item);
        if (error) {
          if (error.code === '23505') {
            // Duplicate numero_cliente - try with a new unique ID
            item.numero_cliente = `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const { error: retryError } = await supabase.from('clientes').insert(item);
            if (retryError) {
              console.error('Retry insert error:', retryError);
              result.errors++;
            } else {
              result.inserted++;
            }
          } else {
            console.error('Insert error:', error);
            result.errors++;
          }
        } else {
          result.inserted++;
        }
      }
    }

    // Batch update
    for (const item of toUpdate) {
      const { error } = await supabase.from('clientes').update(item.data).eq('id', item.id);
      if (error) {
        console.error('Update error:', error);
        result.errors++;
      } else {
        result.updated++;
      }
    }

    toast({
      title: 'Importación completada',
      description: `${result.inserted} insertados, ${result.updated} actualizados, ${result.skipped} duplicados omitidos, ${result.errors} errores.`,
    });

    onComplete();
  } catch (err) {
    console.error('Import error:', err);
    toast({ title: 'Error', description: 'No se pudo importar el archivo.', variant: 'destructive' });
  }

  return result;
};
