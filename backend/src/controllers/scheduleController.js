import ScheduleService from '../services/scheduleService.js';

const scheduleService = new ScheduleService();

export const getAllSchedules = async (req, res) => {
    try {
        const filters = {};
        if (req.query.teacher_id) filters.teacher_id = req.query.teacher_id;
        if (req.query.class_id) filters.class_id = req.query.class_id;
        if (req.query.room_id) filters.room_id = req.query.room_id;
        if (req.query.school_year_id) filters.school_year_id = req.query.school_year_id;
        if (req.query.academic_period_id) filters.academic_period_id = req.query.academic_period_id;
        if (req.query.day) filters.day = req.query.day;
        const schedules = await scheduleService.getAll(filters);
        res.json(schedules);
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des emplois du temps' });
    }
};

export const getScheduleById = async (req, res) => {
    try {
        const schedule = await scheduleService.getById(req.params.id);
        res.json(schedule);
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.create(req.body);
        res.status(201).json(schedule);
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.update(req.params.id, req.body);
        res.json(schedule);
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        await scheduleService.delete(req.params.id);
        res.json({ message: 'Emploi du temps supprimé avec succès' });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(400).json({ message: error.message });
    }
};