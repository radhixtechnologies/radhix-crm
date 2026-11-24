import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // Desktop / Tablet preference persisted in localStorage
  const [isOpen, setIsOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        const saved = localStorage.getItem('radhix_sidebar_open');
        return saved !== null ? saved === 'true' : false;
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [activeModule, setActiveModuleState] = useState('dashboard');

  // Handle window resize - auto-close when transitioning to mobile
  useEffect(() => {
    let previousWidth = window.innerWidth;

    const handleResize = () => {
      const width = window.innerWidth;
      const previousIsMobile = previousWidth < 768;
      const currentIsMobile = width < 768;

      if (currentIsMobile && !previousIsMobile) {
        setIsOpen(false);
      }

      previousWidth = width;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback((forceState) => {
    setIsOpen((prev) => {
      const next = forceState !== undefined ? Boolean(forceState) : !prev;
      try {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          localStorage.setItem('radhix_sidebar_open', String(next));
        }
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    try {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        localStorage.setItem('radhix_sidebar_open', 'false');
      }
    } catch {
      // ignore
    }
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    try {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        localStorage.setItem('radhix_sidebar_open', 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const setActiveModule = useCallback((moduleKey) => {
    setActiveModuleState(moduleKey);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        activeModule,
        setActiveModule,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
