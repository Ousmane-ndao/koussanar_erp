import express from 'express';
import * as schoolYearController from '../controllers/schoolYearController.js';

const router = express.Router();

router.get('/', schoolYearController.getAllSchoolYears);
router.get('/active', schoolYearController.getActiveSchoolYears);
router.get('/current', schoolYearController.getCurrentSchoolYear);
router.get('/:id', schoolYearController.getSchoolYearById);
router.post('/', schoolYearController.createSchoolYear);
router.put('/:id', schoolYearController.updateSchoolYear);
router.delete('/:id', schoolYearController.deleteSchoolYear);

export default router;