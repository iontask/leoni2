/**
 * LEONI QualiTrack - Module 5 : Validation de la Qualification (Étape 5 Métier)
 * 
 * 1. Fiche de décision de qualification par recrue (4 résultats officiels)
 * 2. Droits de validation paramétrables par rôle et typologie de poste
 * 3. Conservation des preuves d'audit (< 2 minutes pour un auditeur)
 * 4. Effets de la décision : statuts, verrous, prolongation
 * 5. Dérogation formelle : motif obligatoire, durée limitée, traçabilité
 * 6. Requalification à 90 jours : planification auto J+90, rappels, rétrogradation Niveau L
 * 7. Fiche de parcours & Passeport de qualification exportable en PDF
 */

import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  FolderLock,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Clock,
  Printer,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Recruit, UserProfile, Language, SystemParameter } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { QualificationDecisionTab } from './qualification/QualificationDecisionTab';
import { AuditVaultTab } from './qualification/AuditVaultTab';
import { Requalification90JTab } from './qualification/Requalification90JTab';
import { ValidationRightsTab } from './qualification/ValidationRightsTab';
import { PassportQualificationPrintModal } from './qualification/PassportQualificationPrintModal';

interface QualificationModuleProps {
  recruits: Recruit[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onSignQualityVisa?: (recruitId: string) => Promise<void>;
  onSignProductionVisa?: (recruitId: string) => Promise<void>;
  onFinalizeQualification?: (recruitId: string) => Promise<void>;
  onTriggerPokaYoke: (action: string, recruit: Recruit) => void;
  onSelectRecruit: (recruit: Recruit) => void;
  onRefreshParent?: () => Promise<void>;
}

type QualifTab = 'DECISIONS' | 'AUDIT_VAULT' | 'REQUALIF_90J' | 'RIGHTS';

export const QualificationModule: React.FC<QualificationModuleProps> = ({
  recruits,
  currentUser,
  parameters,
  lang,
  onSignQualityVisa,
  onSignProductionVisa,
  onFinalizeQualification,
  onTriggerPokaYoke,
  onSelectRecruit,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<QualifTab>('DECISIONS');

  // Modal Passeport Print
  const [passportRecruit, setPassportRecruit] = useState<Recruit | null>(null);

  const handleRefresh = async () => {
    if (onRefreshParent) {
      await onRefreshParent();
    }
  };

  // KPIs
  const countAutonomes = recruits.filter(
    (r) => r.statut === 'QUALIFIE_AUTONOME' || r.qualifiee
  ).length;

  const countAQualifier = recruits.filter(
    (r) =>
      r.statut === 'EN_APPRENTISSAGE_POSTE' &&
      (r.joursSuiviCompletes || 0) >= 18
  ).length;

  const countProlongation = recruits.filter(
    (r) => r.statut === 'NON_QUALIFIE_PROLONGATION' || r.estEnProlongation
  ).length;

  const countDerogations = recruits.filter(
    (r) => r.traceAffectation?.estDerogation
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Étape 5 Métier LEONI QualiTrack</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 mt-0.5">
            <Award className="w-6 h-6 text-emerald-600" />
            {t.navQualification}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Habilitation industrielle finale, double visa Qualité & RFM, coffre-fort d’audit &lt; 2 min et requalification 90J.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {passportRecruit ? (
            <button
              type="button"
              onClick={() => setPassportRecruit(passportRecruit)}
              className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Passeport</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const auto = recruits.find((r) => r.statut === 'QUALIFIE_AUTONOME') || recruits[0];
                if (auto) setPassportRecruit(auto);
              }}
              className="min-h-[44px] px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Aperçu Passeport</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Qualifiés Autonomes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-semibold">Opérateurs Autonomes</span>
            <span className="text-lg font-black font-mono text-emerald-800">{countAutonomes}</span>
          </div>
        </div>

        {/* KPI 2: Dossiers à Qualifier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-semibold">Dossiers à Qualifier</span>
            <span className="text-lg font-black font-mono text-blue-900">{countAQualifier}</span>
          </div>
        </div>

        {/* KPI 3: En Prolongation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-semibold">En Prolongation</span>
            <span className="text-lg font-black font-mono text-rose-800">{countProlongation}</span>
          </div>
        </div>

        {/* KPI 4: Dérogations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-semibold">Dérogations Actives</span>
            <span className="text-lg font-black font-mono text-amber-800">{countDerogations}</span>
          </div>
        </div>
      </div>

      {/* Navigation entre les 4 onglets */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('DECISIONS')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'DECISIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t.qualifTabDecisions}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_VAULT')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'AUDIT_VAULT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FolderLock className="w-4 h-4" />
          <span>{t.qualifTabAuditVault}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REQUALIF_90J')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'REQUALIF_90J'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.qualifTabRequalif90J}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RIGHTS')}
          className={`min-h-[44px] flex-1 min-w-[200px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'RIGHTS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t.qualifTabRights}</span>
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === 'DECISIONS' && (
        <QualificationDecisionTab
          recruits={recruits}
          currentUser={currentUser}
          parameters={parameters}
          lang={lang}
          onRefreshParent={handleRefresh}
          onOpenPassport={(rec) => setPassportRecruit(rec)}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeTab === 'AUDIT_VAULT' && (
        <AuditVaultTab
          recruits={recruits}
          currentUser={currentUser}
          lang={lang}
          onOpenPassport={(rec) => setPassportRecruit(rec)}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeTab === 'REQUALIF_90J' && (
        <Requalification90JTab
          recruits={recruits}
          currentUser={currentUser}
          lang={lang}
          onRefreshParent={handleRefresh}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeTab === 'RIGHTS' && (
        <ValidationRightsTab
          currentUser={currentUser}
          lang={lang}
          onRefreshParent={handleRefresh}
        />
      )}

      {/* Modal Passeport Imprimable */}
      {passportRecruit && (
        <PassportQualificationPrintModal
          isOpen={Boolean(passportRecruit)}
          onClose={() => setPassportRecruit(null)}
          recruit={passportRecruit}
          currentUser={currentUser}
          lang={lang}
        />
      )}
    </div>
  );
};
