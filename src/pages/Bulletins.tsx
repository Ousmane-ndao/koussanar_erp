import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Bulletins = () => {
  const { toast } = useToast();
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("");
  const [selectedEleve, setSelectedEleve] = useState<string>("");
  const [bulletinData, setBulletinData] = useState<any>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  const { data: semestres = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => api.getSemesters({ actif: true }),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students", selectedClasse],
    queryFn: () => api.getStudents(),
    enabled: !!selectedClasse,
  });

  const filteredStudents = selectedClasse
    ? students.filter((s: any) => s.classe_id === selectedClasse)
    : [];

  const generateBulletin = async () => {
    if (!selectedEleve || !selectedSemestre) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un élève et un semestre",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await api.request<any>(`/bulletins/${selectedEleve}/${selectedSemestre}`);
      setBulletinData(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la génération du bulletin",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    if (!selectedEleve || !selectedSemestre) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bulletins/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eleveId: selectedEleve, semestreId: selectedSemestre }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${selectedEleve}_${selectedSemestre}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulletins de notes</h1>
          <p className="text-muted-foreground">Générez les bulletins semestriels des élèves</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Critères de génération</CardTitle>
            <CardDescription>Sélectionnez la classe, le semestre et l'élève</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Classe</label>
                <Select value={selectedClasse} onValueChange={setSelectedClasse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Semestre</label>
                <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {semestres.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nom} ({s.annee_scolaire})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Élève</label>
                <Select value={selectedEleve} onValueChange={setSelectedEleve}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.prenom} {s.nom} ({s.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={generateBulletin} className="flex-1">
                  Générer le bulletin
                </Button>
                {bulletinData && (
                  <Button variant="outline" onClick={downloadPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {bulletinData && (
          <Card>
            <CardHeader>
              <CardTitle>Bulletin de {bulletinData.eleve.prenom} {bulletinData.eleve.nom}</CardTitle>
              <CardDescription>
                {bulletinData.eleve.classe_nom} - {bulletinData.semestre.nom} - Année {bulletinData.semestre.annee_scolaire}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Matricule:</strong> {bulletinData.eleve.matricule}</div>
                <div><strong>Né(e) le:</strong> {bulletinData.eleve.date_naissance}</div>
                <div><strong>Lieu:</strong> {bulletinData.eleve.lieu_naissance}</div>
                <div><strong>Sexe:</strong> {bulletinData.eleve.sexe}</div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Moyenne</TableHead>
                    <TableHead>Coeff</TableHead>
                    <TableHead>Total points</TableHead>
                    <TableHead>Appréciation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulletinData.matieres.map((m: any) => (
                    <TableRow key={m.matiere}>
                      <TableCell>{m.matiere}</TableCell>
                      <TableCell>{m.moyenne_ponderee.toFixed(3)}</TableCell>
                      <TableCell>{m.coefficient}</TableCell>
                      <TableCell>{m.total_points.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          m.moyenne_ponderee >= 16 ? 'default' :
                          m.moyenne_ponderee >= 14 ? 'secondary' :
                          m.moyenne_ponderee >= 12 ? 'outline' :
                          'destructive'
                        }>
                          {m.moyenne_ponderee >= 16 ? 'Excellent' :
                           m.moyenne_ponderee >= 14 ? 'Très bon' :
                           m.moyenne_ponderee >= 12 ? 'Bon' :
                           m.moyenne_ponderee >= 10 ? 'Assez bien' :
                           m.moyenne_ponderee >= 8 ? 'Passable' : 'Faible'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
                <div><strong>Moyenne générale:</strong> {bulletinData.moyenne_generale.toFixed(3)}/20</div>
                <div><strong>Rang:</strong> {bulletinData.rang}/{bulletinData.total_eleves}</div>
                <div><strong>Moyenne classe:</strong> {bulletinData.moyenne_classe.toFixed(3)}</div>
                <div><strong>Absences:</strong> {bulletinData.absences} | <strong>Retards:</strong> {bulletinData.retards}</div>
              </div>

              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-bold text-lg">{bulletinData.appreciation}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bulletins;