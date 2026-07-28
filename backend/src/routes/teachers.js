import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateUniqueEmail, generatePassword } from '../utils/generate-email.js';

const router = express.Router();

// Get all teachers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             p.nom, p.prenom, p.email, p.telephone, p.adresse
      FROM teachers t
      LEFT JOIN profiles p ON t.user_id = p.id
      ORDER BY p.nom, p.prenom
    `;
    const [teachers] = await pool.execute(query);
    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des enseignants' });
  }
});

// Get teacher by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [teachers] = await pool.execute(
      `SELECT t.*, p.nom, p.prenom, p.email, p.telephone, p.adresse
       FROM teachers t
       LEFT JOIN profiles p ON t.user_id = p.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ message: 'Enseignant non trouvé' });
    }

    res.json(teachers[0]);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'enseignant' });
  }
});

// Create teacher
router.post('/', authenticateToken, requireRole('admin'), [
  body('matricule').trim().notEmpty(),
  body('nom').trim().notEmpty(),
  body('prenom').trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(), // Email optionnel, sera généré automatiquement
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matricule, nom, prenom, email: providedEmail, telephone, adresse, specialite, date_embauche } = req.body;

    // Check if matricule exists
    const [existing] = await pool.execute(
      'SELECT id FROM teachers WHERE matricule = ?',
      [matricule]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ce matricule existe déjà' });
    }

    // Générer l'email automatiquement si non fourni
    let email = providedEmail;
    if (!email) {
      email = await generateUniqueEmail(pool, prenom, nom, 5);
    } else {
      // Vérifier si l'email fourni existe déjà
      const [existingEmail] = await pool.execute(
        'SELECT id FROM profiles WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà enregistré' });
      }
    }

    // Générer un mot de passe unique de 6 caractères
    const passwordPlain = generatePassword(6);
    const password = await bcrypt.hash(passwordPlain, 10);

    // Create profile
    const userId = generateUUID();

    await pool.execute(
      'INSERT INTO profiles (id, email, password, nom, prenom, telephone, adresse) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, password, nom, prenom, telephone || null, adresse || null]
    );

    // Assign teacher role
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), userId, 'enseignant']
    );

    // Create teacher
    const teacherId = generateUUID();
    await pool.execute(
      `INSERT INTO teachers (id, user_id, matricule, specialite, date_embauche, statut) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teacherId, userId, matricule, specialite || null, date_embauche || null, 'actif']
    );

    res.status(201).json({ 
      message: 'Enseignant créé avec succès', 
      id: teacherId,
      email: email,
      password: passwordPlain, // Retourner le mot de passe en clair pour l'affichage
      info: 'Email et mot de passe générés automatiquement'
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'enseignant' });
  }
});

// Update teacher
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { specialite, date_embauche, statut } = req.body;

    await pool.execute(
      `UPDATE teachers SET 
        specialite = COALESCE(?, specialite),
        date_embauche = COALESCE(?, date_embauche),
        statut = COALESCE(?, statut)
       WHERE id = ?`,
      [specialite || null, date_embauche || null, statut || null, req.params.id]
    );

    // Update profile if provided
    const { nom, prenom, telephone, adresse } = req.body;
    if (nom || prenom || telephone || adresse) {
      const [teacher] = await pool.execute('SELECT user_id FROM teachers WHERE id = ?', [req.params.id]);
      if (teacher.length > 0) {
        await pool.execute(
          `UPDATE profiles SET 
            nom = COALESCE(?, nom),
            prenom = COALESCE(?, prenom),
            telephone = COALESCE(?, telephone),
            adresse = COALESCE(?, adresse)
           WHERE id = ?`,
          [nom || null, prenom || null, telephone || null, adresse || null, teacher[0].user_id]
        );
      }
    }

    res.json({ message: 'Enseignant modifié avec succès' });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'enseignant' });
  }
});

// Delete teacher
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Enseignant supprimé avec succès' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'enseignant' });
  }
});

export default router;

