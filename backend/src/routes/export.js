import express from 'express';
import pool from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.js';
import {
  exportStudentsPDF,
  exportStudentsExcel,
  exportGradesPDF,
  exportGradesExcel,
  exportAttendancePDF,
  exportAttendanceExcel,
  exportFinancePDF,
  exportFinanceExcel,
  exportUsersRolesPDF,
  exportUsersRolesExcel,
} from '../utils/export.js';
import { getUserPermissions } from '../middleware/rbac.js';

const router = express.Router();

// Export students
router.get('/students/pdf', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const query = `
      SELECT s.*, 
             p.nom, p.prenom, p.email, p.telephone,
             c.nom as classe_nom
      FROM students s
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      ORDER BY p.nom, p.prenom
    `;
    const [students] = await pool.execute(query);
    
    const pdfBuffer = await exportStudentsPDF(students);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eleves_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export students PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF' });
  }
});

router.get('/students/excel', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const query = `
      SELECT s.*, 
             p.nom, p.prenom, p.email, p.telephone,
             c.nom as classe_nom
      FROM students s
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      ORDER BY p.nom, p.prenom
    `;
    const [students] = await pool.execute(query);
    
    const excelBuffer = await exportStudentsExcel(students);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="eleves_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export students Excel error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
  }
});

// Export grades
router.get('/grades/pdf', authenticateToken, requireAnyPermission('view_grades', 'enter_grades'), async (req, res) => {
  try {
    const { student_id, matiere, annee_scolaire } = req.query;
    
    let query = `
      SELECT g.*,
             s.matricule,
             p.nom, p.prenom,
             c.nom as classe_nom
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filtrage selon les permissions (implémenté dans grades.js)
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    if (isEleve) {
      // Les élèves ne voient que leurs notes
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND g.student_id = ?';
        params.push(student[0].id);
      } else {
        return res.status(403).json({ message: 'Aucun élève associé à votre compte' });
      }
    } else if (isEnseignant) {
      // Les enseignants voient les notes de leurs classes
      const [teacherClasses] = await pool.execute(
        `SELECT DISTINCT classe_id FROM teacher_classes tc
         JOIN teachers t ON tc.teacher_id = t.id
         WHERE t.user_id = ?`,
        [req.user.id]
      );
      if (teacherClasses.length > 0) {
        const classIds = teacherClasses.map(tc => tc.classe_id);
        query += ` AND s.classe_id IN (${classIds.map(() => '?').join(',')})`;
        params.push(...classIds);
      } else {
        return res.status(403).json({ message: 'Aucune classe assignée' });
      }
    }

    if (student_id) {
      query += ' AND g.student_id = ?';
      params.push(student_id);
    }
    if (matiere) {
      query += ' AND g.matiere = ?';
      params.push(matiere);
    }
    if (annee_scolaire) {
      query += ' AND g.annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' ORDER BY g.date_evaluation DESC';

    const [grades] = await pool.execute(query, params);
    
    const pdfBuffer = await exportGradesPDF(grades);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="notes_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export grades PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF' });
  }
});

router.get('/grades/excel', authenticateToken, requireAnyPermission('view_grades', 'enter_grades'), async (req, res) => {
  try {
    const { student_id, matiere, annee_scolaire } = req.query;
    
    let query = `
      SELECT g.*,
             s.matricule,
             p.nom, p.prenom,
             c.nom as classe_nom
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      WHERE 1=1
    `;
    const params = [];

    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    if (isEleve) {
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND g.student_id = ?';
        params.push(student[0].id);
      } else {
        return res.status(403).json({ message: 'Aucun élève associé à votre compte' });
      }
    } else if (isEnseignant) {
      const [teacherClasses] = await pool.execute(
        `SELECT DISTINCT classe_id FROM teacher_classes tc
         JOIN teachers t ON tc.teacher_id = t.id
         WHERE t.user_id = ?`,
        [req.user.id]
      );
      if (teacherClasses.length > 0) {
        const classIds = teacherClasses.map(tc => tc.classe_id);
        query += ` AND s.classe_id IN (${classIds.map(() => '?').join(',')})`;
        params.push(...classIds);
      } else {
        return res.status(403).json({ message: 'Aucune classe assignée' });
      }
    }

    if (student_id) {
      query += ' AND g.student_id = ?';
      params.push(student_id);
    }
    if (matiere) {
      query += ' AND g.matiere = ?';
      params.push(matiere);
    }
    if (annee_scolaire) {
      query += ' AND g.annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' ORDER BY g.date_evaluation DESC';

    const [grades] = await pool.execute(query, params);
    
    const excelBuffer = await exportGradesExcel(grades);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="notes_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export grades Excel error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
  }
});

// Export attendance
router.get('/attendance/pdf', authenticateToken, requireAnyPermission('manage_attendance', 'view_own_attendance'), async (req, res) => {
  try {
    const { date, student_id } = req.query;
    
    let query = `
      SELECT a.*,
             s.matricule,
             p.nom, p.prenom,
             c.nom as classe_nom
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      WHERE 1=1
    `;
    const params = [];

    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    if (isEleve) {
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND a.student_id = ?';
        params.push(student[0].id);
      }
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY a.date DESC';

    const [attendance] = await pool.execute(query, params);
    
    const pdfBuffer = await exportAttendancePDF(attendance);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="presences_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export attendance PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF' });
  }
});

router.get('/attendance/excel', authenticateToken, requireAnyPermission('manage_attendance', 'view_own_attendance'), async (req, res) => {
  try {
    const { date, student_id } = req.query;
    
    let query = `
      SELECT a.*,
             s.matricule,
             p.nom, p.prenom,
             c.nom as classe_nom
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN profiles p ON s.user_id = p.id
      LEFT JOIN classes c ON s.classe_id = c.id
      WHERE 1=1
    `;
    const params = [];

    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    if (isEleve) {
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND a.student_id = ?';
        params.push(student[0].id);
      }
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY a.date DESC';

    const [attendance] = await pool.execute(query, params);
    
    const excelBuffer = await exportAttendanceExcel(attendance);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="presences_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export attendance Excel error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
  }
});

// Export finance
router.get('/finance/pdf', authenticateToken, requireAnyPermission('manage_payments', 'view_payments'), async (req, res) => {
  try {
    const { student_id, annee_scolaire } = req.query;
    
    let query = `
      SELECT p.*,
             s.matricule,
             pr.nom, pr.prenom
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN profiles pr ON s.user_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    if (isEleve) {
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND p.student_id = ?';
        params.push(student[0].id);
      }
    }

    if (student_id) {
      query += ' AND p.student_id = ?';
      params.push(student_id);
    }
    if (annee_scolaire) {
      query += ' AND p.annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' ORDER BY p.created_at DESC';

    const [payments] = await pool.execute(query, params);
    
    const pdfBuffer = await exportFinancePDF(payments);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport_financier_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export finance PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF' });
  }
});

router.get('/finance/excel', authenticateToken, requireAnyPermission('manage_payments', 'view_payments'), async (req, res) => {
  try {
    const { student_id, annee_scolaire } = req.query;
    
    let query = `
      SELECT p.*,
             s.matricule,
             pr.nom, pr.prenom
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN profiles pr ON s.user_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    if (isEleve) {
      const [student] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (student.length > 0) {
        query += ' AND p.student_id = ?';
        params.push(student[0].id);
      }
    }

    if (student_id) {
      query += ' AND p.student_id = ?';
      params.push(student_id);
    }
    if (annee_scolaire) {
      query += ' AND p.annee_scolaire = ?';
      params.push(annee_scolaire);
    }

    query += ' ORDER BY p.created_at DESC';

    const [payments] = await pool.execute(query, params);
    
    const excelBuffer = await exportFinanceExcel(payments);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="rapport_financier_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export finance Excel error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
  }
});

// Export users and roles (Admin only)
router.get('/users-roles/pdf', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    // Récupérer tous les utilisateurs avec leurs rôles
    const [users] = await pool.execute(
      `SELECT p.*, 
              GROUP_CONCAT(ur.role SEPARATOR ', ') as roles_list
       FROM profiles p
       LEFT JOIN user_roles ur ON p.id = ur.user_id
       GROUP BY p.id
       ORDER BY p.nom, p.prenom`
    );

    // Enrichir avec les permissions
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const permissions = await getUserPermissions(user.id);
      return {
        ...user,
        roles: user.roles_list ? user.roles_list.split(', ') : [],
        permissions: permissions.permissions || []
      };
    }));

    const pdfBuffer = await exportUsersRolesPDF(usersWithRoles);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_roles_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export users-roles PDF error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF' });
  }
});

router.get('/users-roles/excel', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    // Récupérer tous les utilisateurs avec leurs rôles
    const [users] = await pool.execute(
      `SELECT p.*, 
              GROUP_CONCAT(ur.role SEPARATOR ', ') as roles_list
       FROM profiles p
       LEFT JOIN user_roles ur ON p.id = ur.user_id
       GROUP BY p.id
       ORDER BY p.nom, p.prenom`
    );

    // Enrichir avec les permissions
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const permissions = await getUserPermissions(user.id);
      return {
        ...user,
        roles: user.roles_list ? user.roles_list.split(', ') : [],
        permissions: permissions.permissions || []
      };
    }));

    const excelBuffer = await exportUsersRolesExcel(usersWithRoles);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_roles_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export users-roles Excel error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
  }
});

export default router;

