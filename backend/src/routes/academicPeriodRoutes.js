import express from 'express';
import * as academicPeriodController from '../controllers/academicPeriodController.js';

const router = express.Router();

// Routes sans authentification pour le moment (à réactiver après correction)
router.get('/', academicPeriodController.getAllPeriods);
router.get('/active', academicPeriodController.getActivePeriods);
router.get('/current', academicPeriodController.getCurrentPeriod);
router.get('/school-year/:schoolYearId', academicPeriodController.getPeriodsBySchoolYear);
router.get('/:id', academicPeriodController.getPeriodById);
router.post('/', academicPeriodController.createPeriod);
router.put('/:id', academicPeriodController.updatePeriod);
router.delete('/:id', academicPeriodController.deletePeriod);

export default router;