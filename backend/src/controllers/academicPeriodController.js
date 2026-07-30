import AcademicPeriodService from '../services/academicPeriodService.js';

const academicPeriodService = new AcademicPeriodService();

export const getAllPeriods = async (req, res) => {
    try {
        const filters = {};
        if (req.query.school_year_id) filters.school_year_id = req.query.school_year_id;
        if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';
        const periods = await academicPeriodService.getAll(filters);
        res.json(periods);
    } catch (error) {
        console.error('Get all periods error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des périodes' });
    }
};

export const getPeriodById = async (req, res) => {
    try {
        const period = await academicPeriodService.getById(req.params.id);
        res.json(period);
    } catch (error) {
        console.error('Get period error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const getPeriodsBySchoolYear = async (req, res) => {
    try {
        const periods = await academicPeriodService.getBySchoolYear(req.params.schoolYearId);
        res.json(periods);
    } catch (error) {
        console.error('Get periods by school year error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const getActivePeriods = async (req, res) => {
    try {
        const periods = await academicPeriodService.getActivePeriods();
        res.json(periods);
    } catch (error) {
        console.error('Get active periods error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des périodes actives' });
    }
};

export const getCurrentPeriod = async (req, res) => {
    try {
        const period = await academicPeriodService.getCurrentPeriod();
        res.json(period);
    } catch (error) {
        console.error('Get current period error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const createPeriod = async (req, res) => {
    try {
        const period = await academicPeriodService.create(req.body);
        res.status(201).json(period);
    } catch (error) {
        console.error('Create period error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updatePeriod = async (req, res) => {
    try {
        const period = await academicPeriodService.update(req.params.id, req.body);
        res.json(period);
    } catch (error) {
        console.error('Update period error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deletePeriod = async (req, res) => {
    try {
        await academicPeriodService.delete(req.params.id);
        res.json({ message: 'Période supprimée avec succès' });
    } catch (error) {
        console.error('Delete period error:', error);
        res.status(400).json({ message: error.message });
    }
};