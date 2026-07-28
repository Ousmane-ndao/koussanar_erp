import { useAuth } from "@/components/AuthProvider";

/**
 * Hook pour vérifier les permissions de l'utilisateur
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
  };

  /**
   * Vérifie si l'utilisateur a tous les rôles spécifiés
   */
  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   */
  const hasAnyRole = (...roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles!.includes(role));
  };

  /**
   * Vérifie si l'utilisateur est admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    permissions: user?.permissions || [],
    roles: user?.roles || [],
  };
};




















