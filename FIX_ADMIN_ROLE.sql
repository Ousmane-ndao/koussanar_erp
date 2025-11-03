-- Script pour ajouter le rôle admin au compte existant
-- Exécutez ce script dans MySQL après avoir créé le profil admin

-- 1. Récupérer l'ID du profil admin
SET @admin_id = (SELECT id FROM profiles WHERE email = 'admin@koussanar.sn');

-- 2. Vérifier que le profil existe
SELECT @admin_id AS admin_user_id;

-- 3. Vérifier si le rôle admin existe déjà
SELECT id, user_id, role 
FROM user_roles 
WHERE user_id = @admin_id AND role = 'admin';

-- 4. Ajouter le rôle admin (seulement s'il n'existe pas)
INSERT INTO user_roles (id, user_id, role)
SELECT UUID(), @admin_id, 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = @admin_id AND role = 'admin'
);

-- 5. Vérifier que le rôle a été ajouté
SELECT 
    p.email,
    p.nom,
    p.prenom,
    ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email = 'admin@koussanar.sn';

-- 6. Vérifier que le statut actif est bien à 1
UPDATE profiles 
SET statut_actif = 1 
WHERE email = 'admin@koussanar.sn';


