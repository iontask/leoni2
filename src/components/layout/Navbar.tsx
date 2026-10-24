/**
 * LEONI QualiTrack - Barre Supérieure (Navbar)
 * Gestion du site actif, sélecteur de rôle pour test immédiat, et bascule FR/AR avec support RTL.
 */

import React from 'react';
import {
  Globe,
  Building2,
  UserCheck,
  ChevronDown,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Language, Site, UserProfile, UserRole } from '../../types';
import { TRANSLATIONS, getRoleLabel } from '../../i18n/translations';

interface NavbarProps {
  currentSite: Site | null;
  allSites: Site[];
  onSelectSite: (siteId: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  lang: Language;
  onToggleLang: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSite,
  allSites,
  onSelectSite,
  currentUser,
  allUsers,
  onSelectUser,
  lang,
  onToggleLang,
  onResetDemo
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Identité LEONI */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-700 text-white rounded-xl flex items-center justify-center font-extrabold tracking-wider text-base shadow-sm shrink-0">
              LEONI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  {t.appTitle}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  Site Pilote Maroc
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Outils & Contrôles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Filtre / Sélecteur de Site */}
            <div className="relative">
              <label htmlFor="site-select" className="sr-only">{t.site}</label>
              <div className="flex items-center min-h-[48px] px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0 mx-1.5" />
                <select
                  id="site-select"
                  value={currentSite?.id || ''}
                  onChange={(e) => onSelectSite(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer pr-4"
                >
                  {allSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom} {site.estPilote ? '(Pilote)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sélecteur de Profil / Rôle pour tester l'authentification et les habilitations */}
            <div className="relative">
              <label htmlFor="role-select" className="sr-only">{t.userRole}</label>
              <div className="flex items-center min-h-[48px] px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mx-1.5" />
                <div className="flex flex-col text-start">
                  <span className="text-[10px] text-slate-400 uppercase font-bold leading-none">
                    Rôle actif ({currentUser.matricule})
                  </span>
                  <select
                    id="role-select"
                    value={currentUser.id}
                    onChange={(e) => {
                      const found = allUsers.find((u) => u.id === e.target.value);
                      if (found) onSelectUser(found);
                    }}
                    className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer pr-4 text-xs"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} — {getRoleLabel(u.role, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bascule de Langue FR / AR */}
            <button
              type="button"
              onClick={onToggleLang}
              className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Changer de langue (Français / العربية)"
              aria-label="Basculer de langue"
            >
              <Globe className="w-4 h-4 text-blue-700" />
              <span className="uppercase">{lang === 'fr' ? 'AR' : 'FR'}</span>
            </button>

            {/* Réinitialisation Démo */}
            <button
              type="button"
              onClick={onResetDemo}
              className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="Réinitialiser les données d’exemple LEONI"
              aria-label="Réinitialiser données démo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
