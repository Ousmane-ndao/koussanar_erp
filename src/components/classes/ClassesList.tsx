import { useState } from "react";
import { Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Classe {
  id: string;
  nom: string;
  niveau: string;
  filiere: string | null;
  effectif_max: number;
  _count?: { students: number };
}

interface ClassesListProps {
  classes: Classe[];
  onEdit: (classe: Classe) => void;
  onDelete: (id: string) => void;
}

export const ClassesList = ({ classes, onEdit, onDelete }: ClassesListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Aucune classe créée pour le moment
          </div>
        ) : (
          classes.map((classe) => {
            const studentCount = classe._count?.students || 0;
            const percentFull = classe.effectif_max > 0 
              ? Math.round((studentCount / classe.effectif_max) * 100) 
              : 0;

            return (
              <Card key={classe.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{classe.nom}</CardTitle>
                      <CardDescription>
                        {classe.niveau}
                        {classe.filiere && ` - ${classe.filiere}`}
                      </CardDescription>
                    </div>
                    <Badge variant={percentFull >= 90 ? "destructive" : "default"}>
                      {percentFull}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Effectif</span>
                    </div>
                    <span className="font-medium">
                      {studentCount} / {classe.effectif_max}
                    </span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(percentFull, 100)}%` }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(classe)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(classe.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.
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
