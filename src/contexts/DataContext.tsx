
import React, { createContext, useContext } from 'react';
import { DataContextType } from './types/dataContextTypes';

// Create context with undefined as initial value
const DataContext = createContext<DataContextType | undefined>(undefined);

// Export the useData hook
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Export the context for the provider to use
export { DataContext };
