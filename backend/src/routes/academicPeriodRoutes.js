import express from 'express';
import * as academicPeriodController from '../controllers/academicPeriodController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', authenticateToken, academicPeriodController.getAllPeriods);
router.get('/active', authenticateToken, academicPeriodController.getActivePeriods);
router.get('/current', authenticateToken, academicPeriodController.getCurrentPeriod);
router.get('/school-year/:schoolYearId', authenticateToken, academicPeriodController.getPeriodsBySchoolYear);
router.get('/:id', authenticateToken, academicPeriodController.getPeriodById);

router.post('/', authenticateToken, requirePermission('manage_users'), academicPeriodController.createPeriod);
router.put('/:id', authenticateToken, requirePermission('manage_users'), academicPeriodController.updatePeriod);
router.delete('/:id', authenticateToken, requirePermission('manage_users'), academicPeriodController.deletePeriod);

export default router;