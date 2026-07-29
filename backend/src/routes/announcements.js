import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les annonces visibles par l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Récupérer les rôles de l'utilisateur
    let roles = [];
    try {
      const [rolesRows] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ?', [req.user.id]);
      roles = rolesRows.map(r => r.role);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }

    const isAdmin = roles.includes('admin');
    const isEnseignant = roles.includes('enseignant');
    const isEleve = roles.includes('eleve');

    let userClasseIds = [];
    try {
      if (isEleve) {
        const [studentRows] = await pool.execute('SELECT classe_id FROM students WHERE user_id = ? AND statut_inscription = ?', [req.user.id, 'actif']);
        userClasseIds = studentRows.filter(r => !!r.classe_id).map(r => r.classe_id);
      } else if (isEnseignant) {
        const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
        if (teachers.length > 0) {
          const teacherId = teachers[0].id;
          const [teacherClasses] = await pool.execute('SELECT DISTINCT classe_id FROM teacher_classes WHERE teacher_id = ?', [teacherId]);
          userClasseIds = teacherClasses.filter(r => !!r.classe_id).map(r => r.classe_id);
        }
      }
    } catch (error) {
      console.error('Error fetching user classes:', error);
    }

    // Construire la condition WHERE pour filtrer les annonces
    const conditions = ["a.audience = 'all'"];
    const params = [];

    if (roles.length > 0) {
      const rolePlaceholders = roles.map(() => '?').join(',');
      conditions.push(`(a.audience = 'role' AND a.target_role IN (${rolePlaceholders}))`);
      params.push(...roles);
    }

    conditions.push('(a.audience = \'user\' AND a.target_user_id = ?)');
    params.push(req.user.id);

    if (userClasseIds.length > 0) {
      const classPlaceholders = userClasseIds.map(() => '?').join(',');
      conditions.push(`(a.audience = 'class' AND a.target_class_id IN (${classPlaceholders}))`);
      params.push(...userClasseIds);
    }

    const where = conditions.join(' OR ');

    const query = `
      SELECT a.*, p.nom, p.prenom
      FROM announcements a
      LEFT JOIN profiles p ON a.created_by = p.id
      WHERE ${where}
      ORDER BY a.created_at DESC
    `;

    const [announcements] = await pool.execute(query, params);
    res.json(announcements || []);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des annonces' });
  }
});

// Récupérer une annonce par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      `SELECT a.*, p.nom, p.prenom
       FROM announcements a
       LEFT JOIN profiles p ON a.created_by = p.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    res.json(announcements[0]);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'annonce' });
  }
});

// Créer une annonce (seul l'admin peut cibler une audience autre que 'all')
router.post('/', authenticateToken, [
  body('titre').trim().notEmpty(),
  body('contenu').trim().notEmpty(),
  body('type').isIn(['info', 'important', 'urgence']),
  body('audience').optional().isIn(['all', 'role', 'class', 'user']),
  body('target_role').optional().isIn(['admin', 'enseignant', 'eleve', 'parent', 'comptable', 'surveillant']),
  body('target_class_id').optional().isString().isLength({ min: 1 }),
  body('target_user_id').optional().isString().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titre, contenu, type, audience, target_role, target_class_id, target_user_id } = req.body;

    // Vérifier si l'utilisateur est admin pour les audiences ciblées
    const [roles] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ?', [req.user.id]);
    const isAdmin = roles.some(r => r.role === 'admin');

    let finalAudience = audience || 'all';
    let finalTargetRole = null;
    let finalTargetClass = null;
    let finalTargetUser = null;

    if (finalAudience !== 'all') {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Seul un administrateur peut cibler une audience' });
      }
      if (finalAudience === 'role') {
        if (!target_role) return res.status(400).json({ message: 'target_role requis pour audience role' });
        finalTargetRole = target_role;
      } else if (finalAudience === 'class') {
        if (!target_class_id) return res.status(400).json({ message: 'target_class_id requis pour audience class' });
        finalTargetClass = target_class_id;
      } else if (finalAudience === 'user') {
        if (!target_user_id) return res.status(400).json({ message: 'target_user_id requis pour audience user' });
        finalTargetUser = target_user_id;
      }
    }

    const id = generateUUID();

    await pool.execute(
      `INSERT INTO announcements
        (id, titre, contenu, type, audience, target_role, target_class_id, target_user_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, titre, contenu, type || 'info', finalAudience, finalTargetRole, finalTargetClass, finalTargetUser, req.user.id]
    );

    res.status(201).json({ message: 'Annonce publiée avec succès', id });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Erreur lors de la publication de l\'annonce' });
  }
});

// Modifier une annonce (seul le créateur ou admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      'SELECT created_by FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // Vérifier si l'utilisateur est le créateur ou admin
    const [roles] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"', [req.user.id]);
    if (announcements[0].created_by !== req.user.id && roles.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette annonce' });
    }

    const { titre, contenu, type } = req.body;
    await pool.execute(
      `UPDATE announcements SET
        titre = COALESCE(?, titre),
        contenu = COALESCE(?, contenu),
        type = COALESCE(?, type)
       WHERE id = ?`,
      [titre || null, contenu || null, type || null, req.params.id]
    );

    res.json({ message: 'Annonce modifiée avec succès' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'annonce' });
  }
});

// Supprimer une annonce (seul le créateur ou admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      'SELECT created_by FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    const [roles] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"', [req.user.id]);
    if (announcements[0].created_by !== req.user.id && roles.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette annonce' });
    }

    await pool.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'annonce' });
  }
});

export default router;