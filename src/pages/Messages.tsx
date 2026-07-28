import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Bell, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Messages = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"info" | "important" | "urgence">("info");
  const [audience, setAudience] = useState<"all" | "role" | "class" | "user">("all");
  const [targetRole, setTargetRole] = useState<"admin" | "enseignant" | "eleve" | "parent" | "comptable" | "surveillant" | "">("");
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.getAnnouncements(),
  });

  // Fetch classes and teachers for targeting
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", "for-targeting"],
    queryFn: () => api.getClasses(),
  });
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers", "for-targeting"],
    queryFn: () => api.getTeachers(),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        titre: title,
        contenu: content,
        type,
      };
      if (audience !== "all") {
        payload.audience = audience;
        if (audience === "role") {
          payload.target_role = targetRole || undefined;
        } else if (audience === "class") {
          payload.target_class_id = targetClassId || undefined;
        } else if (audience === "user") {
          payload.target_user_id = targetUserId || undefined;
        }
      }
      await api.createAnnouncement(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setContent("");
      setType("info");
      setAudience("all");
      setTargetRole("");
      setTargetClassId("");
      setTargetUserId("");
      toast({
        title: "Succès",
        description: "Annonce publiée avec succès",
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
      await api.deleteAnnouncement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Succès",
        description: "Annonce supprimée avec succès",
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

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et le contenu sont requis",
        variant: "destructive",
      });
      return;
    }
    publishMutation.mutate();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "important":
        return <Badge variant="default" className="bg-orange-500">Important</Badge>;
      case "urgence":
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Information</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messagerie & Annonces</h1>
          <p className="text-muted-foreground">Communication interne et circulaires</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Nouvelle annonce
              </CardTitle>
              <CardDescription>Publier une annonce ou circulaire</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Titre de l'annonce"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgence">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout le monde</SelectItem>
                    <SelectItem value="role">Par rôle</SelectItem>
                    <SelectItem value="class">Par classe</SelectItem>
                    <SelectItem value="user">Utilisateur spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audience === "role" && (
                <div className="space-y-2">
                  <Label>Rôle cible</Label>
                  <Select value={targetRole} onValueChange={(v: any) => setTargetRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enseignant">Enseignant</SelectItem>
                      <SelectItem value="eleve">Élève</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="comptable">Comptable</SelectItem>
                      <SelectItem value="surveillant">Surveillant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {audience === "class" && (
                <div className="space-y-2">
                  <Label>Classe cible</Label>
                  <Select value={targetClassId} onValueChange={(v: any) => setTargetClassId(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.niveau} - {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {audience === "user" && (
                <div className="space-y-2">
                  <Label>Destinataire (enseignant)</Label>
                  <Select value={targetUserId} onValueChange={(v: any) => setTargetUserId(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t: any) => (
                        <SelectItem key={t.user_id || t.id} value={(t.user_id || t.id)}>
                          {t.prenom} {t.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  placeholder="Rédigez votre message..."
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                <Send className="w-4 h-4" />
                {publishMutation.isPending ? "Publication..." : "Publier l'annonce"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Annonces récentes
              </CardTitle>
              <CardDescription>Dernières communications</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune annonce publiée</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {announcements.map((announcement: any) => (
                    <Card key={announcement.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{announcement.titre}</CardTitle>
                              {getTypeBadge(announcement.type)}
                            </div>
                            <CardDescription>
                              Par {announcement.profiles?.prenom || announcement.prenom} {announcement.profiles?.nom || announcement.nom} •{" "}
                              {format(new Date(announcement.created_at), "dd/MM/yyyy à HH:mm")}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(announcement.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{announcement.contenu}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
