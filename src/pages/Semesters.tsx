import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, Calendar } from "lucide-react";
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

const semesterSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  numero: z.number().min(1).max(3, "Le numéro doit être entre 1 et 3"),
  annee_scolaire: z.string().min(1, "L'année scolaire est requise"),
  date_debut: z.date({
    required_error: "La date de début est requise",
  }),
  date_fin: z.date({
    required_error: "La date de fin est requise",
  }),
  actif: z.boolean().default(true),
}).refine((data) => {
  if (!data.date_debut || !data.date_fin) return true;
  return data.date_fin >= data.date_debut;
}, {
  message: "La date de fin doit être après ou égale à la date de début",
  path: ["date_fin"],
});

type SemesterFormValues = z.infer<typeof semesterSchema>;

const Semesters = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('manage_schedule');

  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      nom: "",
      numero: 1,
      annee_scolaire: anneeScolaire,
      date_debut: new Date(),
      date_fin: new Date(),
      actif: true,
    },
  });

  // Fetch semesters
  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => api.getSemesters(),
  });

  // Get unique years from semesters
  const years = Array.from(new Set(semesters.map((s: any) => s.annee_scolaire))).sort();

  // Filter semesters
  const filteredSemesters = semesters.filter((semester: any) => {
    const matchesSearch = 
      semester.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      semester.annee_scolaire?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear = selectedYear === "all" || semester.annee_scolaire === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  // Create/Update semester
  const saveMutation = useMutation({
    mutationFn: async (values: SemesterFormValues) => {
      const semesterData = {
        nom: values.nom,
        numero: values.numero,
        annee_scolaire: values.annee_scolaire,
        date_debut: format(values.date_debut, "yyyy-MM-dd"),
        date_fin: format(values.date_fin, "yyyy-MM-dd"),
        actif: values.actif,
      };

      if (editingSemester) {
        await api.updateSemester(editingSemester.id, semesterData);
      } else {
        await api.createSemester(semesterData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      setIsDialogOpen(false);
      setEditingSemester(null);
      form.reset();
      toast({
        title: "Succès",
        description: editingSemester ? "Semestre modifié avec succès" : "Semestre créé avec succès",
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

  // Delete semester
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteSemester(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      toast({
        title: "Succès",
        description: "Semestre supprimé avec succès",
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

  const handleEdit = (semester: any) => {
    setEditingSemester(semester);
    form.reset({
      nom: semester.nom || "",
      numero: semester.numero || 1,
      annee_scolaire: semester.annee_scolaire || anneeScolaire,
      date_debut: semester.date_debut ? new Date(semester.date_debut) : new Date(),
      date_fin: semester.date_fin ? new Date(semester.date_fin) : new Date(),
      actif: semester.actif !== undefined ? semester.actif : semester.statut === 'actif',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce semestre ?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (values: SemesterFormValues) => {
    saveMutation.mutate(values);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Semestres</h1>
            <p className="text-muted-foreground">Gérez les semestres de l'année scolaire</p>
          </div>
          {canManage && (
            <Button className="gap-2" onClick={() => {
              setEditingSemester(null);
              form.reset({
                nom: "",
                numero: 1,
                annee_scolaire: anneeScolaire,
                date_debut: new Date(),
                date_fin: new Date(),
                actif: true,
              });
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Nouveau semestre
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <CardTitle>Liste des semestres ({filteredSemesters.length})</CardTitle>
                <CardDescription>Filtrez et gérez les semestres</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto items-center">
                {canManage && (
                  <ExportButton
                    onExportPDF={() => {
                      // TODO: Implémenter export semesters PDF
                      toast({
                        title: "Info",
                        description: "Export PDF des semestres à implémenter",
                      });
                    }}
                    onExportExcel={() => {
                      // TODO: Implémenter export semesters Excel
                      toast({
                        title: "Info",
                        description: "Export Excel des semestres à implémenter",
                      });
                    }}
                  />
                )}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Toutes les années" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
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
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Chargement...</div>
            ) : filteredSemesters.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery || selectedYear !== "all" 
                  ? "Aucun semestre trouvé" 
                  : "Aucun semestre enregistré"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Année scolaire</TableHead>
                      <TableHead>Date début</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Statut</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSemesters.map((semester: any) => (
                      <TableRow key={semester.id}>
                        <TableCell className="font-medium">{semester.nom}</TableCell>
                        <TableCell>Semestre {semester.numero}</TableCell>
                        <TableCell>{semester.annee_scolaire}</TableCell>
                        <TableCell>
                          {semester.date_debut 
                            ? format(new Date(semester.date_debut), "dd/MM/yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {semester.date_fin 
                            ? format(new Date(semester.date_fin), "dd/MM/yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={semester.actif || semester.statut === 'actif' ? "default" : "secondary"}>
                            {semester.actif || semester.statut === 'actif' ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(semester)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(semester.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSemester ? "Modifier le semestre" : "Nouveau semestre"}
            </DialogTitle>
            <DialogDescription>
              {editingSemester 
                ? "Modifiez les informations du semestre"
                : "Remplissez les informations pour créer un nouveau semestre"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du semestre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Premier semestre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="3"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                        <Input placeholder="2025-2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_debut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
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
                  name="date_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
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
                  name="actif"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Statut actif</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Le semestre est actif
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSemester(null);
                    form.reset();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Enregistrement..." : editingSemester ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Semesters;

