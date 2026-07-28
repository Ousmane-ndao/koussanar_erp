import pool from '../database/db.js';
import { logError } from '../utils/logger.js';

// Définition des permissions par rôle
const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',        // Gérer les utilisateurs
    'enter_grades',        // Saisir les notes
    'view_grades',         // Consulter les notes
    'manage_payments',     // Gérer les paiements
    'view_payments',       // Voir les paiements
    'manage_schedule',     // Ajouter un emploi du temps
    'manage_attendance',   // Enregistrer les présences
    'send_message',        // Envoyer un message
    'download_reports',    // Télécharger les bulletins
    'manage_documents',    // Gérer tous les documents
  ],
  enseignant: [
    'enter_grades',        // Saisir les notes (dans ses matières seulement)
    'view_grades',         // Consulter les notes (de ses classes seulement)
    'view_own_classes',    // Voir ses classes assignées
    'view_own_students',   // Voir les élèves de ses classes
    'manage_attendance',   // Enregistrer les présences (de ses classes seulement)
    'send_message',        // Envoyer un message
    'download_reports',    // Télécharger les bulletins
    'upload_documents',    // Téléverser des documents
  ],
  eleve: [
    'view_own_profile',    // Voir ses informations personnelles
    'view_own_grades',     // Consulter ses propres notes
    'view_own_schedule',   // Voir son emploi du temps
    'view_own_attendance', // Voir ses absences et retards
    'view_own_payments',   // Voir ses propres paiements (lecture seule)
    'send_message',        // Envoyer un message
    'download_own_reports', // Télécharger ses bulletins
    'view_documents',      // Voir les documents
    // Note: Les élèves ne peuvent RIEN modifier (pas de permission de modification)
  ],
  comptable: [
    'manage_payments',     // Gérer les paiements
    'view_payments',       // Voir les paiements
    'send_message',        // Envoyer un message
  ],
  parent: [
    'view_child_grades',   // Voir les notes de son enfant
    'view_child_payments', // Voir les paiements de son enfant
    'send_message',        // Envoyer un message
    'download_child_reports', // Télécharger les bulletins de son enfant
  ],
  surveillant: [
    'view_grades',         // Consulter les notes
    'send_message',        // Envoyer un message
  ],
};

/**
 * Middleware pour vérifier une permission spécifique
 * @param {string} permission - La permission requise
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      // Récupérer les rôles de l'utilisateur
      const [userRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [req.user.id]
      );

      if (userRoles.length === 0) {
        return res.status(403).json({ message: 'Aucun rôle assigné' });
      }

      const userRoleNames = userRoles.map(r => r.role);
      req.user.roles = userRoleNames;

      // Vérifier si l'utilisateur a la permission
      let hasPermission = false;

      for (const role of userRoleNames) {
        const permissions = ROLE_PERMISSIONS[role] || [];
        if (permissions.includes(permission)) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        logError('RBAC - Permission denied', new Error(`User ${req.user.id} lacks permission: ${permission}`), req);
        return res.status(403).json({ 
          message: 'Accès refusé. Permission requise: ' + permission 
        });
      }

      next();
    } catch (error) {
      logError('RBAC - Permission check error', error, req);
      return res.status(500).json({ message: 'Erreur de vérification des permissions' });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (OR - au moins une)
 * @param {string[]} permissions - Les permissions requises (au moins une)
 */
export const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const [userRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [req.user.id]
      );

      if (userRoles.length === 0) {
        return res.status(403).json({ message: 'Aucun rôle assigné' });
      }

      const userRoleNames = userRoles.map(r => r.role);
      req.user.roles = userRoleNames;

      // Vérifier si l'utilisateur a au moins une des permissions
      let hasPermission = false;

      for (const permission of permissions) {
        for (const role of userRoleNames) {
          const rolePermissions = ROLE_PERMISSIONS[role] || [];
          if (rolePermissions.includes(permission)) {
            hasPermission = true;
            break;
          }
        }
        if (hasPermission) break;
      }

      if (!hasPermission) {
        logError('RBAC - Permission denied', new Error(`User ${req.user.id} lacks any of: ${permissions.join(', ')}`), req);
        return res.status(403).json({ 
          message: 'Accès refusé. Permissions requises (au moins une): ' + permissions.join(', ') 
        });
      }

      next();
    } catch (error) {
      logError('RBAC - Permission check error', error, req);
      return res.status(500).json({ message: 'Erreur de vérification des permissions' });
    }
  };
};

/**
 * Middleware pour vérifier l'accès aux données propres à l'utilisateur
 * Pour les élèves: peut seulement voir ses propres données
 * Pour les parents: peut voir les données de ses enfants
 */
export const requireOwnershipOrPermission = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const [userRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [req.user.id]
      );

      const userRoleNames = userRoles.map(r => r.role);
      req.user.roles = userRoleNames;

      // Admin a toujours accès
      if (userRoleNames.includes('admin')) {
        return next();
      }

      // Vérifier selon le type de ressource
      if (resourceType === 'student') {
        const studentId = req.params.id || req.params.studentId || req.body.student_id;
        
        if (!studentId) {
          return res.status(400).json({ message: 'ID étudiant requis' });
        }

        // Pour les élèves: vérifier que c'est leur propre ID
        if (userRoleNames.includes('eleve')) {
          const [students] = await pool.execute(
            'SELECT user_id FROM students WHERE id = ?',
            [studentId]
          );
          
          if (students.length > 0 && students[0].user_id === req.user.id) {
            return next();
          } else {
            return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres données' });
          }
        }

        // Pour les parents: vérifier que c'est l'enfant du parent
        if (userRoleNames.includes('parent')) {
          // Note: Nécessiterait une table parent_students pour lier parents et enfants
          // Pour l'instant, on vérifie juste que le parent a la permission
          const permissions = ROLE_PERMISSIONS.parent || [];
          if (permissions.includes('view_child_grades') || permissions.includes('view_child_payments')) {
            return next();
          }
        }
      }

      // Si on arrive ici, l'utilisateur n'a pas accès
      return res.status(403).json({ message: 'Accès refusé' });
    } catch (error) {
      logError('RBAC - Ownership check error', error, req);
      return res.status(500).json({ message: 'Erreur de vérification d\'accès' });
    }
  };
};

/**
 * Fonction utilitaire pour obtenir les permissions d'un utilisateur
 * Utile pour les endpoints qui retournent les permissions au frontend
 */
export const getUserPermissions = async (userId) => {
  try {
    const [userRoles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );

    const userRoleNames = userRoles.map(r => r.role);
    const permissions = new Set();

    for (const role of userRoleNames) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(perm => permissions.add(perm));
    }

    return {
      roles: userRoleNames,
      permissions: Array.from(permissions),
    };
  } catch (error) {
    throw error;
  }
};

// Export des permissions pour utilisation dans d'autres modules
export { ROLE_PERMISSIONS };

