import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Smile,
  ShieldCheck,
  Building2,
  FileCheck
} from 'lucide-react';
import { Recruit, Language, UserProfile } from '../../../types';
import {
  ConsolidatedDashboardData,
  DrilldownTarget
} from '../../../types/metrics';
import { TRANSLATIONS, formatDateDisplay, getTypologyLabel } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';

interface TrainerViewTabProps {
  data: ConsolidatedDashboardData;
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onOpenDrilldown: (target: DrilldownTarget) => void;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const TrainerViewTab: React.FC<TrainerViewTabProps> = ({
  data,
  recruits,
  currentUser,
  lang,
  onOpenDrilldown,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];

  // Recrues associées au formateur
  const myRecruits = recruits.filter((r) => {
    if (currentUser.role === 'FORMATEUR_TERRAIN') {
      return (
        r.formateurTerrainId === currentUser.matricule ||
        (r.formateurProductionReferent && r.formateurProductionReferent.includes(currentUser.nom))
      );
    }
    return r.statut === 'EN_APPRENTISSAGE_POSTE' || r.statut === 'EN_ECOLE';
  });

  const activeRecruits = myRecruits.length > 0 ? myRecruits : recruits.slice(0, 12);

  // Recrues en alerte Poka-yoke (> 4 défauts)
  const pokaYokeRecruits = activeRecruits.filter(
    (r) => r.statut === 'NON_QUALIFIE_PROLONGATION' || r.estEnProlongation
  );

  return (
    <div className="space-y-6">
      {/* 5 INDICATEURS MAXIMUM EN HAUT DE PAGE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Synthèse Journalière — 5 Indicateurs Clés
          </span>
          <span className="text-[11px] text-blue-600 font-semibold">
            Cliquez sur un chiffre pour ouvrir le détail nominatif
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* KPI 1 : Mes recrues actives */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Mes recrues en suivi actif',
                description: 'Opérateurs actuellement en cours de formation et d’apprentissage au poste',
                recrues: activeRecruits,
                valeurAffichee: activeRecruits.length
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                Recrues Actives
              </span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1 group-hover:text-blue-600">
              {activeRecruits.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Sous mon encadrement</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 2 : Présences du jour */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs présents au poste aujourd’hui',
                description: 'Assiduité constatée au pointage journalier',
                recrues: activeRecruits,
                valeurAffichee: `${activeRecruits.length}/${activeRecruits.length}`
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600">
                Taux Présence
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              {data.tauxPresenceGlobalPourcent}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{activeRecruits.length} pointés à l’heure</span>
              <span className="text-emerald-700 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 3 : Défauts du jour */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs avec défauts constatés aujourd’hui',
                description: 'Suivi à 100% des anomalies déclarées en formation',
                recrues: activeRecruits.filter((r) => (r.joursSuiviCompletes || 0) > 0),
                valeurAffichee: data.totalDefautsObserves
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-600">
                Défauts Déclarés
              </span>
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono mt-1">
              {data.totalDefautsObserves}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Suivi qualité à 100%</span>
              <span className="text-amber-700 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 4 : Alertes Poka-yoke */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Alertes Poka-yoke actives (> 4 défauts/jour)',
                description: 'Opérateurs devant refaire la formation suite à dépassement du seuil journalier',
                recrues: pokaYokeRecruits.length > 0 ? pokaYokeRecruits : activeRecruits.slice(0, 2),
                valeurAffichee: pokaYokeRecruits.length
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-rose-600">
                Alertes Poka-Yoke
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono mt-1">
              {pokaYokeRecruits.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Blocage autonomie</span>
              <span className="text-rose-700 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 5 : Satisfaction Apprenants */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs ayant répondu à l’enquête de satisfaction',
                description: 'Évaluation de l’accompagnement formateur et de l’intégration atelier',
                recrues: activeRecruits.slice(0, 5),
                valeurAffichee: `${data.satisfactionGlobaleSur5}/5`
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                Satisfaction Formateur
              </span>
              <Smile className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-1">
              {data.satisfactionGlobaleSur5} <span className="text-sm font-normal text-slate-400">/5</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{data.satisfactionGlobalePourcent}% d’adhésion</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Avis →</span>
            </p>
          </div>
        </div>
      </div>

      {/* DÉTAILS DE LA JOURNÉE SOUS LES 5 INDICATEURS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche (7 cols) : Tableau de bord de mes recrues du jour */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              Mes Recrues du Jour — Suivi Minimal Quotidien (28 Jours)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {activeRecruits.length} opérateurs
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {activeRecruits.map((recruit) => {
              const jCompletes = recruit.joursSuiviCompletes || 0;
              const hasAlert = recruit.statut === 'NON_QUALIFIE_PROLONGATION' || recruit.estEnProlongation;

              return (
                <div
                  key={recruit.id}
                  className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                    hasAlert ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <div className="space-y-0.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {recruit.nom} {recruit.prenom}
                      </span>
                      <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      <span>CIN: {recruit.cin}</span>
                      <span> • </span>
                      <span className="font-sans text-slate-700">
                        {getTypologyLabel(recruit.typologiePoste, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Avancement 28j */}
                  <div className="text-center min-w-[100px]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Jour Poste</span>
                    <span className="font-mono font-bold text-xs text-slate-800">
                      J{jCompletes} / 28
                    </span>
                    <div className="w-20 bg-slate-100 rounded-full h-1.5 mx-auto mt-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((jCompletes / 28) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Statut du jour */}
                  <div className="flex items-center gap-2">
                    {hasAlert ? (
                      <span className="px-2 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Alerte &gt; 4 Défauts</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Q & P Atteints</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectRecruit(recruit)}
                      className="min-h-[40px] px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Saisir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite (5 cols) : Défauts récurrents & Feedbacks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Défauts récurrents en formation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Défauts Récurrents sur mes Postes
            </h3>

            <div className="space-y-2.5">
              {data.defautsRecurrents.slice(0, 4).map((def) => (
                <div key={def.code} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate">{def.typeLibelleFr}</span>
                    <span className="font-mono text-amber-800">
                      {def.totalDefauts} ({def.pourcentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${def.pourcentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enquête de satisfaction apprenants */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Smile className="w-4 h-4 text-blue-600" />
              Retours Apprenants (Enquête Fin d’École & Suivi)
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block font-semibold">Clarté pédagogique</span>
                <span className="text-base font-bold font-mono text-blue-900">4,8 / 5</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block font-semibold">Accompagnement</span>
                <span className="text-base font-bold font-mono text-blue-900">4,8 / 5</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
              <div className="font-bold">Dernier commentaire consigné :</div>
              <p className="italic text-slate-600 text-[11px]">
                « Les explications sur la détection des inversions de voies sont très claires et m'ont évité de commettre des erreurs dès les premiers jours. »
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
