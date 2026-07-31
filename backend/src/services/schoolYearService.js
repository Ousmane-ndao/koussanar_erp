import SchoolYear from '../models/SchoolYear.js';
import { generateUUID } from '../utils/uuid.js';

class SchoolYearService {
    async getAll() {
        return await SchoolYear.findAll();
    }

    async getById(id) {
        const year = await SchoolYear.findById(id);
        if (!year) {
            throw new Error('Année scolaire non trouvée');
        }
        return year;
    }

    async getActive() {
        return await SchoolYear.findActive();
    }

    async getCurrent() {
        const year = await SchoolYear.getCurrent();
        if (!year) {
            throw new Error('Aucune année scolaire active');
        }
        return year;
    }

    async create(data) {
        const existing = await SchoolYear.findAll();
        if (existing.some(y => y.name === data.name)) {
            throw new Error('Une année scolaire avec ce nom existe déjà');
        }
        const id = generateUUID();
        const yearData = {
            id,
            name: data.name,
            start_date: data.start_date,
            end_date: data.end_date,
            is_active: data.is_active ?? true
        };
        await SchoolYear.create(yearData);
        return this.getById(id);
    }

    async update(id, data) {
        const year = await this.getById(id);
        if (data.name && data.name !== year.name) {
            const existing = await SchoolYear.findAll();
            if (existing.some(y => y.name === data.name && y.id !== id)) {
                throw new Error('Une année scolaire avec ce nom existe déjà');
            }
        }
        await SchoolYear.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        const year = await this.getById(id);
        const periods = await SchoolYear.findPeriods(id);
        if (periods && periods.length > 0) {
            throw new Error('Impossible de supprimer une année qui a des périodes');
        }
        await SchoolYear.delete(id);
    }
}

export default SchoolYearService;