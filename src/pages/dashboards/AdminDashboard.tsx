import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, UserCheck, TrendingUp, FileText, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ExportButton";
import { usePermissions } from "@/hooks/usePermissions";

const AdminDashboard = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('manage_users');

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.getTeachers(),
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ["attendance-stats", today],
    queryFn: () => api.getAttendanceStats(today),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: financeStats } = useQuery({
    queryKey: ["finance-stats", anneeScolaire],
    queryFn: () => api.getFinanceStats(anneeScolaire),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const stats = [
    {
      title: "Total Élèves",
      value: students.length || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/students",
    },
    {
      title: "Classes",
      value: classes.length || 0,
      icon: BookOpen,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      link: "/admin/classes",
    },
    {
      title: "Enseignants",
      value: teachers.length || 0,
      icon: UserCheck,
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/admin/teachers",
    },
    {
      title: "Présents aujourd'hui",
      value: attendanceStats?.present || 0,
      icon: TrendingUp,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      link: "/admin/attendance",
    },
    {
      title: "Revenus de l'année",
      value: `${Number(financeStats?.total_recettes || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      link: "/admin/finance",
    },
    {
      title: "Documents",
      value: "Gérer",
      icon: FileText,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      link: "/admin/documents",
    },
  ];

  const quickActions = [
    { label: "Gérer les utilisateurs", link: "/admin/students", icon: Users },
    { label: "Créer une classe", link: "/admin/classes", icon: BookOpen },
    { label: "Créer un emploi du temps", link: "/admin/schedules", icon: ClipboardList },
    { label: "Gérer les paiements", link: "/admin/finance", icon: DollarSign },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Administrateur</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de l'établissement - {anneeScolaire}
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.link} to={action.link}>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                      <Icon className="h-5 w-5" />
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de présence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Présents</span>
                  <span className="font-semibold text-green-600">{attendanceStats?.present || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Absents</span>
                  <span className="font-semibold text-red-600">{attendanceStats?.absent || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Retards</span>
                  <span className="font-semibold text-orange-600">{attendanceStats?.retard || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-semibold">{attendanceStats?.total || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résumé financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recettes totales</span>
                  <span className="font-semibold">{Number(financeStats?.total_recettes || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paiés</span>
                  <span className="font-semibold text-green-600">{Number(financeStats?.total_paye || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">En attente</span>
                  <span className="font-semibold text-orange-600">{Number(financeStats?.total_attente || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Élèves inscrits</span>
                  <span className="font-semibold">{financeStats?.total_students || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Users and Roles */}
        {canManageUsers && (
          <Card>
            <CardHeader>
              <CardTitle>Export des utilisateurs et rôles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ExportButton
                  onExportPDF={() => api.exportUsersRolesPDF()}
                  onExportExcel={() => api.exportUsersRolesExcel()}
                  label="Exporter les utilisateurs et rôles"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Exportez la liste complète de tous les utilisateurs avec leurs rôles et permissions assignés
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;



