/**
 * LEONI QualiTrack - Étape 4 : Moteur d'Affectation Intelligente (J5+)
 * Suggère les postes compatibles avec explications détaillées ("Pourquoi cette suggestion")
 * Décision humaine avec traçabilité intégrale et historique des refus motivés.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  AlertTriangle,
  XCircle,
  ThumbsDown,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  History
} from 'lucide-react';
import {
  AssignmentSuggestion,
  Language,
  Recruit,
  SystemParameter,
  UserProfile,
  Workstation
} from '../../../types';
import { TRANSLATIONS, formatDateDisplay } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';
import { repositoryInstance } from '../../../repositories/storageRepository';
import { PokaYokeEngine } from '../../../engine/pokaYoke';

interface SmartAssignmentTabProps {
  recruits: Recruit[];
  workstations: Workstation[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onAssignStation: (
    recruitId: string,
    workstationId: string,
    options?: {
      scoreSuggestion?: number;
      justificationSuggestion?: string;
    }
  ) => Promise<void>;
  onTriggerPokaYoke: (action: string, recruit: Recruit, ws?: Workstation) => void;
  onSelectRecruit: (recruit: Recruit) => void;
  onRefreshParent: () => Promise<void>;
}

export const SmartAssignmentTab: React.FC<SmartAssignmentTabProps> = ({
  recruits,
  workstations,
  currentUser,
  parameters,
  lang,
  onAssignStation,
  onTriggerPokaYoke,
  onSelectRecruit,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedRecruitId, setSelectedRecruitId] = useState<string>('');
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, AssignmentSuggestion[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [expandedRecruitId, setExpandedRecruitId] = useState<string | null>(null);

  // Modal de refus motivé
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    recruit: Recruit | null;
    workstation: Workstation | null;
    motif: string;
  }>({
    isOpen: false,
    recruit: null,
    workstation: null,
    motif: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recrues en fin d'école (J5+) ou déjà affectées qu'on peut réassigner
  const candidateRecruits = recruits.filter(
    (r) => r.statut === 'EN_ECOLE' || r.statut === 'EN_APPRENTISSAGE_POSTE'
  );

  // Charge les suggestions pour chaque recrue candidate
  useEffect(() => {
    loadAllSuggestions();
  }, [recruits.length, workstations.length]);

  const loadAllSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const map: Record<string, AssignmentSuggestion[]> = {};
      for (const rec of candidateRecruits.slice(0, 30)) {
        const suggs = await repositoryInstance.calculateAssignmentSuggestions(rec.id);
        map[rec.id] = suggs;
      }
      setSuggestionsMap(map);
      if (candidateRecruits[0] && !expandedRecruitId) {
        setExpandedRecruitId(candidateRecruits[0].id);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleApplyAssignment = async (recruit: Recruit, suggestion: AssignmentSuggestion) => {
    const ws = suggestion.workstation;

    // Évaluation Poka-Yoke spécifique aux postes critiques
    if (ws.typologie === 'CRITIQUE') {
      const check = PokaYokeEngine.evaluate('AFFECTATION_POSTE_CRITIQUE', {
        recruit,
        currentUser,
        parameters,
        workstation: ws
      });

      if (!check.autorise) {
        onTriggerPokaYoke('AFFECTATION_POSTE_CRITIQUE', recruit, ws);
        return;
      }
    } else {
      // Poste initial : vérification école standard
      const check = PokaYokeEngine.evaluate('AFFECTATION_POSTE', {
        recruit,
        currentUser,
        parameters
      });

      if (!check.autorise) {
        onTriggerPokaYoke('AFFECTATION_POSTE', recruit, ws);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onAssignStation(recruit.id, ws.id, {
        scoreSuggestion: suggestion.scoreCompatibilite,
        justificationSuggestion: suggestion.raisonsCompatibiliteFr.join(' | ')
      });
      await onRefreshParent();
      await loadAllSuggestions();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejection = (recruit: Recruit, ws: Workstation) => {
    setRejectionModal({
      isOpen: true,
      recruit,
      workstation: ws,
      motif: ''
    });
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModal.recruit || !rejectionModal.workstation || !rejectionModal.motif.trim()) return;

    try {
      setIsSubmitting(true);
      await repositoryInstance.recordAssignmentRejection(
        rejectionModal.recruit.id,
        rejectionModal.workstation.id,
        rejectionModal.motif.trim(),
        currentUser
      );
      setRejectionModal({ isOpen: false, recruit: null, workstation: null, motif: '' });
      await onRefreshParent();
      await loadAllSuggestions();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête explicatif */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>{t.tabSmartAssignment}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Moteur de matching multi-critères : croise les notes de l’école (théorie, pratique), l’assiduité, les aptitudes requises et les besoins ouverts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
          <span>{candidateRecruits.length} opérateurs candidats</span>
        </div>
      </div>

      {/* Liste des recrues candidates avec suggestions dépliables */}
      <div className="space-y-4">
        {candidateRecruits.map((recruit) => {
          const suggestions = suggestionsMap[recruit.id] || [];
          const isExpanded = expandedRecruitId === recruit.id;
          const rejections = recruit.historiqueRefusAffectation || [];
          const isSchoolOk = recruit.ecoleValidee && recruit.ecoleJoursValides >= 5;

          return (
            <div
              key={recruit.id}
              className={`bg-white rounded-2xl border transition-all shadow-2xs ${
                isExpanded ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Ligne récapitulative recrue */}
              <div
                onClick={() => setExpandedRecruitId(isExpanded ? null : recruit.id)}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 font-bold flex items-center justify-center shrink-0">
                    {recruit.prenom.charAt(0)}{recruit.nom.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {recruit.nom} {recruit.prenom}
                      </span>
                      <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                      {recruit.workstationNature && (
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            recruit.workstationNature === 'CRITIQUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Poste {recruit.workstationNature}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-mono">
                      <span>CIN: {recruit.cin}</span>
                      <span>•</span>
                      <span>Assiduité: {recruit.ecoleJoursValides}/5j {isSchoolOk ? '✓' : '⚠️'}</span>
                      <span>•</span>
                      <span>Théorie: {recruit.ecoleScoreTheorie ?? '-'} / 20</span>
                      <span>•</span>
                      <span>Pratique: {recruit.ecoleScorePratique ?? '-'} / 20</span>
                      {recruit.segmentPrevisionnel && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">Cible: {recruit.segmentPrevisionnel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {rejections.length > 0 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-amber-600" />
                      <span>{rejections.length} refus consigné(s)</span>
                    </span>
                  )}

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-700 block">
                      {suggestions.length} postes analysés
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isExpanded ? 'Masquer suggestions' : 'Voir suggestions'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Panneau déplié des suggestions et historique */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  {/* Historique des refus antérieurs s'il existe */}
                  {rejections.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <History className="w-4 h-4 text-amber-600" />
                        <span>Historique des suggestions refusées pour cette recrue</span>
                      </div>
                      <div className="space-y-1.5">
                        {rejections.map((rej) => (
                          <div key={rej.id} className="text-xs text-amber-800 bg-white/80 p-2 rounded-lg border border-amber-100">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="font-bold">{rej.workstationIntitule}</span>
                              <span>{formatDateDisplay(rej.dateRefus)} par {rej.refuseParNom}</span>
                            </div>
                            <div className="text-[11px] mt-0.5 text-slate-700 italic">
                              « {rej.motifRefus} »
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions intelligentes ordonnées par compatibilité */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Postes compatibles & Justifications algorithmiques
                      </span>
                      <span className="text-[11px] text-slate-400">
                        La décision humaine est obligatoire et auditée
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {suggestions.map((sugg) => {
                        const ws = sugg.workstation;
                        const isCritical = ws.typologie === 'CRITIQUE';
                        const isCurrentPost = recruit.workstationId === ws.id;

                        return (
                          <div
                            key={ws.id}
                            className={`p-4 rounded-xl border bg-white space-y-3 transition-all ${
                              sugg.recommande
                                ? 'border-blue-300 ring-1 ring-blue-100 shadow-2xs'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {ws.code}
                                  </span>
                                  <span className="font-bold text-sm text-slate-900">
                                    {lang === 'ar' ? ws.intituleAr : ws.intituleFr}
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                      isCritical
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {isCritical ? 'Poste Critique' : 'Poste Initial'}
                                  </span>
                                  {isCurrentPost && (
                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      Poste Actuel
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                  <span>Segment : {ws.segment}</span>
                                  <span>•</span>
                                  <span>Ligne : {ws.ligne}</span>
                                  <span>•</span>
                                  <span>Formateur : {ws.formateurReferentNom}</span>
                                </div>
                              </div>

                              {/* Jauge Score de compatibilité */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <div className="text-base font-extrabold font-mono text-blue-700">
                                    {sugg.scoreCompatibilite}%
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                    Compatibilité
                                  </span>
                                </div>

                                <div className="w-14 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      sugg.scoreCompatibilite >= 80
                                        ? 'bg-emerald-500'
                                        : sugg.scoreCompatibilite >= 65
                                        ? 'bg-blue-600'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${sugg.scoreCompatibilite}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Cartouche "Pourquoi cette suggestion ?" */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                <Info className="w-3.5 h-3.5 text-blue-600" />
                                <span>{t.whyThisSuggestion}</span>
                              </span>

                              <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                                {(lang === 'ar' ? sugg.raisonsCompatibiliteAr : sugg.raisonsCompatibiliteFr).map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>

                              {/* Points bloquants Poka-Yoke s'ils existent */}
                              {!sugg.prerequisConformes && (
                                <div className="mt-2 bg-rose-50 border border-rose-200 p-2 rounded-lg text-rose-800 text-[11px] space-y-1">
                                  <span className="font-bold flex items-center gap-1">
                                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Points bloquants (Verrou Poka-Yoke) :</span>
                                  </span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {(lang === 'ar' ? sugg.pointsBloquantsAr : sugg.pointsBloquantsFr)?.map((pb, pbi) => (
                                      <li key={pbi}>{pb}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Actions d'affectation ou de refus avec motif */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <div className="text-[11px] text-slate-400 font-mono">
                                Prérequis : Assiduité {ws.prerequis.assiduiteMinJours}j • Note min {ws.prerequis.noteEcoleMin}/20
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejection(recruit, ws)}
                                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{t.rejectSuggestion}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApplyAssignment(recruit, sugg)}
                                  disabled={isSubmitting}
                                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs transition-colors ${
                                    !sugg.prerequisConformes
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                                  }`}
                                >
                                  {!sugg.prerequisConformes ? (
                                    <>
                                      <Lock className="w-4 h-4 text-rose-600" />
                                      <span>Verrou Poka-Yoke (Dérogation)</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>{isCurrentPost ? 'Confirmer le poste' : t.confirmAssignment}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Saisie du motif impératif de refus de suggestion */}
      {rejectionModal.isOpen && rejectionModal.recruit && rejectionModal.workstation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-amber-600" />
                <span>{t.rejectSuggestion}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, recruit: null, workstation: null, motif: '' })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Consignation de la décision formateur :</span>
              <p>
                Vous refusez l’affectation de <strong>{rejectionModal.recruit.nom} {rejectionModal.recruit.prenom}</strong> au poste <strong>{rejectionModal.workstation.code} ({rejectionModal.workstation.intituleFr})</strong>.
              </p>
              <p className="text-[11px] text-amber-800">
                Le motif saisi sera audité et conservé dans l’historique permanent de la recrue.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t.rejectionReasonPrompt} <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={rejectionModal.motif}
                onChange={(e) => setRejectionModal((prev) => ({ ...prev, motif: e.target.value }))}
                placeholder="Ex : Réorientation vers poste initial insertion pour consolidation du geste..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-amber-600 focus:outline-hidden"
                required
              />
            </div>

            {/* Suggestions rapides de motifs standards LEONI */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Motifs fréquents atelier :</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Consolidation du geste sur poste initial requise',
                  'Dextérité fine supérieure orientée vers insertion',
                  'Préférence pour équilibrage effectif Segment Habitacle',
                  'Aptitude visuelle testée plus adaptée au contrôle géométrique'
                ].map((sugMotif, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionModal((prev) => ({ ...prev, motif: sugMotif }))}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-left cursor-pointer"
                  >
                    {sugMotif}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, recruit: null, workstation: null, motif: '' })}
                className="min-h-[48px] px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={!rejectionModal.motif.trim() || isSubmitting}
                className="min-h-[48px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isSubmitting ? 'Consignation...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
