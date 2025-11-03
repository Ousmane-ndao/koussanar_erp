import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserPermissions } from '../middleware/rbac.js';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nom').trim().notEmpty(),
  body('prenom').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nom, prenom, telephone, adresse, role } = req.body;

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM profiles WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà enregistré' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    // Create user
    await pool.execute(
      'INSERT INTO profiles (id, email, password, nom, prenom, telephone, adresse) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, nom, prenom, telephone || null, adresse || null]
    );

    // Assign role (default: eleve if not specified)
    const userRole = role || 'eleve';
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), userId, userRole]
    );

    // Generate token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: userId,
        email,
        nom,
        prenom,
        role: userRole
      }
    });
  } catch (error) {
    console.error('[AUTH] Register error:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password, nom, prenom, statut_actif FROM profiles WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    if (!user.statut_actif) {
      return res.status(401).json({ message: 'Compte désactivé' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Get user roles and permissions
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );
    const userRoleNames = roles.map(r => r.role);
    const permissions = await getUserPermissions(user.id);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        roles: userRoleNames,
        permissions: permissions.permissions
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [req.user.id]
    );
    const permissions = await getUserPermissions(req.user.id);

    res.json({
      user: {
        ...req.user,
        roles: roles.map(r => r.role),
        permissions: permissions.permissions
      }
    });
  } catch (error) {
    console.error('[AUTH] Get me error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du profil',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

export default router;

