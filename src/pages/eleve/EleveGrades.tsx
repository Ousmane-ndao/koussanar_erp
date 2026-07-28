import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, TrendingUp, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ExportButton";

const EleveGrades = () => {
  const { user } = useAuth();

  // Récupérer l'ID de l'élève
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
    enabled: !!user,
  });

  const studentId = students.find((s: any) => s.user_id === user?.id)?.id;

  // Récupérer les notes
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades", studentId],
    queryFn: () => api.getGrades({ student_id: studentId }),
    enabled: !!studentId,
  });

  // Calculer la moyenne générale
  const moyenneGenerale = grades.length > 0
    ? grades.reduce((sum: number, grade: any) => sum + parseFloat(grade.note || 0) * parseFloat(grade.coefficient || 1), 0) /
      grades.reduce((sum: number, grade: any) => sum + parseFloat(grade.coefficient || 1), 0)
    : 0;

  // Grouper par matière
  const notesParMatiere = grades.reduce((acc: any, note: any) => {
    if (!acc[note.matiere]) {
      acc[note.matiere] = [];
    }
    acc[note.matiere].push(note);
    return acc;
  }, {});

  // Calculer la moyenne par matière
  const moyennesParMatiere = Object.entries(notesParMatiere).map(([matiere, notes]: [string, any]) => {
    const moyenne = notes.reduce((sum: number, n: any) => sum + parseFloat(n.note || 0) * parseFloat(n.coefficient || 1), 0) /
      notes.reduce((sum: number, n: any) => sum + parseFloat(n.coefficient || 1), 0);
    return { matiere, moyenne, notes };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Notes</h1>
            <p className="text-muted-foreground mt-1">
              Consultation de vos notes et moyennes
            </p>
          </div>
          {studentId && (
            <ExportButton
              onExportPDF={() => api.exportGradesPDF({ student_id: studentId })}
              onExportExcel={() => api.exportGradesExcel({ student_id: studentId })}
            />
          )}
        </div>

        {/* Statistiques */}
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
                Nombre de notes
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
                Matières
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {moyennesParMatiere.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes par matière */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune note enregistrée pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {moyennesParMatiere.map(({ matiere, moyenne, notes }) => (
              <Card key={matiere}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{matiere}</CardTitle>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      Moyenne: {moyenne.toFixed(2)}/20
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {notes.map((note: any) => (
                      <div key={note.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{note.type_evaluation || 'Devoir'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(note.date_evaluation), "dd/MM/yyyy")}
                          </p>
                          {note.remarque && (
                            <p className="text-sm text-muted-foreground mt-1">{note.remarque}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{note.note}/20</p>
                          <p className="text-xs text-muted-foreground">Coef: {note.coefficient}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EleveGrades;



