import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Folder, Download, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Documents = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState<string>("autre");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = [
    { value: "releves_notes", label: "Relevés de notes" },
    { value: "emplois_temps", label: "Emplois du temps" },
    { value: "circulaires", label: "Circulaires" },
    { value: "bulletins", label: "Bulletins" },
    { value: "autre", label: "Autre" },
  ];

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.getDocuments(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !documentName.trim()) {
        throw new Error("Veuillez sélectionner un fichier et saisir un nom");
      }

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('nom', documentName);
      formData.append('categorie', category);

      await api.uploadDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setIsDialogOpen(false);
      setUploadFile(null);
      setDocumentName("");
      setCategory("autre");
      toast({
        title: "Succès",
        description: "Document téléversé avec succès",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
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

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesCategory = selectedCategory === "all" || doc.categorie === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      doc.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (cat: string) => {
    return documents.filter((d: any) => d.categorie === cat).length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!documentName.trim()) {
        setDocumentName(file.name);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion Documentaire</h1>
            <p className="text-muted-foreground">Stockez et organisez vos documents administratifs</p>
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            Téléverser un document
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.value);
            return (
              <Card
                key={cat.value}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedCategory === cat.value ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? "all" : cat.value)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cat.label}</CardTitle>
                      <CardDescription>{count} fichier{count !== 1 ? "s" : ""}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Documents récents</CardTitle>
                <CardDescription>Derniers fichiers téléversés</CardDescription>
              </div>
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
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>Aucun document trouvé</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Ajouté par</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.nom}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categories.find(c => c.value === doc.categorie)?.label || doc.categorie}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.taille || 0)}</TableCell>
                        <TableCell>
                          {doc.profiles?.prenom || doc.prenom} {doc.profiles?.nom || doc.nom}
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {doc.url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const url = doc.url.startsWith('/') 
                                    ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.url}`
                                    : doc.url;
                                  window.open(url, "_blank");
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
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
            <DialogTitle>Téléverser un document</DialogTitle>
            <DialogDescription>Ajoutez un nouveau document au système</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentName">Nom du document</Label>
              <Input
                id="documentName"
                placeholder="Ex: Relevé de notes - 6ème A"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending || !uploadFile || !documentName.trim()}
              >
                {uploadMutation.isPending ? "Téléversement..." : "Téléverser"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Documents;
