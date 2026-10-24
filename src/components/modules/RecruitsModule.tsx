/**
 * LEONI QualiTrack - Module 1 : Administration des Dossiers Recrues
 * Pagination côté serveur / repository, recherche instantanée, détection multisite, et import en masse.
 */

import React, { useState } from 'react';
import {
  Search,
  UploadCloud,
  UserPlus,
  Filter,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { Recruit, RecruitStatus, UserProfile, Language, SystemParameter } from '../../types';
import { TRANSLATIONS, formatDateDisplay, maskCIN } from '../../i18n/translations';
import { RecruitStatusBadge } from '../common/RecruitStatusBadge';
import { PaginatedResult } from '../../repositories/types';
import { PokaYokeEngine } from '../../engine/pokaYoke';

interface RecruitsModuleProps {
  paginatedRecruits: PaginatedResult<Recruit>;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  selectedStatus?: RecruitStatus;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status?: RecruitStatus) => void;
  onSelectRecruit: (recruit: Recruit) => void;
  onOpenMassImport: () => void;
  onOpenNewRecruit: () => void;
  onOpenSAPLiaison?: () => void;
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
}

export const RecruitsModule: React.FC<RecruitsModuleProps> = ({
  paginatedRecruits,
  currentPage,
  pageSize,
  searchQuery,
  selectedStatus,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  onSelectRecruit,
  onOpenMassImport,
  onOpenNewRecruit,
  onOpenSAPLiaison,
  currentUser,
  parameters,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  // Vérification Poka-Yoke pour l'import de masse (Administration RH uniquement)
  const canImport = currentUser.role === 'ADMINISTRATION' || currentUser.role === 'ADMIN';

  return (
    <div className="space-y-5">
      {/* Barre d'action supérieure */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {t.navDossiers}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Gestion des dossiers, repérage multisite par CIN et contrôle d’intégration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenSAPLiaison}
              disabled={!canImport}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                canImport
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title="Export et réconciliation de matricules SAP RH"
            >
              <Building2 className="w-4 h-4 shrink-0 text-blue-700" />
              <span>Liaison SAP RH</span>
            </button>

            <button
              type="button"
              onClick={onOpenMassImport}
              disabled={!canImport}
              title={
                !canImport
                  ? 'Réservé au rôle ADMINISTRATION RH ou ADMIN'
                  : 'Importer un fichier CSV de recrues'
              }
              className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                canImport
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>{t.massImport}</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewRecruit}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>{t.newRecruit} (Tablette)</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres de statuts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="md:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
            />
          </div>

          <div className="md:col-span-4">
            <div className="flex items-center min-h-[48px] px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm">
              <Filter className="w-4 h-4 text-slate-400 mx-1 shrink-0" />
              <select
                value={selectedStatus || ''}
                onChange={(e) =>
                  onStatusFilterChange(
                    e.target.value ? (e.target.value as RecruitStatus) : undefined
                  )
                }
                className="w-full bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="">Tous les statuts de qualification</option>
                <option value="EN_ECOLE">En école (5j)</option>
                <option value="EN_APPRENTISSAGE_POSTE">En apprentissage poste (28j)</option>
                <option value="QUALIFIE_AUTONOME">Qualifié autonome</option>
                <option value="NON_QUALIFIE_PROLONGATION">Non qualifié (Prolongation)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau paginé des recrues */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">{t.fullName}</th>
                <th className="px-4 py-3.5">{t.cin} & {t.matricule}</th>
                <th className="px-4 py-3.5">Statut de Qualification</th>
                <th className="px-4 py-3.5">Parcours 33 jours</th>
                <th className="px-4 py-3.5">{t.entryDate}</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRecruits.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {t.noDataFound}
                  </td>
                </tr>
              ) : (
                paginatedRecruits.data.map((recruit) => {
                  const totalDaysDone = (recruit.ecoleJoursValides || 0) + (recruit.joursSuiviCompletes || 0);
                  const progressPct = Math.min(100, Math.round((totalDaysDone / 33) * 100));

                  return (
                    <tr
                      key={recruit.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Nom avec Badge de Statut obligatoire à côté */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {recruit.nom} {recruit.prenom}
                            </span>
                          </div>

                          {recruit.aHistoriqueAutreSite && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200 mt-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              Antécédent : {recruit.siteOriginePrecedent}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CIN & Matricule / SAP */}
                      <td className="px-4 py-4 font-mono text-xs">
                        <div className="font-bold text-slate-800" title={currentUser.role === 'ADMINISTRATION' || currentUser.role === 'ADMIN' ? 'CIN complet' : 'CIN partiel (RGPD)'}>
                          {maskCIN(recruit.cin, currentUser.role)}
                        </div>
                        {recruit.matricule ? (
                          <div className="text-slate-500">{recruit.matricule}</div>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-xs inline-block mt-0.5">
                            En attente SAP
                          </span>
                        )}
                        <div className="text-[11px] font-sans text-slate-500 mt-1">
                          Complétude : <strong className={recruit.dossierComplet ? 'text-emerald-700' : 'text-amber-700'}>{recruit.tauxCompletudeDossier ?? 67}%</strong>
                        </div>
                      </td>

                      {/* Badge unique transverse visible partout */}
                      <td className="px-4 py-4">
                        <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                      </td>

                      {/* Barre d'avancement du cycle 33 jours */}
                      <td className="px-4 py-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-700 font-mono">
                              {totalDaysDone}/33 j
                            </span>
                            <span className="text-slate-400">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Date d'entrée */}
                      <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateDisplay(recruit.dateEntree)}
                      </td>

                      {/* Action tactile ≥ 48px */}
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectRecruit(recruit)}
                          className="min-h-[48px] px-3.5 py-2 rounded-xl text-blue-700 hover:text-blue-900 hover:bg-blue-50 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Consulter le dossier recrue"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{t.viewDetails}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination contrôlée */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>{t.rowsPerPage} :</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer min-h-[40px]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400 mx-1">|</span>
            <span>
              Total : <strong className="text-slate-800">{paginatedRecruits.total}</strong> {t.itemsCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              {t.page} <strong className="text-slate-800">{paginatedRecruits.page}</strong> {t.of}{' '}
              <strong className="text-slate-800">{paginatedRecruits.totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                aria-label={t.previous}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= paginatedRecruits.totalPages}
                className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                aria-label={t.next}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
