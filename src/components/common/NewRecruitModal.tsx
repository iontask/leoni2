/**
 * LEONI QualiTrack - Modal de Saisie d'une Nouvelle Recrue
 * Clé d'identification CIN, vérification multisite préalable, et validation stricte des dates.
 */

import React, { useState } from 'react';
import { UserPlus, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Recruit, SchoolGroup, UserProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { repositoryInstance } from '../../repositories/storageRepository';

interface NewRecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: SchoolGroup[];
  currentSiteId: string;
  currentUser: UserProfile;
  lang: Language;
  onCreated: (recruit: Omit<Recruit, 'id'>) => Promise<void>;
}

export const NewRecruitModal: React.FC<NewRecruitModalProps> = ({
  isOpen,
  onClose,
  groups,
  currentSiteId,
  currentUser,
  lang,
  onCreated
}) => {
  const [cin, setCin] = useState('');
  const [matricule, setMatricule] = useState(`LEO-26-${Math.floor(1000 + Math.random() * 9000)}`);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('2001-01-15');
  const [telephone, setTelephone] = useState('+212 6');
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0]);
  const [groupeId, setGroupeId] = useState(groups[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  // Vérification de la présence d'un antécédent lors de la saisie du CIN
  const handleCinBlur = async () => {
    if (!cin.trim()) return;
    try {
      const check = await repositoryInstance.checkHistoryOtherSites(cin.trim(), currentSiteId);
      if (check.hasHistory) {
        setHistoryWarning(
          `Attention : ce CIN (${cin.toUpperCase()}) a été retrouvé sur ${check.otherSiteName}. Le dossier sera marqué avec un antécédent multisite.`
        );
      } else {
        setHistoryWarning(null);
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation stricte du format de date AAAA-MM-JJ
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateNaissance)) {
      setErrorMsg('Format de date de naissance invalide. Format requis : AAAA-MM-JJ.');
      return;
    }
    if (!dateRegex.test(dateEntree)) {
      setErrorMsg('Format de date d’entrée invalide. Format requis : AAAA-MM-JJ.');
      return;
    }

    try {
      setLoading(true);
      await onCreated({
        cin: cin.trim().toUpperCase(),
        matricule: matricule.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance,
        telephone: telephone.trim(),
        siteId: currentSiteId,
        dateEntree,
        statut: 'EN_ECOLE',
        groupeEcoleId: groupeId,
        ecoleJoursValides: 0,
        ecoleValidee: false,
        testPratiqueValide: false,
        joursSuiviCompletes: 0,
        carreMagiquePointsConformes: 0,
        qualifiee: false,
        visaQualite: false,
        visaProduction: false,
        aHistoriqueAutreSite: !!historyWarning,
        siteOriginePrecedent: historyWarning ? 'Autre site LEONI' : undefined
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.newRecruit}</h2>
              <p className="text-xs text-slate-500">
                Clé d’identification CIN & Affectation session école
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          {historyWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{historyWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.cin} (Clé pivot) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                onBlur={handleCinBlur}
                placeholder="Ex: BK123456"
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.matricule} LEONI <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de famille <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: El Amrani"
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prénom <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Youssef"
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.birthDate} (AAAA-MM-JJ) <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.entryDate} (AAAA-MM-JJ) <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={dateEntree}
                onChange={(e) => setDateEntree(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phone}
              </label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.group} d’école initial <span className="text-rose-600">*</span>
              </label>
              <select
                value={groupeId}
                onChange={(e) => setGroupeId(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                required
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} ({g.statut})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Création...' : 'Créer et intégrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
