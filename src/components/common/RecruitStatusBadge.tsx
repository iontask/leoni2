/**
 * LEONI QualiTrack - Composant Badge Unique de Statut de Qualification
 * Règle impérative : Jamais la couleur seule -> Icône + texte obligatoires.
 * Toujours visible à côté du nom de la recrue (liste, fiche, affectation, tableaux).
 */

import React from 'react';
import { BookOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { RecruitStatus, Language } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

interface RecruitStatusBadgeProps {
  status: RecruitStatus;
  size?: 'sm' | 'md' | 'lg';
  lang?: Language;
  className?: string;
}

export const RecruitStatusBadge: React.FC<RecruitStatusBadgeProps> = ({
  status,
  size = 'md',
  lang = 'fr',
  className = ''
}) => {
  const label = getStatusLabel(status, lang);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 min-h-[26px]',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5 min-h-[32px]',
    lg: 'text-sm font-medium px-3.5 py-1.5 gap-2 min-h-[40px]'
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5 shrink-0',
    md: 'w-4 h-4 shrink-0',
    lg: 'w-5 h-5 shrink-0'
  };

  switch (status) {
    case 'EN_ECOLE':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-sky-300 bg-sky-50 text-sky-800 shadow-xs ${sizeClasses[size]} ${className}`}
          title={`Statut qualité : ${label}`}
        >
          <BookOpen className={`${iconSizeClasses[size]} text-sky-600`} aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'EN_APPRENTISSAGE_POSTE':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-900 shadow-xs ${sizeClasses[size]} ${className}`}
          title={`Statut qualité : ${label}`}
        >
          <Clock className={`${iconSizeClasses[size]} text-amber-600`} aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'QUALIFIE_AUTONOME':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 shadow-xs ${sizeClasses[size]} ${className}`}
          title={`Statut qualité : ${label}`}
        >
          <CheckCircle2 className={`${iconSizeClasses[size]} text-emerald-600`} aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    case 'NON_QUALIFIE_PROLONGATION':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-md border border-rose-300 bg-rose-50 text-rose-900 shadow-xs ${sizeClasses[size]} ${className}`}
          title={`Statut qualité : ${label}`}
        >
          <AlertTriangle className={`${iconSizeClasses[size]} text-rose-600`} aria-hidden="true" />
          <span>{label}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-md border border-slate-300 bg-slate-50 text-slate-700 ${sizeClasses[size]} ${className}`}>
          <span>{status}</span>
        </span>
      );
  }
};
