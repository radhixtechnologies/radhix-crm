import { createContext, useContext, useState, useEffect } from 'react';

const QuickActionsContext = createContext();

export const useQuickActions = () => {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error('useQuickActions must be used within QuickActionsProvider');
  }
  return context;
};

export const QuickActionsProvider = ({ children }) => {
  // Quick Actions should be open by default
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage for saved preference, default to true
      const saved = localStorage.getItem('quickActionsOpen');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('quickActionsOpen', isOpen.toString());
  }, [isOpen]);

  const toggleQuickActions = () => {
    setIsOpen((prev) => !prev);
  };

  const openQuickActions = () => {
    setIsOpen(true);
  };

  const closeQuickActions = () => {
    setIsOpen(false);
  };

  return (
    <QuickActionsContext.Provider value={{ isOpen, toggleQuickActions, openQuickActions, closeQuickActions }}>
      {children}
    </QuickActionsContext.Provider>
  );
};

