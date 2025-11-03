# Guide de Dépannage - Frontend

## Erreurs courantes et solutions

### Erreur : "Cannot find module" ou import errors

**Solution :** Vérifiez que toutes les dépendances sont installées :
```bash
npm install
```

### Erreur : "VITE_API_URL is not defined"

**Solution :** Créez/modifiez le fichier `.env` à la racine :
```env
VITE_API_URL=http://localhost:5000/api
```

Puis redémarrez le serveur de développement :
```bash
npm run dev
```

### Erreur : "Network Error" ou connexion au backend échoue

**Causes possibles :**
1. Le backend n'est pas démarré
2. Mauvais port dans VITE_API_URL
3. CORS non configuré sur le backend

**Solutions :**
1. Démarrez le backend :
```bash
cd backend
npm run dev
```

2. Vérifiez que `VITE_API_URL` dans `.env` correspond au port du backend (défaut: 5000)

3. Vérifiez que CORS est activé dans `backend/src/server.js` :
```js
app.use(cors());
```

### Erreur : "Module not found: Can't resolve '@/...'"

**Solution :** Vérifiez que le chemin d'alias est configuré dans `vite.config.ts` :
```ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Erreur : TypeScript compilation errors

**Solution :** Vérifiez la compilation :
```bash
npx tsc --noEmit
```

### Vider le cache et réinstaller

Si les erreurs persistent :
```bash
# Supprimer node_modules et cache
rm -rf node_modules .vite dist
# ou sur Windows:
rmdir /s /q node_modules
rmdir /s /q .vite
rmdir /s /q dist

# Réinstaller
npm install

# Redémarrer
npm run dev
```

## Vérifications

### 1. Variables d'environnement

Fichier `.env` à la racine doit contenir :
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Backend en cours d'exécution

Vérifiez que le backend tourne :
```bash
cd backend
npm run dev
```

Vous devriez voir : `Server is running on port 5000`

### 3. Console du navigateur

Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées.

## Commandes utiles

```bash
# Frontend
npm run dev          # Démarrer le serveur de développement
npm run build        # Construire pour production
npm run lint         # Vérifier le code

# Backend
cd backend
npm run dev          # Démarrer le backend
npm run migrate      # Migrer la base de données
npm run check-db     # Vérifier la connexion DB
```


