import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiFileText, FiBriefcase, FiAlertCircle } from 'react-icons/fi';
import { searchService } from '../../services/searchService';
import '../../styles/dashboard.css';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                setShowResults(true);
                try {
                    const response = await searchService.globalSearch(query);
                    if (response.data.success) {
                        setResults(response.data.data);
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults(null);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleResultClick = (type, id) => {
        setShowResults(false);
        setQuery('');
        switch (type) {
            case 'lead': navigate(`/sales/leads/${id}`); break;
            case 'employee': navigate(`/employees/${id}`); break;
            case 'invoice': navigate(`/finance/invoices/${id}`); break;
            case 'deal': navigate(`/sales/deals/${id}`); break;
            case 'ticket': navigate(`/support/tickets/${id}`); break; // Assuming route exists
            default: break;
        }
    };

    const hasResults = results && (
        results.leads?.length > 0 ||
        results.employees?.length > 0 ||
        results.invoices?.length > 0 ||
        results.deals?.length > 0 ||
        results.tickets?.length > 0
    );

    return (
        <div className="navbar-search" ref={searchRef} style={{ position: 'relative' }}>
            <FiSearch />
            <input
                type="text"
                placeholder="Search employees, leads, deals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.length >= 2) setShowResults(true); }}
            />
            <span className="search-shortcut">Ctrl + K</span>

            {showResults && (
                <div className="search-dropdown animate-fade-in" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    minWidth: '300px',
                    maxWidth: '100vw',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    {loading && <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>Searching...</div>}

                    {!loading && !hasResults && query.length >= 2 && (
                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>No results found</div>
                    )}

                    {!loading && results && (
                        <>
                            {results.employees?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-header">Employees</div>
                                    {results.employees.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleResultClick('employee', item.id)}>
                                            <FiUser className="search-icon" />
                                            <div>
                                                <div className="search-title">{item.title}</div>
                                                <div className="search-subtitle">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.leads?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-header">Leads</div>
                                    {results.leads.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleResultClick('lead', item.id)}>
                                            <FiUser className="search-icon" />
                                            <div>
                                                <div className="search-title">{item.title}</div>
                                                <div className="search-subtitle">{item.subtitle} • {item.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.deals?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-header">Deals</div>
                                    {results.deals.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleResultClick('deal', item.id)}>
                                            <FiBriefcase className="search-icon" />
                                            <div>
                                                <div className="search-title">{item.title}</div>
                                                <div className="search-subtitle">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.invoices?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-header">Invoices</div>
                                    {results.invoices.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleResultClick('invoice', item.id)}>
                                            <FiFileText className="search-icon" />
                                            <div>
                                                <div className="search-title">{item.title}</div>
                                                <div className="search-subtitle">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.tickets?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-header">Tickets</div>
                                    {results.tickets.map(item => (
                                        <div key={item.id} className="search-item" onClick={() => handleResultClick('ticket', item.id)}>
                                            <FiAlertCircle className="search-icon" />
                                            <div>
                                                <div className="search-title">{item.title}</div>
                                                <div className="search-subtitle">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
