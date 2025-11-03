import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, TrendingUp, Users, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ComptableDashboard = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.getPayments(),
  });

  const { data: financeStats } = useQuery({
    queryKey: ["finance-stats", anneeScolaire],
    queryFn: () => api.getFinanceStats(anneeScolaire),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const paymentsToday = payments.filter((p: any) => {
    const paymentDate = new Date(p.created_at);
    return format(paymentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  const paymentsPending = payments.filter((p: any) => p.statut === 'en_attente');

  const quickActions = [
    { label: "Enregistrer un paiement", link: "/dashboard/finance", icon: CreditCard },
    { label: "Paiements en attente", link: "/dashboard/finance", icon: DollarSign },
    { label: "Rapports financiers", link: "/comptable/reports", icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Comptable</h1>
          <p className="text-muted-foreground mt-1">
            Gestion financière - {anneeScolaire}
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.link} to={action.link}>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                      <Icon className="h-5 w-5" />
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recettes totales
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {Number(financeStats?.total_recettes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">FCFA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paiés
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {Number(financeStats?.total_paye || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">FCFA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {Number(financeStats?.total_attente || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">FCFA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transactions
              </CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <FileText className="w-5 h-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {financeStats?.total_transactions || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Paiements d'aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentsToday.length > 0 ? (
                  paymentsToday.slice(0, 5).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.type_paiement}</p>
                        <p className="text-sm text-muted-foreground">{payment.matricule || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Number(payment.montant).toLocaleString()} FCFA</p>
                        <p className={`text-xs ${payment.statut === 'paye' ? 'text-green-600' : 'text-orange-600'}`}>
                          {payment.statut}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucun paiement aujourd'hui</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiements en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentsPending.length > 0 ? (
                  paymentsPending.slice(0, 5).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.type_paiement}</p>
                        <p className="text-sm text-muted-foreground">{payment.matricule || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Number(payment.montant).toLocaleString()} FCFA</p>
                        <p className="text-xs text-orange-600">En attente</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">Aucun paiement en attente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComptableDashboard;

