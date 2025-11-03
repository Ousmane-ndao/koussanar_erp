# 📚 Système ERP - Lycée de Koussanar

Application complète de gestion administrative, pédagogique et financière pour le Lycée de Koussanar.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Configuration](#configuration)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Système RBAC](#système-rbac)
- [Routing par rôles](#routing-par-rôles)
- [API Backend](#api-backend)
- [Base de données](#base-de-données)
- [Guide d'utilisation](#guide-dutilisation)
- [Dépannage](#dépannage)

## 🎯 Vue d'ensemble

Le Système ERP du Lycée de Koussanar est une solution complète qui permet de :
- Gérer les élèves, enseignants et classes
- Saisir et consulter les notes
- Suivre les présences et absences
- Gérer les paiements et finances
- Communiquer via une messagerie interne
- Partager des documents
- Gérer les emplois du temps

## 🛠 Technologies utilisées

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Langage de programmation
- **Vite** - Build tool et serveur de développement
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Composants UI
- **React Query** - Gestion des données
- **React Router** - Routing
- **Zod** - Validation de schémas
- **date-fns** - Manipulation de dates

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Base de données
- **JWT** - Authentification
- **bcryptjs** - Hashage de mots de passe
- **Multer** - Gestion des fichiers
- **express-validator** - Validation des requêtes

## 📦 Installation

### Prérequis
- Node.js >= 18.x
- MySQL >= 5.7 ou >= 8.0
- npm ou yarn

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone <url-du-repo>
cd kous_erp
```

2. **Installer les dépendances Frontend**
```bash
npm install
```

3. **Installer les dépendances Backend**
```bash
cd backend
npm install
cd ..
```

4. **Configurer la base de données**
   - Créer une base de données MySQL : `koussanar_erp`
   - Configurer les variables d'environnement (voir [Configuration](#configuration))

5. **Appliquer les migrations**
```bash
cd backend
npm run migrate
```

6. **Créer un compte administrateur**
```bash
cd backend
npm run create-admin
```

7. **Démarrer les serveurs**

   **Option 1 : Serveurs séparés**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

   **Option 2 : Script Windows**
   ```bash
   start-dev.bat
   ```

## ⚙️ Configuration

### Variables d'environnement Frontend

Créer un fichier `.env` à la racine du projet :

```env
VITE_API_URL=http://localhost:5000/api
```

### Variables d'environnement Backend

Créer un fichier `.env` dans le dossier `backend/` :

```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=koussanar_erp

# JWT
JWT_SECRET=votre_secret_jwt_aleatoire_et_long
JWT_EXPIRES_IN=7d

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Admin (optionnel)
ADMIN_EMAIL=admin@koussanar.sn
ADMIN_PASSWORD=admin123456
ADMIN_NOM=Admin
ADMIN_PRENOM=Système
```

### Scripts npm Backend

```bash
# Développement avec watch mode
npm run dev

# Production
npm start

# Migration de la base de données
npm run migrate

# Créer un compte admin
npm run create-admin

# Réinitialiser le mot de passe admin
npm run reset-admin

# Vérifier le compte admin
npm run verify-admin

# Corriger le mot de passe admin
npm run fix-admin-password

# Ajouter le rôle admin
npm run add-admin-role

# Créer tous les comptes de test
npm run create-test-users
```

## 📁 Structure du projet

```
kous_erp/
├── backend/                 # Application backend
│   ├── src/
│   │   ├── database/       # Schéma et migrations
│   │   │   ├── schema.sql
│   │   │   ├── db.js
│   │   │   └── migrate.js
│   │   ├── middleware/     # Middlewares Express
│   │   │   ├── auth.js
│   │   │   └── rbac.js
│   │   ├── routes/         # Routes API
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   ├── teachers.js
│   │   │   ├── classes.js
│   │   │   ├── grades.js
│   │   │   ├── attendance.js
│   │   │   ├── finance.js
│   │   │   ├── messages.js
│   │   │   ├── documents.js
│   │   │   └── schedules.js
│   │   ├── utils/          # Utilitaires
│   │   │   ├── uuid.js
│   │   │   └── logger.js
│   │   └── server.js       # Point d'entrée
│   ├── uploads/            # Fichiers uploadés
│   ├── .env                # Variables d'environnement
│   └── package.json
├── src/                     # Application frontend
│   ├── components/         # Composants React
│   │   ├── layout/         # Layout (Sidebar, Header, etc.)
│   │   ├── students/       # Composants élèves
│   │   ├── AuthProvider.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/              # Hooks React
│   │   ├── usePermissions.ts
│   │   └── use-toast.ts
│   ├── lib/                # Bibliothèques et utilitaires
│   │   ├── api.ts          # Client API
│   │   └── utils.ts
│   ├── pages/              # Pages React
│   │   ├── dashboards/     # Dashboards par rôle
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ProfesseurDashboard.tsx
│   │   │   ├── EleveDashboard.tsx
│   │   │   └── ComptableDashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Classes.tsx
│   │   ├── Grades.tsx
│   │   ├── Teachers.tsx
│   │   ├── Attendance.tsx
│   │   ├── Finance.tsx
│   │   ├── Messages.tsx
│   │   ├── Documents.tsx
│   │   ├── Schedules.tsx
│   │   └── SuperAdmin.tsx
│   ├── utils/              # Utilitaires frontend
│   │   └── routing.ts      # Routing par rôles
│   ├── App.tsx             # Composant principal
│   └── main.tsx            # Point d'entrée
├── public/                  # Fichiers statiques
├── .env                     # Variables d'environnement frontend
├── package.json
└── README.md
```

## ✨ Fonctionnalités

### 👨‍💼 Administrateur

- ✅ Gestion complète des utilisateurs (élèves, enseignants)
- ✅ Création et gestion des classes
- ✅ Gestion des matières et emplois du temps
- ✅ Attribution des matières aux professeurs
- ✅ Validation des notes
- ✅ Gestion de la scolarité (paiements)
- ✅ Statistiques : taux de réussite, absences, moyennes
- ✅ Gestion des rôles et permissions
- ✅ Consultation et exportation des rapports PDF
- ✅ Accès Super Admin (maintenance technique)

### 👨‍🏫 Professeur

- ✅ Liste des classes et matières assignées
- ✅ Saisie des notes
- ✅ Gestion des absences/présences
- ✅ Téléversement des supports de cours
- ✅ Consultation du profil des élèves
- ✅ Communication via messagerie interne
- ✅ Impression des relevés et bulletins

### 🧑‍🎓 Élève

- ✅ Consultation de son emploi du temps
- ✅ Visualisation de ses notes et moyennes
- ✅ Suivi de ses absences/retards
- ✅ Téléchargement des cours et devoirs
- ✅ Envoi de travaux rendus
- ✅ Consultation des annonces
- ✅ Paiement ou suivi de la scolarité
- ✅ Messagerie avec professeurs

### 💰 Comptable

- ✅ Gestion des paiements
- ✅ Suivi des échéances
- ✅ Enregistrement des factures
- ✅ Exportation des rapports financiers
- ✅ Consultation limitée des élèves (infos financières uniquement)

## 🔐 Système RBAC (Role-Based Access Control)

Le système RBAC contrôle l'accès aux fonctionnalités selon les rôles des utilisateurs.

### Permissions par rôle

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

### Permissions détaillées

Voir le fichier [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md) pour la liste complète des permissions.

## 🧭 Routing par rôles

Après connexion, les utilisateurs sont automatiquement redirigés vers leur dashboard spécifique :

- **Admin** → `/admin/dashboard`
- **Professeur** → `/professeur/dashboard`
- **Élève** → `/eleve/dashboard`
- **Comptable** → `/comptable/dashboard`
- **Super Admin** → `/admin/super`

Voir le fichier [ROLE_ROUTING_GUIDE.md](./ROLE_ROUTING_GUIDE.md) pour plus de détails.

## 🌐 API Backend

### Endpoints disponibles

#### Authentification (`/api/auth`)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Récupérer l'utilisateur actuel

#### Élèves (`/api/students`)
- `GET /api/students` - Liste des élèves
- `GET /api/students/:id` - Détails d'un élève
- `POST /api/students` - Créer un élève (admin)
- `PUT /api/students/:id` - Modifier un élève (admin)
- `DELETE /api/students/:id` - Supprimer un élève (admin)

#### Enseignants (`/api/teachers`)
- `GET /api/teachers` - Liste des enseignants
- `GET /api/teachers/:id` - Détails d'un enseignant
- `POST /api/teachers` - Créer un enseignant (admin)
- `PUT /api/teachers/:id` - Modifier un enseignant (admin)
- `DELETE /api/teachers/:id` - Supprimer un enseignant (admin)

#### Classes (`/api/classes`)
- `GET /api/classes` - Liste des classes
- `GET /api/classes/:id` - Détails d'une classe
- `POST /api/classes` - Créer une classe
- `PUT /api/classes/:id` - Modifier une classe
- `DELETE /api/classes/:id` - Supprimer une classe (admin)

#### Notes (`/api/grades`)
- `GET /api/grades` - Liste des notes (filtré par rôle)
- `GET /api/grades/:id` - Détails d'une note
- `POST /api/grades` - Créer une note (admin, enseignant)
- `PUT /api/grades/:id` - Modifier une note (admin, enseignant)
- `DELETE /api/grades/:id` - Supprimer une note (admin, enseignant)
- `GET /api/grades/student/:studentId/average` - Moyenne d'un élève

#### Présences (`/api/attendance`)
- `GET /api/attendance/date/:date` - Présences d'une date
- `GET /api/attendance/student/:studentId` - Présences d'un élève
- `POST /api/attendance` - Enregistrer une présence
- `GET /api/attendance/stats/:date` - Statistiques de présence

#### Finance (`/api/finance`)
- `GET /api/finance` - Liste des paiements (admin, comptable)
- `GET /api/finance/student/:studentId` - Paiements d'un élève
- `POST /api/finance` - Créer un paiement (admin, comptable)
- `GET /api/finance/stats/:anneeScolaire` - Statistiques financières

#### Messages (`/api/messages`)
- `GET /api/messages` - Liste des messages
- `GET /api/messages/:id` - Détails d'un message
- `POST /api/messages` - Créer un message (tous les rôles)
- `PUT /api/messages/:id` - Modifier un message
- `DELETE /api/messages/:id` - Supprimer un message

#### Documents (`/api/documents`)
- `GET /api/documents` - Liste des documents
- `GET /api/documents/:id` - Détails d'un document
- `POST /api/documents` - Téléverser un document (FormData)
- `DELETE /api/documents/:id` - Supprimer un document

#### Emplois du temps (`/api/schedules`)
- `GET /api/schedules` - Liste des emplois du temps
- `GET /api/schedules/:id` - Détails d'un emploi du temps
- `POST /api/schedules` - Créer un emploi du temps (admin)
- `PUT /api/schedules/:id` - Modifier un emploi du temps (admin)
- `DELETE /api/schedules/:id` - Supprimer un emploi du temps (admin)

### Authentification

Toutes les routes (sauf `/api/auth/register` et `/api/auth/login`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 🗄️ Base de données

### Tables principales

- **profiles** - Utilisateurs du système
- **user_roles** - Rôles des utilisateurs
- **students** - Élèves
- **teachers** - Enseignants
- **classes** - Classes
- **teacher_classes** - Attribution enseignants/classes
- **grades** - Notes
- **attendance** - Présences
- **payments** - Paiements
- **announcements** - Annonces/Messages
- **documents** - Documents partagés
- **schedules** - Emplois du temps

### Schéma complet

Voir le fichier `backend/src/database/schema.sql` pour le schéma complet de la base de données.

### Migration

Pour appliquer le schéma :

```bash
cd backend
npm run migrate
```

## 📖 Guide d'utilisation

### Comptes de test

Pour créer automatiquement des comptes de test pour tous les rôles :

```bash
cd backend
npm run create-test-users
```

### Identifiants de test par rôle

#### 👨‍💼 Administrateur
- **Email** : `admin@koussanar.sn`
- **Mot de passe** : `admin123456`
- **Accès** : Dashboard admin complet

#### 🔧 Super Administrateur
- **Email** : `superadmin@koussanar.sn`
- **Mot de passe** : `superadmin123`
- **Accès** : Zone technique et maintenance

#### 👨‍🏫 Enseignants

**Professeur de Mathématiques**
- **Email** : `professeur.math@koussanar.sn`
- **Mot de passe** : `prof123456`

**Professeur de Français**
- **Email** : `professeur.francais@koussanar.sn`
- **Mot de passe** : `prof123456`

**Professeur d'Anglais**
- **Email** : `professeur.anglais@koussanar.sn`
- **Mot de passe** : `prof123456`

#### 🧑‍🎓 Élèves

**Élève 1**
- **Email** : `eleve1@koussanar.sn`
- **Mot de passe** : `eleve123456`
- **Matricule** : `ELEV001`

**Élève 2**
- **Email** : `eleve2@koussanar.sn`
- **Mot de passe** : `eleve123456`
- **Matricule** : `ELEV002`

**Élève 3**
- **Email** : `eleve3@koussanar.sn`
- **Mot de passe** : `eleve123456`
- **Matricule** : `ELEV003`

#### 💰 Comptable
- **Email** : `comptable@koussanar.sn`
- **Mot de passe** : `comptable123`
- **Accès** : Gestion financière

#### 👨‍👩‍👧 Parent
- **Email** : `parent@koussanar.sn`
- **Mot de passe** : `parent123456`
- **Accès** : Suivi des enfants

#### 👮 Surveillant
- **Email** : `surveillant@koussanar.sn`
- **Mot de passe** : `surveillant123`
- **Accès** : Surveillance et notes

### Première connexion (Admin)

1. Démarrer le backend : `cd backend && npm run dev`
2. Démarrer le frontend : `npm run dev`
3. Accéder à `http://localhost:8080/login`
4. Se connecter avec :
   - Email: `admin@koussanar.sn`
   - Mot de passe: `admin123456`

### Créer un nouveau compte

#### Via l'interface Admin
1. Se connecter en tant qu'admin
2. Aller dans "Élèves" ou "Enseignants"
3. Cliquer sur "Nouvel élève" ou "Nouveau professeur"
4. Remplir le formulaire

#### Via l'API
```bash
POST /api/auth/register
{
  "email": "nouvel.eleve@koussanar.sn",
  "password": "motdepasse123",
  "nom": "Nom",
  "prenom": "Prénom",
  "role": "eleve"
}
```

### Gérer les classes

1. Se connecter en tant qu'admin
2. Aller dans "Classes"
3. Cliquer sur "Nouvelle classe"
4. Remplir : nom, niveau, filière, effectif max

### Saisir des notes

1. Se connecter en tant qu'admin ou enseignant
2. Aller dans "Notes"
3. Cliquer sur "Nouvelle note"
4. Sélectionner l'élève, la matière, saisir la note
5. Enregistrer

### Gérer les paiements

1. Se connecter en tant qu'admin ou comptable
2. Aller dans "Finances"
3. Cliquer sur "Nouveau paiement"
4. Sélectionner l'élève, le type, le montant
5. Enregistrer

## 🔧 Dépannage

### Problèmes courants

#### Erreur de connexion à la base de données

**Symptômes** : `Access denied` ou `Connection refused`

**Solutions** :
1. Vérifier que MySQL est démarré
2. Vérifier les variables d'environnement dans `backend/.env`
3. Vérifier que la base de données existe :
   ```sql
   CREATE DATABASE IF NOT EXISTS koussanar_erp;
   ```

#### Erreur de migration

**Symptômes** : `npm run migrate` échoue

**Solutions** :
1. Vérifier que la base de données existe
2. Vérifier les permissions MySQL
3. Vérifier la version de MySQL (certaines versions ne supportent pas CHECK constraints)

#### Erreur de connexion au backend

**Symptômes** : `Network Error` dans le frontend

**Solutions** :
1. Vérifier que le backend est démarré (`npm run dev` dans `backend/`)
2. Vérifier que `VITE_API_URL` dans `.env` est correct
3. Vérifier que le port 5000 n'est pas utilisé par un autre service

#### Erreur d'authentification

**Symptômes** : "Mot de passe incorrect" même avec les bons identifiants

**Solutions** :
1. Réinitialiser le mot de passe admin :
   ```bash
   cd backend
   npm run reset-admin
   ```
2. Vérifier le rôle admin :
   ```bash
   cd backend
   npm run verify-admin
   ```

#### Erreur "Permission denied"

**Symptômes** : Accès refusé à certaines pages

**Solutions** :
1. Vérifier que l'utilisateur a le bon rôle
2. Vérifier les permissions dans la table `user_roles`
3. Se reconnecter pour rafraîchir les permissions

### Logs et débogage

#### Frontend

Les erreurs sont affichées dans :
- Console du navigateur (F12)
- Écran d'erreur si ErrorBoundary est déclenché

#### Backend

Les erreurs sont loggées dans :
- Console du terminal
- Fichier de logs (si configuré)

Activer le mode développement pour plus de détails :
```env
NODE_ENV=development
```

### Commandes utiles

```bash
# Vérifier la connexion à la base de données
cd backend
npm run check-db

# Créer un admin
cd backend
npm run create-admin

# Vérifier un compte admin
cd backend
npm run verify-admin

# Réinitialiser le mot de passe admin
cd backend
npm run reset-admin
```

## 📚 Documentation supplémentaire

- [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md) - Documentation du système RBAC
- [ROLE_ROUTING_GUIDE.md](./ROLE_ROUTING_GUIDE.md) - Guide du routing par rôles
- [COMPTES_TEST.md](./COMPTES_TEST.md) - Liste complète des comptes de test
- [INSTALLATION.md](./INSTALLATION.md) - Instructions d'installation détaillées
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guide de dépannage frontend
- [DIAGNOSTIC.md](./DIAGNOSTIC.md) - Guide de diagnostic des erreurs

## 🤝 Contribution

Pour contribuer au projet :

1. Créer une branche pour votre fonctionnalité
2. Faire vos modifications
3. Tester soigneusement
4. Créer une pull request

## 📝 Licence

Ce projet est propriétaire du Lycée de Koussanar.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur le dépôt
- Contacter l'équipe de développement

## 🎉 Remerciements

Merci d'utiliser le Système ERP du Lycée de Koussanar !

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024
