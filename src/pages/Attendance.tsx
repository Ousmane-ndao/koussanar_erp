import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

type AttendanceStatus = "present" | "absent" | "retard";

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  heure_arrivee?: string;
  remarque?: string;
  student?: {
    matricule: string;
    nom: string;
    prenom: string;
    classe?: {
      nom: string;
    };
  };
}

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManageAttendance = hasPermission('manage_attendance');

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.getClasses(),
  });

  // Fetch students based on selected class
  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  const students = selectedClass === "all" 
    ? allStudents 
    : allStudents.filter((s: any) => s.classe_id === selectedClass);

  // Fetch attendance for selected date
  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : null;
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["attendance", selectedDateStr],
    queryFn: async () => {
      if (!selectedDateStr) return [];
      return api.getAttendanceByDate(selectedDateStr);
    },
    enabled: !!selectedDateStr,
  });

  // Create/Update attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status, heureArrivee }: { studentId: string; status: AttendanceStatus; heureArrivee?: string }) => {
      if (!selectedDateStr) throw new Error("Date non sélectionnée");
      
      await api.saveAttendance({
        student_id: studentId,
        date: selectedDateStr,
        status,
        heure_arrivee: heureArrivee,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Succès",
        description: "Présence enregistrée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAttendanceStatus = (studentId: string): AttendanceStatus | null => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.status || null;
  };

  const filteredStudents = students.filter((student: any) => {
    const searchLower = searchQuery.toLowerCase();
    const nom = student.nom || "";
    const prenom = student.prenom || "";
    const matricule = student.matricule || "";
    return (
      nom.toLowerCase().includes(searchLower) ||
      prenom.toLowerCase().includes(searchLower) ||
      matricule.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    present: attendanceRecords.filter(r => r.status === "present").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    retard: attendanceRecords.filter(r => r.status === "retard").length,
    total: students.length,
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const heureArrivee = status === "retard" ? new Date().toTimeString().slice(0, 5) : undefined;
    saveAttendanceMutation.mutate({ studentId, status, heureArrivee });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Présences</h1>
          <p className="text-muted-foreground">Suivez et gérez la présence des élèves</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une date</CardTitle>
              <CardDescription>Choisissez un jour pour enregistrer les présences</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résumé du jour</CardTitle>
              <CardDescription>Statistiques de présence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Présents</span>
                <span className="text-2xl font-bold text-green-600">{stats.present}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Absents</span>
                <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Retards</span>
                <span className="text-2xl font-bold text-orange-600">{stats.retard}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <CardTitle>Liste des élèves - {date ? format(date, "dd/MM/yyyy") : "Sélectionnez une date"}</CardTitle>
                <CardDescription>Marquez la présence de chaque élève</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {classes.map((classe) => (
                      <SelectItem key={classe.id} value={classe.id}>
                        {classe.nom}
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
            {!date ? (
              <div className="text-center text-muted-foreground py-8">
                Veuillez sélectionner une date pour commencer
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom complet</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucun élève trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student: any) => {
                        const currentStatus = getAttendanceStatus(student.id);
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.matricule}</TableCell>
                            <TableCell>{student.prenom} {student.nom}</TableCell>
                            <TableCell>
                              {student.classe_nom || 
                               classes.find((c: any) => c.id === student.classe_id)?.nom || 
                               "Non assigné"}
                            </TableCell>
                            <TableCell>
                              {currentStatus === "present" && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Présent
                                </Badge>
                              )}
                              {currentStatus === "absent" && (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Absent
                                </Badge>
                              )}
                              {currentStatus === "retard" && (
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Retard
                                </Badge>
                              )}
                              {!currentStatus && (
                                <Badge variant="secondary">Non défini</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {canManageAttendance ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant={currentStatus === "present" ? "default" : "outline"}
                                    onClick={() => handleStatusChange(student.id, "present")}
                                    disabled={saveAttendanceMutation.isPending}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Présent
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={currentStatus === "absent" ? "destructive" : "outline"}
                                    onClick={() => handleStatusChange(student.id, "absent")}
                                    disabled={saveAttendanceMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Absent
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={currentStatus === "retard" ? "default" : "outline"}
                                    className={currentStatus === "retard" ? "bg-orange-500 hover:bg-orange-600" : ""}
                                    onClick={() => handleStatusChange(student.id, "retard")}
                                    disabled={saveAttendanceMutation.isPending}
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Retard
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Lecture seule</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
