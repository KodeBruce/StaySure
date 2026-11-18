import React, { createContext, useContext } from 'react';
import { useResearchSelection } from '../data/researchSelection';

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
  const compared = useResearchSelection('compare');
  const saved = useResearchSelection('saved');

  const addToCompare = (id: string): boolean => {
    if (compared.ids.includes(id)) {
      compared.toggle(id);
      return false;
    }
    if (compared.ids.length >= 3) {
      alert("You can compare up to 3 properties. Remove one first.");
      return false;
    }
    compared.toggle(id);
    return true;
  };

  const removeFromCompare = (id: string) => {
    if (compared.ids.includes(id)) {
      compared.toggle(id);
    }
  };

  const clearCompare = () => {
    compared.clear();
  };

  const toggleSave = (id: string) => {
    saved.toggle(id);
  };

  return (
    <CompareContext.Provider value={{
      compareIds: compared.ids,
      addToCompare,
      removeFromCompare,
      clearCompare,
      savedIds: saved.ids,
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


