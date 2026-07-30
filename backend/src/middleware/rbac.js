import pool from '../database/db.js';
import { logError } from '../utils/logger.js';
import jwt from 'jsonwebtoken';

// ============================================================
// 1. Définition des permissions par rôle
// ============================================================
const ROLE_PERMISSIONS = {
  admin: [
    'manage_users', 'enter_grades', 'view_grades',
    'manage_payments', 'view_payments', 'manage_schedule',
    'manage_attendance', 'send_message', 'download_reports',
    'manage_documents',
  ],
  enseignant: [
    'enter_grades', 'view_grades', 'view_own_classes',
    'view_own_students', 'manage_attendance', 'send_message',
    'download_reports', 'upload_documents',
  ],
  eleve: [
    'view_own_profile', 'view_own_grades', 'view_own_schedule',
    'view_own_attendance', 'view_own_payments', 'send_message',
    'download_own_reports', 'view_documents',
  ],
  comptable: [
    'manage_payments', 'view_payments', 'send_message',
  ],
  parent: [
    'view_child_grades', 'view_child_payments', 'send_message',
    'download_child_reports',
  ],
  surveillant: [
    'view_grades', 'send_message',
  ],
};

// ============================================================
// 2. Middleware d'authentification JWT
// ============================================================
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide' });
  }
};

// ============================================================
// 3. Middleware de vérification de permission (utilise les rôles du token)
// ============================================================
export const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const userRoles = req.user.roles;
      let hasPermission = false;

      for (const role of userRoles) {
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

// ============================================================
// 4. Middleware "au moins une permission parmi plusieurs"
// ============================================================
export const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const userRoles = req.user.roles;
      let hasPermission = false;

      for (const permission of permissions) {
        for (const role of userRoles) {
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

// ============================================================
// 5. Middleware de propriété / accès restreint (version simplifiée)
// ============================================================
export const requireOwnershipOrPermission = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const userRoles = req.user.roles || [];

      // Admin a toujours accès
      if (userRoles.includes('admin')) {
        return next();
      }

      if (resourceType === 'student') {
        const studentId = req.params.id || req.params.studentId || req.body.student_id;

        if (!studentId) {
          return res.status(400).json({ message: 'ID étudiant requis' });
        }

        // Pour les élèves : vérifier que c'est leur propre ID
        if (userRoles.includes('eleve')) {
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

        // Pour les parents : vérifier que c'est l'enfant (nécessite table parent_students)
        if (userRoles.includes('parent')) {
          // Vérifier si le parent a la permission de voir les notes de l'enfant
          const permissions = ROLE_PERMISSIONS.parent || [];
          if (permissions.includes('view_child_grades') || permissions.includes('view_child_payments')) {
            return next();
          }
        }
      }

      return res.status(403).json({ message: 'Accès refusé' });
    } catch (error) {
      logError('RBAC - Ownership check error', error, req);
      return res.status(500).json({ message: 'Erreur de vérification d\'accès' });
    }
  };
};

// ============================================================
// 6. Fonction utilitaire : obtenir les permissions d'un utilisateur
// ============================================================
export const getUserPermissions = async (userId) => {
  try {
    // Si on veut récupérer depuis la base, ou bien depuis le token
    // Ici on va chercher en base si besoin, sinon on peut utiliser les rôles du token
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

// ============================================================
// 7. Export des permissions (pour utilisation dans d'autres modules)
// ============================================================
export { ROLE_PERMISSIONS };