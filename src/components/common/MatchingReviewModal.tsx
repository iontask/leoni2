/**
 * LEONI QualiTrack - Modal de Rapprochement Multisite (Matching)
 * Clé d'identification CIN. Détection des passages sur autres sites LEONI.
 * Propose le rapprochement avec règles paramétrables et validation utilisateur explicite.
 */

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  GitMerge,
  Building2,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { MatchingResult, Recruit, UserProfile, Language } from '../../types';
import { TRANSLATIONS, formatDateDisplay } from '../../i18n/translations';

interface MatchingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchingResult: MatchingResult | null;
  tentativeData: Partial<Recruit>;
  currentUser: UserProfile;
  lang: Language;
  onConfirmRapprochement: (
    rule: 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE' | 'REPRISE_MATRICULE_EXISTANT',
    previousRecruit: Recruit
  ) => Promise<void>;
}

export const MatchingReviewModal: React.FC<MatchingReviewModalProps> = ({
  isOpen,
  onClose,
  matchingResult,
  tentativeData,
  currentUser,
  lang,
  onConfirmRapprochement
}) => {
  const [selectedRule, setSelectedRule] = useState<
    'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE' | 'REPRISE_MATRICULE_EXISTANT'
  >(matchingResult?.regleRapprochementRecommandee || 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !matchingResult || !matchingResult.recrueAutreSite) return null;

  const prev = matchingResult.recrueAutreSite;
  const t = TRANSLATIONS[lang];

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirmRapprochement(selectedRule, prev);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">
                Rapprochement Multisite (Matching CIN)
              </h2>
              <p className="text-xs text-amber-800">
                Opérateur identifié avec antécédent sur un autre site LEONI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Comparatif Visuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dossier Antérieur */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Historique Antérieur</span>
                <span className="font-mono text-amber-700 font-bold">{prev.cin}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {prev.nom} {prev.prenom}
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div>Site d’origine : <strong className="text-slate-800">{matchingResult.siteAutreNom}</strong></div>
                <div>Ancien matricule : <span className="font-mono font-bold">{prev.matricule || 'N/A'}</span></div>
                <div>Statut atteint : <strong className="text-blue-700">{prev.statut}</strong></div>
                <div>Date d’entrée antérieure : {formatDateDisplay(prev.dateEntree)}</div>
              </div>
            </div>

            {/* Nouvelle Demande */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
                <span>Nouveau Dossier d’Entrée</span>
                <span className="font-mono text-blue-900 font-bold">{tentativeData.cin || prev.cin}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {tentativeData.nom || prev.nom} {tentativeData.prenom || prev.prenom}
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div>Site cible : <strong className="text-slate-800">LEONI Bouskoura (Pilote)</strong></div>
                <div>Date d’entrée : {formatDateDisplay(tentativeData.dateEntree)}</div>
                <div>Liaison proposée : <span className="font-semibold text-emerald-700">Rapprochement validé</span></div>
              </div>
            </div>
          </div>

          {/* Sélection des règles de rapprochement paramétrables */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Sélectionnez la règle de rapprochement (Paramétrable) :
            </span>

            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="regle"
                checked={selectedRule === 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE'}
                onChange={() => setSelectedRule('CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE')}
                className="mt-0.5 text-blue-700"
              />
              <div className="text-xs">
                <strong className="text-slate-900 block font-bold">
                  (Recommandé) Conserver l’historique antérieur & Attribuer un nouveau matricule local
                </strong>
                <p className="text-slate-500 mt-0.5">
                  Assure la continuité du dossier sans conflit de numérotation SAP pour le site de Bouskoura.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="regle"
                checked={selectedRule === 'REPRISE_MATRICULE_EXISTANT'}
                onChange={() => setSelectedRule('REPRISE_MATRICULE_EXISTANT')}
                className="mt-0.5 text-blue-700"
              />
              <div className="text-xs">
                <strong className="text-slate-900 block font-bold">
                  Reprendre l’ancien matricule ({prev.matricule})
                </strong>
                <p className="text-slate-500 mt-0.5">
                  Réutilise l’identifiant RH précédent s’il s’agit d’une mutation directe inter-sites LEONI.
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 rounded-lg bg-amber-100/70 text-amber-950 text-xs">
            Cette validation sera enregistrée dans le journal d’audit avec signature de{' '}
            <strong>{currentUser.prenom} {currentUser.nom}</strong> ({currentUser.matricule}).
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Validation...' : 'Valider le rapprochement'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
