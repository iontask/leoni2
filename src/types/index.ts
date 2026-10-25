/**
 * LEONI QualiTrack - Types & Contrats de données
 * Câblage automobile (Maroc)
 */

export type UserRole =
  | 'ADMINISTRATION'
  | 'FORMATEUR_ECOLE'
  | 'FORMATEUR_TERRAIN'
  | 'AQL'
  | 'SHIFT_LEADER'
  | 'RESPONSABLE_PRODUCTION' // RFM
  | 'QUALITE'
  | 'REFERENT_LEARNING'
  | 'DRH_DIRECTION'
  | 'ADMIN';

export type RecruitStatus =
  | 'EN_ECOLE'
  | 'EN_APPRENTISSAGE_POSTE'
  | 'QUALIFIE_AUTONOME'
  | 'NON_QUALIFIE_PROLONGATION';

export type StationTypology =
  | 'PLANCHE_ASSEMBLAGE'
  | 'TOUFIX_CLIPSAGE'
  | 'TEST_ELECTRIQUE_TNC'
  | 'ENCLIQUETAGE_CONNECTEUR'
  | 'BANDAGE_RUBANAGE'
  | 'SERTISSAGE_MANUEL';

export interface Site {
  id: string;
  code: string;
  nom: string;
  ville: string;
  pays: string;
  estPilote: boolean;
}

export interface UserProfile {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  role: UserRole;
  siteId: string;
  email: string;
  telephone?: string;
}

export interface SchoolGroup {
  id: string;
  code: string; // Ex: GRP-2026-A
  siteId: string;
  formateurId: string;
  dateDebut: string; // ISO YYYY-MM-DD
  dateFinPrevue: string; // ISO
  statut: 'EN_COURS' | 'CLOTURE' | 'A_VENIR';
  dureeJoursEcole?: number; // Paramétrable (défaut 5, ex: 3j école + 2j terrain)
}

export type AttendanceStatus = 'PRESENT' | 'RETARD' | 'ABSENT' | 'ABANDON';

export interface SchoolAttendanceRecord {
  recrueId: string;
  jourIndex: number; // 1..5
  statut: AttendanceStatus;
  retardMinutes?: number;
  motifAbsence?: string;
  horodatage: string;
  pointeParMatricule: string;
}

export type TrainingTheme = 'SECURITE_5S' | 'CABLERIE_BASE' | 'CONNECTIQUE' | 'QUALITE_DEFAUT' | 'GESTE_POSTE';

export interface TrainingContent {
  id: string;
  code: string;
  titreFr: string;
  titreAr: string;
  theme: TrainingTheme;
  typeSupport: 'PDF' | 'IMAGE' | 'VIDEO';
  jourEcoleRattache: number; // 1..5
  dureeEstimeeMinutes: number;
  urlSupport: string;
  descriptionFr?: string;
  descriptionAr?: string;
  consulteParRecrues: string[]; // liste des recrueId ayant consulté
}

export type QuestionType =
  | 'QCM_UNIQUE'
  | 'QCM_MULTIPLE'
  | 'REMISE_EN_ORDRE'
  | 'ETIQUETAGE_IMAGE'
  | 'REPONSE_COURTE'
  | 'GRILLE_PRATIQUE_OK_NOK';

export type QuestionTheme =
  | 'THEORIE_CABLERIE'
  | 'GESTE_QUALITE'
  | 'TEST_LOGIQUE_PRESELECTION'
  | 'SECURITE_5S';

export interface Question {
  id: string;
  theme: QuestionTheme;
  type: QuestionType;
  intituleFr: string;
  intituleAr: string;
  optionsFr?: string[];
  optionsAr?: string[];
  bonneReponseIndex?: number | number[]; // index ou liste d'indices
  reponseTexteAttendue?: string;
  itemsOrdonnes?: string[];
  points: number;
  imageIllustrationUrl?: string;
  explicationFr?: string;
  explicationAr?: string;
}

export interface TestSection {
  id: string;
  titreFr: string;
  titreAr: string;
  dureeMinutes: number;
  questionIds: string[];
  seuilObligatoirePourcent?: number;
}

export interface SchoolTest {
  id: string;
  titreFr: string;
  titreAr: string;
  theme: QuestionTheme;
  sections: TestSection[];
  dureeGlobaleMinutes: number;
  notePassageSur20: number; // ex: 14/20
  seuilEliminatoirePourcent: number; // ex: 60%
  maxTentatives: number;
  tirageAleatoire: boolean; // défaut false
  langue: 'fr' | 'ar' | 'both';
}

export interface TestAttempt {
  id: string;
  testId: string;
  recrueId: string;
  datePassage: string; // ISO
  mode: 'TABLETTE' | 'VERSION_PAPIER' | 'SAISIE_RAPIDE_FORMATEUR';
  reponses: Record<string, any>;
  scoreTotalObtenu: number;
  totalPointsPossibles: number;
  noteSur20: number;
  estReussi: boolean;
  dureeSecondes?: number;
  evalueParMatricule?: string;
  correctionsManuelles?: Record<string, { note: number; commentaire: string }>;
}

export type SchoolFinalDecision = 'ADMIS' | 'A_REVOIR' | 'NON_ADMIS';

// --- Étape 4 : Typologie & Affectation aux Postes ---

export type WorkstationNature = 'INITIAL' | 'CRITIQUE';

export type JobFamily =
  | 'ASSEMBLAGE'
  | 'PREPARATION'
  | 'CONTROLE_ELECTRIQUE'
  | 'FINITION'
  | 'CONDITIONNEMENT';

export interface WorkstationPrerequisites {
  assiduiteMinJours: number; // ex: 5 (100%)
  noteEcoleMin: number; // ex: 16/20
  diplomeExige: boolean;
  testGesteReussiExige: boolean;
  specialitesCompatibles?: string[];
}

export interface Workstation {
  id: string;
  code: string; // Ex: 'PST-INS-01', 'PST-AGRF-01'
  intituleFr: string;
  intituleAr: string;
  familleMetier: JobFamily;
  typologie: WorkstationNature;
  stationTypologyRef?: StationTypology;
  siteId: string;
  segment: string;
  ligne: string;
  aptitudesRequisesFr: string[];
  aptitudesRequisesAr: string[];
  formateurReferentMatricule: string;
  formateurReferentNom: string;
  prerequis: WorkstationPrerequisites;
  descriptionFr?: string;
  descriptionAr?: string;
}

export interface ProductionNeed {
  id: string;
  siteId: string;
  workstationId: string;
  workstationCode: string;
  workstationIntituleFr: string;
  workstationIntituleAr: string;
  typologie: WorkstationNature;
  segment: string;
  ligne: string;
  quantiteDemandee: number;
  quantitePourvue: number;
  dateCible: string; // ISO YYYY-MM-DD
  priorite: 'NORMALE' | 'URGENTE' | 'CRITIQUE';
  statut: 'OUVERT' | 'PARTIEL' | 'POURVU' | 'CLOTURE';
}

export interface AssignmentSuggestion {
  workstationId: string;
  workstation: Workstation;
  scoreCompatibilite: number; // 0..100%
  recommande: boolean;
  raisonsCompatibiliteFr: string[];
  raisonsCompatibiliteAr: string[];
  prerequisConformes: boolean;
  pointsBloquantsFr?: string[];
  pointsBloquantsAr?: string[];
  besoinOuvert?: ProductionNeed;
}

export interface AssignmentRejectionRecord {
  id: string;
  recrueId: string;
  recrueNom: string;
  workstationId: string;
  workstationIntitule: string;
  dateRefus: string; // ISO
  refuseParMatricule: string;
  refuseParNom: string;
  motifRefus: string;
}

export interface GestureEvaluationCriterion {
  id: string;
  code: string;
  libelleFr: string;
  libelleAr: string;
  descriptionAttenduFr: string;
  descriptionAttenduAr: string;
  estCritique: boolean; // si NOK -> geste refusé
  statutFormateur?: 'OK' | 'NOK' | 'NON_EVALUE';
  suggestionIA?: 'OK' | 'NOK';
  observationIA?: string;
  observationFormateur?: string;
  confianceIA?: number; // 0..100
}

export interface GestureEvaluationReport {
  id: string;
  recrueId: string;
  workstationId: string;
  dateEvaluation: string;
  formateurMatricule: string;
  formateurNom: string;
  photoGesteUrl?: string;
  nomFichierMedia?: string;
  criteres: GestureEvaluationCriterion[];
  noteSur20: number;
  resultatFinal: 'VALIDE' | 'A_REVOIR' | 'ECHEC';
  suggestionIAValideeParFormateur: boolean;
  commentaireGlobalFormateur?: string;
  horodatageIA?: string;
  modeleIAUtilise?: string;
}

export interface DocumentRequirement {
  id: string;
  siteId: string;
  code: string; // Ex: 'DOC_CNI', 'DOC_CASIER', 'DOC_DIPLOME', 'DOC_ADRESSE', 'DOC_TRANSPORT', 'DOC_REGLEMENT'
  libelleFr: string;
  libelleAr: string;
  estObligatoire: boolean;
  ordre: number;
  descriptionFr?: string;
  descriptionAr?: string;
}

export interface RecruitDocument {
  id: string;
  codeRequirement: string;
  nomFichier: string;
  typeMime: string; // 'application/pdf' | 'image/jpeg' | 'image/png'
  tailleKo: number;
  dateDepot: string; // ISO
  deposeParMatricule: string;
  apercuUrl?: string;
  valide?: boolean;
  estSimule?: boolean;
  confianceScore?: number;
}

export interface OCRScanResult {
  cinExtraite: string;
  nomExtrait: string;
  prenomExtrait: string;
  dateNaissanceExtraite: string;
  dateExpirationExtraite?: string;
  adresseExtraite?: string;
  confianceScore: number; // 0..100
  sourceDocument: 'CNI' | 'DIPLOME' | 'CASIER' | 'MEDICAL' | 'AUTRE';
  estSimule: boolean; // false = API réelle OCR.space, true = simulation
  rawText?: string;
  apiProvider?: 'ocr.space' | 'simulation';
  nomFichier?: string;
  apercuUrl?: string;
}

export type OCRSimulationResult = OCRScanResult;

export interface Recruit {
  id: string;
  cin: string; // Clé pivot
  matricule?: string; // Optionnel : une recrue peut exister sans matricule avant attribution SAP
  statutLiaisonSAP?: 'NON_TRANSMIS' | 'TRANSMIS_EN_ATTENTE_MATRICULE' | 'RECONCILIE';
  dateLiaisonSAP?: string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO YYYY-MM-DD
  telephone: string;
  siteId: string;
  dateEntree: string; // ISO YYYY-MM-DD
  statut: RecruitStatus;
  
  // Checklist administrative
  documents?: Record<string, RecruitDocument>; // Clé = codeRequirement
  dossierComplet?: boolean;
  tauxCompletudeDossier?: number; // %
  
  // Parcours École (5 jours) & Affectation prévisionnelle
  groupeEcoleId?: string;
  segmentPrevisionnel?: string;
  ecoleJoursValides: number; // 0 à 5
  ecoleScoreTheorie?: number; // /20
  ecoleScorePratique?: number; // /20
  ecoleValidee: boolean;
  dateValidationEcole?: string;
  
  // Affectation & Tests (Étape 4)
  workstationId?: string;
  workstationNature?: WorkstationNature;
  typologiePoste?: StationTypology;
  ligneAffectation?: string;
  segmentAffectation?: string;
  shiftLeaderId?: string;
  formateurTerrainId?: string;
  formateurProductionReferent?: string;
  testPratiqueScore?: number; // /20 ou /100
  testPratiqueValide: boolean;
  testPratiqueAssisteeIA?: boolean;
  dateAffectation?: string;
  historiqueRefusAffectation?: AssignmentRejectionRecord[];
  traceAffectation?: {
    suggereParSysteme: boolean;
    scoreSuggestion?: number;
    justificationSuggestion?: string;
    decisionPriseParMatricule: string;
    decisionPriseParNom: string;
    dateDecision: string;
    estDerogation: boolean;
    motifDerogation?: string;
  };

  // Suivi Poste (28 jours - Carré Magique)
  joursSuiviCompletes: number; // 0 à 28
  carreMagiquePointsConformes: number; // /16
  tauxRespectAQL?: number; // %
  derniereEvaluationPoste?: string;
  
  // Qualification
  qualifiee: boolean;
  dateQualification?: string;
  visaQualite: boolean;
  visaQualitePar?: string;
  visaQualiteDate?: string;
  visaProduction: boolean;
  visaProductionPar?: string;
  visaProductionDate?: string;
  
  // Prolongation éventuelle
  estEnProlongation?: boolean;
  joursProlongationAccordee?: number;
  motifProlongation?: string;

  // Repérage multisite & Matching
  siteOriginePrecedent?: string;
  aHistoriqueAutreSite?: boolean;
  matriculeOriginePrecedent?: string;
  rapprochementValideParUtilisateur?: boolean;
  dateRapprochement?: string;
  remarques?: string;

  // Étape 8 : Archivage (Soft Delete - Aucune suppression définitive)
  estArchive?: boolean;
  dateArchivage?: string;
  motifArchivage?: string;
  archiveParNom?: string;
  archiveParMatricule?: string;
}

export interface SystemParameter {
  id: string;
  cle: string;
  valeur: number | string | boolean;
  unite?: string;
  description: string;
  version: number;
  dateModification: string; // ISO
  modifieParMatricule: string;
  modifieParNom: string;
  motifModification: string;
}

export interface AuditLog {
  id: string;
  dateAction: string; // ISO
  auteurMatricule: string;
  auteurNom: string;
  auteurRole: UserRole;
  siteId: string;
  action: string;
  entite: string;
  entiteId: string;
  details: string;
  estDerogation: boolean;
  motifDerogation?: string;
}

export interface PokaYokeRuleResult {
  autorise: boolean;
  messageBlocage?: string;
  messageBlocageAr?: string;
  derogationPossible: boolean;
  rolesHabilitesDerogation: UserRole[];
}

export interface DatabaseSnapshot {
  version: string;
  timestamp: string;
  auteurNom: string;
  auteurMatricule: string;
  checksumSha256: string;
  counts: {
    recruits: number;
    auditLogs: number;
    parameters: number;
    groups: number;
    carreMagiqueSheets: number;
  };
  payloadJson: string;
}

export interface MatchingResult {
  doublonLocal: boolean;
  recrueLocaleExistante?: Recruit;
  antécédentAutreSite: boolean;
  recrueAutreSite?: Recruit;
  siteAutreNom?: string;
  regleRapprochementRecommandee: 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE' | 'REPRISE_MATRICULE_EXISTANT';
}

export interface SAPExportRow {
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  siteCode: string;
  dateEntree: string;
  segmentPrevisionnel: string;
}

export interface SAPImportRow {
  cin: string;
  matriculeAttribue: string;
  statutSAP: 'VALIDE' | 'REJETE';
  remarque?: string;
}

export interface ISAPStagingArea {
  stagedBatchesCount: number;
  lastSyncTimestamp?: string;
}

export type Language = 'fr' | 'ar';

export * from './carreMagique';
export * from './qualification';
export * from './metrics';
export * from './benchmark';
