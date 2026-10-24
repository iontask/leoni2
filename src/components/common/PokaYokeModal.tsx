/**
 * LEONI QualiTrack - Modal de Poka-Yoke & Dérogation Formelle
 * Affiche l'explication en une phrase claire du blocage.
 * Si une dérogation est possible et que le rôle est habilité, permet la saisie d'un motif obligatoire et consigne l'audit.
 */

import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, X } from 'lucide-react';
import { PokaYokeRuleResult, UserProfile, Language } from '../../types';
import { TRANSLATIONS, getRoleLabel } from '../../i18n/translations';
import { PokaYokeEngine } from '../../engine/pokaYoke';

interface PokaYokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PokaYokeRuleResult;
  currentUser: UserProfile;
  lang: Language;
  onConfirmDerogation?: (reason: string) => Promise<void>;
}

export const PokaYokeModal: React.FC<PokaYokeModalProps> = ({
  isOpen,
  onClose,
  result,
  currentUser,
  lang,
  onConfirmDerogation
}) => {
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const canDerogate =
    result.derogationPossible &&
    PokaYokeEngine.canGrantDerogation(currentUser.role, result.rolesHabilitesDerogation);

  const handleDerogationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif || motif.trim().length < 8) {
      setErrorMsg(
        lang === 'ar'
          ? 'سبب الاستثناء إلزامي ويجب أن يوضح المبرر الصناعي بدقة (8 أحرف على الأقل).'
          : 'Le motif de dérogation est obligatoire et doit être circonstancié (au moins 8 caractères).'
      );
      return;
    }

    if (onConfirmDerogation) {
      try {
        setLoading(true);
        setErrorMsg('');
        await onConfirmDerogation(motif.trim());
        setMotif('');
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la dérogation.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* En-tête sécurisé */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 border-b border-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-900">{t.pokaYokeAlertTitle}</h2>
              <p className="text-xs text-rose-700">{t.pokaYokeLocked}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-hidden"
            aria-label={t.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corps d'explication claire en une phrase */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-lg bg-rose-100/60 border border-rose-200 text-sm font-medium text-rose-950 flex gap-3 items-start">
            <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === 'ar' ? result.messageBlocageAr : result.messageBlocage}
            </p>
          </div>

          {/* Rôles habilités */}
          {result.derogationPossible && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs space-y-2">
              <span className="font-semibold text-slate-700 block">
                {t.pokaYokeAuthorizedRoles} :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.rolesHabilitesDerogation.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-0.5 rounded-sm bg-slate-200 text-slate-800 font-mono text-[11px]"
                  >
                    {getRoleLabel(role, lang)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire de dérogation pour rôle habilité */}
          {result.derogationPossible && canDerogate && (
            <form onSubmit={handleDerogationSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.pokaYokeDerogationTitle} <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder={t.pokaYokeReasonPlaceholder}
                  rows={3}
                  className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                  required
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-600">{errorMsg}</p>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-normal">
                {t.pokaYokeWarning}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 focus:outline-hidden"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[48px] px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center gap-2 shadow-xs focus:outline-hidden disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? 'Enregistrement...' : t.pokaYokeSignAndProceed}</span>
                </button>
              </div>
            </form>
          )}

          {/* Rôle non habilité */}
          {result.derogationPossible && !canDerogate && (
            <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 text-center">
              Votre rôle actuel ({getRoleLabel(currentUser.role, lang)}) ne dispose pas des droits nécessaires pour déroger à cette règle.
            </div>
          )}

          {!result.derogationPossible && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-6 py-2.5 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 focus:outline-hidden"
              >
                {t.close}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
