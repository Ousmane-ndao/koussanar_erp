import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ExportButton";

const ComptableReports = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const { data: financeStats } = useQuery({
    queryKey: ["finance-stats", anneeScolaire],
    queryFn: () => api.getFinanceStats(anneeScolaire),
    retry: 1,
    refetchOnWindowFocus: false,
  });


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports Financiers</h1>
          <p className="text-muted-foreground mt-1">
            Génération et exportation des rapports financiers
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-6 md:grid-cols-4">
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
              <div className="text-2xl font-bold">
                {Number(financeStats?.total_recettes || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">FCFA</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total payé
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
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
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
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
              <div className="text-2xl font-bold">
                {financeStats?.total_transactions || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options d'export */}
        <Card>
          <CardHeader>
            <CardTitle>Exporter les rapports</CardTitle>
            <CardDescription>
              Année scolaire: {anneeScolaire}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <ExportButton
                onExportPDF={() => api.exportFinancePDF({ annee_scolaire: anneeScolaire })}
                onExportExcel={() => api.exportFinanceExcel({ annee_scolaire: anneeScolaire })}
                label="Exporter le rapport"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Année scolaire:</strong> {anneeScolaire}
              </p>
              <p>
                <strong>Date du rapport:</strong> {format(new Date(), "dd/MM/yyyy à HH:mm")}
              </p>
              <p>
                <strong>Élèves inscrits:</strong> {financeStats?.total_students || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ComptableReports;



