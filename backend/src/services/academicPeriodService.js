import AcademicPeriod from '../models/AcademicPeriod.js';
import SchoolYear from '../models/SchoolYear.js';
import { generateUUID } from '../utils/uuid.js';

class AcademicPeriodService {
    async getAll(filters = {}) {
        return await AcademicPeriod.findAll(filters);
    }

    async getById(id) {
        const period = await AcademicPeriod.findById(id);
        if (!period) {
            throw new Error('Période non trouvée');
        }
        return period;
    }

    async getBySchoolYear(schoolYearId) {
        await this._checkSchoolYear(schoolYearId);
        return await AcademicPeriod.findBySchoolYear(schoolYearId);
    }

    async getActivePeriods() {
        return await AcademicPeriod.getActivePeriods();
    }

    async getCurrentPeriod() {
        const period = await AcademicPeriod.getCurrentPeriod();
        if (!period) {
            throw new Error('Aucune période active en cours');
        }
        return period;
    }

    async create(data) {
        await this._checkSchoolYear(data.school_year_id);
        // Vérifier que la séquence est unique pour l'année
        const existing = await AcademicPeriod.findBySchoolYear(data.school_year_id);
        if (existing.some(p => p.sequence === data.sequence)) {
            throw new Error('Une période avec ce numéro existe déjà pour cette année');
        }
        // Vérifier que les dates sont dans l'année scolaire
        const schoolYear = await SchoolYear.findById(data.school_year_id);
        if (data.start_date < schoolYear.start_date || data.end_date > schoolYear.end_date) {
            throw new Error('Les dates de la période doivent être comprises dans l\'année scolaire');
        }
        // Vérifier chevauchement
        for (const p of existing) {
            if (
                (data.start_date <= p.end_date && data.end_date >= p.start_date) ||
                (p.start_date <= data.end_date && p.end_date >= data.start_date)
            ) {
                throw new Error('Les périodes ne doivent pas se chevaucher');
            }
        }
        const id = generateUUID();
        const periodData = {
            id,
            school_year_id: data.school_year_id,
            name: data.name,
            type: data.type,
            sequence: data.sequence,
            start_date: data.start_date,
            end_date: data.end_date,
            is_active: data.is_active ?? true
        };
        await AcademicPeriod.create(periodData);
        return this.getById(id);
    }

    async update(id, data) {
        const period = await this.getById(id);
        if (data.school_year_id) {
            await this._checkSchoolYear(data.school_year_id);
        }
        const schoolYearId = data.school_year_id || period.school_year_id;
        // Vérifier séquence unique
        if (data.sequence !== undefined) {
            const existing = await AcademicPeriod.findBySchoolYear(schoolYearId);
            if (existing.some(p => p.sequence === data.sequence && p.id !== id)) {
                throw new Error('Une période avec ce numéro existe déjà pour cette année');
            }
        }
        // Vérifier dates
        if (data.start_date || data.end_date) {
            const schoolYear = await SchoolYear.findById(schoolYearId);
            const start = data.start_date || period.start_date;
            const end = data.end_date || period.end_date;
            if (start < schoolYear.start_date || end > schoolYear.end_date) {
                throw new Error('Les dates de la période doivent être comprises dans l\'année scolaire');
            }
            const existing = await AcademicPeriod.findBySchoolYear(schoolYearId);
            for (const p of existing) {
                if (p.id === id) continue;
                if (
                    (start <= p.end_date && end >= p.start_date) ||
                    (p.start_date <= end && p.end_date >= start)
                ) {
                    throw new Error('Les périodes ne doivent pas se chevaucher');
                }
            }
        }
        await AcademicPeriod.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        const period = await this.getById(id);
        // Vérifier s'il y a des dépendances (notes, bulletins, etc.) - on pourra ajouter plus tard
        await AcademicPeriod.delete(id);
    }

    async _checkSchoolYear(schoolYearId) {
        const year = await SchoolYear.findById(schoolYearId);
        if (!year) {
            throw new Error('Année scolaire non trouvée');
        }
        return year;
    }
}

export default AcademicPeriodService;