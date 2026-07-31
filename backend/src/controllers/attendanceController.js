import AttendanceService from '../services/attendanceService.js';

const attendanceService = new AttendanceService();

export const getAllAttendance = async (req, res) => {
    try {
        const filters = {};
        if (req.query.student_id) filters.student_id = req.query.student_id;
        if (req.query.class_id) filters.class_id = req.query.class_id;
        if (req.query.status_id) filters.status_id = req.query.status_id;
        if (req.query.date) filters.date = req.query.date;
        if (req.query.start_date && req.query.end_date) {
            filters.start_date = req.query.start_date;
            filters.end_date = req.query.end_date;
        }
        const records = await attendanceService.getAll(filters);
        res.json(records);
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des présences' });
    }
};

export const getAttendanceById = async (req, res) => {
    try {
        const record = await attendanceService.getById(req.params.id);
        res.json(record);
    } catch (error) {
        console.error('Get attendance by id error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const getAttendanceByStudentAndDate = async (req, res) => {
    try {
        const { studentId, date } = req.params;
        const record = await attendanceService.getByStudentAndDate(studentId, date);
        res.json(record || null);
    } catch (error) {
        console.error('Get attendance by student/date error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const record = await attendanceService.create(req.body, req.user.id);
        res.status(201).json(record);
    } catch (error) {
        console.error('Create attendance error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const record = await attendanceService.update(req.params.id, req.body, req.user.id);
        res.json(record);
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteAttendance = async (req, res) => {
    try {
        await attendanceService.delete(req.params.id);
        res.json({ message: 'Enregistrement de présence supprimé avec succès' });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const getStudentStats = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { start_date, end_date } = req.query;
        const stats = await attendanceService.getStats(studentId, start_date, end_date);
        res.json(stats);
    } catch (error) {
        console.error('Get student stats error:', error);
        res.status(500).json({ message: error.message });
    }
};