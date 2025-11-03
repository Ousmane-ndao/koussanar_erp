import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, TrendingUp } from "lucide-react";
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

const gradeSchema = z.object({
  student_id: z.string().min(1, "Sélectionnez un élève"),
  matiere: z.string().min(1, "La matière est requise"),
  note: z.number().min(0).max(20),
  coefficient: z.number().min(0.1).max(10).default(1),
  type_evaluation: z.enum(["devoir", "controle", "examen", "oral"]),
  date_evaluation: z.date(),
  annee_scolaire: z.string().min(1, "L'année scolaire est requise"),
  remarque: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

const Grades = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedMatiere, setSelectedMatiere] = useState<string>("all");
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
    },
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  // Fetch grades
  const { data: grades = [] } = useQuery({
    queryKey: ["grades", selectedStudent, selectedMatiere],
    queryFn: () => api.getGrades({
      student_id: selectedStudent !== "all" ? selectedStudent : undefined,
      matiere: selectedMatiere !== "all" ? selectedMatiere : undefined,
      annee_scolaire: anneeScolaire,
    }),
  });

  const saveGradeMutation = useMutation({
    mutationFn: async (values: GradeFormValues) => {
      const gradeData = {
        student_id: values.student_id,
        matiere: values.matiere,
        note: values.note,
        coefficient: values.coefficient,
        type_evaluation: values.type_evaluation,
        date_evaluation: values.date_evaluation.toISOString().split('T')[0],
        annee_scolaire: values.annee_scolaire,
        remarque: values.remarque || null,
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
      form.reset();
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
    form.reset({
      student_id: grade.student_id,
      matiere: grade.matiere,
      note: Number(grade.note),
      coefficient: Number(grade.coefficient),
      type_evaluation: grade.type_evaluation,
      date_evaluation: new Date(grade.date_evaluation),
      annee_scolaire: grade.annee_scolaire,
      remarque: grade.remarque,
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
                form.reset({
                  coefficient: 1,
                  type_evaluation: "devoir",
                  date_evaluation: new Date(),
                  annee_scolaire: anneeScolaire,
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
              <div className="flex gap-2 w-full md:w-auto">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
            <DialogDescription>Enregistrez une nouvelle note pour un élève</DialogDescription>
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
                  <FormItem>
                    <FormLabel>Élève</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un élève" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.prenom} {student.nom} - {student.matricule}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matiere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matière</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mathématiques" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (/20)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                  name="coefficient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coefficient</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type_evaluation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'évaluation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_evaluation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'évaluation</FormLabel>
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

                <FormField
                  control={form.control}
                  name="annee_scolaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année scolaire</FormLabel>
                      <FormControl>
                        <Input placeholder="2024-2025" {...field} />
                      </FormControl>
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
                      <Input placeholder="Commentaire..." {...field} />
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
                    form.reset();
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


