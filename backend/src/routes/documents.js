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
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT d.*,
             p.nom, p.prenom
      FROM documents d
      LEFT JOIN profiles p ON d.uploaded_by = p.id
      ORDER BY d.created_at DESC
    `;
    const [documents] = await pool.execute(query);
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
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

// Upload document
router.post('/', authenticateToken, upload.single('file'), [
  body('nom').trim().notEmpty(),
  body('categorie').isIn(['releves_notes', 'emplois_temps', 'circulaires', 'bulletins', 'autre']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { nom, categorie } = req.body;
    const id = generateUUID();
    const fileUrl = `/uploads/${req.file.filename}`;

    await pool.execute(
      `INSERT INTO documents (id, nom, categorie, type_fichier, taille, url, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, categorie || 'autre', req.file.mimetype, req.file.size, fileUrl, req.user.id]
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

