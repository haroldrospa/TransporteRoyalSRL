/**
 * Sync Service for Cargar Camiones
 * Handles synchronization of offline data when back online
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  getPendingScans, 
  markScanAsSynced, 
  clearSyncedScans,
  PendingScan 
} from './offlineStorageService';
import { toast } from '@/hooks/use-toast';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync all pending offline scans to the database
 */
export async function syncPendingScans(): Promise<SyncResult> {
  console.log('🔄 Starting offline sync...');
  
  const pendingScans = await getPendingScans();
  
  if (pendingScans.length === 0) {
    console.log('✅ No pending scans to sync');
    return { success: true, synced: 0, failed: 0, errors: [] };
  }

  console.log(`📤 Syncing ${pendingScans.length} offline scans...`);
  
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process scans in batches of 10
  const batchSize = 10;
  for (let i = 0; i < pendingScans.length; i += batchSize) {
    const batch = pendingScans.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(scan => syncSingleScan(scan))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        synced++;
      } else {
        failed++;
        const errorMsg = result.status === 'rejected' 
          ? result.reason?.message 
          : 'Unknown error';
        errors.push(`${batch[index].conduce_number}: ${errorMsg}`);
      }
    });
  }

  // Clean up synced scans
  await clearSyncedScans();

  const result = {
    success: failed === 0,
    synced,
    failed,
    errors,
  };

  console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
  
  if (synced > 0) {
    toast({
      title: "Sincronización completada",
      description: `${synced} escaneos sincronizados${failed > 0 ? `, ${failed} fallidos` : ''}`,
      variant: failed > 0 ? "destructive" : "default",
    });
  }

  return result;
}

/**
 * Sync a single pending scan
 */
async function syncSingleScan(scan: PendingScan): Promise<boolean> {
  try {
    // Check if already exists to avoid duplicates
    const { data: existing } = await supabase
      .from('verified_shipments')
      .select('id')
      .eq('conduce_number', scan.conduce_number)
      .eq('scan_type', scan.scan_type)
      .eq('bulto_sequence', scan.bulto_sequence || null)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️ Scan already exists, skipping: ${scan.conduce_number}`);
      await markScanAsSynced(scan.id);
      return true;
    }

    // Insert the scan
    const { error } = await supabase
      .from('verified_shipments')
      .insert({
        conduce_id: scan.conduce_id,
        conduce_number: scan.conduce_number,
        encomendado: scan.encomendado,
        scan_type: scan.scan_type,
        bulto_sequence: scan.bulto_sequence,
        user_id: scan.user_id,
        user_name: scan.user_name,
        verified_at: scan.created_at, // Use original scan time
      });

    if (error) throw error;

    await markScanAsSynced(scan.id);
    console.log(`✅ Synced scan: ${scan.conduce_number}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to sync scan ${scan.conduce_number}:`, error);
    throw error;
  }
}

/**
 * Get count of pending scans
 */
export async function getPendingScanCount(): Promise<number> {
  const pending = await getPendingScans();
  return pending.length;
}
