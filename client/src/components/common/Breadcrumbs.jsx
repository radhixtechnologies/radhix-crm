import { useLocation, Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const routeNameMap = {
        'hrm': 'HRM',
        'admin': 'Admin',
        'employees': 'Employees',
        'finance': 'Finance',
        'sales': 'Sales',
        'marketing': 'Marketing',
        'support': 'Support',
        'inventory': 'Inventory',
        'dashboard': 'Dashboard',
        'invoices': 'Invoices',
        'expenses': 'Expenses',
        'payroll': 'Payroll',
        'leads': 'Leads',
        'deals': 'Deals',
        'pipeline': 'Pipeline',
        'clients': 'Clients',
        'products': 'Products',
        'tickets': 'Tickets',
        'reports': 'Reports',
        'settings': 'Settings',
        'tasks': 'Tasks',
        'leave-allocation': 'Leave Allocation',
        'leave-balance-overview': 'Leave Balance',
        'salary-slips': 'Salary Slips',
        'salary-structures': 'Salary Structures',
        'attendance': 'Attendance',
        'recruitments': 'Recruitment',
        'performance': 'Performance',
        'leaves': 'Leaves',
        'quotations': 'Quotations',
        'proposals': 'Proposals',
        'new': 'Create New',
        'edit': 'Edit',
    };

    // Helper to format checks
    const getBreadcrumbName = (value) => {
        // Check if it's an ID (simple check: length > 10 and alphanumeric)
        if (value.length > 20 && /[0-9]/.test(value)) {
            return 'Details'; // Or fetch name if possible, but 'Details' is safe
        }
        return routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
    };

    // Helper to get correct breadcrumb path
    const getBreadcrumbPath = (value, index, pathnames) => {
        // Special handling for quotations and proposals - redirect to Sales Documents with appropriate tab
        if (value === 'quotations') {
            return '/sales/proposals?tab=quotations';
        }
        if (value === 'proposals') {
            return '/sales/proposals';
        }
        // Default path
        return `/${pathnames.slice(0, index + 1).join('/')}`;
    };

    return (
        <div className="breadcrumbs">
            <Link to="/dashboard" className="breadcrumb-item">
                <FiHome />
            </Link>
            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = getBreadcrumbPath(value, index, pathnames);
                const name = getBreadcrumbName(value);

                return (
                    <div key={to} className="breadcrumb-item">
                        <FiChevronRight className="breadcrumb-separator" />
                        {last ? (
                            <span className="breadcrumb-current">{name}</span>
                        ) : (
                            <Link to={to}>{name}</Link>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Breadcrumbs;
