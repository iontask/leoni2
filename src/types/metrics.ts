/**
 * LEONI QualiTrack - Types pour l'Étape 7 : Indicateurs et Tableaux de Bord
 * Moteur de calculs unique et tableaux de bord par profil
 */

import { Recruit, RecruitStatus, StationTypology, UserRole } from './index';
import { CarreMagiqueSheet, DayDefectRecord } from './carreMagique';

export type IntegrationStep = 'ECOLE_FORMATION' | 'AFFECTATION_LIGNE' | 'SUIVI_POSTE_28J';

export type DepartureMotive =
  | 'Raisons personnelles et familiales'
  | 'Inadaptation au travail posté (2x8 / 3x8)'
  | 'Reconversion professionnelle'
  | 'Autre opportunité industrielle'
  | 'Abandon de poste sans préavis'
  | 'Inaptitude médicale constatée';

export interface DepartureRecord {
  id: string;
  recrueId: string;
  cin: string;
  nom: string;
  prenom: string;
  matricule?: string;
  siteId: string;
  groupeEcoleId?: string;
  groupeCode?: string;
  etapeDepart: IntegrationStep;
  motifDepart: DepartureMotive;
  dateDepart: string; // ISO YYYY-MM-DD
  joursPassesDansEtape: number;
  commentaire?: string;
}

export interface OperatorSatisfactionSurvey {
  id: string;
  recrueId: string;
  nom: string;
  prenom: string;
  cin: string;
  siteId: string;
  etape: 'FIN_ECOLE' | 'FIN_SUIVI_POSTE';
  dateEnquete: string; // ISO YYYY-MM-DD
  clarteFormationSur5: number; // 1..5
  accompagnementFormateurSur5: number; // 1..5
  accueilEquipePosteSur5: number; // 1..5
  confianceAutonomieSur5: number; // 1..5
  scoreGlobalSur5: number; // Moyenne des notes
  recommandeLeoniNPS: number; // 0..10
  commentaire?: string;
}

export interface DefectMetricItem {
  code: string;
  typeLibelleFr: string;
  totalDefauts: number;
  pourcentage: number;
  parPoste: Record<string, number>;
  parSegment: Record<string, number>;
}

export interface OperatorDefectSummary {
  recrueId: string;
  nom: string;
  prenom: string;
  cin: string;
  matricule: string;
  workstationCode: string;
  segment: string;
  totalDefauts: number;
  defautsParJourMoyen: number;
  alertePokaYokeDeclenchee: boolean; // Si > seuil (ex: > 4 défauts/jour)
  maxDefautsEnUnJour: number;
  typesDefautsRecurrents: string[];
}

export interface ValidationsByDayAndGroup {
  date: string;
  groupeCode: string;
  validations5J: number;
  validations28J: number;
  recruesIds: string[];
}

export interface AssignmentsByDayAndSegment {
  date: string;
  segment: string;
  nombreAffectations: number;
  recruesIds: string[];
}

export interface RemainingIn28DaysBreakdown {
  totalRestants: number;
  tranche1a7Jours: number; // Niveau I
  tranche8a16Jours: number; // Niveau L
  tranche17a28Jours: number; // Niveau U
  recruesTranche1: Recruit[];
  recruesTranche2: Recruit[];
  recruesTranche3: Recruit[];
}

export interface ConsolidatedDashboardData {
  // 1. Personnes en formation à l'instant
  enFormationALInstant: {
    total: number;
    enEcole: number;
    enPoste: number;
    enProlongation: number;
    recruesList: Recruit[];
  };

  // 2. Validations 5J et 28J
  validations5JoursTotal: number;
  validations28JoursTotal: number;
  validationsParJourEtGroupe: ValidationsByDayAndGroup[];
  recruesValidees5J: Recruit[];
  recruesValidees28J: Recruit[];

  // 3. Désistements et départs
  departsTotal: number;
  departsParGroupe: Record<string, number>;
  departsParEtape: Record<IntegrationStep, number>;
  departsParMotif: Record<string, number>;
  departsListe: DepartureRecord[];

  // 4. Affectations par jour et par segment
  affectationsTotal: number;
  affectationsParJourEtSegment: AssignmentsByDayAndSegment[];
  affectationsParSegment: Record<string, number>;

  // 5. Personnes restantes dans les 28 jours
  personnesRestantes28J: RemainingIn28DaysBreakdown;

  // 6. Défauts récurrents
  defautsRecurrents: DefectMetricItem[];
  totalDefautsObserves: number;

  // 7. Défauts par opérateur
  defautsParOperateur: OperatorDefectSummary[];
  operateursAvecAlertePokaYoke: OperatorDefectSummary[];

  // 8. Taux de présence, tests et satisfaction
  tauxPresenceGlobalPourcent: number;
  moyenneNoteTheorieSur20: number;
  moyenneNotePratiqueSur20: number;
  moyenneScoreCarreMagiquePourcent: number;
  satisfactionGlobaleSur5: number;
  satisfactionGlobalePourcent: number;
  recommandationNPSMoyen: number;
  enquetesSatisfaction: OperatorSatisfactionSurvey[];
}

export type MetricsDashboardView = 'FORMATEUR' | 'PRODUCTION' | 'DIRECTION';

export interface DrilldownTarget {
  titre: string;
  description?: string;
  recrues: Recruit[];
  valeurAffichee?: string | number;
}
