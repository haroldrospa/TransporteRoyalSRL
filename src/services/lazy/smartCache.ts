// Smart caching system for reducing Supabase egress
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 50 * 1024 * 1024, defaultTTL = 10 * 60 * 1000) {
    this.maxSize = maxSize; // 50MB default
    this.defaultTTL = defaultTTL; // 10 minutes default
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      console.log(`🔍 Cache MISS for key: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      this.misses++;
      console.log(`⏰ Cache EXPIRED for key: ${key}`);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;
    
    console.log(`✅ Cache HIT for key: ${key} (accessed ${entry.accessCount} times)`);
    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const size = this.estimateSize(data);
    const timestamp = Date.now();

    // Clean expired entries first
    this.cleanExpired();

    // Make space if needed
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      size,
      accessCount: 1,
      lastAccessed: timestamp
    };

    this.cache.set(key, entry);
    console.log(`💾 Cached data for key: ${key} (${this.formatSize(size)})`);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Removed from cache: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('🧹 Cache cleared completely');
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.misses / totalRequests) * 100 : 0
    };
  }

  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.defaultTTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
    }
  }

  private ensureSpace(requiredSize: number): void {
    let currentSize = this.getTotalSize();
    
    if (currentSize + requiredSize <= this.maxSize) {
      return; // Enough space
    }

    console.log(`📦 Making space in cache (current: ${this.formatSize(currentSize)}, need: ${this.formatSize(requiredSize)})`);

    // Sort by LRU (least recently used) and access count
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;
      
      // Prioritize by access count first, then by last accessed time
      if (entryA.accessCount !== entryB.accessCount) {
        return entryA.accessCount - entryB.accessCount;
      }
      
      return entryA.lastAccessed - entryB.lastAccessed;
    });

    // Remove entries until we have enough space
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      currentSize -= entry.size;
      
      if (currentSize + requiredSize <= this.maxSize) {
        break;
      }
    }
    
    console.log(`✅ Made space in cache (new size: ${this.formatSize(currentSize)})`);
  }

  private getTotalSize(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  private estimateSize(data: any): number {
    // Simple estimation of object size
    const str = JSON.stringify(data);
    return str.length * 2; // Approximate UTF-16 encoding
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}

// Global cache instance
export const smartCache = new SmartCache();

// Helper functions for specific cache operations
export const cacheHelpers = {
  // Generate cache keys
  conduceKey: (filters?: any, page?: number, limit?: number) => 
    `conduces:${JSON.stringify(filters || {})}:${page || 0}:${limit || 20}`,
  
  clienteKey: (search?: string, page?: number, limit?: number) =>
    `clientes:${search || ''}:${page || 0}:${limit || 20}`,
  
  imageKey: (conduceId: string) => `image:${conduceId}`,
  
  statsKey: (region?: string, dateRange?: any) =>
    `stats:${region || ''}:${JSON.stringify(dateRange || {})}`,

  // Cache with automatic key generation
  cacheConduces: (data: any[], filters?: any, page?: number, limit?: number) => {
    const key = cacheHelpers.conduceKey(filters, page, limit);
    smartCache.set(key, data);
    return key;
  },

  getCachedConduces: (filters?: any, page?: number, limit?: number) => {
    const key = cacheHelpers.conduceKey(filters, page, limit);
    return smartCache.get(key);
  },

  // Invalidate related cache entries
  invalidateConduces: () => {
    smartCache.clearPattern('^conduces:');
    smartCache.clearPattern('^stats:');
  },

  invalidateClientes: () => {
    smartCache.clearPattern('^clientes:');
  }
};