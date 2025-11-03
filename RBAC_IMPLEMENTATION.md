# Système RBAC (Role-Based Access Control) - Documentation

## Vue d'ensemble

Le système RBAC a été implémenté pour contrôler l'accès aux fonctionnalités selon les rôles des utilisateurs.

## Permissions par rôle

| Fonctionnalité | Admin | Professeur | Élève | Comptable |
|----------------|-------|------------|-------|-----------|
| Gérer les utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Saisir les notes | ✅ | ✅ | ❌ | ❌ |
| Consulter ses notes | ✅ | ✅ | ✅ | ❌ |
| Gérer les paiements | ✅ | ❌ | ❌ | ✅ |
| Voir ses paiements (lecture) | ✅ | ❌ | ✅ | ✅ |
| Ajouter un emploi du temps | ✅ | ❌ | ❌ | ❌ |
| Envoyer un message | ✅ | ✅ | ✅ | ✅ |
| Télécharger les bulletins | ✅ | ✅ | ✅ | ❌ |

## Permissions détaillées

### Admin
- `manage_users` - Gérer les utilisateurs (créer, modifier, supprimer)
- `enter_grades` - Saisir les notes
- `view_grades` - Consulter les notes
- `manage_payments` - Gérer les paiements
- `view_payments` - Voir les paiements
- `manage_schedule` - Ajouter/modifier les emplois du temps
- `send_message` - Envoyer des messages
- `download_reports` - Télécharger les bulletins
- `manage_documents` - Gérer tous les documents

### Enseignant (enseignant)
- `enter_grades` - Saisir les notes
- `view_grades` - Consulter les notes
- `send_message` - Envoyer des messages
- `download_reports` - Télécharger les bulletins
- `upload_documents` - Téléverser des documents

### Élève (eleve)
- `view_own_grades` - Consulter ses propres notes
- `view_own_payments` - Voir ses propres paiements (lecture)
- `send_message` - Envoyer des messages
- `download_own_reports` - Télécharger ses bulletins
- `view_documents` - Voir les documents

### Comptable
- `manage_payments` - Gérer les paiements
- `view_payments` - Voir les paiements
- `send_message` - Envoyer des messages

### Parent
- `view_child_grades` - Voir les notes de son enfant
- `view_child_payments` - Voir les paiements de son enfant
- `send_message` - Envoyer des messages
- `download_child_reports` - Télécharger les bulletins de son enfant

### Surveillant
- `view_grades` - Consulter les notes
- `send_message` - Envoyer des messages

## Implémentation Backend

### Middleware RBAC
- **Fichier**: `backend/src/middleware/rbac.js`
- **Fonctions**:
  - `requirePermission(permission)` - Vérifie une permission spécifique
  - `requireAnyPermission(...permissions)` - Vérifie au moins une permission
  - `requireOwnershipOrPermission(resourceType)` - Vérifie l'accès aux données propres
  - `getUserPermissions(userId)` - Retourne toutes les permissions d'un utilisateur

### Routes protégées

#### Students (`/api/students`)
- `GET /` - Tous les utilisateurs authentifiés
- `POST /` - `manage_users` (admin uniquement)
- `PUT /:id` - `manage_users` (admin uniquement)
- `DELETE /:id` - `manage_users` (admin uniquement)

#### Grades (`/api/grades`)
- `GET /` - Filtré par rôle (élèves voient seulement leurs notes)
- `POST /` - `enter_grades` (admin, enseignant)
- `PUT /:id` - `enter_grades` (admin, enseignant)
- `DELETE /:id` - `enter_grades` (admin, enseignant)

#### Finance (`/api/finance`)
- `GET /` - `manage_payments` ou `view_payments` (admin, comptable)
- `GET /student/:studentId` - Les élèves peuvent voir leurs propres paiements
- `POST /` - `manage_payments` (admin, comptable)

#### Schedules (`/api/schedules`)
- `GET /` - Tous les utilisateurs authentifiés
- `POST /` - `manage_schedule` (admin uniquement)
- `PUT /:id` - `manage_schedule` (admin uniquement)
- `DELETE /:id` - `manage_schedule` (admin uniquement)

#### Messages (`/api/messages`)
- `GET /` - Tous les utilisateurs authentifiés
- `POST /` - `send_message` (tous les rôles)

## Implémentation Frontend

### Hook usePermissions
- **Fichier**: `src/hooks/usePermissions.ts`
- **Fonctions**:
  - `hasPermission(permission)` - Vérifie une permission
  - `hasAnyPermission(...permissions)` - Vérifie au moins une permission
  - `hasRole(role)` - Vérifie un rôle
  - `hasAnyRole(...roles)` - Vérifie au moins un rôle
  - `isAdmin()` - Vérifie si l'utilisateur est admin

### Composant ProtectedRoute
- **Fichier**: `src/components/ProtectedRoute.tsx`
- **Props**:
  - `requirePermission` - Permission requise
  - `requireAnyPermission` - Au moins une permission
  - `requireRole` - Rôle requis
  - `requireAnyRole` - Au moins un rôle
  - `fallback` - Composant à afficher si accès refusé

### Pages protégées

#### Sidebar
Les éléments du menu sont filtrés selon les permissions :
- **Élèves** - Nécessite `manage_users` (masqué pour élèves)
- **Enseignants** - Nécessite `manage_users` (masqué pour élèves)
- **Emplois du temps** - Nécessite `manage_schedule` (admin uniquement)
- **Finances** - Nécessite `manage_payments`, `view_payments` ou `view_own_payments`
- **Messages** - Nécessite `send_message` (tous les rôles)

#### Pages
- **Students** - Le bouton "Nouvel élève" et les actions d'édition/suppression sont masqués si l'utilisateur n'a pas `manage_users`
- **Schedules** - La route est protégée par `requirePermission("manage_schedule")`

## Base de données

### Table `schedules`
Une nouvelle table a été ajoutée pour gérer les emplois du temps :

```sql
CREATE TABLE IF NOT EXISTS schedules (
  id VARCHAR(36) PRIMARY KEY,
  classe_id VARCHAR(36) NOT NULL,
  jour ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi') NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  matiere VARCHAR(100) NOT NULL,
  teacher_id VARCHAR(36),
  salle VARCHAR(50),
  annee_scolaire VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);
```

## Migration

Pour appliquer les changements de la base de données :

```bash
cd backend
npm run migrate
```

## Tests

Pour tester le système RBAC :

1. **Créer un compte admin** :
   ```bash
   cd backend
   npm run create-admin
   ```

2. **Vérifier les permissions d'un utilisateur** :
   - Connectez-vous avec différents comptes
   - Vérifiez que les éléments du menu sont filtrés
   - Vérifiez que les boutons d'action sont masqués selon les permissions

3. **Tester les routes API** :
   - Essayez d'accéder à `/api/students` avec un compte élève (devrait fonctionner en lecture seule)
   - Essayez de créer un étudiant avec un compte élève (devrait échouer avec 403)

## Notes importantes

- Les permissions sont chargées automatiquement lors de la connexion et stockées dans le contexte utilisateur
- Le middleware backend vérifie les permissions à chaque requête
- Les filtres de données sont appliqués automatiquement (ex: élèves voient seulement leurs notes)
- La sidebar est mise à jour dynamiquement selon les permissions de l'utilisateur connecté

