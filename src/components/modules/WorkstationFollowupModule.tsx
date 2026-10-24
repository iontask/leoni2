/**
 * LEONI QualiTrack - Module 4 : Suivi au Poste (28 Jours) & Checklist Carré Magique
 * 
 * Étape 4 Métier :
 * 1. En-tête officiel de la fiche individuelle prérempli
 * 2. Suivi quotidien sur 28 jours (Ponctualité, Q, P, Défauts 100% avec types, seuil Poka-Yoke > 4 défauts, série 28j pour niveau U)
 * 3. Évaluation Carré Magique par phases avec coefficients et numérotation officielle (1..18, 20, 21..24, 26, 28, 29 et R1..R7)
 * 4. Règles de progression Poka-Yoke (Niveau suivant verrouillé si critère NOK)
 * 5. Dispositif de décision finale (Critères bloquants 15, 16, 17, 18, 20, 26, 29 affichés avant le score)
 * 6. Cartouche des 4 visas certifiés par code personnel (Formateur, Shift Leader, RFM, Qualité)
 * 7. Écrans : Grille 28j pensée tablette, vue "À faire aujourd'hui" pour le formateur, export PDF / impression canevas officiel
 * 8. Banc d'essai automatique vérifiant les 3 cas d'école du canevas Excel LEONI.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  UserCheck,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Recruit, UserProfile, Language, SystemParameter } from '../../types';
import { CarreMagiqueSheet, CarreMagiqueVisaRole, WorkstationDailyRecord } from '../../types/carreMagique';
import { repositoryInstance } from '../../repositories/storageRepository';
import { CarreMagiqueEngine } from '../../engine/carreMagiqueEngine';
import { CarreMagiqueSheetTab } from './workstation/CarreMagiqueSheetTab';
import { TodayTrainerTodoTab } from './workstation/TodayTrainerTodoTab';
import { OfficialCanvasPrintModal } from './workstation/OfficialCanvasPrintModal';
import { ExcelBenchmarkTestModal } from './workstation/ExcelBenchmarkTestModal';
import { TRANSLATIONS, getStatusLabel, maskCIN } from '../../i18n/translations';

interface WorkstationFollowupModuleProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onUpdateFollowupDay: (recruitId: string, daysCount: number, carreMagiqueScore: number) => Promise<void>;
  onSelectRecruit: (recruit: Recruit) => void;
  onRefreshParent?: () => Promise<void>;
}

export const WorkstationFollowupModule: React.FC<WorkstationFollowupModuleProps> = ({
  recruits,
  currentUser,
  parameters,
  lang,
  onUpdateFollowupDay,
  onSelectRecruit,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'FICHE_CM' | 'TODAY_TRAINER' | 'BENCHMARK_EXCEL'>('FICHE_CM');
  const [selectedRecruitId, setSelectedRecruitId] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<CarreMagiqueSheet | null>(null);
  const [sheetsByRecruitId, setSheetsByRecruitId] = useState<Record<string, CarreMagiqueSheet>>({});
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Modales
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  // Recrues en apprentissage au poste ou en prolongation (mémoïsé pour éviter les re-renders infinis)
  const workstationRecruits = useMemo(() => {
    return recruits.filter(
      (r) =>
        r.statut === 'EN_APPRENTISSAGE_POSTE' ||
        r.statut === 'NON_QUALIFIE_PROLONGATION' ||
        (r.statut === 'QUALIFIE_AUTONOME' && (r.joursSuiviCompletes || 0) >= 28)
    );
  }, [recruits]);

  const recruitIdsKey = useMemo(
    () => workstationRecruits.map((r) => r.id).join(','),
    [workstationRecruits]
  );

  // Sélection de la première recrue par défaut
  useEffect(() => {
    if (workstationRecruits.length > 0) {
      if (!selectedRecruitId || !workstationRecruits.some((r) => r.id === selectedRecruitId)) {
        const defaultRecruit =
          workstationRecruits.find((r) => r.statut === 'EN_APPRENTISSAGE_POSTE') ||
          workstationRecruits[0];
        setSelectedRecruitId(defaultRecruit.id);
      }
    }
  }, [recruitIdsKey, selectedRecruitId]);

  // Chargement de la fiche active
  useEffect(() => {
    if (selectedRecruitId) {
      loadSheet(selectedRecruitId);
    }
  }, [selectedRecruitId]);

  // Pré-chargement des fiches pour la vue formateur (stabilisé sur recruitIdsKey)
  useEffect(() => {
    let isCancelled = false;
    async function fetchSheets() {
      const map: Record<string, CarreMagiqueSheet> = {};
      for (const rec of workstationRecruits) {
        try {
          const s = await repositoryInstance.getCarreMagiqueSheet(rec.id);
          map[rec.id] = s;
        } catch {
          // continue
        }
      }
      if (!isCancelled) {
        setSheetsByRecruitId(map);
      }
    }
    if (workstationRecruits.length > 0) {
      fetchSheets();
    }
    return () => {
      isCancelled = true;
    };
  }, [recruitIdsKey]);

  const loadSheet = async (recruitId: string) => {
    setIsLoadingSheet(true);
    try {
      const sheet = await repositoryInstance.getCarreMagiqueSheet(recruitId);
      setCurrentSheet(sheet);
      setSheetsByRecruitId((prev) => ({ ...prev, [recruitId]: sheet }));
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const loadAllSheets = async () => {
    const map: Record<string, CarreMagiqueSheet> = {};
    for (const rec of workstationRecruits) {
      try {
        const s = await repositoryInstance.getCarreMagiqueSheet(rec.id);
        map[rec.id] = s;
      } catch {
        // continue
      }
    }
    setSheetsByRecruitId(map);
  };

  const handleUpdateDailyRow = async (row: WorkstationDailyRecord) => {
    if (!selectedRecruitId) return;
    const updated = await repositoryInstance.updateDailyTrackingRow(selectedRecruitId, row, currentUser);
    setCurrentSheet(updated);
    setSheetsByRecruitId((prev) => ({ ...prev, [selectedRecruitId]: updated }));
    if (onRefreshParent) await onRefreshParent();
  };

  const handleUpdateCriterion = async (
    criterionId: string,
    statut: 'OK' | 'NOK',
    observation?: string
  ) => {
    if (!selectedRecruitId) return;
    const updated = await repositoryInstance.updateCriterionStatus(
      selectedRecruitId,
      criterionId,
      statut,
      currentUser,
      observation
    );
    setCurrentSheet(updated);
    setSheetsByRecruitId((prev) => ({ ...prev, [selectedRecruitId]: updated }));
    if (onRefreshParent) await onRefreshParent();
  };

  const handleSignVisa = async (role: CarreMagiqueVisaRole, codePersonnel: string) => {
    if (!selectedRecruitId) return;
    const updated = await repositoryInstance.signVisa(selectedRecruitId, role, codePersonnel, currentUser);
    setCurrentSheet(updated);
    setSheetsByRecruitId((prev) => ({ ...prev, [selectedRecruitId]: updated }));
    if (onRefreshParent) await onRefreshParent();
  };

  const handleQuickRecordDay = async (recruitId: string, row: WorkstationDailyRecord) => {
    const updated = await repositoryInstance.updateDailyTrackingRow(recruitId, row, currentUser);
    setSheetsByRecruitId((prev) => ({ ...prev, [recruitId]: updated }));
    if (selectedRecruitId === recruitId) {
      setCurrentSheet(updated);
    }
    if (onRefreshParent) await onRefreshParent();
  };

  const currentSelectedRecruit = workstationRecruits.find((r) => r.id === selectedRecruitId);
  const evaluation = currentSheet ? CarreMagiqueEngine.evaluateSheet(currentSheet) : null;

  // Calcul des statistiques globales du module
  const totalActifs = workstationRecruits.length;
  const enProlongationCount = workstationRecruits.filter((r) => r.statut === 'NON_QUALIFIE_PROLONGATION').length;
  const autonomesCount = workstationRecruits.filter((r) => r.statut === 'QUALIFIE_AUTONOME').length;

  return (
    <div className="space-y-6">
      {/* En-tête Principal & Navigation Modules */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-sm font-bold">
              Étape 4 Métier
            </span>
            <span className="text-xs text-slate-400 font-medium">Standard Usine LEONI</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
            <Layers className="w-6 h-6 text-amber-600" />
            <span>28 Jours de Suivi au Poste & Carré Magique</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Checklist numérique conforme au canevas officiel LEONI, grille par phases (Niveaux I, L, U) et 4 visas certifiés.
          </p>
        </div>

        {/* Global KPI Chips */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Opérateurs suivis</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {totalActifs} actifs
            </span>
          </div>

          {enProlongationCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-rose-500 uppercase font-bold block">Poka-Yoke défauts</span>
              <span className="font-mono font-bold text-rose-900 text-sm">
                {enProlongationCount} alerte(s)
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsBenchmarkModalOpen(true)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Test Barème Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher (3 Écrans majeurs) */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('FICHE_CM')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'FICHE_CM'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Fiche 28 Jours & Carré Magique</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TODAY_TRAINER')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'TODAY_TRAINER'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>À faire aujourd’hui (Formateur Terrain)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsBenchmarkModalOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Conformité Barème Excel (3 Cas)</span>
        </button>
      </div>

      {/* VUE 1 : FICHE 28 JOURS & CARRÉ MAGIQUE */}
      {activeTab === 'FICHE_CM' && (
        <div className="space-y-6">
          {/* Sélecteur d'opérateur rapide */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <label htmlFor="recruit-select" className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Choisir l’opérateur à évaluer :
              </label>
              <select
                id="recruit-select"
                value={selectedRecruitId}
                onChange={(e) => setSelectedRecruitId(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-hidden bg-white flex-1 max-w-md"
              >
                {workstationRecruits.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom} {r.prenom} ({r.matricule || maskCIN(r.cin, currentUser.role)}) — J{r.joursSuiviCompletes || 0}/28 — {getStatusLabel(r.statut, lang)}
                  </option>
                ))}
              </select>
            </div>

            {currentSelectedRecruit && (
              <button
                type="button"
                onClick={() => onSelectRecruit(currentSelectedRecruit)}
                className="min-h-[44px] px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Fiche RH complète</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Fiche Carré Magique Complète */}
          {isLoadingSheet ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
              Chargement de la fiche Carré Magique...
            </div>
          ) : currentSheet && currentSelectedRecruit ? (
            <CarreMagiqueSheetTab
              sheet={currentSheet}
              recruit={currentSelectedRecruit}
              currentUser={currentUser}
              lang={lang}
              onUpdateDailyRow={handleUpdateDailyRow}
              onUpdateCriterion={handleUpdateCriterion}
              onSignVisa={handleSignVisa}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onOpenBenchmarkModal={() => setIsBenchmarkModalOpen(true)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
              Veuillez sélectionner un opérateur pour afficher sa fiche Carré Magique.
            </div>
          )}
        </div>
      )}

      {/* VUE 2 : À FAIRE AUJOURD'HUI (FORMATEUR TERRAIN) */}
      {activeTab === 'TODAY_TRAINER' && (
        <TodayTrainerTodoTab
          recruits={workstationRecruits}
          currentUser={currentUser}
          lang={lang}
          onSelectRecruit={(r) => {
            setSelectedRecruitId(r.id);
            setActiveTab('FICHE_CM');
          }}
          onQuickRecordDay={handleQuickRecordDay}
          sheetsByRecruitId={sheetsByRecruitId}
        />
      )}

      {/* MODAL 1 : IMPRESSION HAUTE FIDÉLITÉ CANEVAS OFFICIEL */}
      {currentSheet && evaluation && (
        <OfficialCanvasPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          sheet={currentSheet}
          evaluation={evaluation}
          lang={lang}
        />
      )}

      {/* MODAL 2 : BANC DE TEST AUTOMATIQUE DU BARÈME EXCEL */}
      <ExcelBenchmarkTestModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};
