import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

const Dashboard = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
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
    },
    {
      title: "Classes",
      value: classes.length || 0,
      icon: BookOpen,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Présents aujourd'hui",
      value: attendanceStats?.present || 0,
      icon: UserCheck,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Revenus de l'année",
      value: `${Number(financeStats?.total_recettes || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre établissement
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
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
            );
          })}
        </div>

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
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{financeStats?.total_transactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Élèves inscrits</span>
                  <span className="font-semibold">{financeStats?.total_students || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
