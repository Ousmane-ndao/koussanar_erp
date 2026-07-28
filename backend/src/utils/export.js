import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

/**
 * Génère un PDF pour les élèves
 */
export async function exportStudentsPDF(students, title = 'Liste des Élèves') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Tableau
      const tableTop = doc.y;
      const tableLeft = 50;
      const rowHeight = 25;
      const colWidths = [80, 100, 100, 80, 80, 100];
      const headers = ['Matricule', 'Nom', 'Prénom', 'Classe', 'Sexe', 'Téléphone'];

      // En-têtes du tableau
      doc.fontSize(10).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      // Ligne de séparation
      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      // Données
      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 30;
      students.forEach((student, index) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        const row = [
          student.matricule || '',
          student.nom || '',
          student.prenom || '',
          student.classe_nom || 'Non assigné',
          student.sexe === 'M' ? 'M' : 'F',
          student.telephone || ''
        ];

        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un Excel pour les élèves
 */
export async function exportStudentsExcel(students, title = 'Liste des Élèves') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Élèves');

  // En-têtes
  worksheet.columns = [
    { header: 'Matricule', key: 'matricule', width: 15 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Classe', key: 'classe_nom', width: 20 },
    { header: 'Sexe', key: 'sexe', width: 10 },
    { header: 'Date de naissance', key: 'date_naissance', width: 18 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Statut', key: 'statut_inscription', width: 15 },
  ];

  // Style des en-têtes
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Données
  students.forEach(student => {
    worksheet.addRow({
      matricule: student.matricule || '',
      nom: student.nom || '',
      prenom: student.prenom || '',
      classe_nom: student.classe_nom || 'Non assigné',
      sexe: student.sexe === 'M' ? 'Masculin' : 'Féminin',
      date_naissance: student.date_naissance || '',
      telephone: student.telephone || '',
      email: student.email || '',
      statut_inscription: student.statut_inscription || 'actif',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Génère un PDF pour les notes
 */
export async function exportGradesPDF(grades, title = 'Liste des Notes') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      const tableTop = doc.y;
      const tableLeft = 50;
      const rowHeight = 25;
      const colWidths = [100, 100, 100, 60, 80, 80, 100];
      const headers = ['Élève', 'Matière', 'Note', 'Coef', 'Type', 'Date', 'Année'];

      doc.fontSize(10).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 30;
      grades.forEach((grade) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        // Formater la date correctement
        let dateFormatted = '';
        if (grade.date_evaluation) {
          try {
            let date;
            if (grade.date_evaluation instanceof Date) {
              date = grade.date_evaluation;
            } else if (typeof grade.date_evaluation === 'string') {
              // Si c'est une chaîne, essayer de la parser
              if (grade.date_evaluation.includes('T')) {
                date = new Date(grade.date_evaluation);
              } else if (grade.date_evaluation.includes('-')) {
                date = new Date(grade.date_evaluation + 'T00:00:00');
              } else {
                date = new Date(grade.date_evaluation);
              }
            } else {
              date = new Date(grade.date_evaluation);
            }
            
            if (!isNaN(date.getTime())) {
              // Utiliser UTC pour éviter les problèmes de timezone
              const day = String(date.getUTCDate()).padStart(2, '0');
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              const year = date.getUTCFullYear();
              dateFormatted = `${day}/${month}/${year}`;
            } else {
              // Fallback: si la date est déjà formatée en string
              const dateStr = String(grade.date_evaluation);
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                dateFormatted = dateStr.split('T')[0].split('-').reverse().join('/');
              } else {
                dateFormatted = dateStr;
              }
            }
          } catch (e) {
            // En cas d'erreur, essayer de formater la chaîne
            const dateStr = String(grade.date_evaluation);
            if (dateStr.includes('T')) {
              dateFormatted = dateStr.split('T')[0].split('-').reverse().join('/');
            } else if (dateStr.includes('-')) {
              dateFormatted = dateStr.split('-').reverse().join('/');
            } else {
              dateFormatted = dateStr;
            }
          }
        }

        // S'assurer que l'année scolaire est une chaîne propre
        let anneeScolaire = '';
        if (grade.annee_scolaire) {
          const anneeStr = String(grade.annee_scolaire).trim();
          // Extraire seulement l'année si c'est un format complexe
          if (anneeStr.includes('-')) {
            anneeScolaire = anneeStr;
          } else {
            anneeScolaire = anneeStr;
          }
        }

        const row = [
          `${grade.nom || ''} ${grade.prenom || ''}`.trim(),
          grade.matiere || '',
          grade.note || '',
          grade.coefficient || '1',
          grade.type_evaluation || '',
          dateFormatted,
          anneeScolaire
        ];

        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un Excel pour les notes
 */
export async function exportGradesExcel(grades, title = 'Liste des Notes') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Notes');

  worksheet.columns = [
    { header: 'Élève', key: 'eleve', width: 25 },
    { header: 'Matière', key: 'matiere', width: 20 },
    { header: 'Note', key: 'note', width: 10 },
    { header: 'Coefficient', key: 'coefficient', width: 12 },
    { header: 'Type', key: 'type_evaluation', width: 15 },
    { header: 'Date', key: 'date_evaluation', width: 15 },
    { header: 'Année scolaire', key: 'annee_scolaire', width: 15 },
    { header: 'Remarque', key: 'remarque', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  grades.forEach(grade => {
    // Formater la date correctement
    let dateFormatted = '';
    if (grade.date_evaluation) {
      try {
        let date;
        if (grade.date_evaluation instanceof Date) {
          date = grade.date_evaluation;
        } else if (typeof grade.date_evaluation === 'string') {
          // Si c'est une chaîne, essayer de la parser
          if (grade.date_evaluation.includes('T')) {
            date = new Date(grade.date_evaluation);
          } else if (grade.date_evaluation.includes('-')) {
            date = new Date(grade.date_evaluation + 'T00:00:00');
          } else {
            date = new Date(grade.date_evaluation);
          }
        } else {
          date = new Date(grade.date_evaluation);
        }
        
        if (!isNaN(date.getTime())) {
          // Utiliser UTC pour éviter les problèmes de timezone
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          dateFormatted = `${day}/${month}/${year}`;
        } else {
          // Fallback: si la date est déjà formatée en string
          const dateStr = String(grade.date_evaluation);
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            dateFormatted = dateStr.split('T')[0].split('-').reverse().join('/');
          } else {
            dateFormatted = dateStr;
          }
        }
      } catch (e) {
        // En cas d'erreur, essayer de formater la chaîne
        const dateStr = String(grade.date_evaluation);
        if (dateStr.includes('T')) {
          dateFormatted = dateStr.split('T')[0].split('-').reverse().join('/');
        } else if (dateStr.includes('-')) {
          dateFormatted = dateStr.split('-').reverse().join('/');
        } else {
          dateFormatted = dateStr;
        }
      }
    }

    // S'assurer que l'année scolaire est une chaîne propre
    let anneeScolaire = '';
    if (grade.annee_scolaire) {
      const anneeStr = String(grade.annee_scolaire).trim();
      // Extraire seulement l'année si c'est un format complexe
      if (anneeStr.includes('-')) {
        anneeScolaire = anneeStr;
      } else {
        anneeScolaire = anneeStr;
      }
    }

    worksheet.addRow({
      eleve: `${grade.nom || ''} ${grade.prenom || ''}`.trim(),
      matiere: grade.matiere || '',
      note: grade.note || '',
      coefficient: grade.coefficient || 1,
      type_evaluation: grade.type_evaluation || '',
      date_evaluation: dateFormatted,
      annee_scolaire: anneeScolaire,
      remarque: grade.remarque || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Génère un PDF pour les présences
 */
export async function exportAttendancePDF(attendance, title = 'Liste des Présences') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      const tableTop = doc.y;
      const tableLeft = 50;
      const rowHeight = 25;
      const colWidths = [100, 100, 100, 80, 80, 150];
      const headers = ['Élève', 'Date', 'Statut', 'Heure', 'Classe', 'Remarque'];

      doc.fontSize(10).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 30;
      attendance.forEach((record) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        const statusText = record.status === 'present' ? 'Présent' : 
                          record.status === 'absent' ? 'Absent' : 'Retard';
        
        const row = [
          `${record.nom || ''} ${record.prenom || ''}`.trim(),
          record.date || '',
          statusText,
          record.heure_arrivee || '',
          record.classe_nom || '',
          record.remarque || ''
        ];

        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un Excel pour les présences
 */
export async function exportAttendanceExcel(attendance, title = 'Liste des Présences') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Présences');

  worksheet.columns = [
    { header: 'Élève', key: 'eleve', width: 25 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Statut', key: 'status', width: 15 },
    { header: 'Heure d\'arrivée', key: 'heure_arrivee', width: 15 },
    { header: 'Classe', key: 'classe_nom', width: 20 },
    { header: 'Remarque', key: 'remarque', width: 40 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  attendance.forEach(record => {
    const statusText = record.status === 'present' ? 'Présent' : 
                      record.status === 'absent' ? 'Absent' : 'Retard';
    
    worksheet.addRow({
      eleve: `${record.nom || ''} ${record.prenom || ''}`.trim(),
      date: record.date || '',
      status: statusText,
      heure_arrivee: record.heure_arrivee || '',
      classe_nom: record.classe_nom || '',
      remarque: record.remarque || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Génère un PDF pour les paiements
 */
export async function exportFinancePDF(payments, title = 'Rapport Financier') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      
      // Statistiques
      const total = payments.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text(`Total: ${total.toLocaleString('fr-FR')} FCFA`);
      doc.moveDown(2);

      const tableTop = doc.y;
      const tableLeft = 50;
      const rowHeight = 25;
      const colWidths = [100, 120, 80, 80, 80, 100];
      const headers = ['Élève', 'Type', 'Montant', 'Mois', 'Statut', 'Date'];

      doc.fontSize(10).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 30;
      payments.forEach((payment) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        const row = [
          `${payment.nom || ''} ${payment.prenom || ''}`.trim(),
          payment.type_paiement || '',
          `${parseFloat(payment.montant || 0).toLocaleString('fr-FR')} FCFA`,
          payment.mois_paye || '',
          payment.statut || '',
          payment.created_at ? new Date(payment.created_at).toLocaleDateString('fr-FR') : ''
        ];

        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un Excel pour les paiements
 */
export async function exportFinanceExcel(payments, title = 'Rapport Financier') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Paiements');

  worksheet.columns = [
    { header: 'Élève', key: 'eleve', width: 25 },
    { header: 'Type de paiement', key: 'type_paiement', width: 20 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Mois payé', key: 'mois_paye', width: 15 },
    { header: 'Année scolaire', key: 'annee_scolaire', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
    { header: 'Date', key: 'created_at', width: 15 },
    { header: 'Remarque', key: 'remarque', width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  payments.forEach(payment => {
    worksheet.addRow({
      eleve: `${payment.nom || ''} ${payment.prenom || ''}`.trim(),
      type_paiement: payment.type_paiement || '',
      montant: parseFloat(payment.montant || 0),
      mois_paye: payment.mois_paye || '',
      annee_scolaire: payment.annee_scolaire || '',
      statut: payment.statut || '',
      created_at: payment.created_at ? new Date(payment.created_at).toLocaleDateString('fr-FR') : '',
      remarque: payment.remarque || '',
    });
  });

  // Ajouter une ligne de total
  const totalRow = worksheet.addRow({});
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(3).value = {
    formula: `SUM(C2:C${payments.length + 1})`,
    result: payments.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0)
  };
  totalRow.getCell(3).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Génère un PDF pour les utilisateurs et leurs rôles
 */
export async function exportUsersRolesPDF(users, title = 'Liste des Utilisateurs et Rôles') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      const tableTop = doc.y;
      const tableLeft = 50;
      const rowHeight = 25;
      const colWidths = [80, 120, 120, 150, 100, 80];
      const headers = ['Email', 'Nom', 'Prénom', 'Rôles', 'Téléphone', 'Statut'];

      doc.fontSize(10).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 20)
        .stroke();

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 30;
      users.forEach((user) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        const rolesText = user.roles && user.roles.length > 0 
          ? user.roles.join(', ') 
          : 'Aucun rôle';
        
        const statutText = user.statut_actif ? 'Actif' : 'Inactif';

        const row = [
          user.email || '',
          user.nom || '',
          user.prenom || '',
          rolesText,
          user.telephone || '',
          statutText
        ];

        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;
      });

      // Statistiques
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.statut_actif).length;
      const roleCounts = {};
      users.forEach(user => {
        if (user.roles && user.roles.length > 0) {
          user.roles.forEach(role => {
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });
        }
      });

      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Statistiques', { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(12);
      doc.text(`Total d'utilisateurs: ${totalUsers}`);
      doc.text(`Utilisateurs actifs: ${activeUsers}`);
      doc.text(`Utilisateurs inactifs: ${totalUsers - activeUsers}`);
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Répartition par rôle:');
      doc.font('Helvetica');
      Object.entries(roleCounts).forEach(([role, count]) => {
        doc.text(`  - ${role}: ${count}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un Excel pour les utilisateurs et leurs rôles
 */
export async function exportUsersRolesExcel(users, title = 'Liste des Utilisateurs et Rôles') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Utilisateurs et Rôles');

  worksheet.columns = [
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Rôles', key: 'roles', width: 30 },
    { header: 'Permissions', key: 'permissions', width: 40 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Adresse', key: 'adresse', width: 30 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Date de création', key: 'created_at', width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  users.forEach(user => {
    const rolesText = user.roles && user.roles.length > 0 
      ? user.roles.join(', ') 
      : 'Aucun rôle';
    
    const permissionsText = user.permissions && user.permissions.length > 0
      ? user.permissions.join(', ')
      : 'Aucune permission';

    worksheet.addRow({
      email: user.email || '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      roles: rolesText,
      permissions: permissionsText,
      telephone: user.telephone || '',
      adresse: user.adresse || '',
      statut: user.statut_actif ? 'Actif' : 'Inactif',
      created_at: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '',
    });
  });

  // Ajouter une feuille de statistiques
  const statsSheet = workbook.addWorksheet('Statistiques');
  statsSheet.columns = [
    { header: 'Statistique', key: 'stat', width: 30 },
    { header: 'Valeur', key: 'value', width: 20 },
  ];

  statsSheet.getRow(1).font = { bold: true };
  statsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.statut_actif).length;
  const roleCounts = {};
  users.forEach(user => {
    if (user.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
    }
  });

  statsSheet.addRow({ stat: "Total d'utilisateurs", value: totalUsers });
  statsSheet.addRow({ stat: "Utilisateurs actifs", value: activeUsers });
  statsSheet.addRow({ stat: "Utilisateurs inactifs", value: totalUsers - activeUsers });
  statsSheet.addRow({ stat: "", value: "" }); // Ligne vide
  
  statsSheet.addRow({ stat: "Répartition par rôle", value: "" });
  Object.entries(roleCounts).forEach(([role, count]) => {
    statsSheet.addRow({ stat: `  ${role}`, value: count });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
