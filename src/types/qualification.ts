/**
 * LEONI QualiTrack - Types & Contrats de données pour la Validation de la Qualification
 * Étape 5 Métier :
 * - Fiche de décision de qualification par recrue (4 résultats possibles)
 * - Droits de validation paramétrables par rôle et typologie de poste
 * - Coffre-fort des preuves d'audit (< 2 minutes pour un auditeur)
 * - Prolongation avec nouvelle date de fin
 * - Requalification à 90 jours (Carré fermé, rappels)
 * - Passeport de qualification complet exportable en PDF
 */

import { DecisionValidationType, CarreMagiqueVisaRole } from './carreMagique';
import { JobFamily, Recruit, RecruitStatus, StationTypology, UserProfile, UserRole, WorkstationNature } from './index';

export interface QualificationDecisionRecord {
  id: string;
  recrueId: string;
  matricule: string;
  nom: string;
  prenom: string;
  siteId: string;
  workstationId: string;
  workstationCode: string;
  workstationIntitule: string;
  typologiePoste: WorkstationNature; // INITIAL ou CRITIQUE
  
  // Résultat de la décision
  decision: DecisionValidationType;
  scoreTotalPourcent: number; // 0..100%
  scoreTotalSur1: number; // 0..1.00
  criteresBloquantsConformes: boolean;
  criteresBloquantsNOK: Array<{ numero: number | string; libelleFr: string }>;
  
  // Contrôle Poka-Yoke des prérequis opérationnels (Formateur, AQL, Shift Leader)
  prerequisFormateurTerrainOk: boolean;
  prerequisAqlOk: boolean;
  prerequisShiftLeaderOk: boolean;
  
  // Date et Validateur habilité
  dateDecision: string; // ISO
  validateurMatricule: string;
  validateurNom: string;
  validateurRole: UserRole;
  
  // Double visa
  visaQualiteSigne: boolean;
  visaQualitePar?: string;
  visaQualiteDate?: string;
  visaProductionSigne: boolean;
  visaProductionPar?: string;
  visaProductionDate?: string;
  
  // Dérogation éventuelle
  estDerogation: boolean;
  motifDerogation?: string;
  dureeDerogationJours?: number;
  derogationExpireLe?: string;
  
  // Prolongation éventuelle
  estEnProlongation: boolean;
  joursProlongationAccordee?: number;
  nouvelleDateFinPrevue?: string;
  motifProlongation?: string;
  
  // Requalification 90J planifiée
  requalification90JPlanifiee: boolean;
  dateCibleRequalification90J?: string;
  statutRequalification90J?: 'NON_APPLICABLE' | 'PLANIFIEE' | 'EN_COURS' | 'REUSSIE' | 'RETROGRADEE';
  
  commentaires?: string;
}

export interface ValidationRightsRule {
  workstationNature: WorkstationNature;
  rolesHabilitesDecisionFinale: UserRole[];
  rolesHabilitesVisaQualite: UserRole[];
  rolesHabilitesVisaProduction: UserRole[];
  rolesHabilitesDerogation: UserRole[];
  exigerControleFormateur: boolean;
  exigerControleAQL: boolean;
  exigerControleShiftLeader: boolean;
  dureeMaximaleDerogationJours: number;
}

export interface ValidationRightsMatrix {
  initial: ValidationRightsRule;
  critique: ValidationRightsRule;
  derniereMiseAJour: string;
  modifieParNom: string;
}

export interface Requalification90JRecord {
  id: string;
  recrueId: string;
  matricule: string;
  nom: string;
  prenom: string;
  workstationCode: string;
  workstationIntitule: string;
  dateDebut90J: string; // Date de qualification initiale
  dateEcheance90J: string; // Date cible (J+90)
  joursRestants: number;
  statut: 'A_VENIR' | 'RAPPEL_15J' | 'A_EVALUER' | 'VALIDE' | 'RETROGRADE';
  scoreRequalification: number; // /1.00
  criteresR1aR7Statuts: Record<string, 'OK' | 'NOK' | 'NON_EVALUE'>;
  decisionRequalification?: 'MAINTIEN_AUTONOME' | 'RETROGRADATION_NIVEAU_L' | 'PROLONGATION_TUTORAT';
  evalueParMatricule?: string;
  evalueParNom?: string;
  dateEvaluation?: string;
  observations?: string;
}

export interface AuditEvidenceBundle {
  recrue: Recruit;
  ficheDecision?: QualificationDecisionRecord;
  ficheCarreMagique?: import('./carreMagique').CarreMagiqueSheet;
  evaluationCarreMagique?: import('./carreMagique').DecisionValidationResult;
  rapportGesteIA?: import('./index').GestureEvaluationReport;
  documentsDossier: Array<{
    code: string;
    libelleFr: string;
    depose: boolean;
    nomFichier?: string;
    tailleKo?: number;
    dateDepot?: string;
  }>;
  parcoursEcole: {
    joursValides: number;
    dureeRequise: number;
    noteTheorie?: number;
    notePratique?: number;
    validee: boolean;
    dateValidation?: string;
  };
  historiqueVisas: Array<{
    titre: string;
    role: string;
    signataire: string;
    horodatage: string;
    codePersonnel: string;
  }>;
  journalAuditAssocie: import('./index').AuditLog[];
  indiceCompletudePreuves: number; // 0..100%
  tempsRechercheEstimeSecondes: number; // < 120s pour audit
}
