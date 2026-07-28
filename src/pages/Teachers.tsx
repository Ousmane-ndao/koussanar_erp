import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2, User, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const teacherSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis"),
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  specialite: z.string().optional(),
  date_embauche: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

const Teachers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.getTeachers(),
  });

  const saveTeacherMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      if (editingTeacher) {
        return await api.updateTeacher(editingTeacher.id, values);
      } else {
        return await api.createTeacher(values);
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      form.reset();
      
      if (response?.email && response?.password && !editingTeacher) {
        // Afficher les identifiants générés
        toast({
          title: "Enseignant créé avec succès",
          description: `Email: ${response.email} | Mot de passe: ${response.password}`,
          duration: 10000, // Afficher pendant 10 secondes
        });
      } else {
        toast({
          title: "Succès",
          description: editingTeacher ? "Enseignant modifié avec succès" : "Enseignant ajouté avec succès",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteTeacher(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({
        title: "Succès",
        description: "Enseignant supprimé avec succès",
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

  const filteredTeachers = teachers.filter((teacher: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      teacher.matricule?.toLowerCase().includes(searchLower) ||
      teacher.nom?.toLowerCase().includes(searchLower) ||
      teacher.prenom?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower) ||
      teacher.specialite?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    form.reset({
      matricule: teacher.matricule,
      nom: teacher.nom,
      prenom: teacher.prenom,
      email: teacher.email,
      telephone: teacher.telephone || "",
      adresse: teacher.adresse || "",
      specialite: teacher.specialite || "",
      date_embauche: teacher.date_embauche || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Enseignants</h1>
            <p className="text-muted-foreground">Gérez les informations des enseignants</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setEditingTeacher(null);
              form.reset();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Nouvel enseignant
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Liste des enseignants ({filteredTeachers.length})</CardTitle>
                <CardDescription>Recherchez et gérez les enseignants</CardDescription>
              </div>
              <div className="relative w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTeachers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun enseignant trouvé
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Spécialité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher: any) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.matricule}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {teacher.prenom} {teacher.nom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {teacher.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {teacher.telephone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {teacher.telephone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{teacher.specialite || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={teacher.statut === "actif" ? "default" : "secondary"}>
                            {teacher.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTeacherMutation.mutate(teacher.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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
            <DialogTitle>
              {editingTeacher ? "Modifier l'enseignant" : "Nouvel enseignant"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'enseignant
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => saveTeacherMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matricule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ENS001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="+221 XX XXX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spécialité (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mathématiques" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_embauche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'embauche (optionnel)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Adresse complète" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingTeacher(null);
                    form.reset();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saveTeacherMutation.isPending}>
                  {saveTeacherMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Teachers;




