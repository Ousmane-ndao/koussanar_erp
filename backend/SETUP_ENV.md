# Configuration du fichier .env

## Problème détecté

Le fichier `.env` est manquant dans le dossier `backend/`. C'est pourquoi vous obtenez l'erreur :
```
Access denied for user 'root'@'localhost' (using password: NO)
```

## Solution

### 1. Créez le fichier `.env` dans le dossier `backend/`

Copiez le fichier `.env.example` ou créez un nouveau fichier `.env` avec ce contenu :

```env
# Configuration MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=koussanar_erp
DB_PORT=3306

# JWT Configuration
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Server
PORT=5000
NODE_ENV=development
```

### 2. Remplacez les valeurs suivantes :

- **DB_PASSWORD** : Votre mot de passe MySQL (si vous n'avez pas de mot de passe, laissez vide `DB_PASSWORD=` mais MySQL doit être configuré sans mot de passe)
- **JWT_SECRET** : Une chaîne aléatoire sécurisée pour signer les tokens JWT (changez-la en production)

### 3. Exemples selon votre configuration MySQL

#### Si MySQL a un mot de passe :
```env
DB_PASSWORD=MonMotDePasse123
```

#### Si MySQL n'a pas de mot de passe (peu recommandé) :
```env
DB_PASSWORD=
```

#### Si vous utilisez XAMPP avec le mot de passe par défaut :
```env
DB_PASSWORD=
# ou laissez vide si pas de mot de passe
```

### 4. Vérifiez la connexion

Après avoir créé le fichier `.env`, testez la connexion :

```bash
cd backend
npm run check-db
```

### 5. Créez la base de données (si nécessaire)

Si la base de données n'existe pas, créez-la :

```sql
CREATE DATABASE koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ou via la ligne de commande MySQL :

```bash
mysql -u root -p -e "CREATE DATABASE koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 6. Lancez la migration

```bash
npm run migrate
```

## Vérification rapide

Pour vérifier que votre fichier `.env` est bien configuré, le script `check-db` vous dira :
- ✓ Si MySQL est accessible
- ✓ Si la base de données existe
- ✓ Si la connexion fonctionne


