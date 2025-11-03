import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ElevePayments = () => {
  const { user } = useAuth();

  // Récupérer l'ID de l'élève
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
    enabled: !!user,
  });

  const studentId = students.find((s: any) => s.user_id === user?.id)?.id;

  // Récupérer les paiements
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", studentId],
    queryFn: () => studentId ? api.getPaymentsByStudent(studentId) : Promise.resolve([]),
    enabled: !!studentId,
  });

  const paiementsPayes = payments.filter((p: any) => p.statut === 'paye');
  const paiementsEnAttente = payments.filter((p: any) => p.statut === 'en_attente');

  const totalPaye = paiementsPayes.reduce((sum: number, p: any) => sum + parseFloat(p.montant || 0), 0);
  const totalAttente = paiementsEnAttente.reduce((sum: number, p: any) => sum + parseFloat(p.montant || 0), 0);
  const totalGeneral = totalPaye + totalAttente;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Paiements</h1>
          <p className="text-muted-foreground mt-1">
            Suivi de vos paiements de scolarité
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total payé
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {totalPaye.toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {totalAttente.toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total général
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalGeneral.toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des paiements */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun paiement enregistré.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment: any) => (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold capitalize">
                          {payment.type_paiement}
                        </h3>
                        <Badge 
                          variant={payment.statut === 'paye' ? 'default' : 'secondary'}
                          className={
                            payment.statut === 'paye' 
                              ? 'bg-green-500' 
                              : payment.statut === 'en_attente'
                              ? 'bg-orange-500'
                              : ''
                          }
                        >
                          {payment.statut === 'paye' ? 'Payé' : payment.statut === 'en_attente' ? 'En attente' : payment.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.mois_paye && `Mois: ${payment.mois_paye} - `}
                        Année scolaire: {payment.annee_scolaire}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), "dd/MM/yyyy à HH:mm")}
                      </p>
                      {payment.remarque && (
                        <p className="text-sm text-muted-foreground mt-2">{payment.remarque}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{Number(payment.montant).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ElevePayments;

