import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all fee types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { annee_scolaire, actif } = req.query;
    
    let query = `
      SELECT * FROM fee_types
      WHERE 1=1
    `;
    const params = [];

    if (annee_scolaire) {
      query += ' AND annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    if (actif !== undefined) {
      query += ' AND actif = ?';
      params.push(actif === 'true' || actif === '1');
    }

    query += ' ORDER BY created_at DESC';

    const [feeTypes] = await pool.execute(query, params);
    res.json(feeTypes);
  } catch (error) {
    console.error('Get fee types error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des types de frais' });
  }
});

// Get fee type by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [feeTypes] = await pool.execute(
      'SELECT * FROM fee_types WHERE id = ?',
      [req.params.id]
    );

    if (feeTypes.length === 0) {
      return res.status(404).json({ message: 'Type de frais non trouvé' });
    }

    res.json(feeTypes[0]);
  } catch (error) {
    console.error('Get fee type error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du type de frais' });
  }
});

// Create fee type
router.post('/', authenticateToken, requirePermission('manage_payments'), [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('montant').isFloat({ min: 0 }).withMessage('Le montant doit être un nombre positif'),
  body('annee_scolaire').trim().notEmpty().withMessage('L\'année scolaire est requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, montant, annee_scolaire, actif } = req.body;
    const id = generateUUID();

    await pool.execute(
      'INSERT INTO fee_types (id, nom, montant, annee_scolaire, actif) VALUES (?, ?, ?, ?, ?)',
      [id, nom, montant, annee_scolaire, actif !== undefined ? actif : true]
    );

    res.status(201).json({ message: 'Type de frais créé avec succès', id });
  } catch (error) {
    console.error('Create fee type error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du type de frais' });
  }
});

// Update fee type
router.put('/:id', authenticateToken, requirePermission('manage_payments'), [
  body('montant').optional().isFloat({ min: 0 }).withMessage('Le montant doit être un nombre positif'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, montant, annee_scolaire, actif } = req.body;

    // Check if fee type exists
    const [existing] = await pool.execute(
      'SELECT id FROM fee_types WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Type de frais non trouvé' });
    }

    await pool.execute(
      `UPDATE fee_types SET 
        nom = COALESCE(?, nom),
        montant = COALESCE(?, montant),
        annee_scolaire = COALESCE(?, annee_scolaire),
        actif = COALESCE(?, actif)
       WHERE id = ?`,
      [nom || null, montant || null, annee_scolaire || null, actif !== undefined ? actif : null, req.params.id]
    );

    res.json({ message: 'Type de frais modifié avec succès' });
  } catch (error) {
    console.error('Update fee type error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du type de frais' });
  }
});

// Delete fee type
router.delete('/:id', authenticateToken, requirePermission('manage_payments'), async (req, res) => {
  try {
    // Check if fee type exists
    const [existing] = await pool.execute(
      'SELECT id FROM fee_types WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Type de frais non trouvé' });
    }

    // Check if fee type is used in payments
    const [payments] = await pool.execute(
      'SELECT COUNT(*) as count FROM payments WHERE type_paiement = ?',
      [req.params.id]
    );

    if (payments[0].count > 0) {
      // Soft delete: set actif to false instead of deleting
      await pool.execute(
        'UPDATE fee_types SET actif = FALSE WHERE id = ?',
        [req.params.id]
      );
      return res.json({ message: 'Type de frais désactivé (utilisé dans des paiements)' });
    }

    // Hard delete if not used
    await pool.execute('DELETE FROM fee_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Type de frais supprimé avec succès' });
  } catch (error) {
    console.error('Delete fee type error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du type de frais' });
  }
});

export default router;


















