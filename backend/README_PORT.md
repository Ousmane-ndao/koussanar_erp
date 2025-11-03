# Gestion du Port 5000

## Problème : Port déjà utilisé

Si vous obtenez l'erreur `EADDRINUSE: address already in use :::5000`, cela signifie qu'un processus utilise déjà le port 5000.

## Solutions

### Option 1 : Arrêter le processus existant

#### Windows (PowerShell ou CMD)
```bash
# Trouver le processus
netstat -ano | findstr :5000

# Arrêter le processus (remplacez PID par le numéro trouvé)
taskkill /F /PID <PID>

# Ou utilisez le script fourni
stop-server.bat
```

#### Alternative rapide
```bash
# Arrête tous les processus Node.js
taskkill /F /IM node.exe
```

### Option 2 : Changer le port

1. Créez un fichier `.env` dans le dossier `backend` :
```env
PORT=5001
```

2. Le serveur utilisera automatiquement le port 5001

3. **Important** : Mettez à jour la configuration du frontend dans `src/lib/api.ts` :
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

### Option 3 : Vérifier les processus Node.js en cours

```bash
# Lister tous les processus Node.js
tasklist | findstr node.exe
```

## Recommandation

Pour éviter ce problème à l'avenir :
- Utilisez toujours `Ctrl+C` pour arrêter le serveur proprement
- Ou utilisez le script `stop-server.bat` avant de relancer

