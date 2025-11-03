-- Script SQL pour corriger le mot de passe admin
-- ATTENTION: Ce script nécessite que vous génériez d'abord le hash avec le script Node.js

-- Option 1: Utiliser le script Node.js (RECOMMANDÉ)
-- cd backend
-- node fix-admin-password.js

-- Option 2: Générer manuellement le hash et le mettre à jour
-- D'abord, exécutez ce script Node.js pour générer le hash:
-- 
-- import bcrypt from 'bcryptjs';
-- const hash = await bcrypt.hash('admin123456', 10);
-- console.log(hash);

-- Ensuite, remplacez LE_HASH_GENERE ci-dessous par le hash généré:

-- UPDATE profiles 
-- SET password = 'LE_HASH_GENERE'
-- WHERE email = 'admin@koussanar.sn';

-- Vérification:
-- SELECT id, email, SUBSTRING(password, 1, 30) as password_hash_preview
-- FROM profiles 
-- WHERE email = 'admin@koussanar.sn';


