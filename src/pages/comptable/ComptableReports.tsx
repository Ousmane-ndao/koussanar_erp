import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, TrendingUp, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const ComptableReports = () => {
  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;

  const { data: financeStats } = useQuery({
    queryKey: ["finance-stats", anneeScolaire],
    queryFn: () => api.getFinanceStats(anneeScolaire),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF
    alert('Export PDF à implémenter');
  };

  const handleExportExcel = () => {
    // TODO: Implémenter l'export Excel
    alert('Export Excel à implémenter');
  };

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
            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={handleExportPDF}
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Export PDF</div>
                  <div className="text-sm text-muted-foreground">Rapport financier complet</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={handleExportExcel}
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Export Excel</div>
                  <div className="text-sm text-muted-foreground">Données détaillées</div>
                </div>
              </Button>
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

