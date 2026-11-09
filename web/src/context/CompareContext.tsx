import React, { createContext, useContext, useState } from 'react';

interface CompareContextType {
  compareIds: string[];
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  savedIds: string[];
  toggleSave: (id: string) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(["braam-student-village"]);

  const addToCompare = (id: string): boolean => {
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(item => item !== id));
      return false;
    }
    if (compareIds.length >= 3) {
      alert("You can compare up to 3 properties. Remove one first.");
      return false;
    }
    setCompareIds(prev => [...prev, id]);
    return true;
  };

  const removeFromCompare = (id: string) => {
    setCompareIds(prev => prev.filter(item => item !== id));
  };

  const clearCompare = () => setCompareIds([]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <CompareContext.Provider value={{
      compareIds,
      addToCompare,
      removeFromCompare,
      clearCompare,
      savedIds,
      toggleSave
    }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
};

