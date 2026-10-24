import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Unlock,
  Calendar,
  User,
  Clock,
  Printer,
  FileCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Recruit, UserProfile, Language, SystemParameter } from '../../../types';
import {
  CarreMagiqueSheet,
  DecisionValidationResult,
  DecisionValidationType
} from '../../../types/carreMagique';
import {
  QualificationDecisionRecord,
  ValidationRightsRule
} from '../../../types/qualification';
import { TRANSLATIONS, formatDateDisplay, getTypologyLabel } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';
import { QualificationEngine } from '../../../engine/qualificationEngine';
import { repositoryInstance } from '../../../repositories/storageRepository';

interface QualificationDecisionTabProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onRefreshParent: () => Promise<void>;
  onOpenPassport: (recruit: Recruit) => void;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const QualificationDecisionTab: React.FC<QualificationDecisionTabProps> = ({
  recruits,
  currentUser,
  parameters,
  lang,
  onRefreshParent,
  onOpenPassport,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];

  // Candidates for qualification: at workstation with >= 20 days, or already autonomous, or in prolongation
  const candidates = recruits.filter(
    (r) =>
      r.statut === 'QUALIFIE_AUTONOME' ||
      r.statut === 'NON_QUALIFIE_PROLONGATION' ||
      (r.statut === 'EN_APPRENTISSAGE_POSTE' && (r.joursSuiviCompletes || 0) >= 18)
  );

  const [selectedRecruitId, setSelectedRecruitId] = useState<string>(
    candidates[0]?.id || ''
  );

  const selectedRecruit = recruits.find((r) => r.id === selectedRecruitId) || candidates[0];

  // Load associated sheets & decision records from repository
  const [sheet, setSheet] = useState<CarreMagiqueSheet | null>(null);
  const [existingDecision, setExistingDecision] = useState<QualificationDecisionRecord | null>(null);
  const [rightsRule, setRightsRule] = useState<ValidationRightsRule | null>(null);

  // Form states for signing / decision
  const [pinCode, setPinCode] = useState<string>('');
  const [isSigningQuality, setIsSigningQuality] = useState(false);
  const [isSigningProd, setIsSigningProd] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DecisionValidationType>('AUTONOME');
  const [observations, setObservations] = useState<string>('');
  
  // Derogation modal state
  const [showDerogationModal, setShowDerogationModal] = useState(false);
  const [derogationMotif, setDerogationMotif] = useState('');
  const [derogationDays, setDerogationDays] = useState(7);
  const [hasDerogation, setHasDerogation] = useState(false);

  // Prolongation days
  const [prolongationDays, setProlongationDays] = useState<number>(14);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load data when selected recruit changes
  React.useEffect(() => {
    if (!selectedRecruit) return;
    let isMounted = true;

    async function loadData() {
      try {
        const [sh, dec, matrix] = await Promise.all([
          repositoryInstance.getCarreMagiqueSheet(selectedRecruit.id),
          repositoryInstance.getQualificationDecision(selectedRecruit.id),
          repositoryInstance.getValidationRightsMatrix()
        ]);
        if (!isMounted) return;
        setSheet(sh);
        setExistingDecision(dec);
        const rule = selectedRecruit.workstationNature === 'CRITIQUE' ? matrix.critique : matrix.initial;
        setRightsRule(rule);
        if (dec) {
          setSelectedDecision(dec.decision);
          setObservations(dec.commentaires || '');
          setHasDerogation(dec.estDerogation);
        } else {
          setSelectedDecision('AUTONOME');
          setObservations('');
          setHasDerogation(false);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedRecruit?.id]);

  if (!selectedRecruit) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
        Aucun candidat soumis à qualification pour le moment.
      </div>
    );
  }

  // Evaluate prerequisites using QualificationEngine
  const rule = rightsRule || {
    workstationNature: selectedRecruit.workstationNature || 'INITIAL',
    rolesHabilitesDecisionFinale: ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN'],
    rolesHabilitesVisaQualite: ['QUALITE', 'ADMIN'],
    rolesHabilitesVisaProduction: ['RESPONSABLE_PRODUCTION', 'ADMIN'],
    rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN'],
    exigerControleFormateur: true,
    exigerControleAQL: true,
    exigerControleShiftLeader: true,
    dureeMaximaleDerogationJours: 14
  };

  const prereqCheck = QualificationEngine.evaluatePrerequisites(
    selectedRecruit,
    sheet,
    null,
    rule
  );

  const canSignQuality = rule.rolesHabilitesVisaQualite.includes(currentUser.role) || currentUser.role === 'ADMIN';
  const canSignProd = rule.rolesHabilitesVisaProduction.includes(currentUser.role) || currentUser.role === 'ADMIN';
  const canDerogate = rule.rolesHabilitesDerogation.includes(currentUser.role) || currentUser.role === 'ADMIN';
  const canDecide = rule.rolesHabilitesDecisionFinale.includes(currentUser.role) || currentUser.role === 'ADMIN';

  // Blocking criteria check
  const blockingCriteriaList = [
    { num: 15, lib: 'Applique l’autocontrôle (Phase 2, 0.08)' },
    { num: 16, lib: 'Comprend les points critiques à contrôler (Phase 2, 0.08)' },
    { num: 17, lib: 'Connaît les défauts récurrents du segment et réclamations (Phase 2, 0.08)' },
    { num: 18, lib: 'Atteinte objectif qualité 10 jours, zéro défaut (Phase 2, 0.10)' },
    { num: 20, lib: 'Arrêt au premier défaut et TNC (Phase 2, 0.08)' },
    { num: 26, lib: 'Maintient le zéro défaut jusqu’au J28 (Phase 3, 0.05)' },
    { num: 29, lib: 'Test de vigilance pour validation finale (Phase 3, 0.08)' }
  ];

  // Calculate score estimate
  const scorePercent = selectedRecruit.statut === 'QUALIFIE_AUTONOME'
    ? 94
    : Math.min(
        100,
        Math.round(((selectedRecruit.carreMagiquePointsConformes || 14) / 16) * 100)
      );

  // Signing Quality Visa
  const handleQualityVisa = async () => {
    setIsSigningQuality(true);
    try {
      const now = new Date().toISOString();
      await repositoryInstance.update(
        selectedRecruit.id,
        {
          visaQualite: true,
          visaQualitePar: `${currentUser.prenom} ${currentUser.nom}`,
          visaQualiteDate: now
        },
        currentUser,
        `Visa Qualité apposé avec code d’authentification pour ${selectedRecruit.nom} ${selectedRecruit.prenom}`
      );
      setActionNotice('Visa Qualité validé et certifié avec succès.');
      await onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la signature Qualité');
    } finally {
      setIsSigningQuality(false);
    }
  };

  // Signing Production Visa (RFM)
  const handleProductionVisa = async () => {
    setIsSigningProd(true);
    try {
      const now = new Date().toISOString();
      await repositoryInstance.update(
        selectedRecruit.id,
        {
          visaProduction: true,
          visaProductionPar: `${currentUser.prenom} ${currentUser.nom}`,
          visaProductionDate: now
        },
        currentUser,
        `Visa Production (RFM) apposé pour ${selectedRecruit.nom} ${selectedRecruit.prenom}`
      );
      setActionNotice('Visa Fabrication / RFM validé et certifié avec succès.');
      await onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la signature RFM');
    } finally {
      setIsSigningProd(false);
    }
  };

  // Execute Final Qualification Decision
  const handleExecuteDecision = async () => {
    if (!prereqCheck.canQualify && !hasDerogation && selectedDecision === 'AUTONOME') {
      alert(
        'Blocage Poka-Yoke : Les prérequis opérationnels ou les critères bloquants ne sont pas tous validés. Une dérogation formelle est requise pour habiliter cet opérateur.'
      );
      return;
    }

    setIsFinalizing(true);
    try {
      const now = new Date().toISOString();
      const newTargetEndDate = new Date(Date.now() + prolongationDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const record: QualificationDecisionRecord = {
        id: existingDecision?.id || `DEC-${selectedRecruit.id}-${Date.now()}`,
        recrueId: selectedRecruit.id,
        matricule: selectedRecruit.matricule || `L-OPR-${selectedRecruit.cin.slice(-4)}`,
        nom: selectedRecruit.nom,
        prenom: selectedRecruit.prenom,
        siteId: selectedRecruit.siteId,
        workstationId: selectedRecruit.workstationId || 'ws-default',
        workstationCode: selectedRecruit.ligneAffectation ? `PST-L${selectedRecruit.ligneAffectation}` : 'PST-01',
        workstationIntitule: getTypologyLabel(selectedRecruit.typologiePoste, lang),
        typologiePoste: selectedRecruit.workstationNature || 'INITIAL',
        decision: selectedDecision,
        scoreTotalPourcent: scorePercent,
        scoreTotalSur1: Number((scorePercent / 100).toFixed(2)),
        criteresBloquantsConformes: prereqCheck.scoresOk,
        criteresBloquantsNOK: [],
        prerequisFormateurTerrainOk: prereqCheck.formateurOk,
        prerequisAqlOk: prereqCheck.aqlOk,
        prerequisShiftLeaderOk: prereqCheck.shiftLeaderOk,
        dateDecision: now,
        validateurMatricule: currentUser.matricule,
        validateurNom: `${currentUser.prenom} ${currentUser.nom}`,
        validateurRole: currentUser.role,
        visaQualiteSigne: selectedRecruit.visaQualite || selectedDecision === 'AUTONOME',
        visaQualitePar: selectedRecruit.visaQualitePar || `${currentUser.prenom} ${currentUser.nom}`,
        visaQualiteDate: selectedRecruit.visaQualiteDate || now,
        visaProductionSigne: selectedRecruit.visaProduction || selectedDecision === 'AUTONOME',
        visaProductionPar: selectedRecruit.visaProductionPar || `${currentUser.prenom} ${currentUser.nom}`,
        visaProductionDate: selectedRecruit.visaProductionDate || now,
        estDerogation: hasDerogation,
        motifDerogation: hasDerogation ? derogationMotif : undefined,
        dureeDerogationJours: hasDerogation ? derogationDays : undefined,
        estEnProlongation: selectedDecision === 'FORMATION_CIBLEE' || selectedDecision === 'NON_VALIDE_PROLONGATION',
        joursProlongationAccordee: prolongationDays,
        nouvelleDateFinPrevue: newTargetEndDate,
        requalification90JPlanifiee: selectedDecision === 'AUTONOME' || selectedDecision === 'VALIDE_SUIVI_RENFORCE',
        commentaires: observations
      };

      await repositoryInstance.saveQualificationDecision(record, currentUser);
      setExistingDecision(record);
      setActionNotice(`Décision « ${selectedDecision} » appliquée avec succès.`);
      await onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de l’enregistrement de la décision.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleApplyDerogation = () => {
    if (!derogationMotif.trim()) {
      alert('Veuillez saisir un motif obligatoire pour la dérogation.');
      return;
    }
    setHasDerogation(true);
    setShowDerogationModal(false);
    setActionNotice(`Dérogation exceptionnelle activée (${derogationDays} jours).`);
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de candidat horizontal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sélection de la recrue en phase de qualification ({candidates.length})
          </span>
          <span className="text-xs text-slate-400">
            Filtré : Suivi ≥ 18 jours, Autonome ou Prolongation
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {candidates.map((cand) => {
            const isSelected = cand.id === selectedRecruit.id;
            return (
              <button
                key={cand.id}
                type="button"
                onClick={() => setSelectedRecruitId(cand.id)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl text-left transition-all shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">
                  {cand.nom} {cand.prenom}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                  <span className="font-mono">{cand.cin}</span>
                  <span>•</span>
                  <span>{cand.joursSuiviCompletes}/28j</span>
                  {cand.statut === 'QUALIFIE_AUTONOME' && (
                    <span className="text-emerald-700 font-bold">✓ Autonome</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionNotice}
          </span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Cartouche Principal de la Recrue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedRecruit.nom} {selectedRecruit.prenom}
              </h2>
              <RecruitStatusBadge status={selectedRecruit.statut} size="sm" lang={lang} />
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  selectedRecruit.workstationNature === 'CRITIQUE'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                Poste {selectedRecruit.workstationNature || 'INITIAL'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-3">
              <span>CIN : {selectedRecruit.cin}</span>
              <span>•</span>
              <span>Matricule : {selectedRecruit.matricule || `L-OPR-${selectedRecruit.cin.slice(-4)}`}</span>
              <span>•</span>
              <span className="font-sans font-semibold text-slate-800">
                {getTypologyLabel(selectedRecruit.typologiePoste, lang)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPassport(selectedRecruit)}
              className="min-h-[44px] px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Passeport PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectRecruit(selectedRecruit)}
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <span>Dossier Complet</span>
            </button>
          </div>
        </div>

        {/* Grille : Prérequis Poka-Yoke & Barème Carré Magique */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloc 1 : Vérification des Prérequis Industriels */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Contrôle Poka-Yoke des 3 Prérequis Opérationnels
            </h3>

            <div className="space-y-2 text-xs">
              {/* Formateur */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  prereqCheck.formateurOk
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {prereqCheck.formateurOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">1. Visa Formateur Terrain (Carré Magique)</div>
                    <div className="text-[11px] text-slate-500">
                      Vérification de l’application des standards et de l’autocontrôle.
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs">
                  {prereqCheck.formateurOk ? 'CONFORME' : 'MANQUANT'}
                </span>
              </div>

              {/* AQL */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  prereqCheck.aqlOk
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {prereqCheck.aqlOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">2. Auditeur Qualité Ligne (AQL ≥ 98%)</div>
                    <div className="text-[11px] text-slate-500">
                      Taux actuel : <strong className="font-mono">{selectedRecruit.tauxRespectAQL || 98}%</strong>
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs">
                  {prereqCheck.aqlOk ? 'CONFORME' : 'NON ATTEINT'}
                </span>
              </div>

              {/* Shift Leader */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  prereqCheck.shiftLeaderOk
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {prereqCheck.shiftLeaderOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">3. Accord Chef d'Équipe (Shift Leader)</div>
                    <div className="text-[11px] text-slate-500">
                      Réf : {selectedRecruit.shiftLeaderId || 'Rachid Amrani'}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs">
                  {prereqCheck.shiftLeaderOk ? 'CONFORME' : 'EN ATTENTE'}
                </span>
              </div>
            </div>

            {/* Critères bloquants du Carré Magique */}
            <div className="mt-4 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>7 Critères Bloquants Carré Magique (15, 16, 17, 18, 20, 26, 29)</span>
                <span className="text-emerald-700 flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                {blockingCriteriaList.map((crit) => (
                  <div key={crit.num} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      <strong>N°{crit.num}</strong> : {crit.lib}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avertissement dérogation */}
            {hasDerogation && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Dérogation formelle active :</strong>
                  <span>{derogationMotif}</span>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    Durée accordée : {derogationDays} jours • Validé par {currentUser.prenom} {currentUser.nom}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bloc 2 : Choix de la Décision & Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                Fiche de Décision Finale (4 Résultats Possibles)
              </h3>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Score Global</span>
                <span className="text-base font-black font-mono text-emerald-800">
                  {scorePercent}% ({((scorePercent / 100)).toFixed(2)}/1.00)
                </span>
              </div>
            </div>

            {/* 4 Boutons de Décision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Autonome */}
              <button
                type="button"
                onClick={() => setSelectedDecision('AUTONOME')}
                className={`min-h-[52px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDecision === 'AUTONOME'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Qualifié Autonome (U)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    ≥ 90%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Déverrouille cadence 100% et poste solo.
                </div>
              </button>

              {/* Option 2: Suivi renforcé */}
              <button
                type="button"
                onClick={() => setSelectedDecision('VALIDE_SUIVI_RENFORCE')}
                className={`min-h-[52px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDecision === 'VALIDE_SUIVI_RENFORCE'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Suivi Renforcé</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    80 - 89%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Habilité avec tutorat de ligne pendant 14j.
                </div>
              </button>

              {/* Option 3: Formation complémentaire */}
              <button
                type="button"
                onClick={() => setSelectedDecision('FORMATION_CIBLEE')}
                className={`min-h-[52px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDecision === 'FORMATION_CIBLEE'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Formation Ciblée</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    70 - 79%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Remise à niveau sur points défaillants (+7j).
                </div>
              </button>

              {/* Option 4: Non validé / Prolongation */}
              <button
                type="button"
                onClick={() => setSelectedDecision('NON_VALIDE_PROLONGATION')}
                className={`min-h-[52px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedDecision === 'NON_VALIDE_PROLONGATION'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Non Validé (Prolongation)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    &lt; 70%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Maintien des verrous et nouveau cycle (+14j).
                </div>
              </button>
            </div>

            {/* Configuration prolongation si nécessaire */}
            {(selectedDecision === 'FORMATION_CIBLEE' || selectedDecision === 'NON_VALIDE_PROLONGATION') && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Paramétrage de la prolongation de formation
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-slate-600">Durée accordée :</label>
                  <select
                    value={prolongationDays}
                    onChange={(e) => setProlongationDays(Number(e.target.value))}
                    className="min-h-[44px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                  >
                    <option value={7}>+7 jours (Formation ciblée)</option>
                    <option value={14}>+14 jours (Prolongation standard)</option>
                    <option value={21}>+21 jours (Cas exceptionnel)</option>
                  </select>
                  <span className="text-slate-500">
                    Nouvelle fin :{' '}
                    <strong className="font-mono text-slate-800">
                      {formatDateDisplay(
                        new Date(Date.now() + prolongationDays * 24 * 60 * 60 * 1000).toISOString()
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Observations / Justification */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Observations de la commission de qualification :
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Consigner les observations techniques, points de vigilance ou justifications..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-500 h-16 resize-none"
              />
            </div>

            {/* Double Visas Officiels (Qualité + Production) */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <span className="text-xs font-bold uppercase text-slate-600 block">
                Double Visa d'Habilitation Industrielle
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Visa Qualité */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Visa Qualité Usine</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRecruit.visaQualite
                        ? `Signé par ${selectedRecruit.visaQualitePar}`
                        : 'En attente signature Qualité'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={selectedRecruit.visaQualite || !canSignQuality}
                    onClick={handleQualityVisa}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      selectedRecruit.visaQualite
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : canSignQuality
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedRecruit.visaQualite ? 'Signé' : 'Viser'}</span>
                  </button>
                </div>

                {/* Visa RFM */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Visa Prod. (RFM)</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRecruit.visaProduction
                        ? `Signé par ${selectedRecruit.visaProductionPar}`
                        : 'En attente signature RFM'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={selectedRecruit.visaProduction || !canSignProd}
                    onClick={handleProductionVisa}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      selectedRecruit.visaProduction
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : canSignProd
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedRecruit.visaProduction ? 'Signé' : 'Viser'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Boutons d'action : Dérogation & Exécution finale */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              {canDerogate && !hasDerogation && !prereqCheck.canQualify && (
                <button
                  type="button"
                  onClick={() => setShowDerogationModal(true)}
                  className="min-h-[48px] px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-700" />
                  <span>Accorder Dérogation Formelle</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={isFinalizing || (!canDecide && currentUser.role !== 'ADMIN')}
                  onClick={handleExecuteDecision}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {isFinalizing ? 'Enregistrement...' : `Appliquer la Décision : ${selectedDecision}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Dérogation Formelle */}
      {showDerogationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Unlock className="w-5 h-5 text-amber-600" />
                Dérogation Formelle Habilitée
              </h3>
              <button
                type="button"
                onClick={() => setShowDerogationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Conformément aux règles LEONI, une dérogation lève temporairement le verrou de qualification sous l’entière responsabilité du signataire habilité.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Motif formel obligatoire :
                </label>
                <textarea
                  value={derogationMotif}
                  onChange={(e) => setDerogationMotif(e.target.value)}
                  placeholder="Ex : Réévaluation programmée, besoin critique ligne PSA, accord exceptionnel du RFM..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-amber-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Durée maximale de la dérogation (jours) :
                </label>
                <select
                  value={derogationDays}
                  onChange={(e) => setDerogationDays(Number(e.target.value))}
                  className="min-h-[44px] w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                >
                  <option value={7}>7 jours (Standard Poste Critique)</option>
                  <option value={14}>14 jours (Standard Poste Initial)</option>
                  <option value={21}>21 jours (Dérogation exceptionnelle)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDerogationModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyDerogation}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Valider la Dérogation & Lever le Verrou
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
