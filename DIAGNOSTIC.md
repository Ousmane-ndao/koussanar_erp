# 🔍 Guide de Diagnostic - Application ne s'affiche pas

## Étape 1: Vérifier la console du navigateur

1. **Ouvrez la console**:
   - Appuyez sur `F12` ou `Ctrl+Shift+I`
   - Cliquez sur l'onglet **Console**

2. **Recherchez ces messages**:
   - `[main.tsx] Démarrage de l'application...` ✓
   - `[main.tsx] Élément root trouvé` ✓
   - `[main.tsx] Import de App...` ✓
   - `[main.tsx] ✓ Application React initialisée avec succès` ✓

3. **Si vous voyez des erreurs**, notez:
   - Le message d'erreur
   - Le fichier concerné
   - La ligne de l'erreur

## Étape 2: Vérifier les fichiers de configuration

### Vérifier .env
Le fichier `.env` à la racine doit contenir:
```env
VITE_API_URL=http://localhost:5000/api
```

### Vérifier que le serveur dev tourne
```bash
npm run dev
```
Vous devriez voir:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
```

## Étape 3: Vérifier les erreurs réseau

1. Dans la console (F12), allez dans l'onglet **Network**
2. Rechargez la page (F5)
3. Vérifiez s'il y a des fichiers en rouge (erreurs 404, 500, etc.)

## Étape 4: Vérifier les modules

### Réinstaller les dépendances
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Vider le cache Vite
```bash
rmdir /s /q .vite
npm run dev
```

## Étape 5: Tester avec un App minimal

Si l'application ne se charge toujours pas, testez avec un App minimal:

Créez `src/App.test.tsx`:
```tsx
export default function App() {
  return <div>Test - L'application fonctionne!</div>;
}
```

Puis dans `src/main.tsx`, changez temporairement:
```tsx
import App from "./App.test.tsx";
```

## Erreurs courantes

### Erreur: "Cannot find module"
**Solution**: `npm install`

### Erreur: "VITE_API_URL is not defined"
**Solution**: Vérifiez le fichier `.env`

### Erreur: "Module not found: Can't resolve '@/...'"
**Solution**: Vérifiez `vite.config.ts` et `tsconfig.json`

### Page blanche
**Solutions**:
1. Ouvrez la console (F12) pour voir l'erreur
2. Vérifiez que `index.html` contient `<div id="root"></div>`
3. Vérifiez que `src/main.tsx` existe et est correct

## Commandes de diagnostic

```bash
# Vérifier TypeScript
npx tsc --noEmit

# Vérifier la configuration
node check-frontend-config.js

# Build de production (pour voir les erreurs)
npm run build

# Lancer le serveur
npm run dev
```

## Support

Si le problème persiste, fournissez:
1. Les messages d'erreur de la console du navigateur
2. Le résultat de `npm run build`
3. Le contenu du fichier `.env` (sans les mots de passe)
4. La version de Node.js (`node --version`)





















