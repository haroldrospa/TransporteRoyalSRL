// Centralized cache management to avoid conflicts between old and new systems

// Clear all existing caches to force fresh data
export function clearAllCaches() {
  console.log('🧹 Clearing all caches to force fresh data...');
  
  // Clear localStorage cache if any
  if (typeof window !== 'undefined') {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('conduce') || key.includes('cache') || key.includes('optim'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Removed ${keysToRemove.length} localStorage cache entries`);
  }
  
  // Clear any module-level caches
  try {
    // Import and clear optimized cache if available
    import('./optimizedFetchConduces').then(module => {
      if (module.clearOptimizedCache) {
        module.clearOptimizedCache();
        console.log('🧹 Cleared optimized cache');
      }
    }).catch(() => {
      // Cache module might not exist, that's ok
    });
  } catch (error) {
    // Ignore errors - cache might not exist
  }
}

// Force disable any background data loading
export function disableBackgroundLoading() {
  console.log('⏹️ Disabling background data loading...');
  
  // Set a flag to prevent old hooks from running
  if (typeof window !== 'undefined') {
    (window as any).__DISABLE_OLD_HOOKS__ = true;
  }
}

// Initialize ultra-fast mode
export function initializeUltraFastMode() {
  console.log('⚡ Initializing Ultra Fast Mode...');
  clearAllCaches();
  disableBackgroundLoading();
}