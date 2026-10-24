/**
 * LEONI QualiTrack - Types Officiels Carré Magique & Suivi au Poste 28 Jours
 * Basé sur le canevas d'évaluation officiel LEONI (Feuilles Suivi 28J & Décision validation).
 */

import { JobFamily, UserRole } from './index';

export type CarreMagiquePhase = 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'REQUALIFICATION_90J';

export type CarreMagiqueNiveau = 'I' | 'L' | 'U' | 'CARRE_FERME';

export interface CarreMagiqueCriterion {
  id: string;
  numero: number | string; // 1..18, 20, 21..24, 26, 28, 29 ou 'R1'..'R7'
  phase: CarreMagiquePhase;
  niveau: CarreMagiqueNiveau;
  libelleFr: string;
  libelleAr: string;
  descriptionDetailleeFr: string;
  descriptionDetailleeAr: string;
  coefficient: number; // Ex: 0.03
  estBloquant: boolean; // Critères 15, 16, 17, 18, 20, 26, 29
  statut: 'OK' | 'NOK' | 'NON_EVALUE';
  observation?: string;
  dateValidation?: string; // ISO
  valideParMatricule?: string;
  valideParNom?: string;
  valideParRole?: UserRole;
}

export interface DefectTypeDefinition {
  code: string;
  numero: number;
  libelleFr: string;
  libelleAr: string;
  gravite: 'MINEUR' | 'MAJEUR' | 'CRITIQUE';
  descriptionFr: string;
  descriptionAr: string;
}

export interface DayDefectRecord {
  id: string;
  defectCode: string;
  typeNumero: number;
  typeLibelleFr: string;
  typeLibelleAr: string;
  quantite: number;
  remarque?: string;
}

export type PunctualityStatus = 'A_L_HEURE' | 'RETARD' | 'ABSENT';

export interface WorkstationDailyRecord {
  jourIndex: number; // 1..28
  date: string; // ISO YYYY-MM-DD
  ponctualite: PunctualityStatus;
  retardMinutes?: number;
  motifAbsence?: string;
  objectifQualiteAtteint: boolean; // Q (Oui/Non)
  objectifProductiviteAtteint: boolean; // P (Oui/Non)
  nombreDefauts: number;
  defauts: DayDefectRecord[];
  alertePokaYokeDeclenchee: boolean; // Si > seuil (défaut > 4 défauts/jour)
  pointeParMatricule?: string;
  pointeParNom?: string;
  horodatage?: string;
  commentaire?: string;
}

export type CarreMagiqueVisaRole =
  | 'FORMATEUR_TERRAIN'
  | 'SHIFT_LEADER'
  | 'RESPONSABLE_PRODUCTION'
  | 'QUALITE';

export interface CarreMagiqueVisa {
  role: CarreMagiqueVisaRole;
  titreFr: string;
  titreAr: string;
  ordre: number; // 1: Formateur, 2: Shift Leader, 3: RFM, 4: Qualité
  estObligatoire: boolean;
  estSigne: boolean;
  signeParMatricule?: string;
  signeParNom?: string;
  dateSignature?: string; // ISO
  codePersonnelSaisi?: string;
}

export type DecisionValidationType =
  | 'AUTONOME'
  | 'VALIDE_SUIVI_RENFORCE'
  | 'FORMATION_CIBLEE'
  | 'NON_VALIDE_PROLONGATION';

export interface DecisionValidationResult {
  scorePhase1: number; // 0..0.24
  scorePhase2: number; // 0..0.50
  scorePhase3: number; // 0..0.26
  scoreTotalPhases123: number; // 0..1.00 (somme exacte des sous-totaux)
  scoreTotalPourcent: number; // 0..100 %
  scoreRequalification: number; // 0..1.00
  scoreRequalificationPourcent: number;
  criteresBloquantsTotal: number; // 7 critères
  criteresBloquantsOK: number;
  criteresBloquantsNOK: Array<{
    numero: number | string;
    libelleFr: string;
    libelleAr: string;
    phase: CarreMagiquePhase;
  }>;
  tousBloquantsOK: boolean;
  decision: DecisionValidationType;
  decisionLabelFr: string;
  decisionLabelAr: string;
  explicationFr: string;
  explicationAr: string;
  niveauIValide: boolean; // Phase 1 (J1..4)
  niveauLValide: boolean; // Phase 2 (J5..10)
  niveauUValide: boolean; // Phase 3 (J11..28)
  niveauUAcquisParSerie: boolean; // 28 jours consécutifs Q & P
  serieQPConsecutive: number;
  estVerrouillePokaYoke: boolean;
  messageVerrouillageFr?: string;
  messageVerrouillageAr?: string;
  joursCompletes: number;
  joursRequis: number; // 28
}

export interface CarreMagiqueSheet {
  id: string;
  recrueId: string;
  matricule: string;
  nom: string;
  prenom: string;
  raisonSuivi: string; // Ex: 'Intégration nouvelle recrue (Parcours 33 jours)'
  equipe: string; // Ex: 'Équipe A (Matin)'
  posteId: string;
  posteCode: string;
  posteIntitule: string;
  famillePoste: JobFamily;
  dateDebutSuivi: string; // YYYY-MM-DD
  objectifQualite: string; // Ex: '100% Zéro défaut client, autocontrôle systématique'
  objectifProductivite: string; // Ex: 'Temps de cycle standard 120s (100% cadence)'
  suiviJours: WorkstationDailyRecord[];
  criteres: CarreMagiqueCriterion[];
  visas: Record<CarreMagiqueVisaRole, CarreMagiqueVisa>;
  derniereMiseAJour: string;
}

export interface ExcelBenchmarkTestCase {
  id: string;
  titreFr: string;
  titreAr: string;
  description: string;
  scoreAttendu: number; // ex: 1.00, 0.95, 0.75
  decisionAttendue: DecisionValidationType;
  bloquantsNOKAttendus: (number | string)[];
  statutTest: 'PASSE' | 'ECHOUE' | 'NON_EXECUTE';
  scoreCalcule?: number;
  decisionCalculee?: DecisionValidationType;
  bloquantsNOKCalcules?: (number | string)[];
  assertions: Array<{ nom: string; attendu: any; obtenu: any; reussi: boolean }>;
}
