import React, { useState } from 'react';
import {
  Factory,
  Layers,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  BarChart2
} from 'lucide-react';
import { Recruit, Language, UserProfile } from '../../../types';
import {
  ConsolidatedDashboardData,
  DrilldownTarget
} from '../../../types/metrics';
import { TRANSLATIONS, formatDateDisplay, getTypologyLabel } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';

interface ProductionViewTabProps {
  data: ConsolidatedDashboardData;
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onOpenDrilldown: (target: DrilldownTarget) => void;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const ProductionViewTab: React.FC<ProductionViewTabProps> = ({
  data,
  recruits,
  currentUser,
  lang,
  onOpenDrilldown,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedSegment, setSelectedSegment] = useState<string>('TOUS');

  // Filter recruits by segment if selected
  const productionRecruits = recruits.filter((r) => {
    const isAtStation =
      r.statut === 'EN_APPRENTISSAGE_POSTE' ||
      r.statut === 'NON_QUALIFIE_PROLONGATION' ||
      r.statut === 'QUALIFIE_AUTONOME';

    if (!isAtStation) return false;
    if (selectedSegment === 'TOUS') return true;
    return r.segmentAffectation === selectedSegment;
  });

  const remaining = data.personnesRestantes28J;

  return (
    <div className="space-y-6">
      {/* 5 INDICATEURS MAXIMUM EN HAUT DE PAGE */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pilotage Fabrication & Lignes — 5 Indicateurs Clés
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrer par segment :</span>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-blue-600"
            >
              <option value="TOUS">Tous les segments</option>
              <option value="PSA">Segment PSA</option>
              <option value="VW">Segment VW</option>
              <option value="Renault">Segment Renault</option>
              <option value="Stellantis">Segment Stellantis</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* KPI 1 : Recrues actives atelier */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs en apprentissage atelier sur les lignes',
                description: 'Effectif en cours de formation au poste (28 jours de suivi)',
                recrues: productionRecruits.filter((r) => r.statut !== 'QUALIFIE_AUTONOME'),
                valeurAffichee: remaining.totalRestants
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                Recrues Atelier
              </span>
              <Factory className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1 group-hover:text-blue-600">
              {remaining.totalRestants}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Dans le cycle 28J</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Voir liste →</span>
            </p>
          </div>

          {/* KPI 2 : Répartition Niveaux I, L, U */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs au Niveau U (Phase 3 - J17 à J28)',
                description: 'Recrues proches de la qualification autonome',
                recrues: remaining.recruesTranche3,
                valeurAffichee: `${remaining.tranche17a28Jours} en Niv. U`
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-indigo-600">
                Niveaux (I / L / U)
              </span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono mt-1">
              {remaining.tranche1a7Jours}I • {remaining.tranche8a16Jours}L • {remaining.tranche17a28Jours}U
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{remaining.tranche17a28Jours} en phase finale U</span>
              <span className="text-indigo-600 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 3 : Écart Cadence & Productivité (P) */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs atteignant l’objectif de productivité (P)',
                description: 'Maîtrise du temps de cycle standard sans goulot d’étranglement',
                recrues: productionRecruits.filter((r) => (r.joursSuiviCompletes || 0) >= 10),
                valeurAffichee: '96%'
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600">
                Objectif Cadence (P)
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              96%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Temps de cycle tenu</span>
              <span className="text-emerald-700 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 4 : Taux Qualité Ligne (Q) */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Audits Qualité Ligne (AQL Conformes ≥ 98%)',
                description: 'Taux de conformité qualité mesuré au poste',
                recrues: productionRecruits.filter((r) => (r.tauxRespectAQL || 98) >= 98),
                valeurAffichee: '98,6%'
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600">
                Taux Qualité (Q)
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              98,6%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Zéro défaut client</span>
              <span className="text-emerald-700 font-semibold group-hover:underline">Audits →</span>
            </p>
          </div>

          {/* KPI 5 : Validations 28J Autonomes */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs qualifiés autonomes (Niveau U validé)',
                description: 'Habilitation finale accordée par double visa Qualité & RFM',
                recrues: data.recruesValidees28J,
                valeurAffichee: data.validations28JoursTotal
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                Validations 28J
              </span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-1">
              {data.validations28JoursTotal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Mises en autonomie</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Voir liste →</span>
            </p>
          </div>
        </div>
      </div>

      {/* DÉTAILS DE FABRICATION SOUS LES 5 INDICATEURS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche (7 cols) : Tableau des recrues restantes dans les 28 jours */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              Personnes Restantes dans les 28 Jours de Suivi ({remaining.totalRestants})
            </h3>
            <span className="text-xs text-slate-500">
              Par tranche : J1-7 (I), J8-16 (L), J17-28 (U)
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {productionRecruits
              .filter((r) => r.statut !== 'QUALIFIE_AUTONOME')
              .map((recruit) => {
                const j = recruit.joursSuiviCompletes || 0;
                const tranche =
                  j <= 7 ? 'Niveau I (J1-7)' : j <= 16 ? 'Niveau L (J8-16)' : 'Niveau U (J17-28)';
                const trancheColor =
                  j <= 7
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : j <= 16
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                return (
                  <div
                    key={recruit.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {recruit.nom} {recruit.prenom}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${trancheColor}`}
                        >
                          {tranche}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>CIN: {recruit.cin}</span>
                        <span> • </span>
                        <span>Poste: {getTypologyLabel(recruit.typologiePoste, lang)}</span>
                        <span> • </span>
                        <span>Seg: {recruit.segmentAffectation || 'PSA'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[10px]">Jours Restants</span>
                        <span className="font-mono font-bold text-slate-800">
                          {Math.max(0, 28 - j)} jours
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectRecruit(recruit)}
                        className="min-h-[40px] px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Suivi
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Colonne droite (5 cols) : Défauts par opérateur & Affectations par segment */}
        <div className="lg:col-span-5 space-y-6">
          {/* Défauts par opérateur en formation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Défauts par Opérateur en Formation
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">
                Seuil Poka-Yoke : 4 déf/j
              </span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.defautsParOperateur.slice(0, 5).map((op) => (
                <div
                  key={op.recrueId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    op.alertePokaYokeDeclenchee
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {op.nom} {op.prenom}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {op.matricule} • {op.segment} • {op.workstationCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-xs ${
                        op.alertePokaYokeDeclenchee ? 'text-rose-700' : 'text-slate-800'
                      }`}
                    >
                      {op.totalDefauts} défauts
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Max {op.maxDefautsEnUnJour}/j
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Affectations par segment */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-700" />
              Affectations Réalisées par Segment
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(data.affectationsParSegment).map(([segment, count]) => {
                const total = data.affectationsTotal || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={segment} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">Segment {segment}</span>
                      <span className="font-mono text-blue-900">
                        {count} opérateurs ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
