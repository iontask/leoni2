/**
 * LEONI QualiTrack - Menu Latéral de Navigation (Sidebar)
 * Optimisé pour tablettes industrielles : cibles ≥ 48px, 8 modules structurés.
 */

import React from 'react';
import {
  Users,
  GraduationCap,
  Wrench,
  Layers,
  Award,
  BarChart3,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { Language, UserRole } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

export type AppModule =
  | 'DOSSIERS'
  | 'ECOLE'
  | 'AFFECTATION'
  | 'SUIVI_POSTE'
  | 'QUALIFICATION'
  | 'INDICATEURS'
  | 'PARAMETRAGE'
  | 'AUDIT';

interface SidebarProps {
  currentModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  userRole: UserRole;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  userRole,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  const menuItems = [
    {
      id: 'DOSSIERS' as AppModule,
      label: t.navDossiers,
      icon: Users,
      badge: 'RH & Base'
    },
    {
      id: 'ECOLE' as AppModule,
      label: t.navEcole,
      icon: GraduationCap,
      badge: '5 jours'
    },
    {
      id: 'AFFECTATION' as AppModule,
      label: t.navAffectation,
      icon: Wrench,
      badge: 'Postes & Tests'
    },
    {
      id: 'SUIVI_POSTE' as AppModule,
      label: t.navSuiviPoste,
      icon: Layers,
      badge: '28 jours'
    },
    {
      id: 'QUALIFICATION' as AppModule,
      label: t.navQualification,
      icon: Award,
      badge: 'Visas'
    },
    {
      id: 'INDICATEURS' as AppModule,
      label: t.navIndicateurs,
      icon: BarChart3,
      badge: 'KPIs Moteur'
    },
    {
      id: 'PARAMETRAGE' as AppModule,
      label: t.navParametrage,
      icon: Sliders,
      badge: 'Versionné',
      restricted: !['REFERENT_LEARNING', 'ADMIN'].includes(userRole)
    },
    {
      id: 'AUDIT' as AppModule,
      label: t.navAudit,
      icon: ShieldCheck,
      badge: 'Append-Only'
    }
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-white border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-slate-200 p-3 lg:p-4">
      <div className="mb-3 px-2 hidden lg:block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Modules du socle industriel
        </span>
      </div>

      <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0" aria-label="Navigation modules">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              className={`min-h-[48px] px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer shrink-0 lg:w-full text-start ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight ${
                    isActive
                      ? 'bg-blue-800 text-blue-100'
                      : item.restricted
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.restricted ? 'Verrouillé' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
