/**
 * LEONI QualiTrack - Étape 4 : Catalogue des Postes & Besoins de Production
 * Typologie des postes : Postes Initiaux vs Postes Critiques (IATF 16949)
 */

import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Users,
  Target,
  Clock,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import {
  Language,
  ProductionNeed,
  UserProfile,
  Workstation,
  WorkstationNature
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';

interface WorkstationCatalogTabProps {
  workstations: Workstation[];
  productionNeeds: ProductionNeed[];
  currentUser: UserProfile;
  lang: Language;
  onCreateProductionNeed: (
    need: Omit<ProductionNeed, 'id' | 'quantitePourvue' | 'statut'>
  ) => Promise<void>;
  onSelectWorkstationForAssignment?: (ws: Workstation) => void;
}

export const WorkstationCatalogTab: React.FC<WorkstationCatalogTabProps> = ({
  workstations,
  productionNeeds,
  currentUser,
  lang,
  onCreateProductionNeed,
  onSelectWorkstationForAssignment
}) => {
  const t = TRANSLATIONS[lang];
  const [filterNature, setFilterNature] = useState<WorkstationNature | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [isNewNeedModalOpen, setIsNewNeedModalOpen] = useState(false);

  // Formulaire nouveau besoin
  const [needWsId, setNeedWsId] = useState(workstations[0]?.id || '');
  const [needQty, setNeedQty] = useState(2);
  const [needDate, setNeedDate] = useState('2026-10-30');
  const [needPriority, setNeedPriority] = useState<'NORMALE' | 'URGENTE' | 'CRITIQUE'>('URGENTE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const segments = Array.from(new Set(workstations.map((w) => w.segment)));

  const filteredWorkstations = workstations.filter((ws) => {
    if (filterNature !== 'ALL' && ws.typologie !== filterNature) return false;
    if (selectedSegment !== 'ALL' && ws.segment !== selectedSegment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFr = ws.intituleFr.toLowerCase().includes(q) || ws.code.toLowerCase().includes(q);
      const matchAr = ws.intituleAr.includes(q);
      const matchAptitudes = ws.aptitudesRequisesFr.some((a) => a.toLowerCase().includes(q));
      if (!matchFr && !matchAr && !matchAptitudes) return false;
    }
    return true;
  });

  const handleCreateNeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ws = workstations.find((w) => w.id === needWsId);
    if (!ws) return;

    try {
      setIsSubmitting(true);
      await onCreateProductionNeed({
        siteId: currentUser.siteId,
        workstationId: ws.id,
        workstationCode: ws.code,
        workstationIntituleFr: ws.intituleFr,
        workstationIntituleAr: ws.intituleAr,
        typologie: ws.typologie,
        segment: ws.segment,
        ligne: ws.ligne,
        quantiteDemandee: Number(needQty),
        dateCible: needDate,
        priorite: needPriority
      });
      setIsNewNeedModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôle et filtres */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-700" />
              <span>{t.tabCatalogue}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distinction industrielle stricte : Postes Initiaux (débutants) vs Postes Critiques (exigence IATF, assiduité 100%, note ≥ 16/20).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewNeedModalOpen(true)}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProductionNeed}</span>
          </button>
        </div>

        {/* Filtres & Recherche */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par poste, code, aptitude..."
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Filtre Typologie */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterNature('ALL')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterNature === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({workstations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterNature('INITIAL')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterNature === 'INITIAL' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Initiaux ({workstations.filter((w) => w.typologie === 'INITIAL').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterNature('CRITIQUE')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterNature === 'CRITIQUE' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Critiques ({workstations.filter((w) => w.typologie === 'CRITIQUE').length})</span>
            </button>
          </div>

          {/* Filtre Segment */}
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-700 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="ALL">Tous les segments atelier</option>
            {segments.map((seg) => (
              <option key={seg} value={seg}>
                Segment {seg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cartouche des besoins de production ouverts */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base tracking-tight">
              {t.productionNeedsTitle} ({productionNeeds.filter((n) => n.statut !== 'POURVU' && n.statut !== 'CLOTURE').length} ouverts)
            </h3>
          </div>
          <span className="text-xs text-blue-200">
            Objectif : pourvoir en priorité les lignes d’assemblage à J5 de l’école
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productionNeeds.map((need) => {
            const isFilled = need.statut === 'POURVU';
            const remaining = need.quantiteDemandee - need.quantitePourvue;
            return (
              <div
                key={need.id}
                className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 space-y-2 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-blue-200">
                    {need.workstationCode}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      need.priorite === 'CRITIQUE'
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/30'
                        : need.priorite === 'URGENTE'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                        : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                    }`}
                  >
                    {need.priorite}
                  </span>
                </div>

                <div className="font-bold text-xs text-white line-clamp-1">
                  {lang === 'ar' ? need.workstationIntituleAr : need.workstationIntituleFr}
                </div>

                <div className="text-[11px] text-blue-200 flex items-center justify-between">
                  <span>{need.segment} • {need.ligne}</span>
                  <span className="font-mono text-white font-bold">
                    {need.quantitePourvue}/{need.quantiteDemandee} pourvu(s)
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isFilled ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (need.quantitePourvue / need.quantiteDemandee) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grille du catalogue des postes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkstations.map((ws) => {
          const isCritical = ws.typologie === 'CRITIQUE';
          const activeNeed = productionNeeds.find(
            (n) => n.workstationId === ws.id && n.statut !== 'POURVU' && n.statut !== 'CLOTURE'
          );

          return (
            <div
              key={ws.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs hover:shadow-xs transition-shadow ${
                isCritical
                  ? 'border-rose-200/90 bg-gradient-to-br from-white to-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Header carte poste */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {ws.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isCritical ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{t.workstationCritical}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.workstationInitial}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? ws.intituleAr : ws.intituleFr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? ws.descriptionAr : ws.descriptionFr}
                  </p>
                </div>

                {activeNeed && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 block">
                      Besoin ouvert ({activeNeed.quantiteDemandee - activeNeed.quantitePourvue})
                    </span>
                  </div>
                )}
              </div>

              {/* Localisation & Formateur référent */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Segment & Ligne</span>
                  <span className="font-bold text-slate-800">{ws.segment} - {ws.ligne}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Formateur production</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate">{ws.formateurReferentNom}</span>
                  </span>
                </div>
              </div>

              {/* Aptitudes requises */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Aptitudes requises
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(lang === 'ar' ? ws.aptitudesRequisesAr : ws.aptitudesRequisesFr).map((apt, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                    >
                      {apt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prérequis stricts Poka-Yoke */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assiduité: {ws.prerequis.assiduiteMinJours}j (100%)</span>
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    Note min: {ws.prerequis.noteEcoleMin}/20
                  </span>
                  {ws.prerequis.diplomeExige && (
                    <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                      Diplôme exigé
                    </span>
                  )}
                </div>

                {onSelectWorkstationForAssignment && (
                  <button
                    type="button"
                    onClick={() => onSelectWorkstationForAssignment(ws)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir candidats</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Saisie d'un nouveau besoin de production */}
      {isNewNeedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-700" />
                <span>{t.addProductionNeed}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewNeedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNeedSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Poste ciblé du catalogue</label>
                <select
                  value={needWsId}
                  onChange={(e) => setNeedWsId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {workstations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.intituleFr} ({w.typologie === 'CRITIQUE' ? 'Critique' : 'Initial'}) - {w.segment}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quantité demandée</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={needQty}
                    onChange={(e) => setNeedQty(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date cible atelier</label>
                  <input
                    type="date"
                    value={needDate}
                    onChange={(e) => setNeedDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Niveau de priorité production</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMALE', 'URGENTE', 'CRITIQUE'] as const).map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setNeedPriority(prio)}
                      className={`min-h-[44px] rounded-xl font-bold text-xs cursor-pointer border ${
                        needPriority === prio
                          ? prio === 'CRITIQUE'
                            ? 'bg-rose-50 border-rose-400 text-rose-800'
                            : prio === 'URGENTE'
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'bg-blue-50 border-blue-400 text-blue-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewNeedModalOpen(false)}
                  className="min-h-[48px] px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-2xs"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Créer le besoin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
