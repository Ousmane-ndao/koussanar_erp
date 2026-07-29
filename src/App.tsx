import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Finance from "./pages/Finance";
import Messages from "./pages/Messages";
import Documents from "./pages/Documents";
import Grades from "./pages/Grades";
import Teachers from "./pages/Teachers";
import Schedules from "./pages/Schedules";
import Semesters from "./pages/Semesters";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// Dashboards spécifiques par rôle
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ProfesseurDashboard from "./pages/dashboards/ProfesseurDashboard";
import EleveDashboard from "./pages/dashboards/EleveDashboard";
import ComptableDashboard from "./pages/dashboards/ComptableDashboard";
import SuperAdmin from "./pages/SuperAdmin";
// Pages spécifiques élèves
import EleveSchedule from "./pages/eleve/EleveSchedule";
import EleveGrades from "./pages/eleve/EleveGrades";
import ElevePayments from "./pages/eleve/ElevePayments";
// Pages spécifiques comptable
import ComptableReports from "./pages/comptable/ComptableReports";
import Bulletins from "@/pages/Bulletins";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<Auth />} />
                {/* Dashboard général (fallback) */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Dashboards spécifiques par rôle */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requireRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/super" element={
                  <ProtectedRoute requireAnyRole={["admin", "super_admin", "superadmin"]}>
                    <SuperAdmin />
                  </ProtectedRoute>
                } />
                <Route path="/professeur/dashboard" element={
                  <ProtectedRoute requireRole="enseignant">
                    <ProfesseurDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/eleve/dashboard" element={
                  <ProtectedRoute requireRole="eleve">
                    <EleveDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/eleve/schedule" element={
                  <ProtectedRoute requireRole="eleve">
                    <EleveSchedule />
                  </ProtectedRoute>
                } />
                <Route path="/eleve/grades" element={
                  <ProtectedRoute requireRole="eleve">
                    <EleveGrades />
                  </ProtectedRoute>
                } />
                <Route path="/eleve/payments" element={
                  <ProtectedRoute requireRole="eleve">
                    <ElevePayments />
                  </ProtectedRoute>
                } />
                <Route path="/comptable/dashboard" element={
                  <ProtectedRoute requireRole="comptable">
                    <ComptableDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/comptable/reports" element={
                  <ProtectedRoute requireRole="comptable">
                    <ComptableReports />
                  </ProtectedRoute>
                } />

                {/* Routes admin (aliases vers les routes existantes) */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requireRole="admin">
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                } />

                {/* Routes existantes (compatibilité) */}
                <Route path="/dashboard/students" element={<Students />} />
                <Route path="/dashboard/classes" element={<Classes />} />
                <Route path="/dashboard/attendance" element={<Attendance />} />
                <Route path="/dashboard/finance" element={<Finance />} />
                <Route path="/dashboard/messages" element={<Messages />} />
                <Route path="/dashboard/documents" element={<Documents />} />
                <Route path="/dashboard/grades" element={<Grades />} />
                <Route path="/dashboard/teachers" element={<Teachers />} />
                <Route
                  path="/dashboard/schedules"
                  element={
                    <ProtectedRoute requirePermission="manage_schedule" fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
                          <p className="text-muted-foreground">Seuls les administrateurs peuvent accéder aux emplois du temps</p>
                        </div>
                      </div>
                    }>
                      <Schedules />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/semesters"
                  element={
                    <ProtectedRoute requirePermission="manage_schedule" fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
                          <p className="text-muted-foreground">Seuls les administrateurs peuvent accéder aux semestres</p>
                        </div>
                      </div>
                    }>
                      <Semesters />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
