import { body, validationResult } from 'express-validator';

export const validateSchoolYear = [
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('start_date').isISO8601().withMessage('Date de début invalide'),
    body('end_date').isISO8601().withMessage('Date de fin invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validateAcademicPeriod = [
    body('school_year_id').notEmpty().withMessage('Année scolaire requise'),
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('type').isIn(['semester', 'trimester', 'quarter', 'bimester']).withMessage('Type invalide'),
    body('sequence').isInt({ min: 1 }).withMessage('Séquence invalide'),
    body('start_date').isISO8601().withMessage('Date de début invalide'),
    body('end_date').isISO8601().withMessage('Date de fin invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];