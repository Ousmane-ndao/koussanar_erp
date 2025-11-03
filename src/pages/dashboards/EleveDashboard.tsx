import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, DollarSign, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EleveDashboard = () => {
  const { user } = useAuth();

  // Récupérer l'ID de l'élève depuis le user
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
    enabled: !!user,
  });

  const studentId = students.find((s: any) => s.user_id === user?.id)?.id;

  const { data: grades = [] } = useQuery({
    queryKey: ["grades", studentId],
    queryFn: () => api.getGrades({ student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", studentId],
    queryFn: () => studentId ? api.getPaymentsByStudent(studentId) : Promise.resolve([]),
    enabled: !!studentId,
  });

  // Calculer la moyenne générale
  const moyenneGenerale = grades.length > 0
    ? grades.reduce((sum: number, grade: any) => sum + parseFloat(grade.note || 0), 0) / grades.length
    : 0;

  const quickActions = [
    { label: "Mon emploi du temps", link: "/eleve/schedule", icon: Calendar },
    { label: "Mes notes", link: "/eleve/grades", icon: ClipboardList },
    { label: "Mes paiements", link: "/eleve/payments", icon: DollarSign },
    { label: "Documents", link: "/dashboard/documents", icon: FileText },
    { label: "Messagerie", link: "/dashboard/messages", icon: MessageSquare },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon Espace Élève</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue {user?.prenom} {user?.nom}
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne générale
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {moyenneGenerale > 0 ? moyenneGenerale.toFixed(2) : 'N/A'}
                {moyenneGenerale > 0 && <span className="text-lg text-muted-foreground">/20</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notes enregistrées
              </CardTitle>
              <div className="p-2 rounded-lg bg-secondary/10">
                <ClipboardList className="w-5 h-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {grades.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paiements
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {payments.filter((p: any) => p.statut === 'paye').length} / {payments.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dernières notes */}
        {grades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mes dernières notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grades.slice(0, 5).map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{grade.matiere}</p>
                      <p className="text-sm text-muted-foreground">{new Date(grade.date_evaluation).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{grade.note}/20</p>
                      <p className="text-xs text-muted-foreground">Coef: {grade.coefficient}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EleveDashboard;

