/**
 * LEONI QualiTrack - Fiche Officielle 28 Jours & Carré Magique
 * Reproduction fidèle du canevas officiel d'évaluation LEONI (Feuilles Suivi 28J & Décision validation).
 */

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Award,
  Layers,
  Flame,
  ChevronDown,
  UserCheck,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { Recruit, UserProfile, Language } from '../../../types';
import {
  CarreMagiqueCriterion,
  CarreMagiquePhase,
  CarreMagiqueSheet,
  CarreMagiqueVisaRole,
  WorkstationDailyRecord
} from '../../../types/carreMagique';
import { CarreMagiqueEngine, LEONI_DEFECT_TYPES } from '../../../engine/carreMagiqueEngine';
import { formatDateDisplay, maskCIN } from '../../../i18n/translations';

interface CarreMagiqueSheetTabProps {
  sheet: CarreMagiqueSheet;
  recruit: Recruit;
  currentUser: UserProfile;
  lang: Language;
  onUpdateDailyRow: (row: WorkstationDailyRecord) => Promise<void>;
  onUpdateCriterion: (criterionId: string, statut: 'OK' | 'NOK', observation?: string) => Promise<void>;
  onSignVisa: (role: CarreMagiqueVisaRole, codePersonnel: string) => Promise<void>;
  onOpenPrintModal: () => void;
  onOpenBenchmarkModal: () => void;
}

export const CarreMagiqueSheetTab: React.FC<CarreMagiqueSheetTabProps> = ({
  sheet,
  recruit,
  currentUser,
  lang,
  onUpdateDailyRow,
  onUpdateCriterion,
  onSignVisa,
  onOpenPrintModal,
  onOpenBenchmarkModal
}) => {
  const [activeSection, setActiveSection] = useState<'SUIVI_28J' | 'CARRE_MAGIQUE' | 'VISAS'>('SUIVI_28J');
  const [selectedPhase, setSelectedPhase] = useState<CarreMagiquePhase>('PHASE_1');

  // État édition ligne du jour
  const [editingDay, setEditingDay] = useState<WorkstationDailyRecord | null>(null);
  const [selectedDefectCode, setSelectedDefectCode] = useState<string>(LEONI_DEFECT_TYPES[0].code);
  const [defectQuantity, setDefectQuantity] = useState<number>(1);

  // État signature Visa
  const [signingRole, setSigningRole] = useState<CarreMagiqueVisaRole | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Évaluation automatique du Carré Magique
  const evaluation = CarreMagiqueEngine.evaluateSheet(sheet);

  // Sauvegarde d'une ligne de jour
  const handleSaveDayEdit = async () => {
    if (!editingDay) return;
    await onUpdateDailyRow(editingDay);
    setEditingDay(null);
  };

  const handleAddDefectToEditingDay = () => {
    if (!editingDay) return;
    const defDef = LEONI_DEFECT_TYPES.find((d) => d.code === selectedDefectCode);
    if (!defDef) return;

    const newDef = {
      id: `def-${Date.now()}`,
      defectCode: defDef.code,
      typeNumero: defDef.numero,
      typeLibelleFr: defDef.libelleFr,
      typeLibelleAr: defDef.libelleAr,
      quantite: defectQuantity
    };

    const updatedDefauts = [...(editingDay.defauts || []), newDef];
    const totalDefauts = updatedDefauts.reduce((acc, d) => acc + d.quantite, 0);

    setEditingDay({
      ...editingDay,
      defauts: updatedDefauts,
      nombreDefauts: totalDefauts,
      alertePokaYokeDeclenchee: totalDefauts > 4
    });
  };

  const handleRemoveDefect = (defectId: string) => {
    if (!editingDay) return;
    const updatedDefauts = editingDay.defauts.filter((d) => d.id !== defectId);
    const totalDefauts = updatedDefauts.reduce((acc, d) => acc + d.quantite, 0);

    setEditingDay({
      ...editingDay,
      defauts: updatedDefauts,
      nombreDefauts: totalDefauts,
      alertePokaYokeDeclenchee: totalDefauts > 4
    });
  };

  const handleConfirmVisaSignature = async () => {
    if (!signingRole) return;
    if (!enteredPin || enteredPin.trim().length < 4) {
      setPinError('Veuillez saisir votre code personnel officiel (4 chiffres minimum).');
      return;
    }
    await onSignVisa(signingRole, enteredPin);
    setSigningRole(null);
    setEnteredPin('');
    setPinError(null);
  };

  // Filtrage des critères selon la phase choisie
  const filteredCriteria = sheet.criteres.filter((c) => c.phase === selectedPhase);

  // Poka-Yoke de progression
  const canAccessPhase2 = evaluation.niveauIValide;
  const canAccessPhase3 = evaluation.niveauLValide;

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE DE LA FICHE INDIVIDUELLE (Cartouche Industriel LEONI) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-sm">
                  Canevas Officiel LEONI
                </span>
                <span className="text-xs text-amber-300 font-semibold font-mono">
                  {sheet.posteCode}
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white mt-0.5">
                {sheet.nom} {sheet.prenom} — {sheet.posteIntitule}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBenchmarkModal}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Banc Barème Excel</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrintModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>

        {/* Détails Cartouche */}
        <div className="p-5 bg-slate-50/70 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Matricule SAP :</span>
              <strong className="text-blue-900 font-mono text-sm">{sheet.matricule || maskCIN(recruit.cin, currentUser.role)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Équipe de faction :</span>
              <strong className="text-slate-800">{sheet.equipe}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Famille métier :</span>
              <strong className="text-slate-800">{sheet.famillePoste}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Date début suivi :</span>
              <strong className="text-slate-800 font-mono">{formatDateDisplay(sheet.dateDebutSuivi)}</strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Raison du suivi :</span>
              <span className="text-slate-700 font-medium">{sheet.raisonSuivi}</span>
            </div>
            <div className="col-span-1 sm:col-span-3">
              <span className="text-slate-400 block text-[11px] font-medium">Objectifs de référence :</span>
              <span className="text-slate-700 font-medium">
                Q: <strong className="text-slate-900">{sheet.objectifQualite}</strong> • P: <strong className="text-slate-900">{sheet.objectifProductivite}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Série consécutive Q & P et Alerte Poka-Yoke */}
        <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Série Q&P consécutive : {evaluation.serieQPConsecutive} / 28 jours</span>
            </div>

            {evaluation.niveauUAcquisParSerie && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Niveau U acquis (28 jours consécutifs Q & P tenus)</span>
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Avancement cycle atelier :</span>{' '}
            <strong className="text-xs font-mono text-slate-900">
              {evaluation.joursCompletes} / 28 jours
            </strong>
          </div>
        </div>

        {/* Alerte Poka-Yoke (> 4 défauts) si active */}
        {evaluation.estVerrouillePokaYoke && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="font-bold block text-rose-950">
                {lang === 'ar' ? 'إنذار وقائي حاسم (Poka-Yoke) : إقفال فوري للمسار' : 'Verrou Poka-Yoke Actif : Mise en autonomie strictement bloquée'}
              </strong>
              <p>{lang === 'ar' ? evaluation.messageVerrouillageAr : evaluation.messageVerrouillageFr}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. DISPOSITIF DE DÉCISION FINALE (SYNTHÈSE PERMANENTE AVANT LE SCORE) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Synthèse Officielle de Décision (Feuille Décision LEONI)
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {evaluation.decisionLabelFr}
              </h2>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  evaluation.decision === 'AUTONOME'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : evaluation.decision === 'VALIDE_SUIVI_RENFORCE'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : evaluation.decision === 'FORMATION_CIBLEE'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {evaluation.decision}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Phase 1 (Niv I)</span>
              <span className="font-mono font-bold text-xs text-slate-800">{evaluation.scorePhase1} / 0,24</span>
            </div>
            <span className="text-slate-300">+</span>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Phase 2 (Niv L)</span>
              <span className="font-mono font-bold text-xs text-slate-800">{evaluation.scorePhase2} / 0,50</span>
            </div>
            <span className="text-slate-300">+</span>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Phase 3 (Niv U)</span>
              <span className="font-mono font-bold text-xs text-slate-800">{evaluation.scorePhase3} / 0,26</span>
            </div>
            <span className="text-slate-300">=</span>
            <div className="text-right pl-2 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Score Total</span>
              <span className="font-mono font-black text-base text-blue-900">
                {evaluation.scoreTotalPhases123} / 1,00 ({evaluation.scoreTotalPourcent}%)
              </span>
            </div>
          </div>
        </div>

        {/* AFFICHAGE DES CRITÈRES BLOQUANTS NON VALIDÉS AVANT LE SCORE */}
        {evaluation.criteresBloquantsNOK.length > 0 ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                {evaluation.criteresBloquantsNOK.length} critère(s) bloquant(s) non conforme(s) obligatoire(s) :
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2 font-medium">
              {evaluation.criteresBloquantsNOK.map((b) => (
                <li key={String(b.numero)}>
                  Critère N°<strong>{b.numero}</strong> : {b.libelleFr} ({b.phase})
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-700 font-sans">
              Règle LEONI : Un échec sur l'un de ces critères bloque la mise en autonomie même si le score dépasse 80%.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tous les critères bloquants obligatoires (15, 16, 17, 18, 20, 26, 29) sont validés conformes.</span>
          </div>
        )}

        <p className="text-xs text-slate-600">
          {lang === 'ar' ? evaluation.explicationAr : evaluation.explicationFr}
        </p>
      </div>

      {/* 3. SOUS-ONGLETS DE NAVIGATION (Suivi 28J / Carré Magique / Visas) */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSection('SUIVI_28J')}
          className={`min-h-[48px] px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'SUIVI_28J'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Suivi Quotidien sur 28 Jours ({sheet.suiviJours.length} j)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('CARRE_MAGIQUE')}
          className={`min-h-[48px] px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'CARRE_MAGIQUE'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Grille Carré Magique (Phases & Requalification)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('VISAS')}
          className={`min-h-[48px] px-5 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'VISAS'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Cartouche des 4 Visas Officiels</span>
        </button>
      </div>

      {/* SECTION A : TABLEAU DE SUIVI SUR 28 JOURS */}
      {activeSection === 'SUIVI_28J' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Relevé journalier : Ponctualité, Objectif Qualité (Q), Objectif Productivité (P), Défauts
            </span>
            <span className="text-[11px] text-slate-500">
              Suivi à 100% des défauts de l'opérateur en formation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <th className="p-3 text-center w-12">Jour</th>
                  <th className="p-3 w-28">Date</th>
                  <th className="p-3 text-center w-24">Ponctualité</th>
                  <th className="p-3 text-center w-20">Obj Q</th>
                  <th className="p-3 text-center w-20">Obj P</th>
                  <th className="p-3 text-center w-24">Défauts</th>
                  <th className="p-3">Détail des types de défauts</th>
                  <th className="p-3 text-center w-28">Pointé par</th>
                  <th className="p-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheet.suiviJours.map((day) => {
                  const isAlert = day.alertePokaYokeDeclenchee || day.nombreDefauts > 4;

                  return (
                    <tr
                      key={day.jourIndex}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAlert ? 'bg-rose-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        J{day.jourIndex}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {formatDateDisplay(day.date)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            day.ponctualite === 'A_L_HEURE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : day.ponctualite === 'RETARD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {day.ponctualite === 'A_L_HEURE' ? 'À l’heure' : day.ponctualite === 'RETARD' ? 'Retard' : 'Absent'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        {day.objectifQualiteAtteint ? (
                          <span className="text-emerald-700 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> NOK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {day.objectifProductiviteAtteint ? (
                          <span className="text-emerald-700 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> NOK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {day.nombreDefauts > 0 ? (
                          <span className={`px-2 py-0.5 rounded-md ${isAlert ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-800'}`}>
                            {day.nombreDefauts}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        {day.defauts && day.defauts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {day.defauts.map((d) => (
                              <span
                                key={d.id}
                                className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm text-[10px]"
                              >
                                {d.typeLibelleFr} (<strong>{d.quantite}</strong>)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucun défaut</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                        {day.pointeParMatricule || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingDay({ ...day })}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B : CHECKLIST CARRÉ MAGIQUE PAR PHASES */}
      {activeSection === 'CARRE_MAGIQUE' && (
        <div className="space-y-4">
          {/* Phase Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPhase('PHASE_1')}
              className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPhase === 'PHASE_1'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Phase 1 : Niveau I</span>
                <span className="font-mono text-[11px]">{evaluation.scorePhase1}/0,24</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">4 premiers jours</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPhase('PHASE_2')}
              className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPhase === 'PHASE_2'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  {!canAccessPhase2 && <Lock className="w-3 h-3 text-amber-500" />}
                  <span>Phase 2 : Niveau L</span>
                </span>
                <span className="font-mono text-[11px]">{evaluation.scorePhase2}/0,50</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">10 premiers jours (5 bloquants)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPhase('PHASE_3')}
              className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPhase === 'PHASE_3'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1">
                  {!canAccessPhase3 && <Lock className="w-3 h-3 text-amber-500" />}
                  <span>Phase 3 : Niveau U</span>
                </span>
                <span className="font-mono text-[11px]">{evaluation.scorePhase3}/0,26</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Jusqu'au J28 (2 bloquants)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPhase('REQUALIFICATION_90J')}
              className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPhase === 'REQUALIFICATION_90J'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Requalification</span>
                <span className="font-mono text-[11px]">{evaluation.scoreRequalification}/1,00</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">À 90 jours (Carré fermé)</span>
            </button>
          </div>

          {/* Alertes de verrouillage si la phase précédente n'est pas acquise */}
          {selectedPhase === 'PHASE_2' && !canAccessPhase2 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Règle Poka-Yoke de progression : La Phase 1 (Niveau I) doit être validée à 100% avant d'ouvrir la validation officielle du Niveau L.
              </span>
            </div>
          )}

          {selectedPhase === 'PHASE_3' && !canAccessPhase3 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Règle Poka-Yoke de progression : La Phase 2 (Niveau L) doit être validée à 100% avant d'ouvrir la validation officielle du Niveau U.
              </span>
            </div>
          )}

          {/* Criteria Cards List */}
          <div className="space-y-3">
            {filteredCriteria.map((c) => {
              const isOk = c.statut === 'OK';
              const isNok = c.statut === 'NOK';

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    c.estBloquant && isNok
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        N° {c.numero}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">
                        {lang === 'ar' ? c.libelleAr : c.libelleFr}
                      </h4>
                      {c.estBloquant && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>BLOQUANT</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {lang === 'ar' ? c.descriptionDetailleeAr : c.descriptionDetailleeFr}
                    </p>

                    {c.observation && (
                      <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                        Observation : {c.observation}
                      </div>
                    )}
                  </div>

                  {/* Actions & Coeff */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Coefficient</span>
                      <span className="font-mono font-bold text-xs text-slate-700">
                        x {c.coefficient.toFixed(2)}
                      </span>
                    </div>

                    {/* Touch Buttons >= 48px */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateCriterion(c.id, 'OK', c.observation)}
                        className={`min-h-[48px] min-w-[70px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          isOk
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>OK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateCriterion(c.id, 'NOK', c.observation)}
                        className={`min-h-[48px] min-w-[70px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          isNok
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>NOK</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION C : VISAS & SIGNATURES OFFICIELLES */}
      {activeSection === 'VISAS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Cartouche Officiel des Visas (Horodatage Certifié par Code Personnel)
            </h3>
            <p className="text-xs text-slate-500">
              Validation officielle du cursus selon l'ordre paramétré : Formateur Terrain → Shift Leader → Responsable Fabrication (RFM) → Responsable Qualité Usine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['FORMATEUR_TERRAIN', 'SHIFT_LEADER', 'RESPONSABLE_PRODUCTION', 'QUALITE'] as const).map((roleKey) => {
              const visa = sheet.visas[roleKey];

              return (
                <div
                  key={roleKey}
                  className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[170px] transition-all ${
                    visa.estSigne
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">
                      Ordre {visa.ordre} • {visa.titreFr}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {visa.estSigne ? visa.signeParNom : <span className="text-slate-400 italic">Signature en attente</span>}
                    </h4>
                  </div>

                  {visa.estSigne ? (
                    <div className="mt-4 pt-3 border-t border-emerald-200/80 text-xs text-emerald-800 space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Visé avec succès</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {formatDateDisplay(visa.dateSignature)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSigningRole(roleKey);
                          setEnteredPin('');
                          setPinError(null);
                        }}
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Signer avec PIN</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL : MODIFIER / ENREGISTRER UNE JOURNÉE DE SUIVI */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Détail du Suivi — Jour {editingDay.jourIndex} / 28
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Date : {editingDay.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs">
              {/* Ponctualité */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  1. Ponctualité de l’opérateur au poste :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['A_L_HEURE', 'RETARD', 'ABSENT'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditingDay({ ...editingDay, ponctualite: st })}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editingDay.ponctualite === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'A_L_HEURE' ? 'À l’heure' : st === 'RETARD' ? 'Retard' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objectifs Q & P */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="font-bold text-slate-800 block mb-1.5">Objectif Qualité (Q) :</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingDay({
                        ...editingDay,
                        objectifQualiteAtteint: !editingDay.objectifQualiteAtteint
                      })
                    }
                    className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editingDay.objectifQualiteAtteint
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingDay.objectifQualiteAtteint ? 'Atteint (OK)' : 'Non atteint (NOK)'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="font-bold text-slate-800 block mb-1.5">Objectif Productivité (P) :</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingDay({
                        ...editingDay,
                        objectifProductiviteAtteint: !editingDay.objectifProductiviteAtteint
                      })
                    }
                    className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editingDay.objectifProductiviteAtteint
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingDay.objectifProductiviteAtteint ? 'Atteint (OK)' : 'Non atteint (NOK)'}</span>
                  </button>
                </div>
              </div>

              {/* Saisie des Défauts du Jour */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    2. Défauts constatés ({editingDay.nombreDefauts} au total) :
                  </span>
                  {editingDay.nombreDefauts > 4 && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-sm">
                      Poka-Yoke &gt; 4 !
                    </span>
                  )}
                </div>

                {/* Liste des défauts déjà ajoutés */}
                {editingDay.defauts && editingDay.defauts.length > 0 ? (
                  <div className="space-y-1.5">
                    {editingDay.defauts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-800">{d.typeLibelleFr}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            qté : {d.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDefect(d.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold px-1.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic block">Aucun défaut ajouté pour cette journée.</span>
                )}

                {/* Ajouter un défaut */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2">
                  <select
                    value={selectedDefectCode}
                    onChange={(e) => setSelectedDefectCode(e.target.value)}
                    className="flex-1 min-h-[40px] px-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    {LEONI_DEFECT_TYPES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.libelleFr}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={defectQuantity}
                      onChange={(e) => setDefectQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 min-h-[40px] px-2 font-mono text-center font-bold rounded-xl border border-slate-300 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddDefectToEditingDay}
                      className="min-h-[40px] px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {editingDay.nombreDefauts > 4 && (
                  <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Règle Poka-Yoke : Au-delà de 4 défauts/jour, l'opérateur doit impérativement refaire la formation.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveDayEdit}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : SIGNATURE DE VISA PAR CODE PIN PERSONNEL */}
      {signingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Visa Officiel — {sheet.visas[signingRole].titreFr}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Signature certifiée par code personnel
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSigningRole(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Vous vous apprêtez à apposer votre visa officiel pour la recrue <strong>{sheet.nom} {sheet.prenom}</strong> ({sheet.matricule}).
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Code Personnel / PIN de signature (4 chiffres) :
                </label>
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Ex: 3010"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full min-h-[46px] px-3 font-mono text-center tracking-widest text-lg font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {pinError}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSigningRole(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmVisaSignature}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Valider et signer le visa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
