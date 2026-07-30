import express from 'express';
import * as schoolYearController from '../controllers/schoolYearController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Routes publiques (authentifiées)
router.get('/', authenticateToken, schoolYearController.getAllSchoolYears);
router.get('/active', authenticateToken, schoolYearController.getActiveSchoolYears);
router.get('/current', authenticateToken, schoolYearController.getCurrentSchoolYear);
router.get('/:id', authenticateToken, schoolYearController.getSchoolYearById);

// Routes admin
router.post('/', authenticateToken, requirePermission('manage_users'), schoolYearController.createSchoolYear);
router.put('/:id', authenticateToken, requirePermission('manage_users'), schoolYearController.updateSchoolYear);
router.delete('/:id', authenticateToken, requirePermission('manage_users'), schoolYearController.deleteSchoolYear);

export default router;