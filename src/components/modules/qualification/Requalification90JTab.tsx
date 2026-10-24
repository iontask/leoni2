import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ShieldCheck,
  User,
  Save,
  Info
} from 'lucide-react';
import { Recruit, Language, UserProfile } from '../../../types';
import { Requalification90JRecord } from '../../../types/qualification';
import { TRANSLATIONS, formatDateDisplay } from '../../../i18n/translations';
import { repositoryInstance } from '../../../repositories/storageRepository';

interface Requalification90JTabProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onRefreshParent: () => Promise<void>;
  onSelectRecruit: (recruit: Recruit) => void;
}

const CRITERES_90J = [
  {
    id: 'R1',
    libelleFr: 'Maîtrise tous les modes opératoires de la ligne, minimum 3 postes',
    coeff: 0.15
  },
  {
    id: 'R2',
    libelleFr: 'Respect rigoureux du standard 5S et propreté du poste',
    coeff: 0.15
  },
  {
    id: 'R3',
    libelleFr: 'Peut passer sans problème à un autre poste de la ligne',
    coeff: 0.15
  },
  {
    id: 'R4',
    libelleFr: 'Capable de former un nouvel opérateur sans déviation',
    coeff: 0.15
  },
  {
    id: 'R5',
    libelleFr: 'Émet une nouvelle CIP (Idée d’Amélioration Continue)',
    coeff: 0.10
  },
  {
    id: 'R6',
    libelleFr: 'Gestes et mesures qualité maintenus sans défaut',
    coeff: 0.15
  },
  {
    id: 'R7',
    libelleFr: 'Connaît et applique le mode de réaction en situation inhabituelle',
    coeff: 0.15
  }
];

export const Requalification90JTab: React.FC<Requalification90JTabProps> = ({
  recruits,
  currentUser,
  lang,
  onRefreshParent,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];
  const [records, setRecords] = useState<Requalification90JRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Load all 90J records
  const loadRecords = async () => {
    try {
      const data = await repositoryInstance.getAllRequalifications90J();
      setRecords(data);
      if (!selectedRecordId && data.length > 0) {
        setSelectedRecordId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [recruits]);

  const activeRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Current answers on R1..R7
  const [criteresState, setCriteresState] = useState<Record<string, 'OK' | 'NOK' | 'NON_EVALUE'>>({});
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (activeRecord) {
      setCriteresState(activeRecord.criteresR1aR7Statuts || {});
      setObservations(activeRecord.observations || '');
    }
  }, [activeRecord?.id]);

  // Dynamic score calculation
  const currentScore = CRITERES_90J.reduce((sum, crit) => {
    return sum + (criteresState[crit.id] === 'OK' ? crit.coeff : 0);
  }, 0);

  const roundedScore = Number(currentScore.toFixed(2));
  const isAllEvaluated = CRITERES_90J.every((c) => criteresState[c.id] && criteresState[c.id] !== 'NON_EVALUE');

  // Handle toggling criterion status
  const handleToggleCrit = (critId: string, status: 'OK' | 'NOK') => {
    setCriteresState((prev) => ({
      ...prev,
      [critId]: prev[critId] === status ? 'NON_EVALUE' : status
    }));
  };

  // Save 90J Requalification Evaluation
  const handleSaveEvaluation = async (decision: 'MAINTIEN_AUTONOME' | 'RETROGRADATION_NIVEAU_L') => {
    if (!activeRecord) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const updated: Requalification90JRecord = {
        ...activeRecord,
        statut: decision === 'MAINTIEN_AUTONOME' ? 'VALIDE' : 'RETROGRADE',
        scoreRequalification: roundedScore,
        criteresR1aR7Statuts: criteresState,
        decisionRequalification: decision,
        evalueParMatricule: currentUser.matricule,
        evalueParNom: `${currentUser.prenom} ${currentUser.nom}`,
        dateEvaluation: nowIso,
        observations
      };

      await repositoryInstance.saveRequalification90J(updated, currentUser);
      setSaveNotice(
        decision === 'MAINTIEN_AUTONOME'
          ? 'Requalification réussie : Statut autonome maintenu (Carré fermé validé).'
          : 'Poka-Yoke activé : Rétrogradation au Niveau L enregistrée avec prolongation.'
      );
      await loadRecords();
      await onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la requalification.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            Requalification à 90 Jours — Carré Fermé (Total 1,00)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Évaluation continue d’excellence. Si l’opérateur ne maintient pas les standards, retour immédiat au Niveau L (Poka-Yoke).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Rappel Formateur &lt; 15 jours</span>
          </span>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveNotice}
          </span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Grille principale : Tableau des échéances + Fiche d'évaluation Carré Fermé */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche : Liste des échéances 90 jours (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Opérateurs suivis à J+90 ({records.length})
            </span>
            <span className="text-slate-400 font-mono">Planification Auto</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {records.map((rec) => {
              const isSelected = rec.id === activeRecord?.id;
              const isUrgent = rec.joursRestants <= 15 && rec.statut !== 'VALIDE';
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`p-3.5 transition-colors cursor-pointer text-left ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {rec.nom} {rec.prenom}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        rec.statut === 'VALIDE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.statut === 'RETROGRADE'
                          ? 'bg-rose-100 text-rose-800'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.statut === 'VALIDE'
                        ? 'CARRÉ FERMÉ'
                        : rec.statut === 'RETROGRADE'
                        ? 'RÉTROGRADÉ'
                        : `${rec.joursRestants}j restants`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                    <span>{rec.matricule}</span>
                    <span>•</span>
                    <span>Échéance : {formatDateDisplay(rec.dateEcheance90J)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                    <span>{rec.workstationCode}</span>
                    <span className="font-mono font-bold text-slate-700">
                      Score : {rec.scoreRequalification}/1.00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite : Fiche d'évaluation interactive R1 à R7 (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col p-5 space-y-5">
          {activeRecord ? (
            <>
              {/* Header de la recrue */}
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeRecord.nom} {activeRecord.prenom}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Matricule : {activeRecord.matricule} • Poste : {activeRecord.workstationCode}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Score Carré Fermé</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      roundedScore >= 0.85 ? 'text-emerald-700' : 'text-slate-800'
                    }`}
                  >
                    {roundedScore.toFixed(2)} / 1,00 ({Math.round(roundedScore * 100)}%)
                  </span>
                </div>
              </div>

              {/* Grille des critères R1 à R7 */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Évaluation des 7 Critères Officiels de Requalification
                </span>

                <div className="space-y-2">
                  {CRITERES_90J.map((crit) => {
                    const status = criteresState[crit.id] || 'NON_EVALUE';
                    return (
                      <div
                        key={crit.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          status === 'OK'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : status === 'NOK'
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                            {crit.id}
                          </span>
                          <span className="text-slate-800 leading-snug">
                            {crit.libelleFr}{' '}
                            <strong className="text-slate-500 font-mono">({crit.coeff})</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleCrit(crit.id, 'OK')}
                            className={`min-h-[36px] px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                              status === 'OK'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCrit(crit.id, 'NOK')}
                            className={`min-h-[36px] px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                              status === 'NOK'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            NOK
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Règle Poka-Yoke Avertissement */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Règle Poka-Yoke LEONI :</strong> Si l'opérateur ne maintient pas les actions ou si le score est inférieur aux exigences, la décision de <em>Rétrogradation</em> le replace immédiatement au Niveau L en apprentissage avec motif consigné.
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Observations de l'évaluateur (Formateur / Responsable) :
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Justification, constats atelier ou axes d'amélioration..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 h-16 resize-none"
                />
              </div>

              {/* Boutons de décision Requalification */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveEvaluation('RETROGRADATION_NIVEAU_L')}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-700" />
                  <span>Rétrogradation Niveau L (Échec)</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving || roundedScore < 0.70}
                  onClick={() => handleSaveEvaluation('MAINTIEN_AUTONOME')}
                  className="min-h-[48px] px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider Requalification (Carré Fermé)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Sélectionnez un opérateur pour procéder à son évaluation Carré Fermé à 90 jours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
