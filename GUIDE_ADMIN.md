# Guide de Connexion Admin - ERP Lycée de Koussanar

## 📋 Comment créer un compte administrateur

### Méthode 1: Via l'interface d'inscription (Recommandé)

1. **Ouvrez la page d'inscription** de l'application
2. **Remplissez le formulaire** avec vos informations
3. **Important**: Par défaut, le compte créé aura le rôle `eleve`

### Méthode 2: Via l'API directement (Pour créer un admin)

Si vous avez besoin de créer un compte admin directement, vous pouvez utiliser l'endpoint d'API avec le paramètre `role` :

#### Option A: Utiliser curl ou Postman

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@koussanar.sn",
    "password": "admin123456",
    "nom": "Admin",
    "prenom": "Système",
    "role": "admin"
  }'
```

#### Option B: Utiliser le script Node.js ci-dessous

Créez un fichier `backend/create-admin.js` :

```javascript
import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';

async function createAdmin() {
  try {
    const email = 'admin@koussanar.sn';
    const password = 'admin123456';
    const nom = 'Admin';
    const prenom = 'Système';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    // Check if admin exists
    const [existing] = await pool.execute(
      'SELECT id FROM profiles WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log('❌ Un compte avec cet email existe déjà');
      process.exit(1);
    }

    // Create user
    await pool.execute(
      'INSERT INTO profiles (id, email, password, nom, prenom) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, nom, prenom]
    );

    // Assign admin role
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), userId, 'admin']
    );

    console.log('✅ Compte admin créé avec succès !');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('\n⚠️  Changez le mot de passe après la première connexion !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAdmin();
```

Puis exécutez :
```bash
cd backend
node create-admin.js
```

#### Option C: Via SQL directement

Connectez-vous à MySQL et exécutez :

```sql
-- Créer le profil admin
INSERT INTO profiles (id, email, password, nom, prenom, statut_actif)
VALUES (
  UUID(),
  'admin@koussanar.sn',
  '$2a$10$YourHashedPasswordHere', -- Utilisez bcrypt pour hasher 'admin123456'
  'Admin',
  'Système',
  TRUE
);

-- Récupérer l'ID créé
SET @admin_id = (SELECT id FROM profiles WHERE email = 'admin@koussanar.sn');

-- Assigner le rôle admin
INSERT INTO user_roles (id, user_id, role)
VALUES (UUID(), @admin_id, 'admin');
```

**Note**: Pour générer un mot de passe hashé avec bcrypt, vous pouvez utiliser un outil en ligne ou le script Node.js ci-dessus.

## 🔐 Connexion en tant qu'admin

1. **Ouvrez l'application** dans votre navigateur (http://localhost:8080)
2. **Cliquez sur "Se connecter"**
3. **Entrez vos identifiants** :
   - Email: `admin@koussanar.sn` (ou l'email que vous avez utilisé)
   - Mot de passe: `admin123456` (ou le mot de passe que vous avez défini)
4. **Cliquez sur "Connexion"**

## ✏️ Ajouter un nouvel élève (en tant qu'admin)

Une fois connecté en tant qu'admin :

1. **Allez dans "Élèves"** depuis le menu latéral
2. **Cliquez sur "Nouvel élève"** (bouton en haut à droite)
3. **Remplissez le formulaire** :
   - **Matricule**: Ex: `202523`
   - **Année scolaire**: Ex: `2025-2026`
   - **Nom**: Ex: `Ndao`
   - **Prénom**: Ex: `Ousmane`
   - **Date de naissance**: Cliquez sur le champ et sélectionnez une date dans le calendrier
   - **Lieu de naissance**: Ex: `Koussanar`
   - **Sexe**: Sélectionnez "Masculin" ou "Féminin"
   - **Classe**: Cliquez sur le menu déroulant et sélectionnez une classe
   - **Téléphone**: Ex: `+221773932069`
   - **Statut**: Sélectionnez "Actif", "Inactif" ou "Suspendu"
   - **Adresse**: Optionnel
4. **Cliquez sur "Enregistrer"**

## ⚠️ Notes importantes

- Les champs **Date de naissance** et **Classe** sont maintenant corrigés et fonctionnent correctement
- Assurez-vous que des **classes existent** dans la base de données avant d'ajouter un élève
- Le rôle `admin` vous donne accès à toutes les fonctionnalités de gestion

## 🔧 Dépannage

### Erreur: "Aucune classe disponible"
- Allez dans la section "Classes" et créez au moins une classe
- Exemples: "6ème A", "5ème B", "4ème C", etc.

### Erreur de connexion
- Vérifiez que le backend est démarré (`npm run dev` dans le dossier `backend`)
- Vérifiez les logs du backend pour voir les erreurs éventuelles
- Assurez-vous que la base de données est accessible

### Le calendrier ne s'ouvre pas
- Vérifiez que tous les modules sont installés: `npm install`
- Vérifiez la console du navigateur (F12) pour les erreurs


