// API Client pour le backend Express/MySQL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiError {
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Si la réponse n'est pas du JSON
        const text = await response.text();
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          body: text,
        });
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || 'Une erreur est survenue',
          errors: data.errors,
        };
        
        // Log l'erreur dans la console
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          error: error,
          request: {
            method: options.method || 'GET',
            endpoint,
            body: options.body,
          },
        });
        
        throw error;
      }

      return data;
    } catch (error: any) {
      // Log les erreurs réseau
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error(`[Network Error] Impossible de se connecter à l'API:`, {
          endpoint,
          baseURL: this.baseURL,
          error: error.message,
        });
        throw new Error('Erreur de connexion au serveur. Vérifiez que le serveur backend est démarré.');
      }
      
      // Re-lancer l'erreur si elle a déjà été traitée
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request<{
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        nom: string;
        prenom: string;
        roles: string[];
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.token);
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    telephone?: string;
    adresse?: string;
    role?: string;
  }) {
    const data = await this.request<{
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        nom: string;
        prenom: string;
        role: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{
      user: {
        id: string;
        email: string;
        nom: string;
        prenom: string;
        roles: string[];
      };
    }>('/auth/me');
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Students methods
  async getStudents() {
    const data = await this.request<any[]>('/students');
    // The backend returns nom, prenom directly from the JOIN, so no transformation needed
    return data;
  }

  async getStudent(id: string) {
    return this.request<any>(`/students/${id}`);
  }

  async createStudent(studentData: any) {
    return this.request<{ message: string; id: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: string, studentData: any) {
    return this.request<{ message: string }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id: string) {
    return this.request<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Classes methods
  async getClasses() {
    return this.request<any[]>('/classes');
  }

  async getClass(id: string) {
    return this.request<any>(`/classes/${id}`);
  }

  async createClass(classData: any) {
    return this.request<{ message: string; id: string }>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async updateClass(id: string, classData: any) {
    return this.request<{ message: string }>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  }

  async deleteClass(id: string) {
    return this.request<{ message: string }>(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance methods
  async getAttendanceByDate(date: string) {
    const data = await this.request<any[]>(`/attendance/date/${date}`);
    // Format response to match frontend expectations
    return data.map((record: any) => ({
      ...record,
      student_id: record.student_id,
      status: record.status,
      date: record.date,
    }));
  }

  async getAttendanceByStudent(studentId: string) {
    return this.request<any[]>(`/attendance/student/${studentId}`);
  }

  async saveAttendance(attendanceData: {
    student_id: string;
    date: string;
    status: 'present' | 'absent' | 'retard';
    heure_arrivee?: string;
    remarque?: string;
  }) {
    return this.request<{ message: string; id?: string }>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getAttendanceStats(date: string) {
    try {
      return await this.request<{
        total: number;
        present: number;
        absent: number;
        retard: number;
      }>(`/attendance/stats/${date}`);
    } catch (error) {
      // Retourner des stats vides si aucune donnée
      return {
        total: 0,
        present: 0,
        absent: 0,
        retard: 0,
      };
    }
  }

  // Finance methods
  async getPayments() {
    return this.request<any[]>('/finance');
  }

  async getPaymentsByStudent(studentId: string) {
    return this.request<any[]>(`/finance/student/${studentId}`);
  }

  async createPayment(paymentData: any) {
    return this.request<{ message: string; id: string }>('/finance', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getFinanceStats(anneeScolaire?: string) {
    try {
      const url = anneeScolaire
        ? `/finance/stats/${anneeScolaire}`
        : '/finance/stats';
      return await this.request<{
        total_transactions: number;
        total_recettes: number;
        total_paye: number;
        total_attente: number;
        total_students: number;
        annee_scolaire: string;
      }>(url);
    } catch (error) {
      // Retourner des stats vides si aucune donnée
      return {
        total_transactions: 0,
        total_recettes: 0,
        total_paye: 0,
        total_attente: 0,
        total_students: 0,
        annee_scolaire: anneeScolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      };
    }
  }

  // Messages/Announcements methods
  async getAnnouncements() {
    const data = await this.request<any[]>('/messages');
    // Format response to match frontend expectations
    return data.map((announcement: any) => ({
      ...announcement,
      profiles: {
        nom: announcement.nom,
        prenom: announcement.prenom,
      },
    }));
  }

  async getAnnouncement(id: string) {
    return this.request<any>(`/messages/${id}`);
  }

  async createAnnouncement(announcementData: {
    titre: string;
    contenu: string;
    type: 'info' | 'important' | 'urgence';
  }) {
    return this.request<{ message: string; id: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async updateAnnouncement(id: string, announcementData: any) {
    return this.request<{ message: string }>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request<{ message: string }>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Documents methods
  async getDocuments() {
    const data = await this.request<any[]>('/documents');
    // Format response to match frontend expectations
    return data.map((doc: any) => ({
      ...doc,
      profiles: {
        nom: doc.nom,
        prenom: doc.prenom,
      },
    }));
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}`);
  }

  async uploadDocument(formData: FormData) {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type, let the browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur lors du téléversement');
    }

    return response.json();
  }

  async deleteDocument(id: string) {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Grades methods
  async getGrades(filters?: {
    student_id?: string;
    matiere?: string;
    annee_scolaire?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', filters.student_id);
    if (filters?.matiere) params.append('matiere', filters.matiere);
    if (filters?.annee_scolaire) params.append('annee_scolaire', filters.annee_scolaire);
    
    const query = params.toString();
    return this.request<any[]>(`/grades${query ? `?${query}` : ''}`);
  }

  async getGrade(id: string) {
    return this.request<any>(`/grades/${id}`);
  }

  async createGrade(gradeData: any) {
    return this.request<{ message: string; id: string }>('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  }

  async updateGrade(id: string, gradeData: any) {
    return this.request<{ message: string }>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  async deleteGrade(id: string) {
    return this.request<{ message: string }>(`/grades/${id}`, {
      method: 'DELETE',
    });
  }

  async getStudentAverage(studentId: string, filters?: {
    matiere?: string;
    annee_scolaire?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.matiere) params.append('matiere', filters.matiere);
    if (filters?.annee_scolaire) params.append('annee_scolaire', filters.annee_scolaire);
    
    const query = params.toString();
    return this.request<any[]>(`/grades/student/${studentId}/average${query ? `?${query}` : ''}`);
  }

  // Teachers methods
  async getTeachers() {
    return this.request<any[]>('/teachers');
  }

  async getTeacher(id: string) {
    return this.request<any>(`/teachers/${id}`);
  }

  async createTeacher(teacherData: any) {
    return this.request<{ message: string; id: string }>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  async updateTeacher(id: string, teacherData: any) {
    return this.request<{ message: string }>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  }

  async deleteTeacher(id: string) {
    return this.request<{ message: string }>(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedules methods
  async getSchedules(params?: { classe_id?: string; jour?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.classe_id) queryParams.append('classe_id', params.classe_id);
    if (params?.jour) queryParams.append('jour', params.jour);
    const query = queryParams.toString();
    return this.request<any[]>(`/schedules${query ? `?${query}` : ''}`);
  }

  async getSchedule(id: string) {
    return this.request<any>(`/schedules/${id}`);
  }

  async createSchedule(scheduleData: any) {
    return this.request<{ message: string; id: string }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(id: string, scheduleData: any) {
    return this.request<{ message: string }>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteSchedule(id: string) {
    return this.request<{ message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

