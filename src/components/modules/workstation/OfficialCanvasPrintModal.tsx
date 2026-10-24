/**
 * LEONI QualiTrack - Modal d'Impression Haute Fidélité / Export PDF
 * Reproduction scrupuleuse du canevas officiel LEONI « Suivi au Poste 28J & Carré Magique »
 */

import React from 'react';
import {
  Printer,
  X,
  FileCheck2,
  Award,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Layers,
  UserCheck
} from 'lucide-react';
import { CarreMagiqueSheet, DecisionValidationResult } from '../../../types/carreMagique';
import { formatDateDisplay } from '../../../i18n/translations';
import { Language } from '../../../types';

interface OfficialCanvasPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: CarreMagiqueSheet;
  evaluation: DecisionValidationResult;
  lang: Language;
}

export const OfficialCanvasPrintModal: React.FC<OfficialCanvasPrintModalProps> = ({
  isOpen,
  onClose,
  sheet,
  evaluation,
  lang
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Controls (Hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Canevas Officiel LEONI — Export PDF / Impression</h3>
              <p className="text-[11px] text-slate-300">
                Format d'impression officiel conforme aux standards usine LEONI Maroc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la fiche (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Sheet Body */}
        <div className="p-6 sm:p-8 overflow-y-auto print:overflow-visible print:p-0 bg-slate-100/50 print:bg-white text-slate-900 text-xs font-sans">
          <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-8 rounded-2xl print:rounded-none shadow-sm print:shadow-none border border-slate-200 print:border-none space-y-5">
            
            {/* 1. CARTUCHE INDUSTRIEL LEONI */}
            <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
                <div className="col-span-3 p-3 bg-slate-900 text-white flex flex-col justify-center items-center text-center">
                  <span className="font-extrabold tracking-widest text-lg font-mono">LEONI</span>
                  <span className="text-[10px] tracking-wide text-slate-300 uppercase">Qualitrack System</span>
                </div>
                <div className="col-span-6 p-2 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Document Qualité Usine</span>
                  <h1 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Fiche Individuelle de Suivi 28 Jours & Carré Magique
                  </h1>
                  <span className="text-[10px] text-slate-500">Site Pilote : LEONI Bouskoura (Casablanca)</span>
                </div>
                <div className="col-span-3 p-2 text-right flex flex-col justify-center font-mono text-[10px] space-y-0.5">
                  <div><strong>Réf :</strong> FT-QUA-CM-28J</div>
                  <div><strong>Indice :</strong> 04 / 2026</div>
                  <div><strong>Statut :</strong> Officiel</div>
                </div>
              </div>
            </div>

            {/* 2. EN-TÊTE DE LA FICHE INDIVIDUELLE */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Opérateur (Nom & Prénom) :</span>
                  <strong className="text-slate-900 text-xs">{sheet.nom} {sheet.prenom}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Matricule officiel :</span>
                  <strong className="text-blue-900 font-mono text-xs">{sheet.matricule}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Raison du suivi :</span>
                  <strong className="text-slate-900">{sheet.raisonSuivi}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Équipe de production :</span>
                  <strong className="text-slate-900">{sheet.equipe}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Poste de travail :</span>
                  <strong className="text-slate-900 text-xs font-mono">{sheet.posteCode} — {sheet.posteIntitule}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Famille de poste :</span>
                  <strong className="text-slate-900">{sheet.famillePoste}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Date début de suivi :</span>
                  <strong className="text-slate-900">{formatDateDisplay(sheet.dateDebutSuivi)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Série Q&P consécutive :</span>
                  <strong className="text-emerald-700 font-mono">{evaluation.serieQPConsecutive} / 28 jours</strong>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Objectif Qualité (Q) :</span>
                  <span className="font-semibold text-slate-800">{sheet.objectifQualite}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Objectif Productivité (P) :</span>
                  <span className="font-semibold text-slate-800">{sheet.objectifProductivite}</span>
                </div>
              </div>
            </div>

            {/* 3. SUIVI QUOTIDIEN SUR 28 JOURS (TABLEAU CONDENSÉ) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>1. Suivi Quotidien sur 28 Jours (Pointage, Qualité Q & Productivité P, Défauts)</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  Seuil Poka-Yoke : &gt; 4 défauts/jour = Refaire formation
                </span>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-1 text-center w-8">Jour</th>
                      <th className="p-1 w-20">Date</th>
                      <th className="p-1 text-center w-16">Ponctualité</th>
                      <th className="p-1 text-center w-12">Obj Q</th>
                      <th className="p-1 text-center w-12">Obj P</th>
                      <th className="p-1 text-center w-14">Défauts</th>
                      <th className="p-1">Détail des défauts enregistrés</th>
                      <th className="p-1 text-right w-24">Pointé par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sheet.suiviJours.map((day) => {
                      const isAlert = day.alertePokaYokeDeclenchee || day.nombreDefauts > 4;

                      return (
                        <tr
                          key={day.jourIndex}
                          className={`${isAlert ? 'bg-rose-50/70 font-semibold text-rose-900' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-1 text-center font-mono font-bold">J{day.jourIndex}</td>
                          <td className="p-1 font-mono text-[9px] text-slate-600">{formatDateDisplay(day.date)}</td>
                          <td className="p-1 text-center">
                            <span
                              className={`px-1 py-0.5 rounded-xs text-[9px] ${
                                day.ponctualite === 'A_L_HEURE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : day.ponctualite === 'RETARD'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {day.ponctualite === 'A_L_HEURE' ? 'À l’heure' : day.ponctualite === 'RETARD' ? `Retard (${day.retardMinutes || 10}m)` : 'Absent'}
                            </span>
                          </td>
                          <td className="p-1 text-center font-bold">
                            {day.objectifQualiteAtteint ? (
                              <span className="text-emerald-700">OK</span>
                            ) : (
                              <span className="text-rose-700">NOK</span>
                            )}
                          </td>
                          <td className="p-1 text-center font-bold">
                            {day.objectifProductiviteAtteint ? (
                              <span className="text-emerald-700">OK</span>
                            ) : (
                              <span className="text-rose-700">NOK</span>
                            )}
                          </td>
                          <td className="p-1 text-center font-mono font-bold">
                            {day.nombreDefauts > 0 ? (
                              <span className={isAlert ? 'text-rose-700' : 'text-slate-900'}>
                                {day.nombreDefauts}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-1 text-[9px] text-slate-600 truncate max-w-[200px]">
                            {day.defauts && day.defauts.length > 0
                              ? day.defauts.map((d) => `${d.typeLibelleFr} (${d.quantite})`).join(', ')
                              : '-'}
                          </td>
                          <td className="p-1 text-right text-[9px] text-slate-500 font-mono">
                            {day.pointeParMatricule || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. GRILLE OFFICIELLE DU CARRÉ MAGIQUE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  2. Évaluation Carré Magique par Phases (Numérotation & Coefficients Officiels)
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span>P1: <strong>{evaluation.scorePhase1}/0,24</strong></span>
                  <span>•</span>
                  <span>P2: <strong>{evaluation.scorePhase2}/0,50</strong></span>
                  <span>•</span>
                  <span>P3: <strong>{evaluation.scorePhase3}/0,26</strong></span>
                  <span>•</span>
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded-sm font-bold">
                    Total: {evaluation.scoreTotalPhases123}/1,00 ({evaluation.scoreTotalPourcent}%)
                  </span>
                </div>
              </div>

              {/* Table des critères */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-1.5 w-12 text-center">N°</th>
                      <th className="p-1.5">Intitulé officiel du critère</th>
                      <th className="p-1.5 text-center w-16">Coeff</th>
                      <th className="p-1.5 text-center w-16">Résultat</th>
                      <th className="p-1.5 w-40">Observation formateur</th>
                      <th className="p-1.5 text-right w-24">Visa & Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sheet.criteres.map((c) => {
                      const isOk = c.statut === 'OK';
                      const isNok = c.statut === 'NOK';

                      return (
                        <tr
                          key={c.id}
                          className={`${
                            c.estBloquant && isNok
                              ? 'bg-rose-100/70 font-semibold'
                              : isNok
                              ? 'bg-amber-50/60'
                              : ''
                          }`}
                        >
                          <td className="p-1.5 text-center font-mono font-bold">
                            {c.numero}
                          </td>
                          <td className="p-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{c.libelleFr}</span>
                              {c.estBloquant && (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[8px] font-black px-1 rounded-xs">
                                  BLOQUANT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-1.5 text-center font-mono">{c.coefficient.toFixed(2)}</td>
                          <td className="p-1.5 text-center font-bold">
                            {isOk ? (
                              <span className="text-emerald-700">OK</span>
                            ) : isNok ? (
                              <span className="text-rose-700">NOK</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-1.5 text-[9px] text-slate-600 truncate max-w-[150px]">
                            {c.observation || '-'}
                          </td>
                          <td className="p-1.5 text-right text-[9px] font-mono text-slate-500">
                            {c.valideParMatricule || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. DISPOSITIF DE DÉCISION FINALE (SYNTHÈSE OFFICIELLE) */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Résultat de la Décision Finale</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    {evaluation.decisionLabelFr}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Score Global Certifié :</span>
                  <span className="text-base font-black font-mono text-blue-900">
                    {evaluation.scoreTotalPhases123} / 1,00 ({evaluation.scoreTotalPourcent}%)
                  </span>
                </div>
              </div>

              {evaluation.criteresBloquantsNOK.length > 0 ? (
                <div className="p-2.5 rounded-md bg-rose-100 border border-rose-300 text-rose-900 text-[11px] mb-2 font-medium">
                  <strong>Alerte Critères Bloquants :</strong> Non-conformité sur {evaluation.criteresBloquantsNOK.length} critère(s) bloquant(s) [N° {evaluation.criteresBloquantsNOK.map((b) => b.numero).join(', ')}]. La mise en autonomie est formellement bloquée.
                </div>
              ) : (
                <div className="p-2 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] mb-2 font-medium">
                  <strong>Conformité Qualité :</strong> 100% des critères bloquants obligatoires sont validés conformes.
                </div>
              )}

              <p className="text-[11px] text-slate-600">
                {evaluation.explicationFr}
              </p>
            </div>

            {/* 6. CARTOUCHE DES 4 VISAS OFFICIELS AVEC DATE ET HEURE */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
                3. Visas & Signatures Officielles (Horodatage Certifié)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['FORMATEUR_TERRAIN', 'SHIFT_LEADER', 'RESPONSABLE_PRODUCTION', 'QUALITE'] as const).map((role) => {
                  const visa = sheet.visas[role];

                  return (
                    <div
                      key={role}
                      className="border border-slate-300 rounded-lg p-2.5 bg-white flex flex-col justify-between min-h-[95px]"
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">
                          {visa.ordre}. {visa.titreFr}
                        </span>
                        <div className="font-bold text-[11px] text-slate-900 mt-1">
                          {visa.estSigne ? visa.signeParNom : <span className="text-slate-400 italic">En attente</span>}
                        </div>
                      </div>

                      {visa.estSigne ? (
                        <div className="mt-2 pt-1 border-t border-slate-100 text-[9px] font-mono text-emerald-700">
                          <div>Signé : {formatDateDisplay(visa.dateSignature)}</div>
                          <div className="text-[8px] text-slate-400">PIN: ****</div>
                        </div>
                      ) : (
                        <div className="mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400 italic">
                          Non visé
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de page certificat */}
            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
              Document généré numériquement via LEONI QualiTrack • Horodatage certifié : {new Date().toISOString()} • Usine Bouskoura
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
