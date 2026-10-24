/**
 * LEONI QualiTrack - Module 7 : Paramétrage Central Versionné, Daté et Signé
 * Réservé exclusivement à REFERENT_LEARNING et ADMIN.
 * Toute modification incrémente la version, est horodatée en ISO, et exige un motif signé.
 */

import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Save,
  Clock,
  UserCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { SystemParameter, UserProfile, Language } from '../../types';
import { TRANSLATIONS, formatDateDisplay, getRoleLabel } from '../../i18n/translations';
import { PokaYokeEngine } from '../../engine/pokaYoke';

interface SettingsModuleProps {
  parameters: SystemParameter[];
  currentUser: UserProfile;
  lang: Language;
  onUpdateParameter: (cle: string, valeur: number | string | boolean, motif: string) => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  parameters,
  currentUser,
  lang,
  onUpdateParameter
}) => {
  const t = TRANSLATIONS[lang];
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | number | boolean>('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEdit = currentUser.role === 'REFERENT_LEARNING' || currentUser.role === 'ADMIN';

  const startEdit = (param: SystemParameter) => {
    if (!canEdit) return;
    setEditingKey(param.cle);
    setEditValue(param.valeur);
    setMotif('');
    setFeedbackMsg(null);
  };

  const handleSave = async (cle: string) => {
    if (!motif.trim() || motif.trim().length < 6) {
      setFeedbackMsg({
        type: 'error',
        text: 'Le motif de modification est obligatoire et audité (6 caractères minimum).'
      });
      return;
    }

    try {
      setLoading(true);
      await onUpdateParameter(cle, editValue, motif.trim());
      setFeedbackMsg({
        type: 'success',
        text: `Paramètre ${cle} mis à jour avec succès dans une nouvelle version signée.`
      });
      setEditingKey(null);
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-blue-700" />
            {t.navParametrage}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gouvernance des durées, seuils et critères industriels. Versionnage strict et signature obligatoire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
              canEdit
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {canEdit
                ? 'Accès Habilité (Référent Learning / Admin)'
                : 'Mode Consultation Seule (Verrou Poka-Yoke)'}
            </span>
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Liste des paramètres versionnés */}
      <div className="grid grid-cols-1 gap-4">
        {parameters.map((param) => {
          const isBeingEdited = editingKey === param.cle;

          return (
            <div
              key={param.cle}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-800 text-sm">
                      {param.cle}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-mono px-2 py-0.5 rounded-md font-bold">
                      v{param.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {param.description}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {param.valeur}
                  </span>
                  {param.unite && (
                    <span className="text-xs font-medium text-slate-500 ml-1">
                      {param.unite}
                    </span>
                  )}
                </div>
              </div>

              {/* Traçabilité : auteur, date, motif de la dernière version */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.paramLastModified}</span>
                  <span className="font-medium text-slate-700">{formatDateDisplay(param.dateModification)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.paramAuthor}</span>
                  <span className="font-medium text-slate-700">{param.modifieParNom} ({param.modifieParMatricule})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.paramReason}</span>
                  <span className="font-medium text-slate-700 truncate block">{param.motifModification}</span>
                </div>
              </div>

              {/* Formulaire d'édition si en cours */}
              {isBeingEdited ? (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nouvelle valeur :
                      </label>
                      <input
                        type="number"
                        value={typeof editValue === 'number' ? editValue : String(editValue)}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.paramReason} (Obligatoire pour audit) :
                      </label>
                      <input
                        type="text"
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        placeholder="Ex: Révision du standard d’acceptation selon directive usine 2026..."
                        className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSave(param.cle)}
                      className="min-h-[48px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t.paramSaveNewVersion}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => startEdit(param)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      canEdit
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Modifier et créer nouvelle version</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
