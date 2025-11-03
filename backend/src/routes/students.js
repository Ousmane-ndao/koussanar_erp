import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logError } from '../utils/logger.js';

const router = express.Router();

// Get all students - Filtré selon le rôle
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT s.*, 
             p.nom, p.prenom, p.telephone, p.adresse, p.email,
             c.nom as classe_nom
      FROM students s
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Si l'utilisateur est un élève, il ne voit que lui-même
    if (req.user.roles && req.user.roles.includes('eleve') && !req.user.roles.includes('admin')) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (students.length > 0) {
        query += ' AND s.id = ?';
        params.push(students[0].id);
      } else {
        return res.json([]);
      }
    }
    // Si l'utilisateur est un professeur, il ne voit que les élèves de ses classes
    else if (req.user.roles && req.user.roles.includes('enseignant') && !req.user.roles.includes('admin')) {
      // Récupérer l'ID du professeur
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        // Récupérer les classes assignées au professeur
        const [teacherClasses] = await pool.execute(
          'SELECT DISTINCT classe_id FROM teacher_classes WHERE teacher_id = ?',
          [teacherId]
        );
        if (teacherClasses.length > 0) {
          const classeIds = teacherClasses.map(tc => tc.classe_id);
          query += ` AND s.classe_id IN (${classeIds.map(() => '?').join(',')})`;
          params.push(...classeIds);
        } else {
          // Aucune classe assignée, retourner un tableau vide
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY s.created_at DESC';

    const [students] = await pool.execute(query, params);
    res.json(students);
  } catch (error) {
    logError('STUDENTS - Get all', error, req);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des élèves',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Get student by ID - Vérifier les permissions d'accès
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur peut accéder à cet élève
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si élève, vérifier que c'est lui-même
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, req.params.id]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres données' });
      }
    }
    // Si professeur, vérifier que l'élève est dans une de ses classes
    else if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        // Vérifier si l'élève est dans une classe du professeur
        const [studentClasses] = await pool.execute(
          `SELECT s.classe_id FROM students s
           INNER JOIN teacher_classes tc ON s.classe_id = tc.classe_id
           WHERE s.id = ? AND tc.teacher_id = ?`,
          [req.params.id, teacherId]
        );
        if (studentClasses.length === 0) {
          return res.status(403).json({ message: 'Accès refusé: cet élève n\'est pas dans vos classes' });
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const [students] = await pool.execute(
      `SELECT s.*, 
              p.nom, p.prenom, p.telephone, p.adresse, p.email,
              c.nom as classe_nom, c.niveau, c.filiere
       FROM students s
       LEFT JOIN profiles p ON s.user_id = p.id
       LEFT JOIN classes c ON s.classe_id = c.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Élève non trouvé' });
    }

    res.json(students[0]);
  } catch (error) {
    logError('STUDENTS - Get by ID', error, req);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'élève',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Create student
router.post('/', authenticateToken, requirePermission('manage_users'), [
  body('matricule').trim().notEmpty(),
  body('nom').trim().notEmpty(),
  body('prenom').trim().notEmpty(),
  body('date_naissance').isISO8601(),
  body('sexe').isIn(['M', 'F']),
  body('annee_scolaire').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      matricule, nom, prenom, date_naissance, lieu_naissance,
      sexe, classe_id, telephone, adresse, annee_scolaire, statut_inscription
    } = req.body;

    // Check if matricule exists
    const [existing] = await pool.execute(
      'SELECT id FROM students WHERE matricule = ?',
      [matricule]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ce matricule existe déjà' });
    }

    // Create profile first
    const userId = generateUUID();
    const email = `${matricule}@lycee-koussanar.edu`;
    const password = await bcrypt.hash(matricule, 10); // Default password is matricule

    await pool.execute(
      'INSERT INTO profiles (id, email, password, nom, prenom, telephone, adresse) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, password, nom, prenom, telephone || null, adresse || null]
    );

    // Assign student role
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), userId, 'eleve']
    );

    // Create student
    const studentId = generateUUID();
    await pool.execute(
      `INSERT INTO students (id, user_id, matricule, date_naissance, lieu_naissance, 
        sexe, classe_id, annee_scolaire, statut_inscription) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, userId, matricule, date_naissance, lieu_naissance || null,
        sexe, classe_id || null, annee_scolaire, statut_inscription || 'actif']
    );

    res.status(201).json({ message: 'Élève créé avec succès', id: studentId });
  } catch (error) {
    logError('STUDENTS - Create', error, req);
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'élève',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Update student
router.put('/:id', authenticateToken, requirePermission('manage_users'), [
  body('date_naissance').optional().isISO8601(),
  body('sexe').optional().isIn(['M', 'F']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date_naissance, lieu_naissance, sexe, classe_id, annee_scolaire, statut_inscription } = req.body;

    await pool.execute(
      `UPDATE students SET 
        date_naissance = COALESCE(?, date_naissance),
        lieu_naissance = COALESCE(?, lieu_naissance),
        sexe = COALESCE(?, sexe),
        classe_id = ?,
        annee_scolaire = COALESCE(?, annee_scolaire),
        statut_inscription = COALESCE(?, statut_inscription)
       WHERE id = ?`,
      [date_naissance || null, lieu_naissance || null, sexe || null, classe_id || null,
        annee_scolaire || null, statut_inscription || null, req.params.id]
    );

    // Update profile if provided
    const { nom, prenom, telephone, adresse } = req.body;
    if (nom || prenom || telephone || adresse) {
      const [student] = await pool.execute('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
      if (student.length > 0) {
        await pool.execute(
          `UPDATE profiles SET 
            nom = COALESCE(?, nom),
            prenom = COALESCE(?, prenom),
            telephone = COALESCE(?, telephone),
            adresse = COALESCE(?, adresse)
           WHERE id = ?`,
          [nom || null, prenom || null, telephone || null, adresse || null, student[0].user_id]
        );
      }
    }

    res.json({ message: 'Élève modifié avec succès' });
  } catch (error) {
    logError('STUDENTS - Update', error, req);
    res.status(500).json({ 
      message: 'Erreur lors de la modification de l\'élève',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Delete student
router.delete('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Élève supprimé avec succès' });
  } catch (error) {
    logError('STUDENTS - Delete', error, req);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'élève',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

export default router;

