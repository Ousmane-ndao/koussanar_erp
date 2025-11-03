import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getDashboardRoute } from "@/utils/routing";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      // Rediriger selon le rôle
      const dashboardRoute = getDashboardRoute(user.roles || []);
      navigate(dashboardRoute);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">Lycée de Koussanar</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Système de Gestion <span className="text-primary">ERP</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Une solution complète et moderne pour la gestion administrative, pédagogique et financière du Lycée de Koussanar
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Commencer
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Gestion des élèves</h3>
            <p className="text-muted-foreground">
              Inscription, suivi académique, présences et bulletins de notes automatisés
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
            <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Gestion pédagogique</h3>
            <p className="text-muted-foreground">
              Classes, emplois du temps, matières et évaluations centralisés
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
            <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Suivi financier</h3>
            <p className="text-muted-foreground">
              Gestion des paiements, reçus automatiques et tableaux de bord financiers
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 Lycée de Koussanar. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
