/**
 * LEONI QualiTrack - Module 3 / Étape 4 : Affectation aux Postes selon Typologie & Tests
 * Orchestre :
 * 1. Catalogue des Postes & Besoins de Production (Postes Initiaux vs Critiques)
 * 2. Moteur d'Affectation Intelligente (J5+) avec justifications ("Pourquoi cette suggestion") et refus motivés
 * 3. Test Pratique Assisté par IA (Gemini côté serveur, "Suggestion IA, à valider")
 * 4. Matrice des Règles & Verrous Poka-Yoke pour Postes Critiques
 */

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Sparkles,
  ShieldAlert,
  Target,
  FileQuestion,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Camera
} from 'lucide-react';
import {
  Language,
  ProductionNeed,
  Recruit,
  StationTypology,
  SystemParameter,
  UserProfile,
  Workstation
} from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { repositoryInstance } from '../../repositories/storageRepository';
import { WorkstationCatalogTab } from './assignment/WorkstationCatalogTab';
import { SmartAssignmentTab } from './assignment/SmartAssignmentTab';
import { AIPracticalTestTab } from './assignment/AIPracticalTestTab';
import { WorkstationRulesTab } from './assignment/WorkstationRulesTab';

interface AssignmentModuleProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onAssignStation: (
    recruitId: string,
    typology: StationTypology,
    ligne: string,
    segment: string
  ) => Promise<void>;
  onTriggerPokaYoke: (action: string, recruit: Recruit, ws?: Workstation) => void;
  onSelectRecruit: (recruit: Recruit) => void;
  onRefreshParent?: () => Promise<void>;
}

type AssignmentTab = 'CATALOGUE' | 'SMART_ASSIGNMENT' | 'AI_TEST' | 'RULES';

export const AssignmentModule: React.FC<AssignmentModuleProps> = ({
  recruits,
  currentUser,
  parameters,
  lang,
  onAssignStation,
  onTriggerPokaYoke,
  onSelectRecruit,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<AssignmentTab>('SMART_ASSIGNMENT');
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [productionNeeds, setProductionNeeds] = useState<ProductionNeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser.siteId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const wsList = await repositoryInstance.getAllWorkstations(currentUser.siteId);
      setWorkstations(wsList);
      const needsList = await repositoryInstance.getAllProductionNeeds(currentUser.siteId);
      setProductionNeeds(needsList);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    await loadData();
    if (onRefreshParent) {
      await onRefreshParent();
    }
  };

  const handleCreateProductionNeed = async (
    need: Omit<ProductionNeed, 'id' | 'quantitePourvue' | 'statut'>
  ) => {
    await repositoryInstance.createProductionNeed(need, currentUser);
    await handleRefreshAll();
  };

  const handleSmartAssign = async (
    recruitId: string,
    workstationId: string,
    options?: {
      scoreSuggestion?: number;
      justificationSuggestion?: string;
    }
  ) => {
    const ws = workstations.find((w) => w.id === workstationId);
    if (!ws) return;

    await repositoryInstance.assignRecruitToWorkstation(recruitId, workstationId, currentUser, {
      scoreSuggestion: options?.scoreSuggestion,
      justificationSuggestion: options?.justificationSuggestion,
      estDerogation: false
    });

    // Également appel du handler parent pour compatibilité
    await onAssignStation(
      recruitId,
      ws.stationTypologyRef || 'PLANCHE_ASSEMBLAGE',
      ws.ligne,
      ws.segment
    );

    await handleRefreshAll();
  };

  const openNeedsCount = productionNeeds.filter(
    (n) => n.statut !== 'POURVU' && n.statut !== 'CLOTURE'
  ).length;

  const initialCount = workstations.filter((w) => w.typologie === 'INITIAL').length;
  const criticalCount = workstations.filter((w) => w.typologie === 'CRITIQUE').length;

  return (
    <div className="space-y-6">
      {/* En-tête principal LEONI Étape 4 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{t.navAffectation}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Étape 4 usine
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Typologie des postes, besoins d’affectation ouverts, matching J5+ et évaluation pratique assistée par IA.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton d'impression version papier du test pratique / grille */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{t.printPaperTest}</span>
          </button>
        </div>
      </div>

      {/* Cartes d'indicateurs rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Postes Initiaux
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {initialCount} <span className="text-xs font-normal text-slate-500">postes</span>
          </div>
          <span className="text-[11px] text-slate-500">Insertion, Enrubannage (Débutants)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Postes Critiques
          </span>
          <div className="text-xl font-extrabold text-rose-700 font-mono">
            {criticalCount} <span className="text-xs font-normal text-slate-500">postes</span>
          </div>
          <span className="text-[11px] text-slate-500">AGRF, Bol, Géométrie, Filiste (Poka-Yoke)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Besoins Ouverts
          </span>
          <div className="text-xl font-extrabold text-blue-700 font-mono">
            {openNeedsCount} <span className="text-xs font-normal text-slate-500">demandes</span>
          </div>
          <span className="text-[11px] text-slate-500">À pourvoir en atelier J5+</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Assistant IA Geste
          </span>
          <div className="text-xl font-extrabold text-indigo-700 font-mono">
            Gemini 3.8
          </div>
          <span className="text-[11px] text-slate-500">Grille critères & suggestions formateur</span>
        </div>
      </div>

      {/* Barre d'onglets ergonomique tactile (≥ 48px) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('SMART_ASSIGNMENT')}
          className={`min-h-[48px] flex-1 min-w-[150px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'SMART_ASSIGNMENT'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.tabSmartAssignment}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATALOGUE')}
          className={`min-h-[48px] flex-1 min-w-[150px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'CATALOGUE'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{t.tabCatalogue}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AI_TEST')}
          className={`min-h-[48px] flex-1 min-w-[150px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'AI_TEST'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t.tabAIPracticalTest}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RULES')}
          className={`min-h-[48px] flex-1 min-w-[150px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'RULES'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t.tabWorkstationRules}</span>
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === 'SMART_ASSIGNMENT' && (
        <SmartAssignmentTab
          recruits={recruits}
          workstations={workstations}
          currentUser={currentUser}
          parameters={parameters}
          lang={lang}
          onAssignStation={handleSmartAssign}
          onTriggerPokaYoke={(act, r, ws) => onTriggerPokaYoke(act, r, ws)}
          onSelectRecruit={onSelectRecruit}
          onRefreshParent={handleRefreshAll}
        />
      )}

      {activeTab === 'CATALOGUE' && (
        <WorkstationCatalogTab
          workstations={workstations}
          productionNeeds={productionNeeds}
          currentUser={currentUser}
          lang={lang}
          onCreateProductionNeed={handleCreateProductionNeed}
          onSelectWorkstationForAssignment={(ws) => {
            setActiveTab('SMART_ASSIGNMENT');
          }}
        />
      )}

      {activeTab === 'AI_TEST' && (
        <AIPracticalTestTab
          recruits={recruits}
          workstations={workstations}
          currentUser={currentUser}
          parameters={parameters}
          lang={lang}
          onRefreshParent={handleRefreshAll}
        />
      )}

      {activeTab === 'RULES' && (
        <WorkstationRulesTab
          workstations={workstations}
          parameters={parameters}
          currentUser={currentUser}
          lang={lang}
        />
      )}
    </div>
  );
};
