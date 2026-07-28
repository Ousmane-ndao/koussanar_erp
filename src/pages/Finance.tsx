import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, Search, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePermissions } from "@/hooks/usePermissions";
import { ExportButton } from "@/components/ExportButton";

const paymentSchema = z.object({
  student_id: z.string().min(1, "Sélectionnez un élève"),
  montant: z.number().min(1, "Le montant doit être supérieur à 0"),
  type_paiement: z.enum(["inscription", "scolarite", "autre"]),
  mois_paye: z.string().optional(),
  annee_scolaire: z.string().min(1, "L'année scolaire est requise"),
  remarque: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const Finance = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: 0,
      type_paiement: "scolarite",
      annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    },
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => api.getStudents(),
  });

  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.getPayments(),
  });

  const savePaymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      await api.createPayment({
        student_id: values.student_id,
        montant: values.montant,
        type_paiement: values.type_paiement,
        mois_paye: values.mois_paye || null,
        annee_scolaire: values.annee_scolaire,
        remarque: values.remarque || null,
        statut: "paye",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
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

  const filteredPayments = payments.filter((payment: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.matricule?.toLowerCase().includes(searchLower) ||
      payment.nom?.toLowerCase().includes(searchLower) ||
      payment.prenom?.toLowerCase().includes(searchLower)
    );
  });

  const currentYear = new Date().getFullYear();
  const anneeScolaire = `${currentYear}-${currentYear + 1}`;
  
  // Calculate statistics
  const yearPayments = payments.filter((p: any) => 
    p.annee_scolaire === anneeScolaire
  );
  const yearRecettes = yearPayments.reduce((sum: number, p: any) => sum + (Number(p.montant) || 0), 0);
  
  // Simplified calculation - in real app, calculate based on expected fees
  const totalExpected = students.length * 50000; // Example: 50,000 FCFA per student
  const paymentRate = totalExpected > 0 ? Math.round((yearRecettes / totalExpected) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion Financière</h1>
            <p className="text-muted-foreground">Suivez les paiements et les finances de l'établissement</p>
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau paiement
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recettes totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yearRecettes.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">Année {currentYear}-{currentYear + 1}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements en attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(0, totalExpected - yearRecettes).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">À recouvrer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de paiement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentRate}%</div>
              <p className="text-xs text-muted-foreground">Des frais collectés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">Paiements enregistrés</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Dernières transactions</CardTitle>
                <CardDescription>Historique des paiements récents</CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <ExportButton
                  onExportPDF={() => api.exportFinancePDF({ annee_scolaire: anneeScolaire })}
                  onExportExcel={() => api.exportFinanceExcel({ annee_scolaire: anneeScolaire })}
                />
                <div className="relative w-[300px]">
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
            {filteredPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune transaction enregistrée</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {payment.prenom} {payment.nom}
                          <div className="text-xs text-muted-foreground">
                            {payment.matricule}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.type_paiement}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(payment.montant).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.statut === "paye" ? "default" : "destructive"}>
                            {payment.statut === "paye" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Payé
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                En attente
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
            <DialogDescription>Enregistrer un nouveau paiement</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => savePaymentMutation.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Élève</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un élève" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.prenom} {student.nom} - {student.matricule}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_paiement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de paiement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inscription">Inscription</SelectItem>
                        <SelectItem value="scolarite">Scolarité</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annee_scolaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année scolaire</FormLabel>
                    <FormControl>
                      <Input placeholder="2024-2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mois_paye"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois payé (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Octobre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={savePaymentMutation.isPending}>
                  {savePaymentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Finance;
