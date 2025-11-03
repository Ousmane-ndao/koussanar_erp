import jwt from 'jsonwebtoken';
import pool from '../database/db.js';
import { logError } from '../utils/logger.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const [users] = await pool.execute(
      'SELECT id, email, nom, prenom, statut_actif FROM profiles WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].statut_actif) {
      return res.status(401).json({ message: 'Utilisateur non autorisé' });
    }

    // Charger les rôles de l'utilisateur
    const [userRoles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [decoded.userId]
    );

    req.user = {
      id: decoded.userId,
      email: users[0].email,
      nom: users[0].nom,
      prenom: users[0].prenom,
      roles: userRoles.map(r => r.role)
    };
    
    next();
  } catch (error) {
    logError('AUTH - Token verification', error, req);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expiré' });
    }
    return res.status(500).json({ 
      message: 'Erreur d\'authentification',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentification requise' });
      }

      const [userRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ?',
        [req.user.id]
      );

      const userRoleNames = userRoles.map(r => r.role);
      const hasRole = roles.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        return res.status(403).json({ message: 'Accès refusé. Rôle requis: ' + roles.join(', ') });
      }

      req.user.roles = userRoleNames;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Erreur de vérification des rôles' });
    }
  };
};

