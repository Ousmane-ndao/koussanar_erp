# Système de Permissions RBAC - Lycée de Koussanar

Ce document décrit le système de contrôle d'accès basé sur les rôles (RBAC) implémenté dans l'ERP du Lycée de Koussanar.

## Vue d'ensemble

Le système RBAC garantit que chaque utilisateur ne peut accéder qu'aux données et fonctionnalités autorisées selon son rôle.

## Rôles et Permissions

### 👨‍🎓 Élève

**Accès limité à ses propres données uniquement.**

#### Permissions
- ✅ `view_own_profile` - Voir ses informations personnelles
- ✅ `view_own_grades` - Consulter ses propres notes
- ✅ `view_own_schedule` - Voir son emploi du temps
- ✅ `view_own_attendance` - Voir ses absences et retards
- ✅ `view_own_payments` - Voir ses propres paiements (lecture seule)
- ✅ `send_message` - Envoyer des messages
- ✅ `download_own_reports` - Télécharger ses bulletins
- ✅ `view_documents` - Voir les documents

#### Restrictions
- ❌ **NE PEUT RIEN MODIFIER** - Aucune permission de modification
- ❌ Ne peut pas voir les données d'autres élèves
- ❌ Ne peut pas consulter les notes d'autres élèves
- ❌ Ne peut pas modifier les présences
- ❌ Ne peut pas saisir de notes

#### Accès aux données
- **Notes** : Uniquement ses propres notes (filtrées par `student_id = user_id`)
- **Paiements** : Uniquement ses propres paiements
- **Présences** : Uniquement ses propres présences
- **Emploi du temps** : Celui de sa classe
- **Classes** : Non accessible (aucune classe visible sauf via son profil)

---

### 👨‍🏫 Professeur

**Accès étendu mais contrôlé - seulement ses classes et matières.**

#### Permissions
- ✅ `enter_grades` - Saisir les notes (dans ses matières seulement)
- ✅ `view_grades` - Consulter les notes (de ses classes seulement)
- ✅ `view_own_classes` - Voir ses classes assignées
- ✅ `view_own_students` - Voir les élèves de ses classes
- ✅ `manage_attendance` - Enregistrer les présences (de ses classes seulement)
- ✅ `send_message` - Envoyer un message
- ✅ `download_reports` - Télécharger les bulletins
- ✅ `upload_documents` - Téléverser des documents

#### Restrictions
- ❌ Ne peut pas créer/modifier/supprimer des classes
- ❌ Ne peut pas voir les élèves d'autres classes (sauf admin)
- ❌ Ne peut pas saisir de notes pour des matières qu'il n'enseigne pas
- ❌ Ne peut pas modifier les notes d'autres professeurs (sauf admin)
- ❌ Ne peut pas enregistrer des présences pour des élèves d'autres classes

#### Accès aux données
- **Notes** : 
  - Peut voir uniquement les notes de ses classes
  - Peut saisir/modifier uniquement les notes dans ses matières assignées
  - Vérification via `teacher_classes` (classe_id, matiere)
- **Élèves** : Uniquement les élèves de ses classes assignées
- **Classes** : Uniquement ses classes assignées (via `teacher_classes`)
- **Présences** : 
  - Peut voir uniquement les présences de ses classes
  - Peut enregistrer uniquement pour ses classes
- **Emploi du temps** : Celui de ses classes (via `schedules` avec `classe_id`)

---

### 👨‍💼 Administrateur

**Accès total au système.**

#### Permissions
- ✅ `manage_users` - Gérer les utilisateurs (créer, modifier, supprimer)
- ✅ `enter_grades` - Saisir les notes (toutes les matières)
- ✅ `view_grades` - Consulter toutes les notes
- ✅ `manage_payments` - Gérer les paiements
- ✅ `view_payments` - Voir tous les paiements
- ✅ `manage_schedule` - Ajouter/modifier les emplois du temps
- ✅ `send_message` - Envoyer des messages
- ✅ `download_reports` - Télécharger tous les bulletins
- ✅ `manage_documents` - Gérer tous les documents

#### Accès
- **Accès complet** à toutes les données et fonctionnalités
- **Pas de filtres** appliqués (voit tout)
- **Peut tout modifier** (sauf contraintes techniques)

---

### 💰 Comptable

**Accès limité à la gestion financière.**

#### Permissions
- ✅ `manage_payments` - Gérer les paiements
- ✅ `view_payments` - Voir tous les paiements
- ✅ `send_message` - Envoyer des messages
- ✅ `view_students_finance_only` - Voir les élèves (pour les paiements uniquement)

#### Restrictions
- ❌ Ne peut pas gérer les notes
- ❌ Ne peut pas gérer les classes
- ❌ Ne peut pas gérer les présences
- ❌ Accès limité aux données financières

---

## Filtrage des données par rôle

### Route `/api/students`

| Rôle | Filtre appliqué |
|------|----------------|
| **Élève** | `WHERE student.user_id = req.user.id` (uniquement lui-même) |
| **Professeur** | `WHERE student.classe_id IN (classes_du_professeur)` |
| **Admin** | Aucun filtre (voit tout) |

### Route `/api/grades`

| Rôle | Filtre appliqué |
|------|----------------|
| **Élève** | `WHERE grade.student_id = (student_id_de_l_eleve)` |
| **Professeur** | `WHERE student.classe_id IN (classes_du_professeur) AND grade.matiere IN (matieres_du_professeur)` |
| **Admin** | Aucun filtre (voit tout) |

**Note importante pour les professeurs** :
- Lors de la création/modification d'une note, vérification que `teacher_classes` contient `(teacher_id, classe_id, matiere)`
- Un professeur ne peut modifier que les notes qu'il a créées (sauf admin)

### Route `/api/attendance`

| Rôle | Filtre appliqué |
|------|----------------|
| **Élève** | `WHERE attendance.student_id = (student_id_de_l_eleve)` |
| **Professeur** | `WHERE student.classe_id IN (classes_du_professeur)` |
| **Admin** | Aucun filtre (voit tout) |

**Note importante** :
- Seuls les admin et professeurs peuvent enregistrer/modifier les présences
- Un professeur ne peut enregistrer que pour ses classes

### Route `/api/classes`

| Rôle | Filtre appliqué |
|------|----------------|
| **Élève** | Non accessible |
| **Professeur** | `WHERE classe.id IN (classes_du_professeur)` |
| **Admin** | Aucun filtre (voit tout) |

**Note importante** :
- Seuls les admin peuvent créer/modifier/supprimer des classes

---

## Implémentation technique

### Backend (`backend/src/middleware/rbac.js`)

- `requirePermission(permission)` - Vérifie qu'un utilisateur a une permission spécifique
- `requireAnyPermission(...permissions)` - Vérifie qu'un utilisateur a au moins une des permissions
- `getUserPermissions(userId)` - Récupère toutes les permissions d'un utilisateur

### Frontend (`src/hooks/usePermissions.ts`)

- `usePermissions()` - Hook React pour vérifier les permissions
- `hasPermission(permission)` - Vérifie une permission
- `hasAnyPermission(...permissions)` - Vérifie au moins une permission
- `hasRole(role)` - Vérifie un rôle
- `hasAnyRole(...roles)` - Vérifie au moins un rôle

### Composant de protection (`src/components/ProtectedRoute.tsx`)

Protège les routes selon les permissions/rôles :
```tsx
<ProtectedRoute requirePermission="manage_users">
  <AdminPage />
</ProtectedRoute>
```

---

## Table de relation : `teacher_classes`

Cette table lie les professeurs à leurs classes et matières :

```sql
teacher_classes:
  - teacher_id (FK -> teachers.id)
  - classe_id (FK -> classes.id)
  - matiere (VARCHAR) - Nom de la matière enseignée
```

**Exemple** :
- Professeur X enseigne "Mathématiques" à la classe "3ème A"
- Professeur X enseigne "Physique" à la classe "3ème A"
- Professeur X enseigne "Mathématiques" à la classe "2ème B"

→ 3 lignes dans `teacher_classes`

---

## Sécurité

### Protection Backend

Toutes les routes sont protégées par :
1. **Authentification** : `authenticateToken` middleware
2. **Permissions** : Vérification via `requirePermission` ou logique personnalisée
3. **Filtrage** : Les données sont filtrées selon le rôle avant d'être retournées

### Protection Frontend

- Les boutons d'action sont masqués si l'utilisateur n'a pas la permission
- Les routes sont protégées par `ProtectedRoute`
- Les données filtrées côté backend sont affichées telles quelles

---

## Tests de sécurité

Pour tester que le système fonctionne correctement :

1. **Connexion en tant qu'élève** :
   - Vérifier qu'il ne voit que ses propres notes
   - Vérifier qu'il ne peut pas accéder à `/dashboard/grades` avec des boutons de modification
   - Vérifier qu'il ne peut pas modifier ses présences

2. **Connexion en tant que professeur** :
   - Vérifier qu'il ne voit que ses classes assignées
   - Vérifier qu'il ne peut saisir des notes que dans ses matières
   - Vérifier qu'il ne peut pas créer de classes

3. **Connexion en tant qu'admin** :
   - Vérifier qu'il voit tout
   - Vérifier qu'il peut tout modifier

---

## Mise à jour des permissions

Pour ajouter/modifier des permissions :

1. Modifier `backend/src/middleware/rbac.js` :
   ```javascript
   const ROLE_PERMISSIONS = {
     role_name: [
       'permission1',
       'permission2',
       // ...
     ],
   };
   ```

2. Utiliser la permission dans les routes :
   ```javascript
   router.post('/', authenticateToken, requirePermission('permission1'), handler);
   ```

3. Utiliser la permission dans le frontend :
   ```tsx
   const { hasPermission } = usePermissions();
   if (hasPermission('permission1')) {
     // Afficher le bouton
   }
   ```

---

## Notes importantes

⚠️ **Les élèves ne peuvent RIEN modifier** - C'est une règle fondamentale de sécurité.

⚠️ **Les professeurs sont limités à leurs classes/matières** - Même avec la permission `enter_grades`, un professeur ne peut saisir des notes que pour les matières qu'il enseigne dans les classes qui lui sont assignées.

✅ **Le backend fait toujours la vérification finale** - Même si le frontend masque les boutons, le backend vérifie toujours les permissions avant d'exécuter une action.




















