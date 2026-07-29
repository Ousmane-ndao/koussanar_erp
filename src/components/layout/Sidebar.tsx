import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  GraduationCap,
  ClipboardList,
  UserCircle,
  Clock,
  Shield,
  FileSpreadsheet, // Nouvelle icône pour les bulletins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/components/AuthProvider";
import { getDashboardRoute } from "@/utils/routing";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  requirePermission?: string;
  requireAnyPermission?: string[];
  requireRole?: string;
}

const allMenuItems: MenuItem[] = [
  // Dashboard (adaptatif selon le rôle)
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },

  // Menu Admin
  { icon: Users, label: "Élèves", path: "/dashboard/students", requirePermission: "manage_users" },
  { icon: UserCircle, label: "Enseignants", path: "/dashboard/teachers", requirePermission: "manage_users" },
  { icon: BookOpen, label: "Classes", path: "/dashboard/classes" },
  { icon: ClipboardList, label: "Notes", path: "/dashboard/grades" },
  { icon: FileSpreadsheet, label: "Bulletins", path: "/bulletins", requirePermission: "manage_grades" }, // ✅ NOUVEAU
  { icon: Calendar, label: "Présences", path: "/dashboard/attendance" },
  { icon: Clock, label: "Emplois du temps", path: "/dashboard/schedules", requirePermission: "manage_schedule" },
  { icon: GraduationCap, label: "Semestres", path: "/dashboard/semesters", requirePermission: "manage_schedule" },
  { icon: DollarSign, label: "Finances", path: "/dashboard/finance", requireAnyPermission: ["manage_payments", "view_payments"] },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages", requirePermission: "send_message" },
  { icon: FileText, label: "Documents", path: "/dashboard/documents" },
  { icon: Shield, label: "Super Admin", path: "/admin/super", requireAnyRole: ["admin", "super_admin", "superadmin"] },

  // Menu spécifique Professeur
  { icon: BookOpen, label: "Mes classes", path: "/dashboard/classes", requireRole: "enseignant" },

  // Menu spécifique Élève
  { icon: Calendar, label: "Mon emploi du temps", path: "/eleve/schedule", requireRole: "eleve" },
  { icon: ClipboardList, label: "Mes notes", path: "/eleve/grades", requireRole: "eleve" },
  { icon: DollarSign, label: "Mes paiements", path: "/eleve/payments", requireRole: "eleve" },

  // Menu spécifique Comptable
  { icon: DollarSign, label: "Gérer les paiements", path: "/dashboard/finance", requireRole: "comptable" },
  { icon: FileText, label: "Rapports", path: "/comptable/reports", requireRole: "comptable" },
];

export const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } = usePermissions();
  const { user } = useAuth();

  // Obtenir la route du dashboard selon le rôle
  const dashboardRoute = user ? getDashboardRoute(user.roles || []) : "/dashboard";

  // Filtrer les éléments du menu selon les permissions et rôles
  const menuItems = allMenuItems.filter((item) => {
    // Vérifier les rôles
    if (item.requireRole && !hasRole(item.requireRole)) {
      return false;
    }
    if (item.requireAnyRole && !hasAnyRole(...item.requireAnyRole)) {
      return false;
    }
    // Vérifier les permissions
    if (item.requirePermission && !hasPermission(item.requirePermission)) {
      return false;
    }
    if (item.requireAnyPermission && !hasAnyPermission(...item.requireAnyPermission)) {
      return false;
    }
    return true;
  });

  // Remplacer les routes dashboard génériques par la route spécifique au rôle
  const processedMenuItems = menuItems.map((item) => {
    // Si c'est un élément "Tableau de bord" qui n'est pas spécifique à un rôle, le remplacer
    if (item.label === "Tableau de bord" && item.path === "/dashboard") {
      return { ...item, path: dashboardRoute };
    }
    return item;
  });

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="bg-sidebar-primary p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Koussanar ERP</h1>
            <p className="text-xs text-sidebar-foreground/80">Lycée de Koussanar</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {processedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};