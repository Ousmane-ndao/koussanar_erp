import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requirePermission, requireOwnershipOrPermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all grades - Filtré selon le rôle
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, matiere, annee_scolaire } = req.query;
    let query = `
      SELECT g.*,
             s.matricule,
             p.nom, p.prenom,
             creator.nom as creator_nom, creator.prenom as creator_prenom
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN profiles creator ON g.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si l'utilisateur est un élève, filtrer seulement ses notes
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (students.length > 0) {
        query += ' AND g.student_id = ?';
        params.push(students[0].id);
      } else {
        return res.json([]);
      }
    }
    // Si l'utilisateur est un professeur, filtrer seulement ses matières et ses classes
    else if (isEnseignant && !isAdmin) {
      // Récupérer l'ID du professeur
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        // Récupérer les matières et classes du professeur
        const [teacherClasses] = await pool.execute(
          'SELECT DISTINCT classe_id, matiere FROM teacher_classes WHERE teacher_id = ?',
          [teacherId]
        );
        
        if (teacherClasses.length > 0) {
          // Filtrer par classes
          const classeIds = [...new Set(teacherClasses.map(tc => tc.classe_id))];
          const matieres = [...new Set(teacherClasses.map(tc => tc.matiere).filter(m => m))];
          
          query += ` AND s.classe_id IN (${classeIds.map(() => '?').join(',')})`;
          params.push(...classeIds);
          
          // Si des matières sont spécifiées, filtrer aussi par matière
          if (matieres.length > 0) {
            query += ` AND g.matiere IN (${matieres.map(() => '?').join(',')})`;
            params.push(...matieres);
          }
        } else {
          // Aucune classe assignée
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }

    if (student_id) {
      // Si professeur, vérifier que l'élève est dans ses classes
      if (isEnseignant && !isAdmin) {
        const [teachers] = await pool.execute(
          'SELECT id FROM teachers WHERE user_id = ?',
          [req.user.id]
        );
        if (teachers.length > 0) {
          const teacherId = teachers[0].id;
          const [studentClasses] = await pool.execute(
            `SELECT s.classe_id FROM students s
             INNER JOIN teacher_classes tc ON s.classe_id = tc.classe_id
             WHERE s.id = ? AND tc.teacher_id = ?`,
            [student_id, teacherId]
          );
          if (studentClasses.length === 0) {
            return res.status(403).json({ message: 'Accès refusé: cet élève n\'est pas dans vos classes' });
          }
        }
      }
      query += ' AND g.student_id = ?';
      params.push(student_id);
    }
    if (matiere) {
      // Si professeur, vérifier que c'est sa matière
      if (isEnseignant && !isAdmin) {
        const [teachers] = await pool.execute(
          'SELECT id FROM teachers WHERE user_id = ?',
          [req.user.id]
        );
        if (teachers.length > 0) {
          const teacherId = teachers[0].id;
          const [teacherMatieres] = await pool.execute(
            'SELECT matiere FROM teacher_classes WHERE teacher_id = ? AND matiere = ?',
            [teacherId, matiere]
          );
          if (teacherMatieres.length === 0) {
            return res.status(403).json({ message: 'Accès refusé: cette matière ne vous est pas assignée' });
          }
        }
      }
      query += ' AND g.matiere = ?';
      params.push(matiere);
    }
    if (annee_scolaire) {
      query += ' AND g.annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' ORDER BY g.date_evaluation DESC';

    const [grades] = await pool.execute(query, params);
    res.json(grades);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notes' });
  }
});

// Get grade by ID - Vérifier les permissions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    const [grades] = await pool.execute(
      `SELECT g.*, s.matricule, s.classe_id, p.nom, p.prenom
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN profiles p ON s.user_id = p.id
       WHERE g.id = ?`,
      [req.params.id]
    );

    if (grades.length === 0) {
      return res.status(404).json({ message: 'Note non trouvée' });
    }

    const grade = grades[0];

    // Si élève, vérifier que c'est sa note
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, grade.student_id]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres notes' });
      }
    }
    // Si professeur, vérifier que c'est sa matière et sa classe
    else if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        const [teacherClass] = await pool.execute(
          'SELECT classe_id FROM teacher_classes WHERE teacher_id = ? AND classe_id = ? AND matiere = ?',
          [teacherId, grade.classe_id, grade.matiere]
        );
        if (teacherClass.length === 0) {
          return res.status(403).json({ message: 'Accès refusé: cette note ne concerne pas vos classes/matières' });
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    res.json(grade);
  } catch (error) {
    console.error('Get grade error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la note' });
  }
});

// Create grade - Vérifier que le professeur peut saisir cette note
router.post('/', authenticateToken, requirePermission('enter_grades'), [
  body('student_id').notEmpty(),
  body('matiere').trim().notEmpty(),
  body('note').isFloat({ min: 0, max: 20 }),
  body('date_evaluation').isISO8601(),
  body('annee_scolaire').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    const {
      student_id, matiere, note, coefficient, type_evaluation,
      date_evaluation, annee_scolaire, remarque
    } = req.body;

    // Si professeur (pas admin), vérifier qu'il peut saisir cette note
    if (isEnseignant && !isAdmin) {
      // Récupérer la classe de l'élève
      const [students] = await pool.execute(
        'SELECT classe_id FROM students WHERE id = ?',
        [student_id]
      );
      
      if (students.length === 0) {
        return res.status(404).json({ message: 'Élève non trouvé' });
      }

      const classeId = students[0].classe_id;
      if (!classeId) {
        return res.status(400).json({ message: 'L\'élève n\'a pas de classe assignée' });
      }

      // Vérifier que le professeur enseigne cette matière dans cette classe
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );

      if (teachers.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous n\'êtes pas un professeur enregistré' });
      }

      const teacherId = teachers[0].id;
      const [teacherClass] = await pool.execute(
        'SELECT classe_id FROM teacher_classes WHERE teacher_id = ? AND classe_id = ? AND matiere = ?',
        [teacherId, classeId, matiere]
      );

      if (teacherClass.length === 0) {
        return res.status(403).json({ 
          message: 'Accès refusé: vous ne pouvez saisir des notes que pour vos propres matières et classes' 
        });
      }
    }

    const id = generateUUID();

    await pool.execute(
      `INSERT INTO grades (id, student_id, matiere, note, coefficient, type_evaluation, 
        date_evaluation, annee_scolaire, remarque, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student_id, matiere, note, coefficient || 1.0, type_evaluation || 'devoir',
        date_evaluation, annee_scolaire, remarque || null, req.user.id]
    );

    res.status(201).json({ message: 'Note enregistrée avec succès', id });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la note' });
  }
});

// Update grade - Vérifier que le professeur peut modifier cette note
router.put('/:id', authenticateToken, requirePermission('enter_grades'), [
  body('note').optional().isFloat({ min: 0, max: 20 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si professeur (pas admin), vérifier qu'il peut modifier cette note
    if (isEnseignant && !isAdmin) {
      // Récupérer la note existante
      const [existingGrades] = await pool.execute(
        `SELECT g.*, s.classe_id FROM grades g
         LEFT JOIN students s ON g.student_id = s.id
         WHERE g.id = ?`,
        [req.params.id]
      );

      if (existingGrades.length === 0) {
        return res.status(404).json({ message: 'Note non trouvée' });
      }

      const existingGrade = existingGrades[0];
      const matiere = req.body.matiere || existingGrade.matiere;
      const classeId = existingGrade.classe_id;

      // Vérifier que le professeur enseigne cette matière dans cette classe
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );

      if (teachers.length === 0) {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      const teacherId = teachers[0].id;
      const [teacherClass] = await pool.execute(
        'SELECT classe_id FROM teacher_classes WHERE teacher_id = ? AND classe_id = ? AND matiere = ?',
        [teacherId, classeId, matiere]
      );

      if (teacherClass.length === 0) {
        return res.status(403).json({ 
          message: 'Accès refusé: vous ne pouvez modifier que les notes de vos propres matières et classes' 
        });
      }

      // Vérifier que le créateur est bien ce professeur (ou admin)
      if (existingGrade.created_by !== req.user.id && !isAdmin) {
        return res.status(403).json({ 
          message: 'Accès refusé: vous ne pouvez modifier que les notes que vous avez créées' 
        });
      }
    }

    const {
      matiere, note, coefficient, type_evaluation, date_evaluation, remarque
    } = req.body;

    await pool.execute(
      `UPDATE grades SET 
        matiere = COALESCE(?, matiere),
        note = COALESCE(?, note),
        coefficient = COALESCE(?, coefficient),
        type_evaluation = COALESCE(?, type_evaluation),
        date_evaluation = COALESCE(?, date_evaluation),
        remarque = COALESCE(?, remarque)
       WHERE id = ?`,
      [matiere || null, note || null, coefficient || null, type_evaluation || null,
        date_evaluation || null, remarque || null, req.params.id]
    );

    res.json({ message: 'Note modifiée avec succès' });
  } catch (error) {
    console.error('Update grade error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de la note' });
  }
});

// Delete grade - Vérifier que le professeur peut supprimer cette note
router.delete('/:id', authenticateToken, requirePermission('enter_grades'), async (req, res) => {
  try {
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si professeur (pas admin), vérifier qu'il peut supprimer cette note
    if (isEnseignant && !isAdmin) {
      const [existingGrades] = await pool.execute(
        `SELECT g.*, s.classe_id FROM grades g
         LEFT JOIN students s ON g.student_id = s.id
         WHERE g.id = ?`,
        [req.params.id]
      );

      if (existingGrades.length === 0) {
        return res.status(404).json({ message: 'Note non trouvée' });
      }

      const existingGrade = existingGrades[0];

      // Vérifier que le créateur est bien ce professeur
      if (existingGrade.created_by !== req.user.id) {
        return res.status(403).json({ 
          message: 'Accès refusé: vous ne pouvez supprimer que les notes que vous avez créées' 
        });
      }
    }

    await pool.execute('DELETE FROM grades WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note supprimée avec succès' });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la note' });
  }
});

// Get student average by subject
router.get('/student/:studentId/average', authenticateToken, async (req, res) => {
  try {
    const { matiere, annee_scolaire } = req.query;
    let query = `
      SELECT 
        matiere,
        AVG(note * coefficient) / AVG(coefficient) as moyenne,
        COUNT(*) as nombre_notes
      FROM grades
      WHERE student_id = ?
    `;
    const params = [req.params.studentId];

    if (matiere) {
      query += ' AND matiere = ?';
      params.push(matiere);
    }
    if (annee_scolaire) {
      query += ' AND annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' GROUP BY matiere';

    const [averages] = await pool.execute(query, params);
    res.json(averages);
  } catch (error) {
    console.error('Get student average error:', error);
    res.status(500).json({ message: 'Erreur lors du calcul de la moyenne' });
  }
});

export default router;

