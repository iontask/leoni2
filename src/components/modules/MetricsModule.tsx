/**
 * LEONI QualiTrack - Module 7 : Indicateurs et Tableaux de Bord
 * Moteur de calculs unique : Un même indicateur affiche la même valeur sur tous les écrans.
 * 
 * Vues :
 * - Formateur (« Ma journée »)
 * - Responsable de Production (« Mes recrues, niveaux, écarts »)
 * - Direction et DRH (« Vue consolidée par site, groupe et période »)
 * 
 * Règles strictes :
 * - Cinq indicateurs maximum en haut de page, détails dessous.
 * - Un clic sur un chiffre ouvre la liste des personnes concernées.
 * - Export PDF et CSV.
 * - Aucun chiffre fictif de turnover (8-9%) ou difficultés en dur.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Printer,
  Download,
  Calendar,
  Building2,
  Users,
  Factory,
  ShieldCheck,
  Award,
  Layers,
  Smile
} from 'lucide-react';
import { Recruit, SystemParameter, Language, UserProfile, SchoolGroup, SchoolAttendanceRecord } from '../../types';
import { CarreMagiqueSheet } from '../../types/carreMagique';
import {
  ConsolidatedDashboardData,
  DepartureRecord,
  DrilldownTarget,
  MetricsDashboardView,
  OperatorSatisfactionSurvey
} from '../../types/metrics';
import { TRANSLATIONS } from '../../i18n/translations';
import { MetricsEngine } from '../../engine/metrics';
import { repositoryInstance } from '../../repositories/storageRepository';
import { TrainerViewTab } from './metrics/TrainerViewTab';
import { ProductionViewTab } from './metrics/ProductionViewTab';
import { DirectionViewTab } from './metrics/DirectionViewTab';
import { MetricDrilldownModal } from './metrics/MetricDrilldownModal';

interface MetricsModuleProps {
  recruits: Recruit[];
  parameters: SystemParameter[];
  currentUser: UserProfile;
  siteName: string;
  lang: Language;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const MetricsModule: React.FC<MetricsModuleProps> = ({
  recruits,
  parameters,
  currentUser,
  siteName,
  lang,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];

  // Déterminer la vue par défaut selon le rôle connecté
  const getDefaultView = (): MetricsDashboardView => {
    if (currentUser.role === 'FORMATEUR_TERRAIN' || currentUser.role === 'FORMATEUR_ECOLE') {
      return 'FORMATEUR';
    }
    if (currentUser.role === 'RESPONSABLE_PRODUCTION' || currentUser.role === 'SHIFT_LEADER' || currentUser.role === 'QUALITE') {
      return 'PRODUCTION';
    }
    return 'DIRECTION';
  };

  const [activeView, setActiveView] = useState<MetricsDashboardView>(getDefaultView());
  const [selectedPeriod, setSelectedPeriod] = useState<string>('MOIS');
  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [attendance, setAttendance] = useState<SchoolAttendanceRecord[]>([]);
  const [departures, setDepartures] = useState<DepartureRecord[]>([]);
  const [surveys, setSurveys] = useState<OperatorSatisfactionSurvey[]>([]);
  const [sheets, setSheets] = useState<Record<string, CarreMagiqueSheet>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown modal state
  const [drilldownTarget, setDrilldownTarget] = useState<DrilldownTarget | null>(null);

  // Charger les données périphériques pour le moteur unique
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [grps, att, deps, survs] = await Promise.all([
          repositoryInstance.getAllGroups(),
          repositoryInstance.getAttendance('grp-01'),
          repositoryInstance.getAllDepartures(),
          repositoryInstance.getAllSatisfactionSurveys()
        ]);
        const cmSheets = repositoryInstance.getAllCarreMagiqueSheets();

        if (isMounted) {
          setGroups(grps);
          setAttendance(att);
          setDepartures(deps);
          setSurveys(survs);
          setSheets(cmSheets);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calcul unique et certifié via MetricsEngine
  const consolidatedData: ConsolidatedDashboardData = MetricsEngine.getConsolidatedData(
    recruits,
    sheets,
    departures,
    surveys,
    groups,
    attendance
  );

  // Export PDF (Print)
  const handleExportPDF = () => {
    window.print();
  };

  // Export CSV Global du Tableau de Bord
  const handleExportCSV = () => {
    const rows = [
      ['INDICATEUR', 'VALEUR', 'UNITE_PERIMETRE', 'DATE_EXPORT'],
      ['Personnes en formation à l’instant (Total)', consolidatedData.enFormationALInstant.total, 'personnes', new Date().toISOString()],
      ['En école de formation (5j)', consolidatedData.enFormationALInstant.enEcole, 'personnes', new Date().toISOString()],
      ['En apprentissage au poste (28j)', consolidatedData.enFormationALInstant.enPoste, 'personnes', new Date().toISOString()],
      ['En prolongation', consolidatedData.enFormationALInstant.enProlongation, 'personnes', new Date().toISOString()],
      ['Validations à 5 jours (École)', consolidatedData.validations5JoursTotal, 'opérateurs admis', new Date().toISOString()],
      ['Validations à 28 jours (Autonomes)', consolidatedData.validations28JoursTotal, 'opérateurs autonomes', new Date().toISOString()],
      ['Désistements et départs réels', consolidatedData.departsTotal, 'personnes', new Date().toISOString()],
      ['Affectations en ligne réalisées', consolidatedData.affectationsTotal, 'opérateurs affectés', new Date().toISOString()],
      ['Personnes restantes dans les 28 jours', consolidatedData.personnesRestantes28J.totalRestants, 'opérateurs au poste', new Date().toISOString()],
      ['Total défauts déclarés en formation', consolidatedData.totalDefautsObserves, 'défauts suivis 100%', new Date().toISOString()],
      ['Taux de présence global', `${consolidatedData.tauxPresenceGlobalPourcent}%`, 'assiduité', new Date().toISOString()],
      ['Moyenne note théorique école', `${consolidatedData.moyenneNoteTheorieSur20}/20`, 'note théorique', new Date().toISOString()],
      ['Moyenne note pratique école', `${consolidatedData.moyenneNotePratiqueSur20}/20`, 'note pratique', new Date().toISOString()],
      ['Satisfaction globale opérateurs', `${consolidatedData.satisfactionGlobaleSur5}/5`, 'enquête apprenants', new Date().toISOString()],
      ['NPS recommandation', `+${consolidatedData.recommandationNPSMoyen * 10}`, 'score NPS', new Date().toISOString()]
    ];

    const csvContent =
      '\uFEFF' +
      rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `indicateurs_leoni_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Barre Supérieure du Module 7 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Étape 7 Métier LEONI QualiTrack • Module de Calculs Unique</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 mt-0.5">
            {t.navIndicateurs}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tableau de bord certifié sans duplication pour : <strong className="text-slate-800">{siteName}</strong>.
          </p>
        </div>

        {/* Contrôles : Période, Export PDF & Export CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="SEMAINE">Cette semaine (S43)</option>
              <option value="MOIS">Ce mois-ci (Octobre 2026)</option>
              <option value="TRIMESTRE">Ce trimestre (T4 2026)</option>
              <option value="ANNEE">Année 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sélecteur des 3 Vues Métier par Rôle */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1">
        {/* Vue 1: Formateur */}
        <button
          type="button"
          onClick={() => setActiveView('FORMATEUR')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeView === 'FORMATEUR'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Vue Formateur (« Ma journée »)</span>
        </button>

        {/* Vue 2: Responsable Production */}
        <button
          type="button"
          onClick={() => setActiveView('PRODUCTION')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeView === 'PRODUCTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Vue Resp. Production (« Mes recrues, niveaux, écarts »)</span>
        </button>

        {/* Vue 3: Direction & DRH */}
        <button
          type="button"
          onClick={() => setActiveView('DIRECTION')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeView === 'DIRECTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vue Direction & DRH (« Vue consolidée site & groupe »)</span>
        </button>
      </div>

      {/* Contenu de la Vue Active */}
      {activeView === 'FORMATEUR' && (
        <TrainerViewTab
          data={consolidatedData}
          recruits={recruits}
          currentUser={currentUser}
          lang={lang}
          onOpenDrilldown={(target) => setDrilldownTarget(target)}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeView === 'PRODUCTION' && (
        <ProductionViewTab
          data={consolidatedData}
          recruits={recruits}
          currentUser={currentUser}
          lang={lang}
          onOpenDrilldown={(target) => setDrilldownTarget(target)}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeView === 'DIRECTION' && (
        <DirectionViewTab
          data={consolidatedData}
          recruits={recruits}
          groups={groups}
          currentUser={currentUser}
          siteName={siteName}
          lang={lang}
          onOpenDrilldown={(target) => setDrilldownTarget(target)}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {/* Modal Drilldown Nominatif (« Un clic sur un chiffre ouvre la liste des personnes concernées ») */}
      <MetricDrilldownModal
        isOpen={Boolean(drilldownTarget)}
        onClose={() => setDrilldownTarget(null)}
        target={drilldownTarget}
        onSelectRecruit={onSelectRecruit}
        lang={lang}
      />
    </div>
  );
};
