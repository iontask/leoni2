/**
 * LEONI QualiTrack - Étape 4 : Matrice des Règles de Correspondance & Prérequis Postes Critiques
 * Poka-Yoke : La réussite aux tests généraux ne suffit pas à ouvrir tous les postes.
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  FileCheck,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Language, SystemParameter, UserProfile, Workstation } from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';

interface WorkstationRulesTabProps {
  workstations: Workstation[];
  parameters: SystemParameter[];
  currentUser: UserProfile;
  lang: Language;
}

export const WorkstationRulesTab: React.FC<WorkstationRulesTabProps> = ({
  workstations,
  parameters,
  currentUser,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  const assiduiteMin = Number(
    parameters.find((p) => p.cle === 'SEUIL_ASSIDUITE_POSTE_CRITIQUE')?.valeur ?? 100
  );
  const noteCritiqueMin = Number(
    parameters.find((p) => p.cle === 'NOTE_MIN_POSTE_CRITIQUE')?.valeur ?? 16
  );
  const dureeEcole = Number(
    parameters.find((p) => p.cle === 'DUREE_ECOLE_JOURS')?.valeur ?? 5
  );
  const diplomeRequis = Boolean(
    parameters.find((p) => p.cle === 'DIPLOME_EXIGE_POSTE_CRITIQUE')?.valeur ?? true
  );

  return (
    <div className="space-y-6">
      {/* En-tête de la matrice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {t.tabWorkstationRules}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Principe Poka-Yoke LEONI : La réussite aux examens généraux de l’école de câblage ne donne pas accès d’office aux postes critiques. Chaque typologie impose des seuils d’assiduité, d’aptitude gestuelle et de note minimale infranchissables sans dérogation habilitée.
        </p>
      </div>

      {/* Cartes des 4 Verrous Directeurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Assiduité École
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {assiduiteMin}% ({dureeEcole}/{dureeEcole} jours)
          </div>
          <p className="text-[11px] text-slate-500">
            Zéro absence non justifiée pendant le cycle initial de formation.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Note Minimale Requise
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {noteCritiqueMin} / 20
          </div>
          <p className="text-[11px] text-slate-500">
            Examen théorique et pratique de l’école de câblage LEONI.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <FileCheck className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Test Pratique de Geste
          </span>
          <div className="text-xl font-extrabold text-indigo-700 font-mono">
            100% Validé
          </div>
          <p className="text-[11px] text-slate-500">
            Tous les critères éliminatoires (clic, TPA, pull-test) au vert.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Dérogation Exceptionnelle
          </span>
          <div className="text-xl font-extrabold text-rose-700 font-mono">
            Auditée & Signée
          </div>
          <p className="text-[11px] text-slate-500">
            Réservée aux RFM, Référent Learning, Qualité ou Administrateur.
          </p>
        </div>
      </div>

      {/* Tableau comparatif : Postes Initiaux vs Postes Critiques */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Matrice d’accessibilité par typologie de poste
          </h3>
          <span className="text-xs text-slate-500">
            Standard de qualification atelier LEONI Maroc
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Poste & Code</th>
                <th className="p-3.5">Typologie</th>
                <th className="p-3.5">Profil éligible</th>
                <th className="p-3.5">Seuil École</th>
                <th className="p-3.5">Diplôme Technique</th>
                <th className="p-3.5">Test Geste Qualité</th>
                <th className="p-3.5">Verrou Poka-Yoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {workstations.map((ws) => {
                const isCritique = ws.typologie === 'CRITIQUE';

                return (
                  <tr key={ws.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="font-mono text-xs text-blue-700">{ws.code}</div>
                      <div>{ws.intituleFr}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{ws.segment} - {ws.ligne}</div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isCritique
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isCritique ? 'Poste Critique' : 'Poste Initial'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {isCritique ? (
                        <span className="font-semibold text-rose-900">
                          Opérateur expérimenté ou profil technique validé
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-900">
                          Débutant autorisé dès J5 école
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className={isCritique ? 'font-bold text-rose-700' : 'text-slate-600'}>
                        ≥ {ws.prerequis.noteEcoleMin}/20
                      </span>
                    </td>

                    <td className="p-3.5">
                      {ws.prerequis.diplomeExige ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Exigé
                        </span>
                      ) : (
                        <span className="text-slate-400">Non obligatoire</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {ws.prerequis.testGesteReussiExige ? (
                        <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Requis 100%
                        </span>
                      ) : (
                        <span className="text-slate-400">Recommandé</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {isCritique ? (
                        <div className="flex items-center gap-1 text-rose-700 font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloquant sans prérequis</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accessible</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explication du workflow de Dérogation & Poka-Yoke */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base">
            Protocole de dérogation exceptionnelle pour poste critique
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Lorsqu'une recrue ne satisfait pas l'ensemble des critères d'un poste critique mais présente des aptitudes spécifiques identifiées par l'encadrement :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-amber-300 block">1. Déclenchement du Verrou</span>
            <span className="text-slate-300">
              Le système bloque automatiquement l'affectation et affiche la raison exacte du blocage (note insuffisante, assiduité incomplète).
            </span>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-amber-300 block">2. Habilitation Exécutive</span>
            <span className="text-slate-300">
              Seuls le RFM (Responsable Fabrication), le Référent Learning, le Responsable Qualité ou l'Administrateur peuvent lever le verrou.
            </span>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-amber-300 block">3. Audit Immuable</span>
            <span className="text-slate-300">
              Un motif circonstancié est obligatoire et enregistré de façon permanente dans le journal d'audit IATF 16949 et sur la fiche recrue.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
