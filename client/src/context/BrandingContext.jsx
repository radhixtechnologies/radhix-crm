import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { brandingService } from '../services/brandingService';

const BrandingContext = createContext(null);

const DEFAULT_BRANDING = {
  brandColor: '#6366f1',
  accentColor: '#8b5cf6',
  logo: '',
  favicon: '',
  companyDisplayName: 'Radhix CRM',
  tagline: 'Modern Unified Sales & Business Management Platform',
  supportEmail: 'support@radhix.com',
  supportPhone: '+91 98765 43210',
  customDomain: '',
  invoiceHeaderNote: 'Thank you for your business! We appreciate your partnership.',
  invoiceFooterTerms: 'Payment is due within 15 days of invoice date. All disputes subject to local jurisdiction.',
  signatureUrl: '',
};

// Helper: darken or lighten hex colors
function adjustColorBrightness(hex, percent) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = (num >> 8 & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(() => {
    try {
      const saved = localStorage.getItem('radhix_crm_branding');
      return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
    } catch {
      return DEFAULT_BRANDING;
    }
  });
  const [loading, setLoading] = useState(false);

  // Apply colors and document title to DOM
  const applyThemeToDOM = useCallback((brandData) => {
    const color = brandData.brandColor || '#6366f1';
    const darkColor = adjustColorBrightness(color, -20);
    const lightColor = adjustColorBrightness(color, 25);

    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-dark', darkColor);
    root.style.setProperty('--primary-light', lightColor);

    // Dynamic title
    if (brandData.companyDisplayName) {
      if (!document.title.includes(brandData.companyDisplayName)) {
        document.title = `${brandData.companyDisplayName} | Modern CRM`;
      }
    }

    // Dynamic Favicon if provided
    if (brandData.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = brandData.favicon;
    }
  }, []);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = token
        ? await brandingService.getBranding()
        : await brandingService.getPublicBranding();
      if (res.data?.success && res.data?.data) {
        const fresh = { ...DEFAULT_BRANDING, ...res.data.data };
        setBranding(fresh);
        localStorage.setItem('radhix_crm_branding', JSON.stringify(fresh));
        applyThemeToDOM(fresh);
      }
    } catch {
      // Fallback to current / default silently
    } finally {
      setLoading(false);
    }
  }, [applyThemeToDOM]);

  useEffect(() => {
    applyThemeToDOM(branding);
    fetchBranding();
  }, [applyThemeToDOM, fetchBranding]);

  const updateBranding = async (newSettings) => {
    try {
      setLoading(true);
      const res = await brandingService.updateBranding(newSettings);
      if (res.data?.success && res.data?.data) {
        const updated = { ...DEFAULT_BRANDING, ...res.data.data };
        setBranding(updated);
        localStorage.setItem('radhix_crm_branding', JSON.stringify(updated));
        applyThemeToDOM(updated);
        return { success: true, data: updated };
      }
      return { success: false, message: res.data?.message || 'Update failed' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const resetBranding = async () => {
    try {
      setLoading(true);
      const res = await brandingService.resetBranding();
      if (res.data?.success) {
        setBranding(DEFAULT_BRANDING);
        localStorage.removeItem('radhix_crm_branding');
        applyThemeToDOM(DEFAULT_BRANDING);
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        updateBranding,
        resetBranding,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      updateBranding: async () => {},
      resetBranding: async () => {},
      refreshBranding: async () => {},
    };
  }
  return context;
};

export default BrandingContext;

