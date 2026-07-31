import Grade from '../models/Grade.js';
import { generateUUID } from '../utils/uuid.js';

class GradeService {
    async getAll(filters = {}) {
        return await Grade.findAll(filters);
    }

    async getById(id) {
        const grade = await Grade.findById(id);
        if (!grade) {
            throw new Error('Note non trouvée');
        }
        return grade;
    }

    async getByStudentAndSemester(studentId, semestreId) {
        return await Grade.findByStudentAndSemester(studentId, semestreId);
    }

    async create(data, userId) {
        // Vérifier que l'élève existe
        const [students] = await pool.execute('SELECT id FROM students WHERE id = ?', [data.student_id]);
        if (students.length === 0) {
            throw new Error('Élève non trouvé');
        }

        const id = generateUUID();
        const gradeData = {
            id,
            student_id: data.student_id,
            matiere: data.matiere || '',
            note: data.note,
            coefficient: data.coefficient || 1.0,
            type_evaluation: data.type_evaluation || 'devoir',
            date_evaluation: data.date_evaluation,
            annee_scolaire: data.annee_scolaire || this._getCurrentSchoolYear(),
            remarque: data.remarque || null,
            created_by: userId,
            semestre_id: data.semestre_id || null
        };
        await Grade.create(gradeData);
        return this.getById(id);
    }

    async update(id, data) {
        const existing = await this.getById(id);
        await Grade.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id);
        await Grade.delete(id);
    }

    // Calcul de la moyenne par matière pour un élève
    async getAverageBySubject(studentId, matiere, semestreId) {
        const result = await Grade.calculateAverage(studentId, matiere, semestreId);
        if (!result || result.nb_notes === 0) {
            return {
                moyenne_ponderee: 0,
                moyenne_simple: 0,
                total_coeff: 0,
                nb_notes: 0
            };
        }
        return {
            moyenne_ponderee: parseFloat(result.moyenne_ponderee?.toFixed(3)) || 0,
            moyenne_simple: parseFloat(result.moyenne_simple?.toFixed(3)) || 0,
            total_coeff: parseFloat(result.total_coeff?.toFixed(1)) || 0,
            nb_notes: result.nb_notes || 0
        };
    }

    // Moyenne générale d’un élève pour un semestre
    async getOverallAverage(studentId, semestreId) {
        const result = await Grade.calculateOverallAverage(studentId, semestreId);
        if (!result || result.nb_notes === 0) {
            return { moyenne_generale: 0, total_coeff: 0, nb_notes: 0 };
        }
        return {
            moyenne_generale: parseFloat(result.moyenne_generale?.toFixed(3)) || 0,
            total_coeff: parseFloat(result.total_coeff?.toFixed(1)) || 0,
            nb_notes: result.nb_notes || 0
        };
    }

    // Moyennes par matière pour un élève
    async getAveragesByStudent(studentId, semestreId) {
        const grades = await Grade.findByStudentAndSemester(studentId, semestreId);
        const matieres = {};
        for (const g of grades) {
            if (!matieres[g.matiere]) {
                matieres[g.matiere] = [];
            }
            matieres[g.matiere].push(g);
        }

        const result = [];
        for (const [matiere, notes] of Object.entries(matieres)) {
            const coeffs = notes.map(n => n.coefficient);
            const notesVals = notes.map(n => n.note);
            const moyenneSimple = notesVals.reduce((a, b) => a + b, 0) / notesVals.length;
            let sommePonderee = 0;
            let sommeCoefs = 0;
            notes.forEach((n, i) => {
                sommePonderee += n.note * coeffs[i];
                sommeCoefs += coeffs[i];
            });
            const moyennePonderee = sommeCoefs > 0 ? sommePonderee / sommeCoefs : moyenneSimple;
            result.push({
                matiere,
                moyenne_simple: parseFloat(moyenneSimple.toFixed(3)),
                moyenne_ponderee: parseFloat(moyennePonderee.toFixed(3)),
                coefficient: coeffs[0] || 1,
                nb_notes: notes.length,
                total_points: parseFloat((moyennePonderee * (coeffs[0] || 1)).toFixed(2))
            });
        }
        return result;
    }

    _getCurrentSchoolYear() {
        const year = new Date().getFullYear();
        return `${year}-${year + 1}`;
    }
}

export default GradeService;