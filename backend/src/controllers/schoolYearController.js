import SchoolYearService from '../services/schoolYearService.js';

const schoolYearService = new SchoolYearService();

export const getAllSchoolYears = async (req, res) => {
    try {
        const years = await schoolYearService.getAll();
        res.json(years);
    } catch (error) {
        console.error('Get all school years error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des années scolaires' });
    }
};

export const getSchoolYearById = async (req, res) => {
    try {
        const year = await schoolYearService.getById(req.params.id);
        res.json(year);
    } catch (error) {
        console.error('Get school year error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const getActiveSchoolYears = async (req, res) => {
    try {
        const years = await schoolYearService.getActive();
        res.json(years);
    } catch (error) {
        console.error('Get active school years error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des années actives' });
    }
};

export const getCurrentSchoolYear = async (req, res) => {
    try {
        const year = await schoolYearService.getCurrent();
        res.json(year);
    } catch (error) {
        console.error('Get current school year error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const createSchoolYear = async (req, res) => {
    try {
        const year = await schoolYearService.create(req.body);
        res.status(201).json(year);
    } catch (error) {
        console.error('Create school year error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateSchoolYear = async (req, res) => {
    try {
        const year = await schoolYearService.update(req.params.id, req.body);
        res.json(year);
    } catch (error) {
        console.error('Update school year error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteSchoolYear = async (req, res) => {
    try {
        await schoolYearService.delete(req.params.id);
        res.json({ message: 'Année scolaire supprimée avec succès' });
    } catch (error) {
        console.error('Delete school year error:', error);
        res.status(400).json({ message: error.message });
    }
};