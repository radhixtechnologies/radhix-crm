import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setCompanyDropdownOpen(false);
  }, [location]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 py-1"
          : (location.pathname === "/" ? "bg-transparent py-2.5" : "bg-white/90 backdrop-blur-md border-b border-slate-200 py-1")
          }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 sm:px-6">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Zynextro CRM" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${scrolled || location.pathname !== "/"
                ? (isActive("/") ? "text-[#4f46e5] bg-indigo-50" : "text-slate-600 hover:text-[#818cf8] hover:bg-indigo-50")
                : "text-white hover:text-white/80"
                }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link
              to="/about-us"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${scrolled || location.pathname !== "/"
                ? (isActive("/about-us") ? "text-[#4f46e5] bg-indigo-50" : "text-slate-600 hover:text-[#818cf8] hover:bg-indigo-50")
                : "text-white hover:text-white/80"
                }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About Us
            </Link>
            <Link
              to="/pricing"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${scrolled || location.pathname !== "/"
                ? (isActive("/pricing") ? "text-[#4f46e5] bg-indigo-50" : "text-slate-600 hover:text-[#818cf8] hover:bg-indigo-50")
                : "text-white hover:text-white/80"
                }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Pricing
            </Link>

            {/* Company Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCompanyDropdownOpen(true)}
              onMouseLeave={() => setCompanyDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${scrolled || location.pathname !== "/"
                  ? ((isActive("/terms-and-services") || isActive("/privacy-policy") || companyDropdownOpen) ? "text-[#4f46e5] bg-indigo-50" : "text-slate-600 hover:text-[#818cf8] hover:bg-indigo-50")
                  : "text-white hover:text-white/80"
                  }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company
                <svg
                  className={`h-4 w-4 transition-transform ${companyDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {companyDropdownOpen && (
                <div className="absolute top-full left-0 mt-0 w-48 rounded-lg border border-slate-100 bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
                  <Link
                    to="/terms-and-services"
                    onClick={(e) => {
                      setCompanyDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#818cf8] ${isActive("/terms-and-services") ? "text-[#4f46e5]" : ""
                      }`}
                  >
                    Terms & Services
                  </Link>
                  <Link
                    to="/privacy-policy"
                    onClick={(e) => {
                      setCompanyDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#818cf8] ${isActive("/privacy-policy") ? "text-[#4f46e5]" : ""
                      }`}
                  >
                    Privacy Policy
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Contact Button & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Link
              to="/contact-us"
              className="hidden rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 md:block bg-[#6366f1]"
            >
              Contact Us
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden ml-2 p-2 transition-colors ${scrolled || location.pathname !== "/" ? "text-slate-600" : "text-white"
                }`}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
            <div className="mt-2 space-y-1">
              <Link
                to="/"
                onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block rounded-md px-4 py-3 text-base font-medium transition-all ${isActive("/")
                  ? "bg-indigo-50 text-[#4f46e5]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#818cf8]"
                  }`}
              >
                Home
              </Link>
              <Link
                to="/about-us"
                onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block rounded-md px-4 py-3 text-base font-medium transition-all ${isActive("/about-us")
                  ? "bg-indigo-50 text-[#4f46e5]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#818cf8]"
                  }`}
              >
                About Us
              </Link>
              <Link
                to="/pricing"
                onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block rounded-md px-4 py-3 text-base font-medium transition-all ${isActive("/pricing")
                  ? "bg-indigo-50 text-[#4f46e5]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#818cf8]"
                  }`}
              >
                Pricing
              </Link>
              <Link
                to="/terms-and-services"
                onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block rounded-md px-4 py-3 text-base font-medium transition-all ${isActive("/terms-and-services")
                  ? "bg-indigo-50 text-[#4f46e5]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#818cf8]"
                  }`}
              >
                Terms & Services
              </Link>
              <Link
                to="/privacy-policy"
                onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`block rounded-md px-4 py-3 text-base font-medium transition-all ${isActive("/privacy-policy")
                  ? "bg-indigo-50 text-[#4f46e5]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#818cf8]"
                  }`}
              >
                Privacy Policy
              </Link>
            </div>

            <div className="mt-auto pb-8 px-4">
              <Link
                to="/contact-us"
                className="flex w-full items-center justify-center rounded-lg py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5"
                style={{ backgroundColor: "#6366f1" }}
              >
                Contact Us
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Header;


