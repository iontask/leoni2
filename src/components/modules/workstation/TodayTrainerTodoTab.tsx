/**
 * LEONI QualiTrack - Vue « À Faire Aujourd’hui » (Formateur Terrain)
 * Liste opérationnelle des recrues en suivi au poste avec ce qu'il manque et pointage en un geste.
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Plus,
  Flame,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Recruit, UserProfile, Language } from '../../../types';
import { CarreMagiqueSheet, WorkstationDailyRecord } from '../../../types/carreMagique';
import { CarreMagiqueEngine } from '../../../engine/carreMagiqueEngine';
import { formatDateDisplay, maskCIN } from '../../../i18n/translations';

interface TodayTrainerTodoTabProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onSelectRecruit: (recruit: Recruit) => void;
  onQuickRecordDay: (recruitId: string, dayRecord: WorkstationDailyRecord) => Promise<void>;
  sheetsByRecruitId: Record<string, CarreMagiqueSheet>;
}

export const TodayTrainerTodoTab: React.FC<TodayTrainerTodoTabProps> = ({
  recruits,
  currentUser,
  lang,
  onSelectRecruit,
  onQuickRecordDay,
  sheetsByRecruitId
}) => {
  const [selectedQuickDayRecruit, setSelectedQuickDayRecruit] = useState<Recruit | null>(null);
  const [quickPunctuality, setQuickPunctuality] = useState<'A_L_HEURE' | 'RETARD' | 'ABSENT'>('A_L_HEURE');
  const [quickQ, setQuickQ] = useState(true);
  const [quickP, setQuickP] = useState(true);
  const [quickDefects, setQuickDefects] = useState(0);
  const [quickDefectType, setQuickDefectType] = useState('DEF_01_INVERSION_VOIE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtre : recrues en apprentissage au poste ou en prolongation
  const activeFollowupRecruits = recruits.filter(
    (r) => r.statut === 'EN_APPRENTISSAGE_POSTE' || r.statut === 'NON_QUALIFIE_PROLONGATION'
  );

  const handleOpenQuickModal = (recruit: Recruit) => {
    setSelectedQuickDayRecruit(recruit);
    setQuickPunctuality('A_L_HEURE');
    setQuickQ(true);
    setQuickP(true);
    setQuickDefects(0);
  };

  const handleConfirmQuickDay = async () => {
    if (!selectedQuickDayRecruit) return;
    setIsSubmitting(true);
    try {
      const currentSheet = sheetsByRecruitId[selectedQuickDayRecruit.id];
      const nextDayIndex = Math.min(28, (selectedQuickDayRecruit.joursSuiviCompletes || 0) + 1);
      const todayIso = new Date().toISOString().split('T')[0];

      const dayRecord: WorkstationDailyRecord = {
        jourIndex: nextDayIndex,
        date: todayIso,
        ponctualite: quickPunctuality,
        objectifQualiteAtteint: quickQ,
        objectifProductiviteAtteint: quickP,
        nombreDefauts: quickDefects,
        defauts:
          quickDefects > 0
            ? [
                {
                  id: `def-${Date.now()}`,
                  defectCode: quickDefectType,
                  typeNumero: 1,
                  typeLibelleFr: 'Inversion de fils / voies',
                  typeLibelleAr: 'قلب مسار الأسلاك',
                  quantite: quickDefects
                }
              ]
            : [],
        alertePokaYokeDeclenchee: quickDefects > 4
      };

      await onQuickRecordDay(selectedQuickDayRecruit.id, dayRecord);
      setSelectedQuickDayRecruit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Guide */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'ar' ? 'لوحة المهام اليومية للمؤطر الميداني' : 'Feuille de Route Quotidienne — Formateur Terrain'}
            </h3>
            <p className="text-xs text-slate-600">
              {lang === 'ar'
                ? 'متابعة سريعة للحضور، أهداف Q&P والعيوب اليومية مع إقفال وقائي فوري عند تجاوز 4 عيوب.'
                : 'Pointage rapide ponctualité, objectifs Q & P et saisie des défauts du jour avec Poka-Yoke si > 4 défauts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            {activeFollowupRecruits.length} {lang === 'ar' ? 'عامل في فترة التتبع' : 'opérateurs à suivre'}
          </span>
        </div>
      </div>

      {/* Recruits Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeFollowupRecruits.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            Aucun opérateur en cours de suivi au poste actuellement.
          </div>
        ) : (
          activeFollowupRecruits.map((recruit) => {
            const sheet = sheetsByRecruitId[recruit.id];
            const evalResult = sheet ? CarreMagiqueEngine.evaluateSheet(sheet) : null;
            const nextDay = Math.min(28, (recruit.joursSuiviCompletes || 0) + 1);
            const hasAlertDefects = recruit.statut === 'NON_QUALIFIE_PROLONGATION' || evalResult?.estVerrouillePokaYoke;

            // Déterminer la phase active
            let phaseActive = 'Phase 1 (J1-4)';
            if (nextDay > 10) phaseActive = 'Phase 3 (J11-28)';
            else if (nextDay > 4) phaseActive = 'Phase 2 (J5-10)';

            return (
              <div
                key={recruit.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  hasAlertDefects ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          {recruit.nom} {recruit.prenom}
                        </h4>
                        {recruit.estEnProlongation && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                            Prolongation
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {recruit.matricule || maskCIN(recruit.cin, currentUser.role)} • {recruit.ligneAffectation || 'Ligne standard'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        J{recruit.joursSuiviCompletes || 0}/28
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-500">
                      <span>Progression : {Math.round(((recruit.joursSuiviCompletes || 0) / 28) * 100)}%</span>
                      <span className="font-mono text-slate-700">{phaseActive}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${((recruit.joursSuiviCompletes || 0) / 28) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Requise Aujourd'hui */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      À faire aujourd’hui :
                    </span>

                    {hasAlertDefects ? (
                      <div className="flex items-start gap-1.5 text-rose-700 font-semibold text-[11px]">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Alerte Défauts : Refaire la formation obligatoire suite à dépassement du seuil.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Pointer J{nextDay} : Vérifier ponctualité, conformité Q & P.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Série Q&P consécutive : <strong>{evalResult?.serieQPConsecutive || 0} jours</strong></span>
                    </div>
                  </div>
                </div>

                {/* Buttons (Touch Targets >= 48px) */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickModal(recruit)}
                    className="flex-1 min-h-[48px] px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Pointer J{nextDay}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecruit(recruit)}
                    className="min-h-[48px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Consulter la fiche Carré Magique complète"
                  >
                    <span>Fiche</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Day Record Modal */}
      {selectedQuickDayRecruit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pointage Rapide au Poste — J{Math.min(28, (selectedQuickDayRecruit.joursSuiviCompletes || 0) + 1)}
                </h3>
                <p className="text-xs text-slate-500">
                  Opérateur : <strong>{selectedQuickDayRecruit.nom} {selectedQuickDayRecruit.prenom}</strong> ({selectedQuickDayRecruit.matricule || selectedQuickDayRecruit.cin})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuickDayRecruit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Ponctualité */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  1. Ponctualité de l’opérateur :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['A_L_HEURE', 'RETARD', 'ABSENT'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQuickPunctuality(st)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        quickPunctuality === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'A_L_HEURE' ? 'À l’heure' : st === 'RETARD' ? 'En retard' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objectifs Q & P */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="font-bold text-slate-800 block mb-1">Objectif Qualité (Q) :</span>
                  <button
                    type="button"
                    onClick={() => setQuickQ(!quickQ)}
                    className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      quickQ
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{quickQ ? 'Atteint (OK)' : 'Non atteint (NOK)'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="font-bold text-slate-800 block mb-1">Objectif Productivité (P) :</span>
                  <button
                    type="button"
                    onClick={() => setQuickP(!quickP)}
                    className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      quickP
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{quickP ? 'Atteint (OK)' : 'Non atteint (NOK)'}</span>
                  </button>
                </div>
              </div>

              {/* Défauts du jour & Poka-Yoke */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>2. Nombre de défauts constatés aujourd’hui :</span>
                  {quickDefects > 4 && (
                    <span className="text-[11px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-sm">
                      Alerte Poka-Yoke &gt; 4 !
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={quickDefects}
                    onChange={(e) => setQuickDefects(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 min-h-[44px] px-3 font-mono text-center font-bold text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />

                  {quickDefects > 0 && (
                    <select
                      value={quickDefectType}
                      onChange={(e) => setQuickDefectType(e.target.value)}
                      className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                    >
                      <option value="DEF_01_INVERSION_VOIE">1. Inversion de fils / cavités</option>
                      <option value="DEF_02_MAUVAIS_ENCLIQUETAGE">2. Mauvais encliquetage / terminal non verrouillé</option>
                      <option value="DEF_03_MAUVAIS_SERTISSAGE">3. Mauvais sertissage / sous-sertissage</option>
                      <option value="DEF_04_FIL_BLESSE">4. Fil blessé / dénudage non conforme</option>
                      <option value="DEF_05_MAUVAISE_INSERTION_PUSH_PULL">5. Mauvaise insertion / échec Push-Pull</option>
                      <option value="DEF_06_ENRUBANNAGE_DEFECTUEUX">6. Enrubannage défectueux / chevauchement incorrect</option>
                      <option value="DEF_07_CONNECTEUR_ENDOMMAGE_TPA">7. Connecteur endommagé / TPA non verrouillé</option>
                    </select>
                  )}
                </div>

                {quickDefects > 4 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Règle Poka-Yoke stricte : Au-delà de 4 défauts journaliers, l’opérateur doit obligatoirement refaire la formation.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedQuickDayRecruit(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickDay}
                disabled={isSubmitting}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le pointage du jour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
