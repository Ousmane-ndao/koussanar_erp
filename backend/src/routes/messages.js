import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all announcements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT a.*,
             p.nom, p.prenom
      FROM announcements a
      LEFT JOIN profiles p ON a.created_by = p.id
      ORDER BY a.created_at DESC
    `;
    const [announcements] = await pool.execute(query);
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des annonces' });
  }
});

// Get announcement by ID
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

// Create announcement
router.post('/', authenticateToken, [
  body('titre').trim().notEmpty(),
  body('contenu').trim().notEmpty(),
  body('type').isIn(['info', 'important', 'urgence']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titre, contenu, type } = req.body;
    const id = generateUUID();

    await pool.execute(
      'INSERT INTO announcements (id, titre, contenu, type, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, titre, contenu, type || 'info', req.user.id]
    );

    res.status(201).json({ message: 'Annonce publiée avec succès', id });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Erreur lors de la publication de l\'annonce' });
  }
});

// Update announcement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is the creator
    const [announcements] = await pool.execute(
      'SELECT created_by FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    if (announcements[0].created_by !== req.user.id) {
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

// Delete announcement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is the creator or admin
    const [announcements] = await pool.execute(
      'SELECT created_by FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // Check if admin (simplified - in production, check role)
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
      [req.user.id]
    );

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

