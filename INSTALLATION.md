# Guide d'Installation - ERP Lycée de Koussanar

## Prérequis

- Node.js (version 18 ou supérieure)
- MySQL (version 8.0 ou supérieure)
- npm ou yarn

## Installation

### 1. Installation des dépendances

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Configuration de la base de données

1. Créez une base de données MySQL :
```sql
CREATE DATABASE koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Configurez les variables d'environnement du backend :
```bash
cd backend
cp .env.example .env
```

3. Modifiez le fichier `.env` avec vos informations :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=koussanar_erp
DB_PORT=3306
JWT_SECRET=votre_secret_jwt_tres_securise
```

4. Exécutez les migrations pour créer les tables :
```bash
cd backend
npm run migrate
```

Ou exécutez manuellement le fichier SQL :
```bash
mysql -u root -p koussanar_erp < src/database/schema.sql
```

### 3. Configuration du frontend

1. Créez le fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

2. Vérifiez que l'URL de l'API est correcte :
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Démarrage de l'application

#### Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Le serveur backend sera disponible sur `http://localhost:5000`

#### Frontend (Terminal 2)
```bash
npm run dev
```

L'application frontend sera disponible sur `http://localhost:5173`

## Utilisation

1. Accédez à l'application via votre navigateur : `http://localhost:5173`
2. Créez un compte administrateur via la page d'inscription
3. Connectez-vous avec vos identifiants
4. Commencez à utiliser l'application !

## Structure du projet

```
kous_erp/
├── src/                    # Code source frontend
│   ├── components/         # Composants React
│   ├── pages/             # Pages de l'application
│   └── lib/               # Utilitaires et API client
├── backend/               # Code source backend
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── database/      # Configuration DB et migrations
│   │   └── middleware/    # Middleware d'authentification
└── package.json           # Dépendances frontend
```

## Fonctionnalités

- ✅ Gestion des élèves
- ✅ Gestion des enseignants
- ✅ Gestion des classes
- ✅ Gestion des présences
- ✅ Gestion des notes
- ✅ Gestion financière
- ✅ Messagerie et annonces
- ✅ Gestion documentaire

## Support

Pour toute question ou problème, veuillez consulter la documentation ou contacter le support technique.


