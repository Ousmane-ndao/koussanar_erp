import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, BookOpen, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const EleveSchedule = () => {
  const { user } = useAuth();

  // Récupérer l'ID de l'élève
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
    enabled: !!user,
  });

  const student = students.find((s: any) => s.user_id === user?.id);
  const classeId = student?.classe_id;

  // Récupérer l'emploi du temps de la classe
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", classeId],
    queryFn: () => api.getSchedules({ classe_id: classeId }),
    enabled: !!classeId,
  });

  // Grouper par jour
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const schedulesParJour = jours.map(jour => ({
    jour,
    cours: schedules.filter((s: any) => s.jour === jour)
      .sort((a: any, b: any) => a.heure_debut.localeCompare(b.heure_debut))
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon Emploi du temps</h1>
          <p className="text-muted-foreground mt-1">
            {student?.classe_nom ? `Classe: ${student.classe_nom}` : 'Aucune classe assignée'}
          </p>
        </div>

        {!classeId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune classe assignée. Contactez l'administration.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun emploi du temps disponible pour votre classe.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {schedulesParJour.map(({ jour, cours }) => (
              cours.length > 0 && (
                <Card key={jour}>
                  <CardHeader>
                    <CardTitle className="capitalize">{jour}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cours.map((coursItem: any) => (
                        <div
                          key={coursItem.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {coursItem.heure_debut} - {coursItem.heure_fin}
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="font-medium">{coursItem.matiere}</span>
                            </div>
                            {coursItem.teacher_nom && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {coursItem.teacher_prenom} {coursItem.teacher_nom}
                              </div>
                            )}
                            {coursItem.salle && (
                              <span className="text-sm text-muted-foreground">Salle: {coursItem.salle}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EleveSchedule;




















