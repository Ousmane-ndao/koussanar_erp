# Guide de Migration de Base de Données

## Problèmes courants et solutions

### Erreur : "ER_ACCESS_DENIED_ERROR"
**Cause :** Mauvais identifiants MySQL  
**Solution :** Vérifiez votre fichier `.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=koussanar_erp
```

### Erreur : "ER_BAD_DB_ERROR"
**Cause :** La base de données n'existe pas  
**Solution :** Créez la base de données manuellement :
```sql
CREATE DATABASE koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erreur : "ECONNREFUSED"
**Cause :** MySQL n'est pas démarré  
**Solution :** Démarrez votre serveur MySQL :
```bash
# Windows (Service)
net start MySQL80

# Linux/Mac
sudo systemctl start mysql
# ou
sudo service mysql start
```

### Erreur : "Table already exists"
**Cause :** Les tables existent déjà  
**Solution :** C'est normal ! Le script ignore ces erreurs. Si vous voulez réinitialiser :
```sql
DROP DATABASE koussanar_erp;
CREATE DATABASE koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Commandes de migration

### Migration standard
```bash
cd backend
npm run migrate
```

### Migration manuelle (alternative)
Si le script automatique échoue, exécutez le SQL manuellement :
```bash
mysql -u root -p koussanar_erp < src/database/schema.sql
```

### Vérifier les tables créées
```sql
USE koussanar_erp;
SHOW TABLES;
```

## Structure attendue
Après migration réussie, vous devriez voir ces tables :
- profiles
- user_roles
- classes
- students
- teachers
- teacher_classes
- attendance
- payments
- fee_types
- announcements
- documents
- grades





















