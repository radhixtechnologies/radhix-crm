import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { INDUSTRY_SUITES, getIndustrySuiteById } from '../constants/industrySuites';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'radhix_active_industry_suite';

const IndustrySuiteContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useIndustrySuite = () => {
  const context = useContext(IndustrySuiteContext);
  if (!context) {
    throw new Error('useIndustrySuite must be used within an IndustrySuiteProvider');
  }
  return context;
};

export const IndustrySuiteProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperAdmin = user?.role?.slug === 'super_admin' || user?.role === 'super_admin';

  // Determine allowed suites based on user company / subscription
  const { availableSuites, defaultSuiteId, isSingleSuiteTenant } = useMemo(() => {
    if (!user || isSuperAdmin) {
      return {
        availableSuites: INDUSTRY_SUITES,
        defaultSuiteId: 'all',
        isSingleSuiteTenant: false,
      };
    }

    const company = user.company;
    const companyIndustry = company?.industry?.toLowerCase()?.trim() || '';
    const allowedSuitesList = Array.isArray(company?.subscription?.allowedSuites)
      ? company.subscription.allowedSuites.map((s) => s.toLowerCase().trim()).filter((s) => s !== 'all')
      : [];

    let suites = [];
    if (companyIndustry) {
      suites = INDUSTRY_SUITES.filter((s) => s.id === companyIndustry);
    }
    if (suites.length === 0 && allowedSuitesList.length > 0) {
      suites = INDUSTRY_SUITES.filter((s) => allowedSuitesList.includes(s.id));
    }
    if (suites.length === 0) {
      suites = [INDUSTRY_SUITES.find((s) => s.id === 'real-estate') || INDUSTRY_SUITES[0]];
    }

    const primaryId = suites[0]?.id || companyIndustry || 'real-estate';

    return {
      availableSuites: suites,
      defaultSuiteId: primaryId,
      isSingleSuiteTenant: true,
    };
  }, [user, isSuperAdmin]);

  const [activeSuiteId, setActiveSuiteId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  // Enforce suite restriction for tenant
  useEffect(() => {
    if (!isSuperAdmin && defaultSuiteId && defaultSuiteId !== 'all') {
      if (activeSuiteId !== defaultSuiteId) {
        setActiveSuiteId(defaultSuiteId);
        try {
          localStorage.setItem(STORAGE_KEY, defaultSuiteId);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [isSuperAdmin, defaultSuiteId, activeSuiteId]);

  // Sync active suite with current route if user directly visits an industry path
  useEffect(() => {
    const pathname = location.pathname;
    const matchedSuite = availableSuites.find((suite) => {
      if (pathname.startsWith(`/${suite.id}`)) return true;
      if (suite.id === 'institute' && pathname.startsWith('/institute')) return true;
      if (suite.id === 'real-estate' && pathname.startsWith('/real-estate')) return true;
      return false;
    });

    if (matchedSuite && activeSuiteId !== matchedSuite.id && activeSuiteId !== 'all') {
      setActiveSuiteId(matchedSuite.id);
      try {
        localStorage.setItem(STORAGE_KEY, matchedSuite.id);
      } catch (err) {
        console.error('Failed to persist active suite:', err);
      }
    }
  }, [location.pathname, activeSuiteId, availableSuites]);

  const setSuite = useCallback(
    (suiteId, shouldNavigate = false) => {
      // Validate permission: if tenant, only allowed suites
      if (!isSuperAdmin && suiteId !== defaultSuiteId && !availableSuites.some((s) => s.id === suiteId)) {
        return;
      }

      setActiveSuiteId(suiteId);
      try {
        localStorage.setItem(STORAGE_KEY, suiteId);
      } catch (err) {
        console.error('Failed to save suite to storage:', err);
      }

      if (shouldNavigate) {
        if (suiteId === 'all') {
          navigate('/industry-hub');
        } else {
          const suite = getIndustrySuiteById(suiteId);
          if (suite && suite.defaultPath) {
            navigate(suite.defaultPath);
          }
        }
      }
    },
    [navigate, isSuperAdmin, defaultSuiteId, availableSuites]
  );

  const currentSuite = getIndustrySuiteById(activeSuiteId) || availableSuites[0] || null;

  const value = {
    activeSuiteId,
    currentSuite,
    availableSuites,
    setSuite,
    isAllSuites: isSuperAdmin && activeSuiteId === 'all',
    isSingleSuiteTenant,
  };

  return (
    <IndustrySuiteContext.Provider value={value}>
      {children}
    </IndustrySuiteContext.Provider>
  );
};
