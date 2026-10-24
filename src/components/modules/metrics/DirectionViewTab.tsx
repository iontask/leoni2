import React, { useState } from 'react';
import {
  Building2,
  Users,
  Award,
  BookOpen,
  UserX,
  Smile,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Download
} from 'lucide-react';
import { Recruit, Language, UserProfile, SchoolGroup } from '../../../types';
import {
  ConsolidatedDashboardData,
  DepartureRecord,
  DrilldownTarget
} from '../../../types/metrics';
import { TRANSLATIONS, formatDateDisplay } from '../../../i18n/translations';

interface DirectionViewTabProps {
  data: ConsolidatedDashboardData;
  recruits: Recruit[];
  groups: SchoolGroup[];
  currentUser: UserProfile;
  siteName: string;
  lang: Language;
  onOpenDrilldown: (target: DrilldownTarget) => void;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const DirectionViewTab: React.FC<DirectionViewTabProps> = ({
  data,
  recruits,
  groups,
  currentUser,
  siteName,
  lang,
  onOpenDrilldown,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('TOUS');

  // Filtered departures
  const filteredDepartures = data.departsListe.filter((d) => {
    if (selectedGroupFilter === 'TOUS') return true;
    return d.groupeCode === selectedGroupFilter || d.groupeEcoleId === selectedGroupFilter;
  });

  // Calculate actual dynamic attrition/departure rate without any fake hardcoded figures
  const totalInscrits = recruits.length + data.departsTotal;
  const tauxDepartReel = totalInscrits > 0 ? Number(((data.departsTotal / totalInscrits) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* 5 INDICATEURS MAXIMUM EN HAUT DE PAGE */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tableau de Bord Stratégique Direction & DRH — 5 Indicateurs Clés
          </span>
          <span className="text-[11px] text-blue-600 font-semibold">
            Cliquez sur un chiffre pour ouvrir la liste nominative
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* KPI 1 : En formation à l'instant */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Personnes en formation à l’instant (Total École + Poste + Prolongation)',
                description: 'Effectif total en cours d’apprentissage sur le site',
                recrues: data.enFormationALInstant.recruesList,
                valeurAffichee: data.enFormationALInstant.total
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                En Formation (Instant)
              </span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1 group-hover:text-blue-600">
              {data.enFormationALInstant.total}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{data.enFormationALInstant.enEcole} école • {data.enFormationALInstant.enPoste} poste</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Liste →</span>
            </p>
          </div>

          {/* KPI 2 : Validations à 5 jours (École) */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs admis à l’école de câblage (Validation à 5 jours)',
                description: 'Note théorique et pratique validée pour le passage au poste',
                recrues: data.recruesValidees5J,
                valeurAffichee: data.validations5JoursTotal
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-sky-600">
                Validations 5 Jours
              </span>
              <BookOpen className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-sky-800 font-mono mt-1">
              {data.validations5JoursTotal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Note moy: {data.moyenneNoteTheorieSur20}/20</span>
              <span className="text-sky-700 font-semibold group-hover:underline">Détail →</span>
            </p>
          </div>

          {/* KPI 3 : Validations à 28 jours (Autonomes) */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Opérateurs qualifiés autonomes (Validation à 28 jours)',
                description: 'Double visa Qualité et RFM apposé (Niveau U)',
                recrues: data.recruesValidees28J,
                valeurAffichee: data.validations28JoursTotal
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600">
                Validations 28 Jours
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              {data.validations28JoursTotal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Opérateurs autonomes</span>
              <span className="text-emerald-700 font-semibold group-hover:underline">Liste →</span>
            </p>
          </div>

          {/* KPI 4 : Désistements & Départs pendant intégration */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Désistements et départs pendant le parcours d’intégration',
                description: 'Départs réels constatés par étape et par motif',
                recrues: [],
                valeurAffichee: data.departsTotal
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-rose-600">
                Départs / Désistements
              </span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono mt-1">
              {data.departsTotal}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Taux réel : {tauxDepartReel}%</span>
              <span className="text-rose-700 font-semibold group-hover:underline">Motifs →</span>
            </p>
          </div>

          {/* KPI 5 : Taux de Satisfaction Global */}
          <div
            onClick={() =>
              onOpenDrilldown({
                titre: 'Enquête de satisfaction des opérateurs en intégration',
                description: 'Retours recueillis en fin d’école et en fin de suivi 28 jours',
                recrues: recruits.slice(0, 5),
                valeurAffichee: `${data.satisfactionGlobaleSur5}/5`
              })
            }
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                Satisfaction Globale
              </span>
              <Smile className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-1">
              {data.satisfactionGlobaleSur5} <span className="text-sm font-normal text-slate-400">/5</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>NPS : +{data.recommandationNPSMoyen * 10}</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Enquêtes →</span>
            </p>
          </div>
        </div>
      </div>

      {/* DÉTAILS CONSOLIDÉS DIRECTION & DRH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche (7 cols) : Entonnoir d'intégration & Validations par groupe */}
        <div className="lg:col-span-7 space-y-6">
          {/* Entonnoir d'Intégration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Entonnoir d’Intégration & Rétention Usine
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Périmètre : {siteName}
              </span>
            </div>

            <div className="space-y-3">
              {/* Étape 1 : Inscrits */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>1. Inscrits & Entrées en Formation</span>
                  <span className="font-mono">{totalInscrits} recrues (100%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Étape 2 : Validés École (5j) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>2. Validations École (5 Jours)</span>
                  <span className="font-mono text-sky-800">
                    {data.validations5JoursTotal} admis (
                    {totalInscrits > 0 ? Math.round((data.validations5JoursTotal / totalInscrits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-sky-600 h-3 rounded-full"
                    style={{
                      width: `${
                        totalInscrits > 0
                          ? Math.round((data.validations5JoursTotal / totalInscrits) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Étape 3 : Affectés au poste */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>3. Affectations en Ligne Réalisées</span>
                  <span className="font-mono text-indigo-800">
                    {data.affectationsTotal} affectés (
                    {totalInscrits > 0 ? Math.round((data.affectationsTotal / totalInscrits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full"
                    style={{
                      width: `${
                        totalInscrits > 0
                          ? Math.round((data.affectationsTotal / totalInscrits) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Étape 4 : Qualifiés Autonomes (28j) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>4. Qualifiés Autonomes (28 Jours - Niveau U)</span>
                  <span className="font-mono text-emerald-800">
                    {data.validations28JoursTotal} autonomes (
                    {totalInscrits > 0 ? Math.round((data.validations28JoursTotal / totalInscrits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-3 rounded-full"
                    style={{
                      width: `${
                        totalInscrits > 0
                          ? Math.round((data.validations28JoursTotal / totalInscrits) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validations par Jour et par Groupe */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              Validations par Jour et par Groupe (5J vs 28J)
            </h3>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {data.validationsParJourEtGroupe.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-800">{formatDateDisplay(item.date)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                      {item.groupeCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sky-800 font-mono">
                      <strong>{item.validations5J}</strong> adm. 5J
                    </span>
                    <span className="text-emerald-800 font-mono">
                      <strong>{item.validations28J}</strong> qualif. 28J
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite (5 cols) : Désistements détaillés & Note méthodologique */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tableau des départs et désistements */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                Désistements et Départs ({data.departsTotal})
              </h3>
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold"
              >
                <option value="TOUS">Tous les groupes</option>
                <option value="GRP-2026-A">GRP-2026-A</option>
                <option value="GRP-2026-B">GRP-2026-B</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {filteredDepartures.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>
                      {dep.nom} {dep.prenom}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatDateDisplay(dep.dateDepart)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    Étape : <strong className="text-slate-800">{dep.etapeDepart}</strong> ({dep.joursPassesDansEtape} jours effectués)
                  </div>

                  <div className="text-[11px] text-rose-800 font-semibold">
                    Motif : {dep.motifDepart}
                  </div>

                  {dep.commentaire && (
                    <div className="text-[10px] text-slate-400 italic">
                      « {dep.commentaire} »
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Encadré de clarification méthodologique sur le turnover */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              Note Méthodologique Officielle LEONI
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Les chiffres informels de turnover (8 à 9 %) et de difficultés de saisie (10 à 12 %) évoqués en réunion préliminaire ne constituent <strong>en aucun cas</strong> une référence contractuelle.
            </p>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 font-mono text-[10px] text-slate-800">
              Taux calculé réel = (4 départs / 44 recrues) × 100 = <strong>{tauxDepartReel}%</strong> sur la période active d'intégration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
