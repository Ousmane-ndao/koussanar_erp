# 📋 Comptes de Test - Système ERP Koussanar

Ce document liste tous les comptes de test disponibles pour tester l'application avec différents rôles.

## 🚀 Création des comptes de test

Pour créer automatiquement tous les comptes de test :

```bash
cd backend
npm run create-test-users
```

Cette commande créera tous les comptes listés ci-dessous. Si un compte existe déjà, il sera ignoré mais son rôle sera vérifié.

## 📧 Identifiants par rôle

### 👨‍💼 Administrateur

| Email | Mot de passe | Description |
|-------|--------------|-------------|
| `admin@koussanar.sn` | `admin123456` | Administrateur principal |

**Fonctionnalités** :
- Gestion complète des utilisateurs
- Création de classes et emplois du temps
- Validation des notes
- Gestion financière
- Statistiques et rapports
- Accès Super Admin

---

### 🔧 Super Administrateur

| Email | Mot de passe | Description |
|-------|--------------|-------------|
| `superadmin@koussanar.sn` | `superadmin123` | Super administrateur technique |

**Fonctionnalités** :
- Toutes les fonctionnalités admin
- Accès zone technique (`/admin/super`)
- Sauvegarde de la base de données
- Vérification de l'intégrité
- Logs système
- Paramètres système avancés

---

### 👨‍🏫 Enseignants

| Email | Mot de passe | Spécialité |
|-------|--------------|------------|
| `professeur.math@koussanar.sn` | `prof123456` | Mathématiques |
| `professeur.francais@koussanar.sn` | `prof123456` | Français |
| `professeur.anglais@koussanar.sn` | `prof123456` | Anglais |

**Fonctionnalités** :
- Liste des classes assignées
- Saisie des notes
- Gestion des présences
- Téléversement de documents
- Consultation des profils élèves
- Messagerie
- Impression des bulletins

---

### 🧑‍🎓 Élèves

| Email | Mot de passe | Matricule | Description |
|-------|--------------|-----------|-------------|
| `eleve1@koussanar.sn` | `eleve123456` | ELEV001 | Élève - Terminale S |
| `eleve2@koussanar.sn` | `eleve123456` | ELEV002 | Élève - Première L |
| `eleve3@koussanar.sn` | `eleve123456` | ELEV003 | Élève - Seconde A |

**Fonctionnalités** :
- Consultation de l'emploi du temps
- Visualisation des notes et moyennes
- Suivi des absences
- Téléchargement des documents
- Envoi de travaux
- Consultation des annonces
- Suivi des paiements
- Messagerie

---

### 💰 Comptable

| Email | Mot de passe | Description |
|-------|--------------|-------------|
| `comptable@koussanar.sn` | `comptable123` | Comptable principal |

**Fonctionnalités** :
- Gestion des paiements
- Suivi des échéances
- Enregistrement des factures
- Exportation des rapports financiers
- Consultation des informations financières des élèves

---

### 👨‍👩‍👧 Parent

| Email | Mot de passe | Description |
|-------|--------------|-------------|
| `parent@koussanar.sn` | `parent123456` | Parent d'élève |

**Fonctionnalités** :
- Consultation des notes des enfants
- Suivi des paiements
- Consultation des bulletins
- Messagerie avec les professeurs

---

### 👮 Surveillant

| Email | Mot de passe | Description |
|-------|--------------|-------------|
| `surveillant@koussanar.sn` | `surveillant123` | Surveillant général |

**Fonctionnalités** :
- Consultation des notes
- Messagerie

---

## 🔐 Sécurité des comptes de test

⚠️ **Important** : Ces comptes sont destinés uniquement à des fins de test et de développement. 

**En production** :
- Changez TOUS les mots de passe par défaut
- Utilisez des mots de passe forts et uniques
- Activez l'authentification à deux facteurs si disponible
- Supprimez ou désactivez les comptes de test

## 🧪 Tests recommandés

### Test du système RBAC

1. **Connectez-vous avec chaque rôle** et vérifiez que :
   - Les redirections fonctionnent correctement
   - Le menu s'adapte selon les permissions
   - Les pages inaccessibles affichent un message d'erreur

2. **Testez les permissions** :
   - Élève ne peut pas créer de notes
   - Professeur peut saisir des notes
   - Admin peut tout faire

### Test des fonctionnalités

1. **Admin** :
   - Créer une classe
   - Créer un élève
   - Créer un professeur
   - Créer un emploi du temps

2. **Professeur** :
   - Saisir des notes
   - Voir les classes assignées
   - Gérer les présences

3. **Élève** :
   - Voir ses notes
   - Voir son emploi du temps
   - Voir ses paiements

4. **Comptable** :
   - Enregistrer un paiement
   - Voir les statistiques financières

## 🔄 Réinitialisation des comptes

Si vous devez réinitialiser les comptes de test :

```bash
cd backend
npm run create-test-users
```

Cette commande est idempotente : elle créera les comptes manquants et ignorera ceux qui existent déjà.

## 📝 Personnalisation

Pour créer vos propres comptes de test, modifiez le fichier `backend/create-test-users.js` et ajoutez vos entrées dans le tableau `testUsers`.

Exemple :
```javascript
{
  email: 'votre.email@koussanar.sn',
  password: 'votremotdepasse',
  nom: 'Votre Nom',
  prenom: 'Votre Prénom',
  role: 'admin', // ou 'enseignant', 'eleve', etc.
  description: 'Description du compte'
}
```

Ensuite, exécutez :
```bash
cd backend
npm run create-test-users
```

## 🆘 Problèmes courants

### "Email already exists"

C'est normal ! Le script ignore les comptes qui existent déjà. Pour forcer la réinitialisation, supprimez manuellement les comptes dans la base de données ou modifiez le script.

### "Rôle non assigné"

Si un compte existe mais n'a pas de rôle, le script tentera d'ajouter le rôle manquant automatiquement.

### Mots de passe incorrects

Si vous avez modifié un mot de passe et oubliez, vous pouvez :
1. Le réinitialiser via le script `reset-admin.js` (pour admin)
2. Le modifier directement dans la base de données
3. Recréer le compte via `create-test-users.js`

---

**Note** : Gardez ce document à jour si vous ajoutez de nouveaux comptes de test !

