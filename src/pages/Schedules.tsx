import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, BookOpen, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const Schedules = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canManage = hasPermission('manage_schedule');

  // Fetch schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => api.getSchedules(),
    enabled: true,
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.getTeachers(),
  });

  // Group schedules by day and class
  const groupedSchedules = schedules.reduce((acc: any, schedule: any) => {
    const key = `${schedule.classe_id}-${schedule.jour}`;
    if (!acc[key]) {
      acc[key] = {
        classe: schedule.classe_nom || 'N/A',
        jour: schedule.jour,
        items: [],
      };
    }
    acc[key].items.push(schedule);
    return acc;
  }, {});

  // Create/Update schedule
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const scheduleData = {
        classe_id: values.classe_id,
        jour: values.jour,
        heure_debut: values.heure_debut,
        heure_fin: values.heure_fin,
        matiere: values.matiere,
        teacher_id: values.teacher_id || null,
        salle: values.salle || null,
      };

      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await api.createSchedule(scheduleData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      toast({
        title: "Succès",
        description: editingSchedule ? "Emploi du temps modifié avec succès" : "Emploi du temps créé avec succès",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = {
      classe_id: formData.get('classe_id') as string,
      jour: formData.get('jour') as string,
      heure_debut: formData.get('heure_debut') as string,
      heure_fin: formData.get('heure_fin') as string,
      matiere: formData.get('matiere') as string,
      teacher_id: formData.get('teacher_id') as string || null,
      salle: formData.get('salle') as string || null,
    };
    saveMutation.mutate(values);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Emplois du temps</h1>
            <p className="text-muted-foreground">Gestion des horaires des classes</p>
          </div>
          {canManage && (
            <Button onClick={() => {
              setEditingSchedule(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un horaire
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(groupedSchedules).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun emploi du temps trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.entries(groupedSchedules).map(([key, group]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{group.classe} - {group.jour}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.items
                      .sort((a: any, b: any) => a.heure_debut.localeCompare(b.heure_debut))
                      .map((schedule: any) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {schedule.heure_debut} - {schedule.heure_fin}
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="font-medium">{schedule.matiere}</span>
                            </div>
                            {schedule.teacher_nom && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {schedule.teacher_prenom} {schedule.teacher_nom}
                              </div>
                            )}
                            {schedule.salle && (
                              <span className="text-sm text-muted-foreground">Salle: {schedule.salle}</span>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Modifier
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Modifier l'emploi du temps" : "Nouvel emploi du temps"}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule ? "Modifiez les informations de l'emploi du temps" : "Ajoutez un nouvel horaire"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Classe</label>
                  <select
                    name="classe_id"
                    required
                    defaultValue={editingSchedule?.classe_id}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((classe: any) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Jour</label>
                  <select
                    name="jour"
                    required
                    defaultValue={editingSchedule?.jour}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {JOURS.map((jour) => (
                      <option key={jour} value={jour}>
                        {jour.charAt(0).toUpperCase() + jour.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Heure début</label>
                  <input
                    type="time"
                    name="heure_debut"
                    required
                    defaultValue={editingSchedule?.heure_debut}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Heure fin</label>
                  <input
                    type="time"
                    name="heure_fin"
                    required
                    defaultValue={editingSchedule?.heure_fin}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Matière</label>
                <input
                  type="text"
                  name="matiere"
                  required
                  defaultValue={editingSchedule?.matiere}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Ex: Mathématiques"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Enseignant (optionnel)</label>
                  <select
                    name="teacher_id"
                    defaultValue={editingSchedule?.teacher_id || ''}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Aucun enseignant</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.prenom} {teacher.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Salle (optionnel)</label>
                  <input
                    type="text"
                    name="salle"
                    defaultValue={editingSchedule?.salle || ''}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Ex: Salle 101"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSchedule(null);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Enregistrement..." : editingSchedule ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Schedules;




















