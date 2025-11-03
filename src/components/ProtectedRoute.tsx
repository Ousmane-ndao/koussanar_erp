import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: string;
  requireAnyPermission?: string[];
  requireRole?: string;
  requireAnyRole?: string[];
  fallback?: React.ReactNode;
}

/**
 * Composant pour protéger les routes selon les permissions/rôles
 */
export const ProtectedRoute = ({
  children,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireAnyRole,
  fallback,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } = usePermissions();

  // En attente de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Non authentifié
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Vérification des permissions
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Accès refusé
            </h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas la permission d'accéder à cette page.
            </p>
            <p className="text-sm text-muted-foreground">
              Permission requise: <code className="bg-muted px-2 py-1 rounded">{requirePermission}</code>
            </p>
          </div>
        </div>
      )
    );
  }

  if (requireAnyPermission && !hasAnyPermission(...requireAnyPermission)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Accès refusé
            </h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-muted-foreground">
              Permissions requises (au moins une):{" "}
              {requireAnyPermission.map((perm, idx) => (
                <span key={perm}>
                  <code className="bg-muted px-2 py-1 rounded">{perm}</code>
                  {idx < requireAnyPermission.length - 1 && ", "}
                </span>
              ))}
            </p>
          </div>
        </div>
      )
    );
  }

  if (requireRole && !hasRole(requireRole)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Accès refusé
            </h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas le rôle nécessaire pour accéder à cette page.
            </p>
            <p className="text-sm text-muted-foreground">
              Rôle requis: <code className="bg-muted px-2 py-1 rounded">{requireRole}</code>
            </p>
          </div>
        </div>
      )
    );
  }

  if (requireAnyRole && !hasAnyRole(...requireAnyRole)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Accès refusé
            </h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les rôles nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-muted-foreground">
              Rôles requis (au moins un):{" "}
              {requireAnyRole.map((role, idx) => (
                <span key={role}>
                  <code className="bg-muted px-2 py-1 rounded">{role}</code>
                  {idx < requireAnyRole.length - 1 && ", "}
                </span>
              ))}
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

