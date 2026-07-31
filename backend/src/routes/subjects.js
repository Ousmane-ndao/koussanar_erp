import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// ============================================================
// GET /api/subjects - Liste des matières
// ============================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM matieres ORDER BY nom');
    res.json(rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des matières' });
  }
});

// ============================================================
// GET /api/subjects/:id - Détail d'une matière
// ============================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM matieres WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Matière non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la matière' });
  }
});

// ============================================================
// POST /api/subjects - Création d'une matière (admin)
// ============================================================
router.post('/', authenticateToken, requirePermission('manage_users'), [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('coefficient').optional().isFloat({ min: 0.1 }).withMessage('Le coefficient doit être ≥ 0.1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, coefficient } = req.body;

    // Vérifier l'unicité du nom
    const [existing] = await pool.execute('SELECT id FROM matieres WHERE nom = ?', [nom]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cette matière existe déjà' });
    }

    const id = generateUUID();
    await pool.execute(
      'INSERT INTO matieres (id, nom, coefficient) VALUES (?, ?, ?)',
      [id, nom, coefficient || 1.0]
    );

    res.status(201).json({ message: 'Matière créée avec succès', id });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la matière' });
  }
});

// ============================================================
// PUT /api/subjects/:id - Modification d'une matière (admin)
// ============================================================
router.put('/:id', authenticateToken, requirePermission('manage_users'), [
  body('nom').optional().trim().notEmpty(),
  body('coefficient').optional().isFloat({ min: 0.1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, coefficient } = req.body;

    // Vérifier que la matière existe
    const [existing] = await pool.execute('SELECT id FROM matieres WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Matière non trouvée' });
    }

    // Vérifier l'unicité du nom (si changement)
    if (nom) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM matieres WHERE nom = ? AND id != ?',
        [nom, req.params.id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Une autre matière porte déjà ce nom' });
      }
    }

    await pool.execute(
      'UPDATE matieres SET nom = COALESCE(?, nom), coefficient = COALESCE(?, coefficient) WHERE id = ?',
      [nom || null, coefficient || null, req.params.id]
    );

    res.json({ message: 'Matière modifiée avec succès' });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de la matière' });
  }
});

// ============================================================
// DELETE /api/subjects/:id - Suppression d'une matière (admin)
// ============================================================
router.delete('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    // Vérifier que la matière n'est pas utilisée dans des notes ou des emplois du temps
    const [used] = await pool.execute(
      'SELECT id FROM grades WHERE matiere = (SELECT nom FROM matieres WHERE id = ?) LIMIT 1',
      [req.params.id]
    );
    if (used.length > 0) {
      return res.status(400).json({ message: 'Cette matière est utilisée dans des notes, impossible de la supprimer' });
    }

    await pool.execute('DELETE FROM matieres WHERE id = ?', [req.params.id]);
    res.json({ message: 'Matière supprimée avec succès' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la matière' });
  }
});

export default router;