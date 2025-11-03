import { useState } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Student {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: string;
  classe_id: string | null;
  statut_inscription: string;
  annee_scolaire: string;
}

interface StudentsListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onView: (student: Student) => void;
  classes: Array<{ id: string; nom: string }>;
  canManage?: boolean;
}

export const StudentsList = ({ students, onEdit, onDelete, onView, classes, canManage = true }: StudentsListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getClassName = (classeId: string | null) => {
    if (!classeId) return "Non assigné";
    const classe = classes.find(c => c.id === classeId);
    return classe?.nom || "Non assigné";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      actif: "default",
      inactif: "secondary",
      suspendu: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom complet</TableHead>
              <TableHead>Date de naissance</TableHead>
              <TableHead>Sexe</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucun élève inscrit pour le moment
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.matricule}</TableCell>
                  <TableCell>{student.prenom} {student.nom}</TableCell>
                  <TableCell>{format(new Date(student.date_naissance), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{student.sexe === "M" ? "Masculin" : "Féminin"}</TableCell>
                  <TableCell>{getClassName(student.classe_id)}</TableCell>
                  <TableCell>{getStatusBadge(student.statut_inscription)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onView(student)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(student.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteId) {
                onDelete(deleteId);
                setDeleteId(null);
              }
            }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
