import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Save,
  RotateCcw,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, UserRole, Language } from '../../../types';
import { ValidationRightsMatrix, ValidationRightsRule } from '../../../types/qualification';
import { TRANSLATIONS } from '../../../i18n/translations';
import { repositoryInstance } from '../../../repositories/storageRepository';

interface ValidationRightsTabProps {
  currentUser: UserProfile;
  lang: Language;
  onRefreshParent: () => Promise<void>;
}

const ALL_ROLES: Array<{ role: UserRole; label: string }> = [
  { role: 'RESPONSABLE_PRODUCTION', label: 'Responsable Fabrication (RFM)' },
  { role: 'QUALITE', label: 'Responsable Qualité Usine' },
  { role: 'SHIFT_LEADER', label: 'Chef d’Équipe (Shift Leader)' },
  { role: 'FORMATEUR_TERRAIN', label: 'Formateur Terrain' },
  { role: 'REFERENT_LEARNING', label: 'Référent Formation / École' },
  { role: 'ADMIN', label: 'Administrateur Système' }
];

export const ValidationRightsTab: React.FC<ValidationRightsTabProps> = ({
  currentUser,
  lang,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];
  const [matrix, setMatrix] = useState<ValidationRightsMatrix | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatrix() {
      try {
        const m = await repositoryInstance.getValidationRightsMatrix();
        setMatrix(m);
      } catch (e) {
        console.error(e);
      }
    }
    loadMatrix();
  }, []);

  if (!matrix) {
    return <div className="p-8 text-center text-slate-400">Chargement de la matrice des droits...</div>;
  }

  const handleToggleRole = (
    nature: 'initial' | 'critique',
    field:
      | 'rolesHabilitesDecisionFinale'
      | 'rolesHabilitesVisaQualite'
      | 'rolesHabilitesVisaProduction'
      | 'rolesHabilitesDerogation',
    role: UserRole
  ) => {
    setMatrix((prev) => {
      if (!prev) return prev;
      const currentList = prev[nature][field];
      const nextList = currentList.includes(role)
        ? currentList.filter((r) => r !== role)
        : [...currentList, role];

      return {
        ...prev,
        [nature]: {
          ...prev[nature],
          [field]: nextList
        }
      };
    });
  };

  const handleTogglePrereq = (
    nature: 'initial' | 'critique',
    field: 'exigerControleFormateur' | 'exigerControleAQL' | 'exigerControleShiftLeader'
  ) => {
    setMatrix((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [nature]: {
          ...prev[nature],
          [field]: !prev[nature][field]
        }
      };
    });
  };

  const handleChangeMaxDays = (nature: 'initial' | 'critique', days: number) => {
    setMatrix((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [nature]: {
          ...prev[nature],
          dureeMaximaleDerogationJours: days
        }
      };
    });
  };

  const handleSave = async () => {
    if (!matrix) return;
    setIsSaving(true);
    try {
      await repositoryInstance.updateValidationRightsMatrix(matrix, currentUser);
      setSaveNotice('Matrice des droits de validation mise à jour et consignée dans le journal d’audit.');
      await onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Matrice des Droits de Validation & Dérogations Paramétrable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Définit les habilitations requises par nature de poste (Poste Initial vs Poste Critique) pour la signature finale et les dérogations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Matrice'}</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveNotice}
          </span>
          <button
            type="button"
            onClick={() => setSaveNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Colonnes comparatives : Postes Initiaux vs Postes Critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne 1 : Postes Initiaux */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-bold uppercase tracking-wider">
                Postes Initiaux
              </span>
              <span className="text-xs text-slate-500">Standards d'assemblage</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Max dérogation : {matrix.initial.dureeMaximaleDerogationJours}j
            </span>
          </div>

          {/* Prérequis obligatoires */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Prérequis opérationnels obligatoires :</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.initial.exigerControleFormateur}
                onChange={() => handleTogglePrereq('initial', 'exigerControleFormateur')}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Visa Formateur Terrain obligatoire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.initial.exigerControleAQL}
                onChange={() => handleTogglePrereq('initial', 'exigerControleAQL')}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Taux conformité AQL ≥ 98% obligatoire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.initial.exigerControleShiftLeader}
                onChange={() => handleTogglePrereq('initial', 'exigerControleShiftLeader')}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Accord Chef d'Équipe (Shift Leader) obligatoire</span>
            </label>
          </div>

          {/* Rôles habilités pour la décision finale */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <span className="font-bold text-slate-700 block">
              Rôles habilités pour prononcer la décision finale :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_ROLES.map(({ role, label }) => {
                const checked = matrix.initial.rolesHabilitesDecisionFinale.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleToggleRole('initial', 'rolesHabilitesDecisionFinale', role)
                      }
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rôles habilités pour les dérogations */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <span className="font-bold text-slate-700 block">
              Rôles habilités pour accorder une dérogation :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_ROLES.map(({ role, label }) => {
                const checked = matrix.initial.rolesHabilitesDerogation.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleRole('initial', 'rolesHabilitesDerogation', role)}
                      className="rounded border-slate-300 text-amber-600"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-700">Durée max dérogation :</span>
            <select
              value={matrix.initial.dureeMaximaleDerogationJours}
              onChange={(e) => handleChangeMaxDays('initial', Number(e.target.value))}
              className="min-h-[40px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            >
              <option value={7}>7 jours</option>
              <option value={14}>14 jours (Recommandé)</option>
              <option value={21}>21 jours</option>
            </select>
          </div>
        </div>

        {/* Colonne 2 : Postes Critiques */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-100 text-rose-900 rounded-lg text-xs font-bold uppercase tracking-wider">
                Postes Critiques
              </span>
              <span className="text-xs text-slate-500">TNC, Sertissage, Haute tension</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700">
              Max dérogation : {matrix.critique.dureeMaximaleDerogationJours}j
            </span>
          </div>

          {/* Prérequis obligatoires */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Prérequis opérationnels obligatoires :</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.critique.exigerControleFormateur}
                onChange={() => handleTogglePrereq('critique', 'exigerControleFormateur')}
                className="rounded border-slate-300 text-rose-600"
              />
              <span>Visa Formateur Terrain obligatoire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.critique.exigerControleAQL}
                onChange={() => handleTogglePrereq('critique', 'exigerControleAQL')}
                className="rounded border-slate-300 text-rose-600"
              />
              <span>Taux conformité AQL ≥ 98% obligatoire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matrix.critique.exigerControleShiftLeader}
                onChange={() => handleTogglePrereq('critique', 'exigerControleShiftLeader')}
                className="rounded border-slate-300 text-rose-600"
              />
              <span>Accord Chef d'Équipe (Shift Leader) obligatoire</span>
            </label>
          </div>

          {/* Rôles habilités pour la décision finale */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <span className="font-bold text-slate-700 block">
              Rôles habilités pour prononcer la décision finale :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_ROLES.map(({ role, label }) => {
                const checked = matrix.critique.rolesHabilitesDecisionFinale.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleToggleRole('critique', 'rolesHabilitesDecisionFinale', role)
                      }
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rôles habilités pour les dérogations */}
          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <span className="font-bold text-slate-700 block">
              Rôles habilités pour accorder une dérogation (Strict) :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_ROLES.map(({ role, label }) => {
                const checked = matrix.critique.rolesHabilitesDerogation.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleToggleRole('critique', 'rolesHabilitesDerogation', role)
                      }
                      className="rounded border-slate-300 text-amber-600"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-700">Durée max dérogation :</span>
            <select
              value={matrix.critique.dureeMaximaleDerogationJours}
              onChange={(e) => handleChangeMaxDays('critique', Number(e.target.value))}
              className="min-h-[40px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            >
              <option value={5}>5 jours</option>
              <option value={7}>7 jours (Recommandé)</option>
              <option value={10}>10 jours</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
