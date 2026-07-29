import express from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|mp4|webm|avi|mov|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Get documents visible to current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user roles
    let roles = [];
    try {
      const [rolesRows] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ?', [req.user.id]);
      roles = rolesRows.map(r => r.role);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Continue with empty roles array
    }

    const isAdmin = roles.includes('admin');
    const isEnseignant = roles.includes('enseignant');
    const isEleve = roles.includes('eleve');

    let userClasseIds = [];
    try {
      if (isEleve) {
        // 🔥 Correction : remplacer statut_inscription par statut
      // ✅ CORRECT
const [studentRows] = await pool.execute('SELECT classe_id FROM students WHERE user_id = ? AND statut_inscription = "actif"', [req.user.id]);
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
      // Continue with empty classeIds array
    }

    // Admin can see all
    let where = '';
    let params = [];
    if (!isAdmin) {
      const conditions = [
        "d.visibilite = 'public'",
        'd.uploaded_by = ?'
      ];
      params.push(req.user.id);

      if (userClasseIds.length > 0) {
        const placeholders = userClasseIds.map(() => '?').join(',');
        conditions.push(`(d.visibilite = 'classe' AND d.classe_id IN (${placeholders}))`);
        params.push(...userClasseIds);
      }

      where = `WHERE ${conditions.join(' OR ')}`;
    }

    const query = `
      SELECT d.*, p.nom, p.prenom
      FROM documents d
      LEFT JOIN profiles p ON d.uploaded_by = p.id
      ${where}
      ORDER BY d.created_at DESC
    `;

    const [documents] = await pool.execute(query, params);
    res.json(documents || []);
  } catch (error) {
    console.error('Get documents error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Erreur lors de la récupération des documents',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Get document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT d.*, p.nom, p.prenom
       FROM documents d
       LEFT JOIN profiles p ON d.uploaded_by = p.id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    res.json(documents[0]);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du document' });
  }
});

// Upload document (support visibility and classe targeting)
router.post('/', authenticateToken, upload.single('file'), [
  body('nom').trim().notEmpty(),
  body('categorie').isIn(['releves_notes', 'emplois_temps', 'circulaires', 'bulletins', 'autre', 'cours', 'exercice', 'video']),
  body('visibilite').optional().isIn(['public', 'classe', 'prive']),
  body('classe_id').optional().isString().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { nom, categorie, visibilite, classe_id } = req.body;
    const id = generateUUID();
    const fileUrl = `/uploads/${req.file.filename}`;

    let finalVisibilite = visibilite || 'public';
    let finalClasseId = null;
    if (finalVisibilite === 'classe') {
      if (!classe_id) {
        return res.status(400).json({ message: 'classe_id requis pour visibilite=classe' });
      }
      finalClasseId = classe_id;
    }

    await pool.execute(
      `INSERT INTO documents (id, nom, categorie, visibilite, classe_id, type_fichier, taille, url, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, categorie || 'autre', finalVisibilite, finalClasseId, req.file.mimetype, req.file.size, fileUrl, req.user.id]
    );

    res.status(201).json({ message: 'Document téléversé avec succès', id, url: fileUrl });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Erreur lors du téléversement du document' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get document info
    const [documents] = await pool.execute(
      'SELECT url, uploaded_by FROM documents WHERE id = ?',
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Check if user is the uploader or admin
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
      [req.user.id]
    );

    if (documents[0].uploaded_by !== req.user.id && roles.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce document' });
    }

    // Delete file
    if (documents[0].url) {
      const filePath = path.join(process.cwd(), documents[0].url);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete from database
    await pool.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du document' });
  }
});

export default router;