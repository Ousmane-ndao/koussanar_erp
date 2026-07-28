# Guide du Système de Routing par Rôles

## Vue d'ensemble

Le système de routing par rôles redirige automatiquement les utilisateurs vers leur dashboard spécifique après connexion, selon leur rôle dans l'application.

## Routes par rôle

### 👨‍💼 Administrateur (Admin)
- **Page de connexion**: `/login` ou `/auth`
- **Route après connexion**: `/admin/dashboard`
- **Route Super Admin**: `/admin/super` (pour les super administrateurs)

**Fonctionnalités disponibles**:
- Gestion des utilisateurs (élèves, enseignants)
- Création de classes, matières, emplois du temps
- Validation des notes
- Gestion de la scolarité (paiements)
- Statistiques et rapports
- Exportation PDF

### 👨‍🏫 Professeur (Enseignant)
- **Page de connexion**: `/login` ou `/auth`
- **Route après connexion**: `/professeur/dashboard`

**Fonctionnalités disponibles**:
- Liste des classes et matières assignées
- Saisie des notes
- Gestion des absences/présences
- Téléversement des supports de cours
- Consultation du profil des élèves
- Messagerie interne
- Impression des relevés et bulletins

### 🧑‍🎓 Élève
- **Page de connexion**: `/login` ou `/auth`
- **Route après connexion**: `/eleve/dashboard`

**Fonctionnalités disponibles**:
- Consultation de son emploi du temps
- Visualisation de ses notes et moyennes
- Suivi de ses absences/retards
- Téléchargement des cours et devoirs
- Envoi de travaux rendus
- Consultation des annonces
- Paiement ou suivi de la scolarité
- Messagerie avec professeurs

### 💰 Comptable
- **Page de connexion**: `/login` ou `/auth`
- **Route après connexion**: `/comptable/dashboard`

**Fonctionnalités disponibles**:
- Gestion des paiements
- Suivi des échéances
- Enregistrement des factures
- Exportation des rapports financiers
- Consultation limitée des élèves (infos financières uniquement)

### 🔧 Super Administrateur
- **Page d'accès**: `/admin/super`
- **Authentification**: Accès via rôle `super_admin` ou `superadmin`

**Fonctionnalités disponibles**:
- Sauvegarde de la base de données
- Vérification de l'intégrité
- Logs système
- Paramètres système avancés
- Maintenance technique

## Implémentation technique

### Fonction utilitaire `getDashboardRoute()`

La fonction `getDashboardRoute()` dans `src/utils/routing.ts` détermine la route de redirection selon les rôles de l'utilisateur :

```typescript
export const getDashboardRoute = (roles: string[]): string => {
  if (roles.includes('super_admin') || roles.includes('superadmin')) {
    return '/admin/super';
  }
  if (roles.includes('admin')) {
    return '/admin/dashboard';
  }
  if (roles.includes('enseignant') || roles.includes('professeur')) {
    return '/professeur/dashboard';
  }
  if (roles.includes('eleve') || roles.includes('student')) {
    return '/eleve/dashboard';
  }
  if (roles.includes('comptable')) {
    return '/comptable/dashboard';
  }
  // Par défaut
  return '/dashboard';
};
```

### Redirection après connexion

Dans `src/pages/Auth.tsx`, après une connexion réussie :

```typescript
const response = await api.login(loginEmail, loginPassword);
setUser(response.user);
const dashboardRoute = getDashboardRoute(response.user.roles || []);
navigate(dashboardRoute);
```

### Routes protégées

Toutes les routes de dashboard sont protégées avec le composant `ProtectedRoute` :

```typescript
<Route path="/admin/dashboard" element={
  <ProtectedRoute requireRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### Sidebar adaptative

La sidebar (`src/components/layout/Sidebar.tsx`) s'adapte automatiquement selon le rôle :
- Les éléments du menu sont filtrés selon les permissions
- Le premier élément pointe vers le dashboard spécifique au rôle
- Seuls les éléments accessibles sont affichés

## Migration depuis l'ancien système

Si vous avez des liens vers `/dashboard`, ils continueront de fonctionner mais redirigeront automatiquement vers le dashboard approprié selon le rôle de l'utilisateur connecté.

## Notes importantes

1. **Route `/login`**: Redirige vers `/auth` pour maintenir la compatibilité
2. **Route `/dashboard`**: Route générique toujours disponible (fallback)
3. **Protection des routes**: Toutes les routes spécifiques aux rôles sont protégées
4. **Permissions**: Le système RBAC vérifie les permissions avant d'afficher les fonctionnalités

## Tests

Pour tester le système :

1. **Admin**:
   - Connectez-vous avec un compte admin
   - Vous devriez être redirigé vers `/admin/dashboard`
   - Le menu devrait afficher toutes les fonctionnalités admin

2. **Professeur**:
   - Connectez-vous avec un compte enseignant
   - Vous devriez être redirigé vers `/professeur/dashboard`
   - Le menu devrait afficher seulement les fonctionnalités professeur

3. **Élève**:
   - Connectez-vous avec un compte élève
   - Vous devriez être redirigé vers `/eleve/dashboard`
   - Le menu devrait afficher seulement les fonctionnalités élève

4. **Comptable**:
   - Connectez-vous avec un compte comptable
   - Vous devriez être redirigé vers `/comptable/dashboard`
   - Le menu devrait afficher seulement les fonctionnalités comptable




















