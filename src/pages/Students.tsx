import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { StudentForm } from "@/components/students/StudentForm";
import { StudentsList } from "@/components/students/StudentsList";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { ExportButton } from "@/components/ExportButton";

const Students = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('manage_users');

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // Create/Update student
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const studentData = {
        matricule: values.matricule,
        nom: values.nom,
        prenom: values.prenom,
        date_naissance: values.date_naissance ? values.date_naissance.toISOString().split('T')[0] : null,
        lieu_naissance: values.lieu_naissance,
        sexe: values.sexe,
        classe_id: values.classe_id || null,
        telephone: values.telephone || null,
        adresse: values.adresse || null,
        annee_scolaire: values.annee_scolaire,
        statut_inscription: values.statut_inscription || 'actif',
      };

      if (editingStudent) {
        return await api.updateStudent(editingStudent.id, studentData);
      } else {
        return await api.createStudent(studentData);
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDialogOpen(false);
      setEditingStudent(null);
      
      if (response?.email && response?.password && !editingStudent) {
        // Afficher les identifiants générés
        toast({
          title: "Élève créé avec succès",
          description: `Email: ${response.email} | Mot de passe: ${response.password}`,
          duration: 10000, // Afficher pendant 10 secondes
        });
      } else {
        toast({
          title: "Succès",
          description: editingStudent ? "Élève modifié avec succès" : "Élève ajouté avec succès",
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

  // Delete student
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteStudent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Succès",
        description: "Élève supprimé avec succès",
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

  const filteredStudents = students.filter((student: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.matricule?.toLowerCase().includes(searchLower) ||
      student.nom?.toLowerCase().includes(searchLower) ||
      student.prenom?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleView = (student: any) => {
    toast({
      title: "Détails de l'élève",
      description: `${student.prenom} ${student.nom} - ${student.matricule}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Élèves</h1>
            <p className="text-muted-foreground">Gérez les inscriptions et les informations des élèves</p>
          </div>
          {canManage && (
            <Button className="gap-2" onClick={() => {
              setEditingStudent(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Nouvel élève
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Liste des élèves ({filteredStudents.length})</CardTitle>
                <CardDescription>Recherchez et gérez les élèves inscrits</CardDescription>
              </div>
              {canManage && (
                <ExportButton
                  onExportPDF={() => api.exportStudentsPDF()}
                  onExportExcel={() => api.exportStudentsExcel()}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par matricule, nom ou prénom..." 
                className="max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <StudentsList
              students={filteredStudents.map((s: any) => ({
                ...s,
                classe_id: s.classe_id,
                classe_nom: s.classe_nom || classes.find((c: any) => c.id === s.classe_id)?.nom || "Non assigné",
              }))}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onView={handleView}
              classes={classes}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Modifier l'élève" : "Nouvel élève"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'élève
            </DialogDescription>
          </DialogHeader>
          <StudentForm
            onSubmit={(values) => saveMutation.mutate(values)}
            initialData={editingStudent ? {
              ...editingStudent,
              date_naissance: editingStudent.date_naissance ? new Date(editingStudent.date_naissance) : undefined,
            } : undefined}
            isLoading={saveMutation.isPending}
            classes={classes}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Students;
