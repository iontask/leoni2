import React, { useState } from 'react';
import {
  X,
  Search,
  Download,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { Recruit, Language } from '../../../types';
import { DrilldownTarget } from '../../../types/metrics';
import { TRANSLATIONS, formatDateDisplay, getTypologyLabel } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';

interface MetricDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DrilldownTarget | null;
  onSelectRecruit: (recruit: Recruit) => void;
  lang: Language;
}

export const MetricDrilldownModal: React.FC<MetricDrilldownModalProps> = ({
  isOpen,
  onClose,
  target,
  onSelectRecruit,
  lang
}) => {
  if (!isOpen || !target) return null;

  const [search, setSearch] = useState('');

  const filteredRecruits = target.recrues.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.nom.toLowerCase().includes(q) ||
      r.prenom.toLowerCase().includes(q) ||
      r.cin.toLowerCase().includes(q) ||
      (r.matricule && r.matricule.toLowerCase().includes(q)) ||
      (r.segmentAffectation && r.segmentAffectation.toLowerCase().includes(q))
    );
  });

  // Export drilldown to CSV
  const handleExportCSV = () => {
    const headers = ['CIN', 'Matricule', 'Nom', 'Prenom', 'Statut', 'Site', 'Poste', 'Segment', 'JoursPoste', 'PointsCarreMagique'];
    const rows = filteredRecruits.map((r) => [
      r.cin,
      r.matricule || '',
      r.nom,
      r.prenom,
      r.statut,
      r.siteId,
      r.typologiePoste || '',
      r.segmentAffectation || '',
      r.joursSuiviCompletes || 0,
      r.carreMagiquePointsConformes || 0
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.map((x) => `"${x}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drilldown_${target.titre.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {target.titre}
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-mono font-bold">
                {target.recrues.length} personnes
              </span>
            </div>
            {target.description && (
              <p className="text-xs text-slate-500 pl-8">{target.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & CSV Export */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par CIN, nom, matricule..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exporter la sélection (CSV)</span>
          </button>
        </div>

        {/* Recruits List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 sm:p-4">
          {filteredRecruits.length > 0 ? (
            filteredRecruits.map((recruit) => (
              <div
                key={recruit.id}
                className="p-3.5 hover:bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                    {recruit.prenom[0]}
                    {recruit.nom[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {recruit.nom} {recruit.prenom}
                      </span>
                      <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>CIN: {recruit.cin}</span>
                      <span>•</span>
                      <span>Matr: {recruit.matricule || 'En cours SAP'}</span>
                      <span>•</span>
                      <span className="font-sans font-semibold text-slate-700">
                        {getTypologyLabel(recruit.typologiePoste, lang)}
                      </span>
                      {recruit.segmentAffectation && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                            {recruit.segmentAffectation}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">Parcours</span>
                    <span className="font-bold font-mono text-slate-800">
                      {recruit.joursSuiviCompletes > 0
                        ? `${recruit.joursSuiviCompletes}/28j poste`
                        : `${recruit.ecoleJoursValides || 0}/5j école`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectRecruit(recruit);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Consulter</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucun opérateur ne correspond aux critères de recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
