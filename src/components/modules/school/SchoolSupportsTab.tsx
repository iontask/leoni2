import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Language, Recruit, TrainingContent, TrainingTheme, UserProfile } from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';

interface SchoolSupportsTabProps {
  contents: TrainingContent[];
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onMarkConsulted: (contentId: string, recruitId: string) => Promise<void>;
}

export const SchoolSupportsTab: React.FC<SchoolSupportsTabProps> = ({
  contents,
  recruits,
  currentUser,
  lang,
  onMarkConsulted
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedTheme, setSelectedTheme] = useState<TrainingTheme | 'ALL'>('ALL');
  const [activeContentForPreview, setActiveContentForPreview] = useState<TrainingContent | null>(null);
  const [selectedRecruitId, setSelectedRecruitId] = useState<string>(recruits[0]?.id || '');

  const days = [1, 2, 3, 4, 5];

  // Filtrage
  let filtered = [...contents];
  if (selectedDay !== 'ALL') {
    filtered = filtered.filter((c) => c.jourEcoleRattache === selectedDay);
  }
  if (selectedTheme !== 'ALL') {
    filtered = filtered.filter((c) => c.theme === selectedTheme);
  }

  const activeRecruit = recruits.find((r) => r.id === selectedRecruitId);

  const getThemeBadge = (theme: TrainingTheme) => {
    switch (theme) {
      case 'SECURITE_5S':
        return { label: '5S & Sécurité', color: 'bg-emerald-100 text-emerald-800' };
      case 'CABLERIE_BASE':
        return { label: 'Schémas & Normes DIN', color: 'bg-blue-100 text-blue-800' };
      case 'CONNECTIQUE':
        return { label: 'Connectique & Toufix', color: 'bg-purple-100 text-purple-800' };
      case 'GESTE_POSTE':
        return { label: 'Sertissage & Gestuelle', color: 'bg-amber-100 text-amber-800' };
      case 'QUALITE_DEFAUT':
        return { label: 'Qualité Zéro Défaut', color: 'bg-rose-100 text-rose-800' };
    }
  };

  const getMediaTypeIcon = (type: TrainingContent['typeSupport']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleMarkConsulted = async (contentId: string) => {
    if (!selectedRecruitId) return;
    await onMarkConsulted(contentId, selectedRecruitId);
  };

  return (
    <div className="space-y-5">
      {/* Sélecteur de Recrue pour le suivi de consultation + Filtres */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              {lang === 'ar' ? 'المكتبة الرقمية لمدرسة التكوين' : 'Supports de cours & bibliothèque technique (J1 à J5)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fiches standards LEONI, modes opératoires de câblage et vidéos de démonstration du geste qualité.
            </p>
          </div>

          {/* Choix de la recrue active */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Suivi recrue :
            </span>
            <select
              value={selectedRecruitId}
              onChange={(e) => setSelectedRecruitId(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold bg-white"
            >
              {recruits.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom} {r.prenom} ({r.cin})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres par Jour & par Thème */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedDay('ALL')}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 'ALL'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous les jours (J1-J5)
            </button>
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === d
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                J{d}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedTheme('ALL')}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                selectedTheme === 'ALL'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous les thèmes
            </button>
            <button
              type="button"
              onClick={() => setSelectedTheme('SECURITE_5S')}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                selectedTheme === 'SECURITE_5S'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5S / Sécurité
            </button>
            <button
              type="button"
              onClick={() => setSelectedTheme('CABLERIE_BASE')}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                selectedTheme === 'CABLERIE_BASE'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normes DIN
            </button>
            <button
              type="button"
              onClick={() => setSelectedTheme('CONNECTIQUE')}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                selectedTheme === 'CONNECTIQUE'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Connectique
            </button>
          </div>
        </div>
      </div>

      {/* Grille des supports de formation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((content) => {
          const themeInfo = getThemeBadge(content.theme);
          const hasConsulted = activeRecruit
            ? content.consulteParRecrues.includes(activeRecruit.id)
            : false;

          return (
            <div
              key={content.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-4 sm:p-5 space-y-3">
                {/* Header card : Jour + Format + Thème */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-xs flex items-center justify-center font-mono">
                      J{content.jourEcoleRattache}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${themeInfo.color}`}>
                      {themeInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                    {getMediaTypeIcon(content.typeSupport)}
                    <span>{content.typeSupport}</span>
                  </div>
                </div>

                {/* Titre & Description */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                    {lang === 'ar' ? content.titreAr : content.titreFr}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {lang === 'ar' ? content.descriptionAr : content.descriptionFr}
                  </p>
                </div>

                {/* Durée estimée & Taux de consultation du groupe */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{content.dureeEstimeeMinutes} min</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Consulté par : <strong>{content.consulteParRecrues.length} recrue(s)</strong>
                  </div>
                </div>
              </div>

              {/* Actions tactiles bas de carte */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveContentForPreview(content)}
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Consulter</span>
                </button>

                {hasConsulted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t.alreadyConsulted}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMarkConsulted(content.id)}
                    className="min-h-[44px] px-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.markAsConsulted}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal d'aperçu d'un document technique */}
      {activeContentForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  J{activeContentForPreview.jourEcoleRattache}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === 'ar' ? activeContentForPreview.titreAr : activeContentForPreview.titreFr}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Code doc : {activeContentForPreview.code} • Format : {activeContentForPreview.typeSupport}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveContentForPreview(null)}
                className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Corps de visualisation du support */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100 flex items-center justify-center">
                <img
                  src={activeContentForPreview.urlSupport}
                  alt={activeContentForPreview.titreFr}
                  className="w-full h-full object-cover max-h-72"
                />
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-800 mb-1">
                  Objectifs pédagogiques & Standard LEONI
                </h4>
                <p className="text-xs leading-relaxed">
                  {lang === 'ar'
                    ? activeContentForPreview.descriptionAr
                    : activeContentForPreview.descriptionFr}
                </p>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>• Règle Poka-Yoke : interdiction formelle de manipulation sans validation du geste de dénudage.</div>
                <div>• Norme qualité : contrôle visuel 100% de l’insertion et test de rétention mécanique.</div>
                <div>• Traçabilité : l’enregistrement de consultation est consigné au journal d’audit.</div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Site : LEONI Bouskoura
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveContentForPreview(null)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                >
                  {t.close}
                </button>
                {selectedRecruitId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkConsulted(activeContentForPreview.id);
                      setActiveContentForPreview(null);
                    }}
                    className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold"
                  >
                    Valider consultation recrue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
