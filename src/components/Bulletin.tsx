// src/components/Bulletin.tsx
import React from 'react';
import html2pdf from 'html2pdf.js';

export interface Matiere {
  nom: string;
  devoir: number;
  composition: number;
  moyenne: number;
  coefficient: number;
  points: number;
  rang?: number | null;
  appreciation: string;
}

export interface BulletinData {
  eleve: {
    prenom: string;
    nom: string;
    dateNaissance: string;
    lieuNaissance: string;
    matricule: string;
    classe: string;
    sexe: string;
    photo?: string | null;
  };
  semestre: {
    nom: string;
    anneeScolaire: string;
  };
  matieres: Matiere[];
  statistiques: {
    moyenneGenerale: number;
    rang: number;
    totalEleves: number;
    absences: number;
    retards: number;
  };
  mention: string;
  decision: 'admise' | 'redoublement' | 'exclusion';
  observations: string;
  signatures: {
    professeur: string;
    directeur: string;
  };
  dateImpression: string;
  qrCodeUrl?: string | null;
}

interface BulletinProps {
  data: BulletinData;
  id?: string;
}

const Bulletin: React.FC<BulletinProps> = ({ data, id = 'bulletin-content' }) => {
  const { eleve, semestre, matieres, statistiques, mention, decision, observations, signatures, dateImpression, qrCodeUrl } = data;

  const getNoteColor = (moyenne: number) => {
    if (moyenne >= 16) return 'text-green-700';
    if (moyenne >= 12) return 'text-blue-700';
    if (moyenne >= 10) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getAppreciationBadge = (moyenne: number) => {
    if (moyenne >= 16) return { bg: 'bg-green-100', text: 'text-green-800', label: 'Excellent' };
    if (moyenne >= 14) return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Très bon' };
    if (moyenne >= 12) return { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Bon' };
    if (moyenne >= 10) return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Assez bien' };
    if (moyenne >= 8) return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Passable' };
    return { bg: 'bg-red-100', text: 'text-red-800', label: 'Insuffisant' };
  };

  const statCards = [
    { title: 'Moyenne générale', value: statistiques.moyenneGenerale.toFixed(2) + ' / 20', icon: '', color: 'bg-blue-50 border-blue-200' },
    { title: 'Rang', value: `${statistiques.rang} / ${statistiques.totalEleves}`, icon: '', color: 'bg-indigo-50 border-indigo-200' },
    { title: 'Absences', value: statistiques.absences, icon: '', color: 'bg-red-50 border-red-200' },
    { title: 'Retards', value: statistiques.retards, icon: '', color: 'bg-orange-50 border-orange-200' },
  ];

  const progression = Math.min(100, (statistiques.moyenneGenerale / 20) * 100);

  return (
    <div
      id={id}
      className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:p-6"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ===== EN-TÊTE ===== */}
      <header className="flex items-start justify-between border-b-2 border-blue-900 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-2xl">

          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">LYCÉE DE KOUSSANAR</h1>
            <p className="text-sm text-gray-600">Tél : 33 982 10 21</p>
            <p className="text-sm text-gray-600">contact@lyceedekoussanar.sn</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">Année scolaire {semestre.anneeScolaire}</p>
          <p className="text-sm text-blue-700 font-medium">{semestre.nom}</p>
          <p className="text-xs text-gray-500 italic">"Savoir, Discipline, Excellence"</p>
        </div>
      </header>

      {/* ===== INFOS ÉLÈVE ===== */}
      <section className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center text-3xl text-blue-700">
            {eleve.photo ? <img src={eleve.photo} alt="Photo" className="rounded-full w-full h-full object-cover" /> : '👤'}
          </div>
          <div>
            <p className="text-sm text-gray-500">Prénoms</p>
            <p className="font-semibold text-lg">{eleve.prenom}</p>
            <p className="text-sm text-gray-500">Nom</p>
            <p className="font-semibold text-lg">{eleve.nom}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span> {eleve.dateNaissance}</span>
              <span> {eleve.lieuNaissance}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <div><span className="font-medium">Matricule :</span> {eleve.matricule}</div>
          <div><span className="font-medium">Classe :</span> {eleve.classe}</div>
          <div><span className="font-medium">Sexe :</span> {eleve.sexe}</div>
          <div><span className="font-medium">Effectif :</span> {statistiques.totalEleves} élèves</div>
        </div>
      </section>

      {/* ===== TABLEAU DES NOTES ===== */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-1 mb-3">Relevé des notes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-2 text-left">Matière</th>
                <th className="p-2 text-center">Devoir</th>
                <th className="p-2 text-center">Composition</th>
                <th className="p-2 text-center">Moyenne</th>
                <th className="p-2 text-center">Coeff.</th>
                <th className="p-2 text-center">Points</th>
                <th className="p-2 text-center">Rang</th>
                <th className="p-2 text-left">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((mat, idx) => {
                const badge = getAppreciationBadge(mat.moyenne);
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2 font-medium">{mat.nom}</td>
                    <td className="p-2 text-center">{mat.devoir.toFixed(2)}</td>
                    <td className="p-2 text-center">{mat.composition.toFixed(2)}</td>
                    <td className={`p-2 text-center font-semibold ${getNoteColor(mat.moyenne)}`}>
                      {mat.moyenne.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">{mat.coefficient}</td>
                    <td className="p-2 text-center">{mat.points.toFixed(2)}</td>
                    <td className="p-2 text-center">{mat.rang ?? '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== STATISTIQUES ===== */}
      <section className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, idx) => (
          <div key={idx} className={`border rounded-lg p-4 ${card.color} flex items-center gap-3`}>
            <div className="p-2 bg-white rounded-full shadow-sm text-xl">{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500 uppercase">{card.title}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ===== BARRE DE PROGRESSION ===== */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Niveau de l'élève</span>
          <span className="text-sm font-bold text-blue-700">{progression.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progression}%` }}></div>
        </div>
      </section>

      {/* ===== MENTION ===== */}
      <section className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
        <div className="text-5xl mb-2"></div>
        <h3 className="text-2xl font-extrabold text-green-800 uppercase">{mention}</h3>
        <p className="text-green-700 mt-1">Excellent élève, sérieux et discipliné. Continuez ainsi.</p>
      </section>

      {/* ===== DÉCISION DU CONSEIL ===== */}
      <section className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 mb-6">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={decision === 'admise'} readOnly className="w-4 h-4 text-blue-600" />
          <span className="text-sm">Admis(e) en classe supérieure</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={decision === 'redoublement'} readOnly className="w-4 h-4 text-orange-600" />
          <span className="text-sm">Autorisé(e) à redoubler</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={decision === 'exclusion'} readOnly className="w-4 h-4 text-red-600" />
          <span className="text-sm">Exclusion</span>
        </div>
      </section>

      {/* ===== OBSERVATIONS ===== */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Observations du conseil :</h4>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{observations || 'Aucune observation particulière.'}</p>
      </section>

      {/* ===== HISTOGRAMME ===== */}
      <section className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Progression par matière</h4>
        <div className="grid grid-cols-5 gap-2">
          {matieres.slice(0, 5).map((mat, idx) => (
            <div key={idx} className="text-center">
              <div className="bg-blue-100 h-24 rounded-t flex items-end justify-center">
                <div
                  className="bg-blue-600 w-full rounded-t"
                  style={{ height: `${(mat.moyenne / 20) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 truncate">{mat.nom}</p>
              <p className="text-xs font-bold">{mat.moyenne.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PIED DE PAGE ===== */}
      <footer className="border-t border-gray-300 pt-4 mt-4 text-xs text-gray-600 flex flex-wrap justify-between items-center">
        <div>
          <p>Professeur principal : <span className="font-semibold">{signatures.professeur}</span></p>
          <p>Directeur : <span className="font-semibold">{signatures.directeur}</span></p>
          <p>Cachet officiel</p>
        </div>
        <div className="text-right">
          <p>Date d'impression : {dateImpression}</p>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 inline-block mt-1" />
          )}
          <p className="mt-1 text-gray-400 italic text-[10px]">Ce bulletin n'est délivré qu'une seule fois.</p>
          <p className="mt-1 text-gray-400 text-[10px]">Lycée de Koussanar - Tél : 33 982 10 21</p>
        </div>
      </footer>
    </div>
  );
};

export const exportBulletinPDF = (elementId: string, filename = 'bulletin.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Élément avec l'id "${elementId}" non trouvé.`);
    return;
  }
  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, letterRendering: true, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
};

export default Bulletin;