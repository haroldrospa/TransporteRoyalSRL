/**
 * Offline Storage Service for Cargar Camiones
 * Uses IndexedDB for persistent offline storage
 */

import { Conduce } from '@/types/conduces';
import { VerifiedShipment } from '@/services/cargarCamiones/fastCargarCamionesService';

const DB_NAME = 'cargar-camiones-offline';
const DB_VERSION = 2; // Incremented to fix synced index (boolean -> number)

// Store names
const STORES = {
  CONDUCES: 'conduces',
  SHIPMENTS: 'shipments',
  PENDING_SCANS: 'pending_scans',
  META: 'meta',
};

export interface PendingScan {
  id: string;
  conduce_id: string | null;
  conduce_number: string;
  encomendado: string;
  scan_type: 'conduce' | 'bulto';
  bulto_sequence?: number;
  user_id?: string;
  user_name?: string;
  created_at: string;
  synced: number; // 0 = not synced, 1 = synced (IndexedDB doesn't index booleans well)
}

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB initialized for offline storage');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Conduces store
      if (!database.objectStoreNames.contains(STORES.CONDUCES)) {
        const conducesStore = database.createObjectStore(STORES.CONDUCES, { keyPath: 'id' });
        conducesStore.createIndex('numeroConduce', 'numeroConduce', { unique: false });
        conducesStore.createIndex('encomendado', 'encomendado', { unique: false });
      }

      // Verified shipments store
      if (!database.objectStoreNames.contains(STORES.SHIPMENTS)) {
        const shipmentsStore = database.createObjectStore(STORES.SHIPMENTS, { keyPath: 'id' });
        shipmentsStore.createIndex('conduce_number', 'conduce_number', { unique: false });
        shipmentsStore.createIndex('encomendado', 'encomendado', { unique: false });
      }

      // Pending scans store (for offline-created scans)
      if (!database.objectStoreNames.contains(STORES.PENDING_SCANS)) {
        const pendingStore = database.createObjectStore(STORES.PENDING_SCANS, { keyPath: 'id' });
        pendingStore.createIndex('synced', 'synced', { unique: false });
        pendingStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Meta store for cache timestamps
      if (!database.objectStoreNames.contains(STORES.META)) {
        database.createObjectStore(STORES.META, { keyPath: 'key' });
      }

      console.log('📦 IndexedDB stores created');
    };
  });
}

/**
 * Save conduces to offline storage
 */
export async function saveConducesOffline(conduces: Conduce[]): Promise<void> {
  try {
    const database = await initOfflineDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORES.CONDUCES, STORES.META], 'readwrite');
    const store = transaction.objectStore(STORES.CONDUCES);
    const metaStore = transaction.objectStore(STORES.META);

    // Clear existing and add new
    store.clear();
    conduces.forEach(conduce => store.add(conduce));

    // Update timestamp
    metaStore.put({ key: 'conduces_updated', value: Date.now() });

    transaction.oncomplete = () => {
      console.log(`💾 Saved ${conduces.length} conduces offline`);
      resolve();
    };

    transaction.onerror = () => {
      console.error('❌ Failed to save conduces offline:', transaction.error);
      reject(transaction.error);
    };
    });
  } catch (error) {
    console.warn('⚠️ No se pudo guardar conduces offline (posible falta de espacio en disco):', error);
  }
}

/**
 * Get conduces from offline storage
 */
export async function getConducesOffline(): Promise<Conduce[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.CONDUCES, 'readonly');
    const store = transaction.objectStore(STORES.CONDUCES);
    const request = store.getAll();

    request.onsuccess = () => {
      console.log(`📱 Loaded ${request.result.length} conduces from offline storage`);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('❌ Failed to get conduces offline:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Save shipments to offline storage
 */
export async function saveShipmentsOffline(shipments: VerifiedShipment[]): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SHIPMENTS, STORES.META], 'readwrite');
    const store = transaction.objectStore(STORES.SHIPMENTS);
    const metaStore = transaction.objectStore(STORES.META);

    // Use put instead of add to handle existing keys
    store.clear();
    shipments.forEach(shipment => {
      if (shipment && shipment.id) {
        store.put(shipment);
      }
    });

    // Update timestamp
    metaStore.put({ key: 'shipments_updated', value: Date.now() });

    transaction.oncomplete = () => {
      console.log(`💾 Saved ${shipments.length} shipments offline`);
      resolve();
    };

    transaction.onerror = () => {
      console.error('❌ Failed to save shipments offline:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Get shipments from offline storage
 */
export async function getShipmentsOffline(): Promise<VerifiedShipment[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.SHIPMENTS, 'readonly');
    const store = transaction.objectStore(STORES.SHIPMENTS);
    const request = store.getAll();

    request.onsuccess = () => {
      console.log(`📱 Loaded ${request.result.length} shipments from offline storage`);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('❌ Failed to get shipments offline:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Add a pending scan (created while offline)
 */
export async function addPendingScan(scan: Omit<PendingScan, 'id' | 'created_at' | 'synced'>): Promise<PendingScan> {
  const database = await initOfflineDB();

  const pendingScan: PendingScan = {
    ...scan,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    synced: 0, // 0 = not synced
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SCANS);
    const request = store.add(pendingScan);

    request.onsuccess = () => {
      console.log(`📱 Added pending scan: ${pendingScan.conduce_number}`);
      resolve(pendingScan);
    };

    request.onerror = () => {
      console.error('❌ Failed to add pending scan:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all pending (unsynced) scans
 */
export async function getPendingScans(): Promise<PendingScan[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_SCANS, 'readonly');
    const store = transaction.objectStore(STORES.PENDING_SCANS);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(0)); // 0 = not synced

    request.onsuccess = () => {
      console.log(`📱 Found ${request.result.length} pending scans to sync`);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('❌ Failed to get pending scans:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Mark a pending scan as synced
 */
export async function markScanAsSynced(scanId: string): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SCANS);
    const getRequest = store.get(scanId);

    getRequest.onsuccess = () => {
      const scan = getRequest.result;
      if (scan) {
        scan.synced = 1; // 1 = synced
        const updateRequest = store.put(scan);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

/**
 * Delete synced scans (cleanup)
 */
export async function clearSyncedScans(): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PENDING_SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SCANS);
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(1)); // 1 = synced

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      console.log('🧹 Cleared synced scans from offline storage');
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Get offline cache timestamp
 */
export async function getOfflineCacheTimestamp(): Promise<number | null> {
  const database = await initOfflineDB();

  return new Promise((resolve) => {
    const transaction = database.transaction(STORES.META, 'readonly');
    const store = transaction.objectStore(STORES.META);
    const request = store.get('conduces_updated');

    request.onsuccess = () => {
      resolve(request.result?.value || null);
    };

    request.onerror = () => {
      resolve(null);
    };
  });
}

/**
 * Check if offline data is available
 */
export async function hasOfflineData(): Promise<boolean> {
  try {
    const conduces = await getConducesOffline();
    return conduces.length > 0;
  } catch {
    return false;
  }
}

// Initialize DB on module load
initOfflineDB().catch(console.error);
