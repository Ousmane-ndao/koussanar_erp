import GradeService from '../services/gradeService.js';

const gradeService = new GradeService();

// ============================================================
// GET /api/grades
// ============================================================
export const getAllGrades = async (req, res) => {
    try {
        const filters = {
            student_id: req.query.student_id,
            matiere: req.query.matiere,
            annee_scolaire: req.query.annee_scolaire,
            semestre_id: req.query.semestre_id,
            class_id: req.query.class_id
        };
        const grades = await gradeService.getAll(filters);
        res.json(grades);
    } catch (error) {
        console.error('Get all grades error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des notes' });
    }
};

// ============================================================
// GET /api/grades/:id
// ============================================================
export const getGradeById = async (req, res) => {
    try {
        const grade = await gradeService.getById(req.params.id);
        res.json(grade);
    } catch (error) {
        console.error('Get grade by id error:', error);
        res.status(404).json({ message: error.message });
    }
};

// ============================================================
// GET /api/grades/student/:studentId/semester/:semestreId
// ============================================================
export const getGradesByStudentAndSemester = async (req, res) => {
    try {
        const { studentId, semestreId } = req.params;
        const grades = await gradeService.getByStudentAndSemester(studentId, semestreId);
        res.json(grades);
    } catch (error) {
        console.error('Get grades by student/semester error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// POST /api/grades
// ============================================================
export const createGrade = async (req, res) => {
    try {
        const grade = await gradeService.create(req.body, req.user.id);
        res.status(201).json(grade);
    } catch (error) {
        console.error('Create grade error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ============================================================
// PUT /api/grades/:id
// ============================================================
export const updateGrade = async (req, res) => {
    try {
        const grade = await gradeService.update(req.params.id, req.body);
        res.json(grade);
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ============================================================
// DELETE /api/grades/:id
// ============================================================
export const deleteGrade = async (req, res) => {
    try {
        await gradeService.delete(req.params.id);
        res.json({ message: 'Note supprimée avec succès' });
    } catch (error) {
        console.error('Delete grade error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ============================================================
// GET /api/grades/student/:studentId/average
// ============================================================
export const getAverages = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semestre_id } = req.query;
        if (!semestre_id) {
            return res.status(400).json({ message: 'semestre_id requis' });
        }
        const averages = await gradeService.getAveragesByStudent(studentId, semestre_id);
        res.json(averages);
    } catch (error) {
        console.error('Get averages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// GET /api/grades/student/:studentId/overall-average
// ============================================================
export const getOverallAverage = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semestre_id } = req.query;
        if (!semestre_id) {
            return res.status(400).json({ message: 'semestre_id requis' });
        }
        const result = await gradeService.getOverallAverage(studentId, semestre_id);
        res.json(result);
    } catch (error) {
        console.error('Get overall average error:', error);
        res.status(500).json({ message: error.message });
    }
};