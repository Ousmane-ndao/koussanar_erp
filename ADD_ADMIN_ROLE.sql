-- Ajouter le rôle admin au compte existant
USE koussanar_erp;

-- Ajouter le rôle admin (remplacez l'ID si nécessaire)
INSERT INTO user_roles (id, user_id, role)
SELECT UUID(), '07c69b5f-b896-11f0-8cb5-0a0027000010', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = '07c69b5f-b896-11f0-8cb5-0a0027000010' 
    AND role = 'admin'
);

-- Vérification
SELECT 
    p.email,
    p.nom,
    p.prenom,
    ur.role,
    p.statut_actif
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email = 'admin@koussanar.sn';


