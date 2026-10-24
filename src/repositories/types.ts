/**
 * LEONI QualiTrack - Interfaces des Repositories
 * Permet l'interchangeabilité de la base de données (In-Memory, LocalStorage, Cloud SQL, Firestore, API LEONI).
 */

import { AuditLog, Recruit, RecruitStatus, SchoolGroup, Site, SystemParameter, UserProfile } from '../types';

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  siteId?: string;
  statut?: RecruitStatus;
  groupeId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IRecruitRepository {
  getAllRecruits(params: PaginationParams): Promise<PaginatedResult<Recruit>>;
  getRecruitById(id: string): Promise<Recruit | null>;
  getByCin(cin: string): Promise<Recruit | null>;
  checkHistoryOtherSites(cin: string, currentSiteId: string): Promise<{ hasHistory: boolean; otherSiteName?: string }>;
  checkMatchingCandidate(cin: string, currentSiteId: string): Promise<import('../types').MatchingResult>;
  createRecruit(recruit: Omit<Recruit, 'id'>, author: UserProfile): Promise<Recruit>;
  updateRecruit(id: string, updates: Partial<Recruit>, author: UserProfile, reason?: string, isDerogation?: boolean): Promise<Recruit>;
  attachDocumentToRecruit(recruitId: string, doc: import('../types').RecruitDocument, author: UserProfile): Promise<Recruit>;
  reconcileRecruitWithSAP(cin: string, matriculeAttribue: string, author: UserProfile): Promise<Recruit>;
  massImport(recruitsData: Array<Omit<Recruit, 'id'>>, author: UserProfile): Promise<{ importedCount: number; errors: Array<{ ligne: number; cin: string; erreur: string }> }>;
  archiveRecruit(id: string, motif: string, author: UserProfile): Promise<Recruit>;
  restoreRecruit(id: string, motif: string, author: UserProfile): Promise<Recruit>;
}

export interface IDocumentRequirementRepository {
  getDocumentRequirements(siteId: string): Promise<import('../types').DocumentRequirement[]>;
  updateDocumentRequirement(id: string, updates: Partial<import('../types').DocumentRequirement>, author: UserProfile): Promise<import('../types').DocumentRequirement>;
}

export interface ISiteRepository {
  getAllSites(): Promise<Site[]>;
  getSiteById(id: string): Promise<Site | null>;
}

export interface IUserRepository {
  getAllUsers(): Promise<UserProfile[]>;
  getUserById(id: string): Promise<UserProfile | null>;
  getTrainers(siteId?: string): Promise<{ ecole: UserProfile[]; terrain: UserProfile[] }>;
}

export interface ISchoolGroupRepository {
  getAllGroups(siteId?: string): Promise<SchoolGroup[]>;
  getGroupById(id: string): Promise<SchoolGroup | null>;
}

export interface ISettingsRepository {
  getAllParameters(): Promise<SystemParameter[]>;
  getParameterByKey(cle: string): Promise<SystemParameter | null>;
  updateParameter(cle: string, valeur: number | string | boolean, author: UserProfile, motif: string): Promise<SystemParameter>;
}

export interface ISchoolRepository {
  getAttendance(groupId: string, jourIndex?: number): Promise<import('../types').SchoolAttendanceRecord[]>;
  recordAttendance(records: import('../types').SchoolAttendanceRecord[], author: UserProfile): Promise<void>;
  markAllPresent(groupId: string, jourIndex: number, author: UserProfile): Promise<number>;
  getTrainingContents(jour?: number, theme?: import('../types').TrainingTheme): Promise<import('../types').TrainingContent[]>;
  markContentConsulted(contentId: string, recruitId: string): Promise<void>;
  getAllQuestions(theme?: import('../types').QuestionTheme): Promise<import('../types').Question[]>;
  createQuestion(question: Omit<import('../types').Question, 'id'>, author: UserProfile): Promise<import('../types').Question>;
  getAllTests(): Promise<import('../types').SchoolTest[]>;
  createTest(test: Omit<import('../types').SchoolTest, 'id'>, author: UserProfile): Promise<import('../types').SchoolTest>;
  getTestAttempts(recrueId?: string, testId?: string): Promise<import('../types').TestAttempt[]>;
  submitTestAttempt(attempt: Omit<import('../types').TestAttempt, 'id' | 'datePassage'>, author?: UserProfile): Promise<import('../types').TestAttempt>;
  finalizeSchoolDecision(
    recrueId: string,
    decision: import('../types').SchoolFinalDecision,
    noteTheorie: number,
    notePratique: number,
    author: UserProfile,
    observations?: string
  ): Promise<Recruit>;
}

export interface IAssignmentRepository {
  getAllWorkstations(siteId?: string, nature?: import('../types').WorkstationNature): Promise<import('../types').Workstation[]>;
  getWorkstationById(id: string): Promise<import('../types').Workstation | null>;
  createWorkstation(ws: Omit<import('../types').Workstation, 'id'>, author: UserProfile): Promise<import('../types').Workstation>;
  updateWorkstation(id: string, updates: Partial<import('../types').Workstation>, author: UserProfile): Promise<import('../types').Workstation>;
  getAllProductionNeeds(siteId?: string): Promise<import('../types').ProductionNeed[]>;
  createProductionNeed(need: Omit<import('../types').ProductionNeed, 'id' | 'quantitePourvue' | 'statut'>, author: UserProfile): Promise<import('../types').ProductionNeed>;
  updateProductionNeed(id: string, updates: Partial<import('../types').ProductionNeed>, author: UserProfile): Promise<import('../types').ProductionNeed>;
  calculateAssignmentSuggestions(recruitId: string): Promise<import('../types').AssignmentSuggestion[]>;
  assignRecruitToWorkstation(
    recruitId: string,
    workstationId: string,
    author: UserProfile,
    options?: {
      estDerogation?: boolean;
      motifDerogation?: string;
      scoreSuggestion?: number;
      justificationSuggestion?: string;
      testPratiqueScore?: number;
      testPratiqueValide?: boolean;
    }
  ): Promise<Recruit>;
  recordAssignmentRejection(
    recruitId: string,
    workstationId: string,
    motif: string,
    author: UserProfile
  ): Promise<import('../types').AssignmentRejectionRecord>;
  getRejectionsByRecruit(recruitId: string): Promise<import('../types').AssignmentRejectionRecord[]>;
  saveGestureEvaluation(
    report: Omit<import('../types').GestureEvaluationReport, 'id'>,
    author: UserProfile
  ): Promise<import('../types').GestureEvaluationReport>;
  getGestureEvaluations(recruitId?: string): Promise<import('../types').GestureEvaluationReport[]>;
}

export interface IAuditRepository {
  getAllAuditLogs(params?: { siteId?: string; entite?: string; limit?: number }): Promise<AuditLog[]>;
  log(entry: Omit<AuditLog, 'id' | 'dateAction'>): Promise<AuditLog>;
  logSensitiveDataConsultation(recruitId: string, docCode: string, author: UserProfile): Promise<AuditLog>;
  createDatabaseSnapshot(author: UserProfile): Promise<import('../types').DatabaseSnapshot>;
  restoreDatabaseSnapshot(snapshot: import('../types').DatabaseSnapshot, author: UserProfile): Promise<{ success: boolean; message: string }>;
  run20kBenchmark(): Promise<import('../types/benchmark').BenchmarkReport>;
}

export interface ICarreMagiqueRepository {
  getCarreMagiqueSheet(recruitId: string): Promise<import('../types').CarreMagiqueSheet>;
  saveCarreMagiqueSheet(sheet: import('../types').CarreMagiqueSheet, author: UserProfile): Promise<import('../types').CarreMagiqueSheet>;
  updateDailyTrackingRow(
    recruitId: string,
    row: import('../types').WorkstationDailyRecord,
    author: UserProfile
  ): Promise<import('../types').CarreMagiqueSheet>;
  updateCriterionStatus(
    recruitId: string,
    criterionId: string,
    statut: 'OK' | 'NOK' | 'NON_EVALUE',
    author: UserProfile,
    observation?: string
  ): Promise<import('../types').CarreMagiqueSheet>;
  signVisa(
    recruitId: string,
    role: import('../types').CarreMagiqueVisaRole,
    codePersonnel: string,
    author: UserProfile
  ): Promise<import('../types').CarreMagiqueSheet>;
}

export interface IQualificationRepository {
  getQualificationDecision(recruitId: string): Promise<import('../types').QualificationDecisionRecord | null>;
  saveQualificationDecision(
    decision: import('../types').QualificationDecisionRecord,
    author: UserProfile
  ): Promise<import('../types').QualificationDecisionRecord>;
  getRequalification90J(recruitId: string): Promise<import('../types').Requalification90JRecord>;
  saveRequalification90J(
    record: import('../types').Requalification90JRecord,
    author: UserProfile
  ): Promise<import('../types').Requalification90JRecord>;
  getAllRequalifications90J(): Promise<import('../types').Requalification90JRecord[]>;
  getValidationRightsMatrix(): Promise<import('../types').ValidationRightsMatrix>;
  updateValidationRightsMatrix(
    matrix: import('../types').ValidationRightsMatrix,
    author: UserProfile
  ): Promise<import('../types').ValidationRightsMatrix>;
  getAuditEvidenceBundle(recruitId: string): Promise<import('../types').AuditEvidenceBundle>;
}

export interface IMetricsRepository {
  getAllDepartures(siteId?: string): Promise<import('../types/metrics').DepartureRecord[]>;
  recordDeparture(
    departure: Omit<import('../types/metrics').DepartureRecord, 'id'>,
    author: UserProfile
  ): Promise<import('../types/metrics').DepartureRecord>;
  getAllSatisfactionSurveys(siteId?: string): Promise<import('../types/metrics').OperatorSatisfactionSurvey[]>;
  submitSatisfactionSurvey(
    survey: Omit<import('../types/metrics').OperatorSatisfactionSurvey, 'id'>
  ): Promise<import('../types/metrics').OperatorSatisfactionSurvey>;
}

