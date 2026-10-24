/**
 * LEONI QualiTrack - Barre Latérale Dynamique (Sidebar UX/UI Industrielle)
 * Câblage automobile - LEONI Maroc
 * 
 * Conception UX/UI Experte :
 * - Mode rétractable (Rail 80px / Étendu 300px) avec persistance locale
 * - Compteurs en direct synchronisés avec les recrues et le journal d'audit
 * - Double découpage ergonomique : Parcours Opérateur (33j) vs Pilotage & Gouvernance
 * - Tooltips flottants en mode réduit pour consultation immédiate sans encombrement
 * - Raccourcis clavier (Ctrl+B pour réduire/agrandir, Alt+1..8 pour navigation directe)
 * - Conforme anti-slop : zéro capsule statique inutile, typographie épurée, contrastes IATF
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Wrench,
  Layers,
  Award,
  BarChart3,
  Sliders,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronLeft,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles
} from 'lucide-react';
import { Language, UserRole, Recruit, AuditLog } from '../../types';
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
  recruits?: Recruit[];
  auditLogs?: AuditLog[];
  currentSiteName?: string;
}

interface MenuItemDef {
  id: AppModule;
  label: string;
  shortLabel: string;
  stepNumber?: number;
  stepDays?: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'WORKFLOW' | 'GOVERNANCE';
  restricted?: boolean;
  shortcut: string;
  getDynamicStats: (recruits: Recruit[], auditLogs: AuditLog[], userRole: UserRole) => {
    countText: string;
    subtext: string;
    hasAlert?: boolean;
    isSuccess?: boolean;
    alertCount?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  userRole,
  lang,
  recruits = [],
  auditLogs = [],
  currentSiteName
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // État de réduction persisté
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('leoni_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Filtre rapide de recherche dans la sidebar
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredModule, setHoveredModule] = useState<AppModule | null>(null);

  // Sauvegarde de l'état réduit
  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('leoni_sidebar_collapsed', String(next));
      } catch {
        // Ignorer en mode sandbox
      }
      return next;
    });
  };

  // Raccourcis clavier (Ctrl+B pour replier, Alt+1..8 pour basculer de module)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B ou Cmd+B pour plier/déplier
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
        return;
      }

      // Alt+1 à Alt+8 pour navigation rapide
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          const target = allMenuItems[num - 1];
          if (target) {
            onSelectModule(target.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Définition structurée des modules avec calcul dynamique des métriques
  const allMenuItems: MenuItemDef[] = useMemo(() => [
    // --- SECTION 1 : PARCOURS OPÉRATEUR (33 JOURS) ---
    {
      id: 'DOSSIERS',
      label: t.navDossiers,
      shortLabel: isRtl ? 'الملفات' : 'Dossiers',
      stepNumber: 1,
      stepDays: 'J0',
      icon: Users,
      section: 'WORKFLOW',
      shortcut: 'Alt+1',
      getDynamicStats: (recs) => {
        const active = recs.filter((r) => !r.estArchive);
        const incomplete = active.filter((r) => !r.dossierComplet || (r.tauxCompletudeDossier ?? 100) < 100);
        return {
          countText: `${active.length}`,
          subtext: incomplete.length > 0 ? `${incomplete.length} à compléter` : 'Dossiers complets',
          hasAlert: incomplete.length > 0,
          alertCount: incomplete.length
        };
      }
    },
    {
      id: 'ECOLE',
      label: t.navEcole,
      shortLabel: isRtl ? 'المدرسة' : 'École (5j)',
      stepNumber: 2,
      stepDays: 'J1-5',
      icon: GraduationCap,
      section: 'WORKFLOW',
      shortcut: 'Alt+2',
      getDynamicStats: (recs) => {
        const inSchool = recs.filter((r) => !r.estArchive && r.statut === 'EN_ECOLE');
        const readyForDecision = inSchool.filter((r) => (r.ecoleJoursValides || 0) >= 5 && !r.ecoleValidee);
        return {
          countText: `${inSchool.length}`,
          subtext: readyForDecision.length > 0 ? `${readyForDecision.length} à valider` : `${inSchool.length} stagiaires`,
          hasAlert: readyForDecision.length > 0,
          alertCount: readyForDecision.length
        };
      }
    },
    {
      id: 'AFFECTATION',
      label: t.navAffectation,
      shortLabel: isRtl ? 'التوجيه' : 'Affectation',
      stepNumber: 3,
      stepDays: 'J6',
      icon: Wrench,
      section: 'WORKFLOW',
      shortcut: 'Alt+3',
      getDynamicStats: (recs) => {
        const toAssign = recs.filter(
          (r) => !r.estArchive && r.ecoleValidee && !r.workstationId
        );
        return {
          countText: `${toAssign.length}`,
          subtext: toAssign.length > 0 ? `${toAssign.length} en attente poste` : 'Tous affectés',
          hasAlert: toAssign.length > 0,
          alertCount: toAssign.length
        };
      }
    },
    {
      id: 'SUIVI_POSTE',
      label: t.navSuiviPoste,
      shortLabel: isRtl ? 'تتبع المركز' : 'Poste (28j)',
      stepNumber: 4,
      stepDays: 'J7-28',
      icon: Layers,
      section: 'WORKFLOW',
      shortcut: 'Alt+4',
      getDynamicStats: (recs) => {
        const onLine = recs.filter((r) => !r.estArchive && r.statut === 'EN_APPRENTISSAGE_POSTE');
        const withIssues = onLine.filter((r) => (r.carreMagiquePointsConformes || 16) < 14);
        return {
          countText: `${onLine.length}`,
          subtext: withIssues.length > 0 ? `${withIssues.length} écarts détectés` : `${onLine.length} opérateurs`,
          hasAlert: withIssues.length > 0,
          alertCount: withIssues.length
        };
      }
    },
    {
      id: 'QUALIFICATION',
      label: t.navQualification,
      shortLabel: isRtl ? 'التأهيل' : 'Qualification',
      stepNumber: 5,
      stepDays: 'J33+',
      icon: Award,
      section: 'WORKFLOW',
      shortcut: 'Alt+5',
      getDynamicStats: (recs) => {
        const pendingVisas = recs.filter(
          (r) => !r.estArchive && (r.joursSuiviCompletes || 0) >= 28 && (!r.visaQualite || !r.visaProduction)
        );
        const qualified = recs.filter((r) => !r.estArchive && r.qualifiee);
        return {
          countText: pendingVisas.length > 0 ? `${pendingVisas.length}` : `${qualified.length}`,
          subtext: pendingVisas.length > 0 ? `${pendingVisas.length} visas en attente` : `${qualified.length} autonomes`,
          hasAlert: pendingVisas.length > 0,
          isSuccess: pendingVisas.length === 0 && qualified.length > 0,
          alertCount: pendingVisas.length
        };
      }
    },

    // --- SECTION 2 : GOUVERNANCE & PILOTAGE ---
    {
      id: 'INDICATEURS',
      label: t.navIndicateurs,
      shortLabel: isRtl ? 'المؤشرات' : 'Indicateurs',
      icon: BarChart3,
      section: 'GOVERNANCE',
      shortcut: 'Alt+6',
      getDynamicStats: (recs) => {
        const total = recs.filter((r) => !r.estArchive).length;
        const qual = recs.filter((r) => !r.estArchive && r.qualifiee).length;
        const rate = total > 0 ? Math.round((qual / total) * 100) : 100;
        return {
          countText: `${rate}%`,
          subtext: 'Taux qualification',
          isSuccess: rate >= 85
        };
      }
    },
    {
      id: 'PARAMETRAGE',
      label: t.navParametrage,
      shortLabel: isRtl ? 'الإعدادات' : 'Paramétrage',
      icon: Sliders,
      section: 'GOVERNANCE',
      shortcut: 'Alt+7',
      restricted: !['REFERENT_LEARNING', 'ADMIN'].includes(userRole),
      getDynamicStats: (_recs, _logs, role) => {
        const canEdit = ['REFERENT_LEARNING', 'ADMIN'].includes(role);
        return {
          countText: 'v3.2',
          subtext: canEdit ? 'Éditable' : 'Verrouillé'
        };
      }
    },
    {
      id: 'AUDIT',
      label: t.navAudit,
      shortLabel: isRtl ? 'التدقيق' : 'Audit',
      icon: ShieldCheck,
      section: 'GOVERNANCE',
      shortcut: 'Alt+8',
      getDynamicStats: (_recs, logs) => {
        return {
          countText: `${logs.length}`,
          subtext: 'Traçabilité IATF',
          isSuccess: true
        };
      }
    }
  ], [t, isRtl, userRole]);

  // Filtrage par texte si recherche active
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return allMenuItems;
    const q = searchFilter.toLowerCase();
    return allMenuItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.shortLabel.toLowerCase().includes(q)
    );
  }, [allMenuItems, searchFilter]);

  const workflowItems = filteredItems.filter((i) => i.section === 'WORKFLOW');
  const governanceItems = filteredItems.filter((i) => i.section === 'GOVERNANCE');

  return (
    <aside
      className={`shrink-0 bg-white border-b lg:border-b-0 ltr:lg:border-r rtl:lg:border-l border-slate-200 transition-all duration-300 ease-in-out flex flex-col select-none ${
        isCollapsed ? 'lg:w-20 w-full' : 'lg:w-72 xl:w-80 w-full'
      }`}
      aria-label="Navigation principale LEONI QualiTrack"
    >
      {/* En-tête de la Sidebar avec bascule de réduction */}
      <div className="hidden lg:flex items-center justify-between p-3.5 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
              {isRtl ? 'وحدات المسار الصناعي' : 'Socle Qualification'}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Agrandir la barre latérale (Ctrl+B)' : 'Réduire la barre latérale (Ctrl+B)'}
          className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          aria-label={isCollapsed ? 'Agrandir le menu latéral' : 'Réduire le menu latéral'}
        >
          {isCollapsed ? (
            isRtl ? <PanelLeftClose className="w-5 h-5 text-blue-700" /> : <PanelLeftOpen className="w-5 h-5 text-blue-700" />
          ) : (
            isRtl ? <PanelLeftOpen className="w-5 h-5 text-slate-600" /> : <PanelLeftClose className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* Barre de recherche rapide de module (affichée uniquement en mode étendu) */}
      {!isCollapsed && (
        <div className="hidden lg:block px-3.5 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={isRtl ? 'تصفية الوحدات...' : 'Filtrer les modules...'}
              className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 rounded-lg ltr:pl-8 rtl:pr-8 pr-3 py-1.5 border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Navigation des modules */}
      <nav
        className="flex-1 p-2.5 sm:p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto"
        aria-label="Liste des modules"
      >
        {/* SECTION 1 : PARCOURS OPÉRATEUR (33 JOURS) */}
        {workflowItems.length > 0 && (
          <div className="flex lg:flex-col gap-1 shrink-0 lg:w-full">
            {!isCollapsed && (
              <div className="hidden lg:flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>{isRtl ? 'المسار التأهيلي (33 يوماً)' : 'Parcours Opérateur (33j)'}</span>
                <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">IATF 7.2</span>
              </div>
            )}

            {workflowItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentModule === item.id}
                isCollapsed={isCollapsed}
                isRtl={isRtl}
                onSelect={() => onSelectModule(item.id)}
                stats={item.getDynamicStats(recruits, auditLogs, userRole)}
                isHovered={hoveredModule === item.id}
                onHover={(hover) => setHoveredModule(hover ? item.id : null)}
              />
            ))}
          </div>
        )}

        {/* Séparateur visuel */}
        {governanceItems.length > 0 && workflowItems.length > 0 && (
          <div className="hidden lg:block my-2 border-t border-slate-100" />
        )}

        {/* SECTION 2 : GOUVERNANCE & SYSTÈME */}
        {governanceItems.length > 0 && (
          <div className="flex lg:flex-col gap-1 shrink-0 lg:w-full">
            {!isCollapsed && (
              <div className="hidden lg:flex items-center justify-between px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>{isRtl ? 'الحكامة والقيادة' : 'Pilotage & Gouvernance'}</span>
              </div>
            )}

            {governanceItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentModule === item.id}
                isCollapsed={isCollapsed}
                isRtl={isRtl}
                onSelect={() => onSelectModule(item.id)}
                stats={item.getDynamicStats(recruits, auditLogs, userRole)}
                isHovered={hoveredModule === item.id}
                onHover={(hover) => setHoveredModule(hover ? item.id : null)}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Pied de page de la Sidebar : État de l'Usine en temps réel */}
      <div className="hidden lg:block p-3 border-t border-slate-200 bg-slate-50/70">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-start overflow-hidden">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentSiteName || 'LEONI Bouskoura'}
                </span>
                <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Poka-Yoke & Audit actifs
                </span>
              </div>
            </div>

            <kbd
              title="Raccourci pour plier/déplier le menu"
              className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs"
            >
              Ctrl+B
            </kbd>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div
              title={`${currentSiteName || 'Site LEONI'} - Poka-Yoke Actif`}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"
            />
            <span className="text-[9px] font-bold text-slate-400 font-mono">IATF</span>
          </div>
        )}
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  item: MenuItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  isRtl: boolean;
  onSelect: () => void;
  stats: {
    countText: string;
    subtext: string;
    hasAlert?: boolean;
    isSuccess?: boolean;
    alertCount?: number;
  };
  isHovered: boolean;
  onHover: (hover: boolean) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isCollapsed,
  isRtl,
  onSelect,
  stats,
  isHovered,
  onHover
}) => {
  const Icon = item.icon;

  return (
    <div
      className="relative shrink-0 lg:w-full"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`group relative min-h-[48px] w-full px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center transition-all duration-200 cursor-pointer text-start ${
          isCollapsed ? 'justify-center' : 'justify-between gap-2.5'
        } ${
          isActive
            ? 'bg-blue-700 text-white shadow-xs font-semibold'
            : item.restricted
            ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-current={isActive ? 'page' : undefined}
        title={isCollapsed ? `${item.label} (${stats.countText})` : undefined}
      >
        {/* Trait indicateur actif latéral */}
        {isActive && !isCollapsed && (
          <span
            className={`absolute top-2 bottom-2 w-1 bg-white rounded-full ${
              isRtl ? 'right-1' : 'left-1'
            }`}
          />
        )}

        {/* Partie gauche : Icône + Étape + Titre */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} overflow-hidden`}>
          <div className="relative shrink-0">
            <Icon
              className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                isActive
                  ? 'text-white'
                  : item.restricted
                  ? 'text-slate-400'
                  : 'text-slate-500 group-hover:text-blue-700'
              }`}
            />

            {/* Pastille discrète d'alerte en mode réduit */}
            {isCollapsed && stats.hasAlert && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col text-start overflow-hidden">
              <div className="flex items-center gap-1.5">
                {item.stepNumber && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.stepDays || `E${item.stepNumber}`}
                  </span>
                )}
                <span className="truncate font-semibold tracking-tight">{item.label}</span>
                {item.restricted && (
                  <Lock className={`w-3 h-3 shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
                )}
              </div>
              <span
                className={`text-[11px] truncate font-normal ${
                  isActive ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {stats.subtext}
              </span>
            </div>
          )}
        </div>

        {/* Partie droite : Compteur dynamique et alertes (en mode étendu) */}
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {stats.countText && (
              <span
                className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-800 text-white'
                    : stats.hasAlert
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : stats.isSuccess
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                {stats.countText}
              </span>
            )}
          </div>
        )}
      </button>

      {/* FLYOUT TOOLTIP FLOTTANT EN MODE RÉDUIT (Desktop uniquement) */}
      {isCollapsed && isHovered && (
        <div
          className={`hidden lg:flex flex-col absolute top-1/2 -translate-y-1/2 z-50 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 pointer-events-none transition-all duration-200 animate-in fade-in ${
            isRtl ? 'right-full mr-2' : 'left-full ml-2'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              {item.stepDays ? `Étape ${item.stepNumber} (${item.stepDays})` : 'Gouvernance'}
            </span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              {item.shortcut}
            </kbd>
          </div>

          <span className="text-sm font-bold text-white mb-0.5">{item.label}</span>
          <p className="text-xs text-slate-300 mb-2">{stats.subtext}</p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Activité en cours :</span>
            <span
              className={`font-mono font-bold ${
                stats.hasAlert
                  ? 'text-amber-400'
                  : stats.isSuccess
                  ? 'text-emerald-400'
                  : 'text-blue-300'
              }`}
            >
              {stats.countText}
            </span>
          </div>

          {item.restricted && (
            <div className="mt-2 text-[10px] text-amber-300 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Accès réservé aux profils Référent / Admin</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
