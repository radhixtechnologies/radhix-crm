import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // Desktop (>= 1024px): closed by default (opens on hover)
  // Tablet (768px-1023px): closed by default (opens on hover)
  // Mobile (< 768px): closed (drawer mode, opens via menu button)
  const [isOpen, setIsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null); // 'hrm', 'finance', 'sales', etc.

  // Handle window resize - auto-collapse on tablet, close on mobile
  useEffect(() => {
    let previousWidth = window.innerWidth;

    const handleResize = () => {
      const width = window.innerWidth;
      const previousIsMobile = previousWidth < 768;
      const currentIsMobile = width < 768;

      // Only force close when transitioning TO mobile from desktop/tablet
      if (currentIsMobile && !previousIsMobile) {
        setIsOpen(false);
        setActiveModule(null);
      }

      previousWidth = width;
    };

    window.addEventListener('resize', handleResize);
    // Don't run on mount to avoid interfering with initial state
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = (forceState) => {
    if (forceState !== undefined) {
      setIsOpen(forceState);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const openSidebar = () => {
    setIsOpen(true);
  };

  const setModule = (moduleKey) => {
    setActiveModule(moduleKey);
    // If setting a module, we generally want to open the secondary sidebar if it has content
    // But the Sidebar component will handle the specific logic of what to do
  };

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      activeModule,
      setActiveModule: setModule
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

