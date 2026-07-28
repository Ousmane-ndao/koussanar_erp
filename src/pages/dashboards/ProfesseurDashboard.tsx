import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, Users, FileText, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ProfesseurDashboard = () => {
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.getGrades(),
  });

  const quickActions = [
    { label: "Saisir des notes", link: "/professeur/grades", icon: ClipboardList },
    { label: "Mes classes", link: "/professeur/classes", icon: BookOpen },
    { label: "Gérer les présences", link: "/professeur/attendance", icon: Users },
    { label: "Téléverser des documents", link: "/professeur/documents", icon: FileText },
    { label: "Messagerie", link: "/professeur/messages", icon: MessageSquare },
  ];

  // Statistiques des notes saisies
  const notesSaisies = grades.length;
  const classesEnseignees = classes.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Professeur</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue dans votre espace de travail
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
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
                Classes assignées
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {classesEnseignees}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notes saisies
              </CardTitle>
              <div className="p-2 rounded-lg bg-secondary/10">
                <ClipboardList className="w-5 h-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {notesSaisies}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages non lus
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mes classes */}
        {classes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mes classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classes.slice(0, 5).map((classe: any) => (
                  <Link key={classe.id} to={`/professeur/classes/${classe.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <div>
                        <p className="font-medium">{classe.nom}</p>
                        <p className="text-sm text-muted-foreground">{classe.niveau} - {classe.filiere || 'Toutes filières'}</p>
                      </div>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfesseurDashboard;




















