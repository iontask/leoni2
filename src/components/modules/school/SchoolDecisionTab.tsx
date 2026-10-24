import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  MessageSquare,
  Copy,
  ChevronRight,
  Send,
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  Language,
  Recruit,
  SchoolFinalDecision,
  SchoolGroup,
  UserProfile
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';

interface SchoolDecisionTabProps {
  currentGroup: SchoolGroup;
  recruits: Recruit[];
  currentUser: UserProfile;
  lang: Language;
  onFinalizeDecision: (
    recrueId: string,
    decision: SchoolFinalDecision,
    noteTheorie: number,
    notePratique: number,
    observations?: string
  ) => Promise<void>;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const SchoolDecisionTab: React.FC<SchoolDecisionTabProps> = ({
  currentGroup,
  recruits,
  currentUser,
  lang,
  onFinalizeDecision,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];
  const [activeModalRecruit, setActiveModalRecruit] = useState<Recruit | null>(null);
  const [decision, setDecision] = useState<SchoolFinalDecision>('ADMIS');
  const [noteTheorie, setNoteTheorie] = useState<number>(15);
  const [notePratique, setNotePratique] = useState<number>(16);
  const [observations, setObservations] = useState<string>('Excellente maîtrise du geste de sertissage et respect 5S.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedPhones, setCopiedPhones] = useState<boolean>(false);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const canValidate = ['FORMATEUR_ECOLE', 'REFERENT_LEARNING', 'ADMIN'].includes(currentUser.role);

  const handleOpenDecisionModal = (recruit: Recruit) => {
    setActiveModalRecruit(recruit);
    setNoteTheorie(recruit.ecoleScoreTheorie || 15);
    setNotePratique(recruit.ecoleScorePratique || 16);
    setDecision(
      (recruit.ecoleScoreTheorie || 15) >= 14 && (recruit.ecoleScorePratique || 16) >= 14
        ? 'ADMIS'
        : 'A_REVOIR'
    );
  };

  const handleConfirmDecision = async () => {
    if (!activeModalRecruit || !canValidate) return;
    setIsSubmitting(true);
    try {
      await onFinalizeDecision(
        activeModalRecruit.id,
        decision,
        noteTheorie,
        notePratique,
        observations
      );
      setActiveModalRecruit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Liste des numéros de téléphone du groupe
  const phoneNumbersList = recruits
    .map((r) => r.telephone)
    .filter(Boolean)
    .join('\n');

  const convocationMessageTemplate =
    lang === 'ar'
      ? `السلام عليكم، تذكير رسمي من مدرسة التكوين LEONI المغرب (فوج ${currentGroup.code}) : يرجى الحضور يوم غد على الساعة 07:30 صباحاً بورشة التكوين مع ارتداء حذاء السلامة والبدلة. بالتوفيق.`
      : `Bonjour, rappel officiel de l’École de Formation LEONI Maroc (Session ${currentGroup.code}) : Convocation demain à 07h30 précises avec chaussures de sécurité ESD et blouse atelier. Bon courage.`;

  const handleCopyPhones = () => {
    navigator.clipboard.writeText(phoneNumbersList);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 2000);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(convocationMessageTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Information sur le transfert automatique vers l'affectation */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-sky-950">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold text-blue-900">
            Validation collective & Règle de transfert automatique :
          </strong>
          <p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
            {t.autoTransferNotice} Les recrues admises deviennent immédiatement éligibles au
            test pratique d’affectation sur planche ou banc TNC en production.
          </p>
        </div>
      </div>

      {/* Tableau de bord de fin d'école pour le groupe */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'ar' ? 'قرارات التخرج ومعدلات الدورة' : 'Résultats & Décisions de passage au poste'}
            </h3>
            <p className="text-xs text-slate-500">
              Seuil standard : Assiduité 5j + Note théorique ≥ 14/20 + Note pratique ≥ 14/20
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Effectif : {recruits.length} recrue(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recruits.map((recruit) => {
            const has5Days = (recruit.ecoleJoursValides || 0) >= 5;
            const theorie = recruit.ecoleScoreTheorie ?? '-';
            const pratique = recruit.ecoleScorePratique ?? '-';
            const isAdmitted = recruit.ecoleValidee;

            return (
              <div
                key={recruit.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                {/* Informations recrue */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {recruit.nom} {recruit.prenom}
                    </span>
                    <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>CIN: {recruit.cin}</span>
                    <span>•</span>
                    <span>Jours: {recruit.ecoleJoursValides || 0}/5</span>
                    <span>•</span>
                    <span>Tél: {recruit.telephone}</span>
                  </div>
                </div>

                {/* Notes & Statut École */}
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-right text-xs font-mono">
                    <div className="text-slate-400">Théorie / Pratique</div>
                    <div className="font-bold text-slate-800 text-sm">
                      {theorie}/20 • {pratique}/20
                    </div>
                  </div>

                  {isAdmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.decisionAdmis}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canValidate}
                      onClick={() => handleOpenDecisionModal(recruit)}
                      className="min-h-[48px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:bg-slate-200"
                    >
                      <Award className="w-4 h-4" />
                      <span>Évaluer & Valider</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectRecruit(recruit)}
                    className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                    title="Voir fiche complète"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fiche de Contact du groupe & Modèles SMS / WhatsApp */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-700" />
            {t.groupContacts} (Session {currentGroup.code})
          </h3>
          <button
            type="button"
            onClick={handleCopyPhones}
            className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedPhones ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedPhones ? 'Numéros copiés !' : t.copyPhoneList}</span>
          </button>
        </div>

        {/* Modèle de message WhatsApp / SMS */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              {t.whatsappMessageTemplate}
            </span>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              {copiedTemplate ? 'Texte copié !' : 'Copier le message'}
            </button>
          </div>
          <p className="text-xs text-slate-600 font-mono bg-white p-3 rounded-lg border border-slate-200">
            {convocationMessageTemplate}
          </p>
        </div>
      </div>

      {/* Modal de décision officielle de fin d'école */}
      {activeModalRecruit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Décision finale de fin d'école : {activeModalRecruit.nom} {activeModalRecruit.prenom}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  CIN : {activeModalRecruit.cin} • Session : {currentGroup.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRecruit(null)}
                className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Choix décision */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Décision du formateur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('ADMIS')}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                      decision === 'ADMIS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ADMIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('A_REVOIR')}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                      decision === 'A_REVOIR'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>À REVOIR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('NON_ADMIS')}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                      decision === 'NON_ADMIS'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>NON ADMIS</span>
                  </button>
                </div>
              </div>

              {/* Notes Théorique et Pratique */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Note Théorique (/20)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={noteTheorie}
                    onChange={(e) => setNoteTheorie(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Note Pratique (/20)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={notePratique}
                    onChange={(e) => setNotePratique(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-blue-900"
                  />
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Observations et avis formateur (enregistré à l'audit)
                </label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalRecruit(null)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDecision}
                className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Signer & Transférer au poste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
