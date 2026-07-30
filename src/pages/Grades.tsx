import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, TrendingUp, Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePermissions } from "@/hooks/usePermissions";
import { ExportButton } from "@/components/ExportButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ============================================================
// Programme scolaire sénégalais - Matières par niveau
// ============================================================
const MATIERES_BY_NIVEAU: Record<string, Array<{ nom: string; coefficient: number }>> = {
  // ... (contenu inchangé) ...
  // On le garde tel quel pour ne pas alourdir, mais je le laisse en entier pour le fichier final
  "6eme": [
    { nom: "Français", coefficient: 4 },
    { nom: "Mathématiques", coefficient: 4 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arts Plastiques", coefficient: 1 },
    { nom: "Éducation Civique", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "5eme": [
    { nom: "Français", coefficient: 4 },
    { nom: "Mathématiques", coefficient: 4 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arts Plastiques", coefficient: 1 },
    { nom: "Éducation Civique", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "4eme": [
    { nom: "Français", coefficient: 4 },
    { nom: "Mathématiques", coefficient: 4 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arts Plastiques", coefficient: 1 },
    { nom: "Éducation Civique", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "3eme": [
    { nom: "Français", coefficient: 4 },
    { nom: "Mathématiques", coefficient: 4 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arts Plastiques", coefficient: 1 },
    { nom: "Éducation Civique", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "seconde": [
    { nom: "Français", coefficient: 4 },
    { nom: "Mathématiques", coefficient: 4 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 3 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Physique-Chimie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Économie-Gestion", coefficient: 2 },
    { nom: "Informatique", coefficient: 1 },
    { nom: "Arabe", coefficient: 1 },
    { nom: "Espagnol", coefficient: 1 },
  ],
  "premiere_l": [
    { nom: "Français", coefficient: 4 },
    { nom: "Philosophie", coefficient: 3 },
    { nom: "Histoire-Géographie", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Mathématiques", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
    { nom: "Espagnol (optionnel)", coefficient: 1 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
  ],
  "premiere_s": [
    { nom: "Mathématiques", coefficient: 5 },
    { nom: "Physique-Chimie", coefficient: 4 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 4 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "premiere_s2": [
    { nom: "Mathématiques", coefficient: 5 },
    { nom: "Physique-Chimie", coefficient: 4 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 3 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "premiere_g": [
    { nom: "Économie-Gestion", coefficient: 4 },
    { nom: "Comptabilité", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "terminale_l": [
    { nom: "Français", coefficient: 4 },
    { nom: "Philosophie", coefficient: 4 },
    { nom: "Histoire-Géographie", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Mathématiques", coefficient: 2 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
    { nom: "Espagnol (optionnel)", coefficient: 1 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
  ],
  "terminale_s": [
    { nom: "Mathématiques", coefficient: 5 },
    { nom: "Physique-Chimie", coefficient: 4 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 4 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "terminale_s2": [
    { nom: "Mathématiques", coefficient: 5 },
    { nom: "Physique-Chimie", coefficient: 4 },
    { nom: "Sciences de la Vie et de la Terre (SVT)", coefficient: 3 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
  "terminale_g": [
    { nom: "Économie-Gestion", coefficient: 4 },
    { nom: "Comptabilité", coefficient: 3 },
    { nom: "Mathématiques", coefficient: 3 },
    { nom: "Français", coefficient: 3 },
    { nom: "Anglais", coefficient: 2 },
    { nom: "Philosophie", coefficient: 2 },
    { nom: "Histoire-Géographie", coefficient: 2 },
    { nom: "Éducation Physique et Sportive (EPS)", coefficient: 1 },
    { nom: "Informatique (optionnel)", coefficient: 1 },
    { nom: "Arabe (optionnel)", coefficient: 1 },
  ],
};

// Modification du schéma pour ajouter semestre_id
const gradeSchema = z.object({
  student_id: z.string().min(1, "Sélectionnez un élève"),
  matiere: z.string().optional(),
  note: z.number().min(0).max(20),
  coefficient: z.number().min(0.1).max(10).default(1),
  type_evaluation: z.enum(["devoir", "controle", "examen", "oral"]),
  date_evaluation: z.date(),
  annee_scolaire: z.string().optional(),
  remarque: z.string().optional(),
  semestre_id: z.string().optional(), // AJOUT
});

type GradeFormValues = z.infer<typeof gradeSchema>;

const Grades = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedMatiere, setSelectedMatiere] = useState<string>("all");
  const [selectedClasse, setSelectedClasse] = useState<string>("all");
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>(""); // AJOUT
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canEnterGrades = hasPermission('enter_grades');

  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      coefficient: 1,
      type_evaluation: "devoir",
      date_evaluation: new Date(),
      annee_scolaire: anneeScolaire,
      semestre_id: "", // AJOUT
    },
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // AJOUT : Fetch semestres
  const { data: semestres = [] } = useQuery({
    queryKey: ["semestres"],
    queryFn: () => api.getSemesters({ actif: true }),
  });

  // Grouper les élèves par classe
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, typeof students> = {};
    students.forEach((student: any) => {
      const classeId = student.classe_id || "sans_classe";
      if (!grouped[classeId]) {
        grouped[classeId] = [];
      }
      grouped[classeId].push(student);
    });
    return grouped;
  }, [students]);

  // Filtrer les élèves selon la recherche
  const filteredStudentsForSearch = useMemo(() => {
    if (!studentSearchQuery) return students;
    const query = studentSearchQuery.toLowerCase();
    return students.filter((student: any) =>
      `${student.prenom} ${student.nom}`.toLowerCase().includes(query) ||
      student.matricule?.toLowerCase().includes(query) ||
      student.classe_nom?.toLowerCase().includes(query)
    );
  }, [students, studentSearchQuery]);

  // Vérifier si on doit utiliser la recherche (plus de 1000 élèves)
  const useSearchMode = students.length > 1000;

  // Fetch grades
  const { data: grades = [] } = useQuery({
    queryKey: ["grades", selectedStudent, selectedMatiere],
    queryFn: () => api.getGrades({
      student_id: selectedStudent !== "all" ? selectedStudent : undefined,
      matiere: selectedMatiere !== "all" ? selectedMatiere : undefined,
      annee_scolaire: anneeScolaire,
    }),
  });

  // ---------- Adaptation des matières selon le niveau ----------
  const getNiveauFromClasse = (classeId: string): string | null => {
    const classe = classes.find((c: any) => c.id === classeId);
    if (!classe) return null;

    const nom = classe.nom?.toLowerCase() || '';
    const niveau = classe.niveau?.toLowerCase() || '';

    if (nom.includes('6eme') || niveau.includes('6eme')) return '6eme';
    if (nom.includes('5eme') || niveau.includes('5eme')) return '5eme';
    if (nom.includes('4eme') || niveau.includes('4eme')) return '4eme';
    if (nom.includes('3eme') || niveau.includes('3eme')) return '3eme';
    if (nom.includes('seconde') || niveau.includes('seconde')) return 'seconde';
    if (nom.includes('premiere l') || nom.includes('premiere L') || niveau.includes('litteraire')) return 'premiere_l';
    if (nom.includes('premiere s') || nom.includes('premiere S') || niveau.includes('scientifique') || nom.includes('1ere s')) return 'premiere_s';
    if (nom.includes('premiere s2') || nom.includes('premiere S2')) return 'premiere_s2';
    if (nom.includes('premiere g') || nom.includes('premiere G') || niveau.includes('gestion')) return 'premiere_g';
    if (nom.includes('terminale l') || nom.includes('terminale L') || niveau.includes('litteraire')) return 'terminale_l';
    if (nom.includes('terminale s') || nom.includes('terminale S') || niveau.includes('scientifique') || nom.includes('tle s')) return 'terminale_s';
    if (nom.includes('terminale s2') || nom.includes('terminale S2')) return 'terminale_s2';
    if (nom.includes('terminale g') || nom.includes('terminale G') || niveau.includes('gestion')) return 'terminale_g';

    return 'seconde';
  };

  const selectedClasseNiveau = selectedClasse !== 'all' ? getNiveauFromClasse(selectedClasse) : null;
  const availableMatieres = selectedClasseNiveau ? MATIERES_BY_NIVEAU[selectedClasseNiveau] || [] : [];

  const watchedMatiere = form.watch("matiere");
  useEffect(() => {
    if (watchedMatiere && watchedMatiere !== "aucune") {
      const allMatieres = selectedClasseNiveau ? availableMatieres : Object.values(MATIERES_BY_NIVEAU).flat();
      const matiere = allMatieres.find(m => m.nom === watchedMatiere);
      if (matiere) {
        form.setValue("coefficient", matiere.coefficient);
      }
    }
  }, [watchedMatiere, form, selectedClasseNiveau, availableMatieres]);

  const saveGradeMutation = useMutation({
    mutationFn: async (values: GradeFormValues) => {
      const matiereValue = values.matiere === "aucune" ? null : values.matiere || null;

      const gradeData = {
        student_id: values.student_id,
        matiere: matiereValue,
        note: values.note,
        coefficient: values.coefficient,
        type_evaluation: values.type_evaluation,
        date_evaluation: values.date_evaluation.toISOString().split('T')[0],
        annee_scolaire: values.annee_scolaire || anneeScolaire,
        remarque: values.remarque || null,
        semestre_id: values.semestre_id || null, // AJOUT
      };

      if (editingGrade) {
        await api.updateGrade(editingGrade.id, gradeData);
      } else {
        await api.createGrade(gradeData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setIsDialogOpen(false);
      setEditingGrade(null);
      setSelectedClasse("all");
      setStudentSearchQuery("");
      setStudentSearchOpen(false);
      setSelectedSemestre(""); // AJOUT : réinitialisation
      form.reset({
        coefficient: 1,
        type_evaluation: "devoir",
        date_evaluation: new Date(),
        annee_scolaire: anneeScolaire,
        semestre_id: "", // AJOUT
      });
      toast({
        title: "Succès",
        description: editingGrade ? "Note modifiée avec succès" : "Note ajoutée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteGrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({
        title: "Succès",
        description: "Note supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const filteredGrades = grades.filter((grade: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      grade.matricule?.toLowerCase().includes(searchLower) ||
      grade.nom?.toLowerCase().includes(searchLower) ||
      grade.prenom?.toLowerCase().includes(searchLower) ||
      grade.matiere?.toLowerCase().includes(searchLower)
    );
  });

  const matieres = Array.from(new Set(grades.map((g: any) => g.matiere).filter(Boolean)));

  const handleEdit = (grade: any) => {
    setEditingGrade(grade);
    const student = students.find((s: any) => s.id === grade.student_id);
    if (student?.classe_id) {
      setSelectedClasse(student.classe_id);
    } else {
      setSelectedClasse("all");
    }
    setStudentSearchQuery("");
    setStudentSearchOpen(false);
    setSelectedSemestre(grade.semestre_id || ""); // AJOUT
    form.reset({
      student_id: grade.student_id,
      matiere: grade.matiere || "",
      note: Number(grade.note),
      coefficient: Number(grade.coefficient),
      type_evaluation: grade.type_evaluation,
      date_evaluation: new Date(grade.date_evaluation),
      annee_scolaire: grade.annee_scolaire || "",
      remarque: grade.remarque || "",
      semestre_id: grade.semestre_id || "", // AJOUT
    });
    setIsDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      devoir: "secondary",
      controle: "default",
      examen: "destructive",
      oral: "outline",
    };
    return <Badge variant={variants[type] as any}>{type}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Notes</h1>
            <p className="text-muted-foreground">Enregistrez et gérez les notes des élèves</p>
          </div>
          {canEnterGrades && (
            <Button
              className="gap-2"
              onClick={() => {
                setEditingGrade(null);
                setSelectedClasse("all");
                setStudentSearchQuery("");
                setStudentSearchOpen(false);
                setSelectedSemestre(""); // AJOUT
                form.reset({
                  coefficient: 1,
                  type_evaluation: "devoir",
                  date_evaluation: new Date(),
                  annee_scolaire: anneeScolaire,
                  semestre_id: "", // AJOUT
                });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Nouvelle note
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <CardTitle>Liste des notes</CardTitle>
                <CardDescription>Filtrez et recherchez les notes</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto items-center">
                <ExportButton
                  onExportPDF={() => api.exportGradesPDF({
                    student_id: selectedStudent !== 'all' ? selectedStudent : undefined,
                    matiere: selectedMatiere !== 'all' ? selectedMatiere : undefined,
                    annee_scolaire: anneeScolaire,
                  })}
                  onExportExcel={() => api.exportGradesExcel({
                    student_id: selectedStudent !== 'all' ? selectedStudent : undefined,
                    matiere: selectedMatiere !== 'all' ? selectedMatiere : undefined,
                    annee_scolaire: anneeScolaire,
                  })}
                />
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tous les élèves" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les élèves</SelectItem>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.prenom} {student.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Toutes les matières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les matières</SelectItem>
                    {matieres.map((matiere: string) => (
                      <SelectItem key={matiere} value={matiere}>
                        {matiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 md:w-[250px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredGrades.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucune note enregistrée
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.map((grade: any) => (
                      <TableRow key={grade.id}>
                        <TableCell>
                          {format(new Date(grade.date_evaluation), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {grade.prenom} {grade.nom}
                          <div className="text-xs text-muted-foreground">{grade.matricule}</div>
                        </TableCell>
                        <TableCell>{grade.matiere}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{Number(grade.note).toFixed(2)}/20</span>
                            {Number(grade.coefficient) !== 1 && (
                              <Badge variant="outline">Coef. {grade.coefficient}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(grade.type_evaluation)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canEnterGrades && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(grade)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteGradeMutation.mutate(grade.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingGrade ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
            <DialogDescription className="text-base">
              {editingGrade ? "Modifiez les informations de la note" : "Enregistrez une nouvelle note pour un élève"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveGradeMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Élève <span className="text-destructive">*</span></FormLabel>
                    {useSearchMode ? (
                      <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? `${students.find((s: any) => s.id === field.value)?.prenom || ""} ${students.find((s: any) => s.id === field.value)?.nom || ""} - ${students.find((s: any) => s.id === field.value)?.matricule || ""}`
                                : "Rechercher un élève..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Rechercher par nom, prénom ou matricule..."
                              value={studentSearchQuery}
                              onValueChange={setStudentSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>Aucun élève trouvé.</CommandEmpty>
                              <CommandGroup>
                                {filteredStudentsForSearch.slice(0, 100).map((student: any) => (
                                  <CommandItem
                                    value={`${student.prenom} ${student.nom} ${student.matricule}`}
                                    key={student.id}
                                    onSelect={() => {
                                      field.onChange(student.id);
                                      setStudentSearchOpen(false);
                                      setStudentSearchQuery("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === student.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{student.prenom} {student.nom}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {student.matricule} {student.classe_nom ? `- ${student.classe_nom}` : ""}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="space-y-3">
                        <Select
                          value={selectedClasse}
                          onValueChange={(value) => {
                            setSelectedClasse(value);
                            field.onChange("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une classe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les classes</SelectItem>
                            {classes.map((classe: any) => (
                              <SelectItem key={classe.id} value={classe.id}>
                                {classe.nom} ({studentsByClass[classe.id]?.length || 0} élèves)
                              </SelectItem>
                            ))}
                            {studentsByClass["sans_classe"] && (
                              <SelectItem value="sans_classe">
                                Sans classe ({studentsByClass["sans_classe"].length} élèves)
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={selectedClasse === "all" || !selectedClasse}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedClasse === "all" || !selectedClasse ? "Choisissez d'abord une classe" : "Sélectionner un élève"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedClasse !== "all" && selectedClasse && (
                              (studentsByClass[selectedClasse] || []).map((student: any) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.prenom} {student.nom} - {student.matricule}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AJOUT du champ Semestre */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="semestre_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedSemestre(value);
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un semestre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {semestres.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nom} ({s.annee_scolaire})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="matiere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Matière
                        {!selectedClasse || selectedClasse === 'all' ?
                          <span className="text-muted-foreground text-xs ml-1">(sélectionnez d'abord une classe)</span> :
                          ''}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "aucune"}
                        disabled={!selectedClasse || selectedClasse === 'all' || availableMatieres.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedClasse || selectedClasse === 'all' ? "Choisissez d'abord une classe" : "Sélectionner une matière"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aucune">Aucune matière</SelectItem>
                          {availableMatieres.map((matiere) => (
                            <SelectItem key={matiere.nom} value={matiere.nom}>
                              {matiere.nom} (Coef. {matiere.coefficient})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (/20) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coefficient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coefficient <span className="text-muted-foreground text-xs">(auto-rempli si matière sélectionnée)</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          placeholder="1.0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          value={field.value || 1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type_evaluation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'évaluation <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="devoir">Devoir</SelectItem>
                          <SelectItem value="controle">Contrôle</SelectItem>
                          <SelectItem value="examen">Examen</SelectItem>
                          <SelectItem value="oral">Oral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_evaluation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'évaluation <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annee_scolaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année scolaire (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={anneeScolaire}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Par défaut: {anneeScolaire}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarque (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Commentaire ou observation sur cette note..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingGrade(null);
                    setSelectedClasse("all");
                    setStudentSearchQuery("");
                    setStudentSearchOpen(false);
                    setSelectedSemestre("");
                    form.reset({
                      coefficient: 1,
                      type_evaluation: "devoir",
                      date_evaluation: new Date(),
                      annee_scolaire: anneeScolaire,
                      semestre_id: "",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saveGradeMutation.isPending}>
                  {saveGradeMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Grades;