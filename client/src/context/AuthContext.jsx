import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Fetch logged-in user info from backend
          const response = await authService.getMe();

          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          // Token invalid → clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      console.log("Login response in context:", response);

      if (response.success) {
        // Save user & token
        localStorage.setItem("token", response.token);
        localStorage.setItem("sessionId", response.sessionId);
        localStorage.setItem("user", JSON.stringify(response.data));

        setUser(response.data);

        // Log user role info
        console.log('🔐 Logged in as:', {
          name: response.data.name,
          email: response.data.email,
          role: response.data.role?.name,
          roleSlug: response.data.role?.slug,
          modules: response.data.role?.modules,
        });
      }

      return response;
    } catch (error) {
      console.error("Login error in context:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    const sessionId = localStorage.getItem("sessionId");

    await authService.logout(token, sessionId);

    localStorage.removeItem("token");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");

    setUser(null);
  };

  const logoutAll = async () => {
    await authService.logoutAll();
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  // Helper functions for role and permission checking
  const getUserRoleSlug = () => {
    if (typeof user?.role === 'string') return user.role;
    return user?.role?.slug || '';
  };

  const isSuperAdmin = () => {
    return getUserRoleSlug() === 'super_admin';
  };

  const isAdmin = () => {
    const roleSlug = getUserRoleSlug();
    return roleSlug === 'super_admin' ||
      roleSlug === 'admin' ||
      roleSlug.includes('_admin') ||
      roleSlug.includes('_manager');
  };

  const isEmployee = () => {
    return getUserRoleSlug().includes('employee');
  };

  const getRoleSlug = () => {
    return getUserRoleSlug();
  };

  const getRoleName = () => {
    return typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  };

  // Get accessible modules based on user role and department
  const getAccessibleModules = () => {
    if (!user) return ['employee'];

    // Super Admin has access to all modules
    if (getUserRoleSlug() === 'super_admin') {
      return ['dashboard', 'employee', 'finance', 'sales', 'hrm', 'marketing', 'operations', 'inventory', 'support', 'reports_analytics', 'settings'];
    }

    // Start with modules assigned to the role
    // Handle cases where role might be a string (ObjectId) or an object
    const roleModules = (user.role && typeof user.role === 'object' && Array.isArray(user.role.modules))
      ? user.role.modules
      : [];

    const modules = [...roleModules];

    // All users have access to employee module (My Profile / My Workspace)
    if (!modules.includes('employee')) {
      modules.push('employee');
    }

    // Add dashboard module for everyone to see their respective dashboard
    if (!modules.includes('dashboard')) {
      modules.push('dashboard');
    }

    // Note: Automatic module injection based on department name is disabled 
    // to prevent showing "Operations" or other specialized modules to 
    // employees who don't have them in their assigned role.

    // We only keep essential department mapping if it's strictly required
    // but the user's role should ideally be the source of truth.
    const dept = user.department;
    if (dept) {
      const d = dept.toUpperCase();
      // Only keep core mappings that are safely "employee-grade"
      if ((d === 'HR' || d === 'HRM') && !modules.includes('hrm')) {
        // Only give HRM core access, specialized sub-modules should be role-gated
      }
    }

    return modules;
  };

  // Check if user can access a specific module
  const canAccessModule = (module) => {


    if (!user) return false;

    // Super Admin can access all modules
    if (getUserRoleSlug() === 'super_admin') {
      return true;
    }

    // All users can access employee module (My Profile)
    if (module === 'employee') {
      return true;
    }

    // Check if module is in user's accessible modules
    const accessibleModules = getAccessibleModules();
    return accessibleModules.includes(module);
  };

  // Check if user has "Admin" level access to a module
  // Returns true if Super Admin OR if Admin with that module assigned
  const hasFullModuleAccess = (module) => {
    if (!user) return false;

    // Super Admin has full access to everything
    if (getUserRoleSlug() === 'super_admin') return true;

    // Check if user is an Admin
    const roleSlug = getUserRoleSlug();
    const isActuallyAdmin = roleSlug === 'admin' || roleSlug.includes('_admin');

    // Check if module is assigned to this Admin
    const roleModules = (user.role && typeof user.role === 'object' && Array.isArray(user.role.modules))
      ? user.role.modules
      : [];

    return isActuallyAdmin && roleModules.includes(module);
  };

  // Legacy hasModuleAccess for backward compatibility
  const hasModuleAccess = (module) => {
    return canAccessModule(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        logoutAll,
        updateUser,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin: isSuperAdmin(),
        isAdmin: isAdmin(),
        isEmployee: isEmployee(),
        roleSlug: getRoleSlug(),
        roleName: getRoleName(),
        getAccessibleModules,
        canAccessModule,
        hasFullModuleAccess,
        hasModuleAccess, // Legacy support
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
