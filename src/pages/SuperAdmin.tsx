import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Settings, Users, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SuperAdmin = () => {
  const { toast } = useToast();

  const systemActions = [
    { label: "Sauvegarde de la base de données", icon: Database, action: () => handleBackup() },
    { label: "Vérification de l'intégrité", icon: Shield, action: () => handleIntegrityCheck() },
    { label: "Logs système", icon: FileText, action: () => handleViewLogs() },
    { label: "Paramètres système", icon: Settings, action: () => handleSystemSettings() },
  ];

  const handleBackup = () => {
    toast({
      title: "Sauvegarde",
      description: "La sauvegarde de la base de données a été initiée.",
    });
    // TODO: Implémenter la logique de sauvegarde
  };

  const handleIntegrityCheck = () => {
    toast({
      title: "Vérification",
      description: "Vérification de l'intégrité du système en cours...",
    });
    // TODO: Implémenter la vérification d'intégrité
  };

  const handleViewLogs = () => {
    toast({
      title: "Logs",
      description: "Ouverture des logs système...",
    });
    // TODO: Implémenter la visualisation des logs
  };

  const handleSystemSettings = () => {
    toast({
      title: "Paramètres",
      description: "Ouverture des paramètres système...",
    });
    // TODO: Implémenter les paramètres système
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-destructive/10 p-3 rounded-lg">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Super Administrateur</h1>
            <p className="text-muted-foreground mt-1">
              Accès technique et maintenance du système
            </p>
          </div>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle>Zone technique</CardTitle>
            </div>
            <CardDescription>
              Cette zone est réservée aux administrateurs techniques. Toute action effectuée ici peut impacter l'ensemble du système.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* System Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions système</CardTitle>
            <CardDescription>
              Gestion technique et maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {systemActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                    onClick={action.action}
                  >
                    <Icon className="h-5 w-5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base de données</span>
                  <span className="font-medium">MySQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernière sauvegarde</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <span className="font-medium text-green-600">Actif</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Utilisateurs actifs</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Espace disque utilisé</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdmin;

