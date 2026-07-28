import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Users, BookOpen, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ClassForm } from "@/components/classes/ClassForm";
import { ClassesList } from "@/components/classes/ClassesList";
import { useToast } from "@/hooks/use-toast";
import { FILIERES } from "@/lib/constants";

const Classes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classes with student counts
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // Filter classes by filiere
  const filteredClasses = useMemo(() => {
    if (selectedFiliere === "all") {
      return classes;
    }
    return classes.filter((classe: any) => classe.filiere === selectedFiliere);
  }, [classes, selectedFiliere]);

  // Calculate statistics based on filtered classes
  const stats = {
    totalClasses: filteredClasses.length,
    totalStudents: filteredClasses.reduce((sum, c) => sum + (c._count?.students || 0), 0),
    avgPerClass: filteredClasses.length > 0 
      ? Math.round(filteredClasses.reduce((sum, c) => sum + (c._count?.students || 0), 0) / filteredClasses.length)
      : 0,
  };

  // Create/Update class
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingClass) {
        await api.updateClass(editingClass.id, values);
      } else {
        await api.createClass(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsDialogOpen(false);
      setEditingClass(null);
      toast({
        title: "Succès",
        description: editingClass ? "Classe modifiée avec succès" : "Classe créée avec succès",
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

  // Delete class
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteClass(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Succès",
        description: "Classe supprimée avec succès",
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

  const handleEdit = (classe: any) => {
    setEditingClass(classe);
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Classes</h1>
            <p className="text-muted-foreground">Gérez les classes, niveaux et filières</p>
          </div>
          <Button className="gap-2" onClick={() => {
            setEditingClass(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="w-4 h-4" />
            Nouvelle classe
          </Button>
        </div>

        {/* Filter by Filiere */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1">
                <Label htmlFor="filiere-filter" className="text-sm font-medium">
                  Filière (optionnel)
                </Label>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger id="filiere-filter" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {FILIERES.map((filiere) => (
                      <SelectItem key={filiere} value={filiere}>
                        {filiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes actives</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Total cette année</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Élèves inscrits</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Dans toutes les classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne par classe</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPerClass}</div>
              <p className="text-xs text-muted-foreground">Élèves par classe</p>
            </CardContent>
          </Card>
        </div>

        <ClassesList
          classes={filteredClasses}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Modifier la classe" : "Nouvelle classe"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la classe
            </DialogDescription>
          </DialogHeader>
          <ClassForm
            onSubmit={(values) => saveMutation.mutate(values)}
            initialData={editingClass}
            isLoading={saveMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Classes;
