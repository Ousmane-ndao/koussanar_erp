// Bulletins.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileDown } from "lucide-react";
import Bulletin, { exportBulletinPDF, BulletinData } from "@/components/Bulletin";

const Bulletins = () => {
  const { toast } = useToast();
  const [selectedClasse, setSelectedClasse] = useState<string>("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("");
  const [selectedEleve, setSelectedEleve] = useState<string>("");
  const [bulletinData, setBulletinData] = useState<BulletinData | null>(null);

  // Récupération des classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // Récupération des semestres
  const { data: semestres = [] } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => api.getSemesters({ actif: true }),
  });

  // Récupération des élèves (selon classe sélectionnée)
  const { data: students = [] } = useQuery({
    queryKey: ["students", selectedClasse],
    queryFn: () => api.getStudents(),
    enabled: !!selectedClasse,
  });

  const filteredStudents = selectedClasse
    ? students.filter((s: any) => s.classe_id === selectedClasse)
    : [];

  // Génération du bulletin
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

      // Transformation des données vers le format BulletinData
      const formattedData: BulletinData = {
        eleve: {
          prenom: data.eleve.prenom,
          nom: data.eleve.nom,
          dateNaissance: data.eleve.date_naissance,
          lieuNaissance: data.eleve.lieu_naissance,
          matricule: data.eleve.matricule,
          classe: data.eleve.classe_nom,
          sexe: data.eleve.sexe,
          photo: null,
        },
        semestre: {
          nom: data.semestre.nom,
          anneeScolaire: data.semestre.annee_scolaire,
        },
        matieres: data.matieres.map((m: any) => ({
          nom: m.matiere,
          devoir: m.moyenne_simple || 0,
          composition: m.moyenne_ponderee || 0,
          moyenne: m.moyenne_ponderee || 0,
          coefficient: m.coefficient || 1,
          points: m.total_points || 0,
          rang: null,
          appreciation: '',
        })),
        statistiques: {
          moyenneGenerale: data.moyenne_generale,
          rang: data.rang,
          totalEleves: data.total_eleves,
          absences: data.absences,
          retards: data.retards,
        },
        mention: data.appreciation || 'Élève très faible',
        decision: data.moyenne_generale >= 10 ? 'admise' : 'redoublement',
        observations: 'Aucune observation particulière.',
        signatures: {
          professeur: '',
          directeur: '',
        },
        dateImpression: new Date().toLocaleDateString('fr-FR'),
        qrCodeUrl: null,
      };

      setBulletinData(formattedData);
      toast({ title: "Succès", description: "Bulletin généré avec succès" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la génération du bulletin",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (!bulletinData) return;
    exportBulletinPDF('bulletin-pdf-content', `bulletin_${bulletinData.eleve.matricule}_${bulletinData.semestre.nom}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulletins de notes</h1>
          <p className="text-muted-foreground">Générez les bulletins semestriels des élèves</p>
        </div>

        {/* Formulaire de sélection */}
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
                  <Button variant="outline" onClick={handleExportPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affichage du bulletin avec le nouveau composant premium */}
        {bulletinData && (
          <div>
            <Bulletin data={bulletinData} id="bulletin-pdf-content" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bulletins;