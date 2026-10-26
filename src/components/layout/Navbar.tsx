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
      <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[72px] py-2 gap-3 sm:gap-4">
          {/* Logo & Identité LEONI (Protégé contre tout débordement ou repli) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-700 text-white rounded-xl flex items-center justify-center font-extrabold tracking-wider text-xs sm:text-sm shadow-xs shrink-0 select-none">
              LEONI
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base lg:text-lg whitespace-nowrap">
                  {t.appTitle}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200 shrink-0 whitespace-nowrap">
                  Site Pilote Maroc
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[220px] md:max-w-xs lg:max-w-md hidden md:block leading-tight mt-0.5">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Outils & Contrôles */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Filtre / Sélecteur de Site */}
            <div className="relative shrink-0">
              <label htmlFor="site-select" className="sr-only">{t.site}</label>
              <div className="flex items-center min-h-[44px] px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 transition-colors">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0 mx-1" />
                <select
                  id="site-select"
                  value={currentSite?.id || ''}
                  onChange={(e) => onSelectSite(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer pr-3 max-w-[130px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[320px] truncate text-xs sm:text-sm"
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
            <div className="relative shrink-0">
              <label htmlFor="role-select" className="sr-only">{t.userRole}</label>
              <div className="flex items-center min-h-[44px] px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 transition-colors">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mx-1" />
                <div className="flex flex-col text-start min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold leading-none truncate max-w-[120px] sm:max-w-none">
                    Rôle actif ({currentUser.matricule})
                  </span>
                  <select
                    id="role-select"
                    value={currentUser.id}
                    onChange={(e) => {
                      const found = allUsers.find((u) => u.id === e.target.value);
                      if (found) onSelectUser(found);
                    }}
                    className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer pr-3 text-xs max-w-[120px] sm:max-w-[180px] md:max-w-[240px] truncate"
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
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors shrink-0"
              title="Changer de langue (Français / العربية)"
              aria-label="Basculer de langue"
            >
              <Globe className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="uppercase font-extrabold">{lang === 'fr' ? 'AR' : 'FR'}</span>
            </button>

            {/* Réinitialisation Démo */}
            <button
              type="button"
              onClick={onResetDemo}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Réinitialiser les données d’exemple LEONI"
              aria-label="Réinitialiser données démo"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
