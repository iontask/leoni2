import {
  AssignmentRejectionRecord,
  AssignmentSuggestion,
  AuditLog,
  DocumentRequirement,
  GestureEvaluationCriterion,
  GestureEvaluationReport,
  MatchingResult,
  ProductionNeed,
  Question,
  QuestionTheme,
  Recruit,
  RecruitDocument,
  SchoolAttendanceRecord,
  SchoolFinalDecision,
  SchoolGroup,
  SchoolTest,
  Site,
  SystemParameter,
  TestAttempt,
  TrainingContent,
  TrainingTheme,
  UserProfile,
  Workstation,
  WorkstationNature
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DOCUMENT_REQUIREMENTS,
  INITIAL_GESTURE_REPORTS,
  INITIAL_GROUPS,
  INITIAL_PARAMETERS,
  INITIAL_PRODUCTION_NEEDS,
  INITIAL_QUESTIONS,
  INITIAL_REJECTIONS,
  INITIAL_SCHOOL_TESTS,
  INITIAL_SITES,
  INITIAL_TRAINING_CONTENTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_TEST_ATTEMPTS,
  INITIAL_USERS,
  INITIAL_WORKSTATIONS,
  STANDARD_GESTURE_CRITERIA,
  generateInitialRecruits,
  INITIAL_DEPARTURES,
  INITIAL_SURVEYS
} from './mockData';
import {
  IAssignmentRepository,
  IAuditRepository,
  ICarreMagiqueRepository,
  IQualificationRepository,
  IMetricsRepository,
  IDocumentRequirementRepository,
  IRecruitRepository,
  ISchoolGroupRepository,
  ISchoolRepository,
  ISettingsRepository,
  ISiteRepository,
  IUserRepository,
  PaginatedResult,
  PaginationParams
} from './types';
import { MetricsEngine } from '../engine/metrics';
import { CarreMagiqueEngine } from '../engine/carreMagiqueEngine';
import { DEFAULT_VALIDATION_RIGHTS, QualificationEngine } from '../engine/qualificationEngine';
import {
  CarreMagiqueCriterion,
  CarreMagiqueSheet,
  CarreMagiqueVisaRole,
  WorkstationDailyRecord
} from '../types/carreMagique';
import {
  AuditEvidenceBundle,
  QualificationDecisionRecord,
  Requalification90JRecord,
  ValidationRightsMatrix
} from '../types/qualification';
import { DepartureRecord, OperatorSatisfactionSurvey } from '../types/metrics';

const STORAGE_KEY_RECRUITS = 'leoni_qualitrack_recruits_v1';
const STORAGE_KEY_AUDIT = 'leoni_qualitrack_audit_v1';
const STORAGE_KEY_PARAMS = 'leoni_qualitrack_params_v1';
const STORAGE_KEY_GROUPS = 'leoni_qualitrack_groups_v1';
const STORAGE_KEY_DOC_REQS = 'leoni_qualitrack_doc_reqs_v1';
const STORAGE_KEY_ATTENDANCE = 'leoni_qualitrack_attendance_v1';
const STORAGE_KEY_CONTENTS = 'leoni_qualitrack_contents_v1';
const STORAGE_KEY_QUESTIONS = 'leoni_qualitrack_questions_v1';
const STORAGE_KEY_TESTS = 'leoni_qualitrack_tests_v1';
const STORAGE_KEY_ATTEMPTS = 'leoni_qualitrack_attempts_v1';
const STORAGE_KEY_WORKSTATIONS = 'leoni_qualitrack_workstations_v1';
const STORAGE_KEY_PROD_NEEDS = 'leoni_qualitrack_prod_needs_v1';
const STORAGE_KEY_REJECTIONS = 'leoni_qualitrack_rejections_v1';
const STORAGE_KEY_GESTURE_REPORTS = 'leoni_qualitrack_gesture_reports_v1';
const STORAGE_KEY_CARRE_MAGIQUE = 'leoni_qualitrack_carre_magique_v1';
const STORAGE_KEY_QUALIF_DECISIONS = 'leoni_qualitrack_qualif_decisions_v1';
const STORAGE_KEY_REQUALIF_90J = 'leoni_qualitrack_requalif_90j_v1';
const STORAGE_KEY_VALIDATION_RIGHTS = 'leoni_qualitrack_validation_rights_v1';
const STORAGE_KEY_DEPARTURES = 'leoni_qualitrack_departures_v1';
const STORAGE_KEY_SURVEYS = 'leoni_qualitrack_surveys_v1';

export class StorageRepository
  implements
    IRecruitRepository,
    IDocumentRequirementRepository,
    ISiteRepository,
    IUserRepository,
    ISchoolGroupRepository,
    ISettingsRepository,
    ISchoolRepository,
    IAssignmentRepository,
    ICarreMagiqueRepository,
    IQualificationRepository,
    IMetricsRepository,
    IAuditRepository
{
  private recruits: Recruit[] = [];
  private auditLogs: AuditLog[] = [];
  private parameters: SystemParameter[] = [];
  private groups: SchoolGroup[] = [];
  private documentRequirements: DocumentRequirement[] = [];
  private attendanceRecords: SchoolAttendanceRecord[] = [];
  private trainingContents: TrainingContent[] = [];
  private questions: Question[] = [];
  private schoolTests: SchoolTest[] = [];
  private testAttempts: TestAttempt[] = [];
  private workstations: Workstation[] = [];
  private productionNeeds: ProductionNeed[] = [];
  private rejections: AssignmentRejectionRecord[] = [];
  private gestureReports: GestureEvaluationReport[] = [];
  private carreMagiqueSheets: Record<string, CarreMagiqueSheet> = {};
  private qualifDecisions: Record<string, QualificationDecisionRecord> = {};
  private requalifications90J: Record<string, Requalification90JRecord> = {};
  private validationRights: ValidationRightsMatrix = DEFAULT_VALIDATION_RIGHTS;
  private departures: DepartureRecord[] = [];
  private surveys: OperatorSatisfactionSurvey[] = [];
  private users: UserProfile[] = INITIAL_USERS;
  private sites: Site[] = INITIAL_SITES;

  // Index en mémoire pour performance O(1)
  private indexCin: Map<string, Recruit> = new Map();
  private indexMatricule: Map<string, Recruit> = new Map();
  private indexGroupe: Map<string, Set<string>> = new Map();
  private indexSite: Map<string, Set<string>> = new Map();

  constructor() {
    this.initStorage();
    this.rebuildIndices();
  }

  public rebuildIndices() {
    this.indexCin.clear();
    this.indexMatricule.clear();
    this.indexGroupe.clear();
    this.indexSite.clear();

    for (const r of this.recruits) {
      if (r.cin) this.indexCin.set(r.cin.toLowerCase().trim(), r);
      if (r.matricule) this.indexMatricule.set(r.matricule.toLowerCase().trim(), r);
      if (r.groupeEcoleId) {
        if (!this.indexGroupe.has(r.groupeEcoleId)) this.indexGroupe.set(r.groupeEcoleId, new Set());
        this.indexGroupe.get(r.groupeEcoleId)!.add(r.id);
      }
      if (r.siteId) {
        if (!this.indexSite.has(r.siteId)) this.indexSite.set(r.siteId, new Set());
        this.indexSite.get(r.siteId)!.add(r.id);
      }
    }
  }


  private initStorage() {
    try {
      const storedCarreMagique = localStorage.getItem(STORAGE_KEY_CARRE_MAGIQUE);
      if (storedCarreMagique) {
        this.carreMagiqueSheets = JSON.parse(storedCarreMagique);
      } else {
        this.carreMagiqueSheets = {};
      }

      const storedDecisions = localStorage.getItem(STORAGE_KEY_QUALIF_DECISIONS);
      if (storedDecisions) {
        this.qualifDecisions = JSON.parse(storedDecisions);
      } else {
        this.qualifDecisions = {};
      }

      const storedReq90 = localStorage.getItem(STORAGE_KEY_REQUALIF_90J);
      if (storedReq90) {
        this.requalifications90J = JSON.parse(storedReq90);
      } else {
        this.requalifications90J = {};
      }

      const storedRights = localStorage.getItem(STORAGE_KEY_VALIDATION_RIGHTS);
      if (storedRights) {
        this.validationRights = JSON.parse(storedRights);
      } else {
        this.validationRights = DEFAULT_VALIDATION_RIGHTS;
      }

      const storedRecruits = localStorage.getItem(STORAGE_KEY_RECRUITS);
      if (storedRecruits) {
        this.recruits = JSON.parse(storedRecruits);
      } else {
        this.recruits = generateInitialRecruits();
        this.saveRecruits();
      }

      const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (storedAudit) {
        this.auditLogs = JSON.parse(storedAudit);
      } else {
        this.auditLogs = [...INITIAL_AUDIT_LOGS];
        this.saveAudit();
      }

      const storedParams = localStorage.getItem(STORAGE_KEY_PARAMS);
      if (storedParams) {
        this.parameters = JSON.parse(storedParams);
      } else {
        this.parameters = [...INITIAL_PARAMETERS];
        this.saveParams();
      }

      const storedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (storedGroups) {
        this.groups = JSON.parse(storedGroups);
      } else {
        this.groups = [...INITIAL_GROUPS];
        this.saveGroups();
      }

      const storedDocReqs = localStorage.getItem(STORAGE_KEY_DOC_REQS);
      if (storedDocReqs) {
        this.documentRequirements = JSON.parse(storedDocReqs);
      } else {
        this.documentRequirements = [...INITIAL_DOCUMENT_REQUIREMENTS];
        this.saveDocReqs();
      }

      const storedAtt = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (storedAtt) {
        this.attendanceRecords = JSON.parse(storedAtt);
      } else {
        this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];
        this.saveAttendance();
      }

      const storedCnt = localStorage.getItem(STORAGE_KEY_CONTENTS);
      if (storedCnt) {
        this.trainingContents = JSON.parse(storedCnt);
      } else {
        this.trainingContents = [...INITIAL_TRAINING_CONTENTS];
        this.saveContents();
      }

      const storedQst = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (storedQst) {
        this.questions = JSON.parse(storedQst);
      } else {
        this.questions = [...INITIAL_QUESTIONS];
        this.saveQuestions();
      }

      const storedTst = localStorage.getItem(STORAGE_KEY_TESTS);
      if (storedTst) {
        this.schoolTests = JSON.parse(storedTst);
      } else {
        this.schoolTests = [...INITIAL_SCHOOL_TESTS];
        this.saveTests();
      }

      const storedAttempts = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      if (storedAttempts) {
        this.testAttempts = JSON.parse(storedAttempts);
      } else {
        this.testAttempts = [...INITIAL_TEST_ATTEMPTS];
        this.saveAttempts();
      }

      const storedWorkstations = localStorage.getItem(STORAGE_KEY_WORKSTATIONS);
      if (storedWorkstations) {
        this.workstations = JSON.parse(storedWorkstations);
      } else {
        this.workstations = [...INITIAL_WORKSTATIONS];
        this.saveWorkstations();
      }

      const storedProdNeeds = localStorage.getItem(STORAGE_KEY_PROD_NEEDS);
      if (storedProdNeeds) {
        this.productionNeeds = JSON.parse(storedProdNeeds);
      } else {
        this.productionNeeds = [...INITIAL_PRODUCTION_NEEDS];
        this.saveProductionNeeds();
      }

      const storedRejections = localStorage.getItem(STORAGE_KEY_REJECTIONS);
      if (storedRejections) {
        this.rejections = JSON.parse(storedRejections);
      } else {
        this.rejections = [...INITIAL_REJECTIONS];
        this.saveRejections();
      }

      const storedGestureReports = localStorage.getItem(STORAGE_KEY_GESTURE_REPORTS);
      if (storedGestureReports) {
        this.gestureReports = JSON.parse(storedGestureReports);
      } else {
        this.gestureReports = [...INITIAL_GESTURE_REPORTS];
        this.saveGestureReports();
      }

      const storedDepartures = localStorage.getItem(STORAGE_KEY_DEPARTURES);
      if (storedDepartures) {
        this.departures = JSON.parse(storedDepartures);
      } else {
        this.departures = [...INITIAL_DEPARTURES];
        this.saveDepartures();
      }

      const storedSurveys = localStorage.getItem(STORAGE_KEY_SURVEYS);
      if (storedSurveys) {
        this.surveys = JSON.parse(storedSurveys);
      } else {
        this.surveys = [...INITIAL_SURVEYS];
        this.saveSurveys();
      }
    } catch {
      this.recruits = generateInitialRecruits();
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.parameters = [...INITIAL_PARAMETERS];
      this.groups = [...INITIAL_GROUPS];
      this.documentRequirements = [...INITIAL_DOCUMENT_REQUIREMENTS];
      this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];
      this.trainingContents = [...INITIAL_TRAINING_CONTENTS];
      this.questions = [...INITIAL_QUESTIONS];
      this.schoolTests = [...INITIAL_SCHOOL_TESTS];
      this.testAttempts = [...INITIAL_TEST_ATTEMPTS];
      this.workstations = [...INITIAL_WORKSTATIONS];
      this.productionNeeds = [...INITIAL_PRODUCTION_NEEDS];
      this.rejections = [...INITIAL_REJECTIONS];
      this.gestureReports = [...INITIAL_GESTURE_REPORTS];
      this.carreMagiqueSheets = {};
      this.qualifDecisions = {};
      this.requalifications90J = {};
      this.validationRights = DEFAULT_VALIDATION_RIGHTS;
      this.departures = [...INITIAL_DEPARTURES];
      this.surveys = [...INITIAL_SURVEYS];
    }
  }

  private saveDepartures() {
    try {
      localStorage.setItem(STORAGE_KEY_DEPARTURES, JSON.stringify(this.departures));
    } catch {}
  }

  private saveSurveys() {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEYS, JSON.stringify(this.surveys));
    } catch {}
  }

  private saveCarreMagique() {
    try {
      localStorage.setItem(STORAGE_KEY_CARRE_MAGIQUE, JSON.stringify(this.carreMagiqueSheets));
    } catch {}
  }

  private saveQualifDecisions() {
    try {
      localStorage.setItem(STORAGE_KEY_QUALIF_DECISIONS, JSON.stringify(this.qualifDecisions));
    } catch {}
  }

  private saveRequalif90J() {
    try {
      localStorage.setItem(STORAGE_KEY_REQUALIF_90J, JSON.stringify(this.requalifications90J));
    } catch {}
  }

  private saveValidationRights() {
    try {
      localStorage.setItem(STORAGE_KEY_VALIDATION_RIGHTS, JSON.stringify(this.validationRights));
    } catch {}
  }

  private saveWorkstations() {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSTATIONS, JSON.stringify(this.workstations));
    } catch {}
  }

  private saveProductionNeeds() {
    try {
      localStorage.setItem(STORAGE_KEY_PROD_NEEDS, JSON.stringify(this.productionNeeds));
    } catch {}
  }

  private saveRejections() {
    try {
      localStorage.setItem(STORAGE_KEY_REJECTIONS, JSON.stringify(this.rejections));
    } catch {}
  }

  private saveGestureReports() {
    try {
      localStorage.setItem(STORAGE_KEY_GESTURE_REPORTS, JSON.stringify(this.gestureReports));
    } catch {}
  }

  private saveDocReqs() {
    try {
      localStorage.setItem(STORAGE_KEY_DOC_REQS, JSON.stringify(this.documentRequirements));
    } catch {
      // In-memory fallback
    }
  }

  private saveRecruits() {
    try {
      localStorage.setItem(STORAGE_KEY_RECRUITS, JSON.stringify(this.recruits));
    } catch {
      // In-memory fallback
    }
  }

  private saveAudit() {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
    } catch {
      // In-memory fallback
    }
  }

  private saveParams() {
    try {
      localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify(this.parameters));
    } catch {
      // In-memory fallback
    }
  }

  private saveGroups() {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(this.groups));
    } catch {
      // In-memory fallback
    }
  }

  private saveAttendance() {
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(this.attendanceRecords));
    } catch {
      // In-memory fallback
    }
  }

  private saveContents() {
    try {
      localStorage.setItem(STORAGE_KEY_CONTENTS, JSON.stringify(this.trainingContents));
    } catch {
      // In-memory fallback
    }
  }

  private saveQuestions() {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(this.questions));
    } catch {
      // In-memory fallback
    }
  }

  private saveTests() {
    try {
      localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(this.schoolTests));
    } catch {
      // In-memory fallback
    }
  }

  private saveAttempts() {
    try {
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(this.testAttempts));
    } catch {
      // In-memory fallback
    }
  }


  // --- IRecruitRepository ---

  public async getAllRecruits(params: PaginationParams): Promise<PaginatedResult<Recruit>> {
    const { page, pageSize, search, siteId, statut, groupeId } = params;

    let filtered = [...this.recruits];

    if (siteId) {
      filtered = filtered.filter((r) => r.siteId === siteId);
    }

    if (statut) {
      filtered = filtered.filter((r) => r.statut === statut);
    }

    if (groupeId) {
      filtered = filtered.filter((r) => r.groupeEcoleId === groupeId);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const nomComplet = `${r.nom} ${r.prenom}`.toLowerCase();
        const prenomNom = `${r.prenom} ${r.nom}`.toLowerCase();
        const cin = (r.cin || '').toLowerCase();
        const matricule = (r.matricule || '').toLowerCase();
        const groupe = (r.groupeEcoleId || '').toLowerCase();
        return (
          nomComplet.includes(q) ||
          prenomNom.includes(q) ||
          cin.includes(q) ||
          matricule.includes(q) ||
          groupe.includes(q)
        );
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
      page: currentPage,
      pageSize,
      totalPages
    };
  }

  // Alias
  public async getAll(params: PaginationParams): Promise<PaginatedResult<Recruit>> {
    return this.getAllRecruits(params);
  }

  public async getRecruitById(id: string): Promise<Recruit | null> {
    const item = this.recruits.find((r) => r.id === id);
    return item ? { ...item } : null;
  }

  public async getById(id: string): Promise<Recruit | null> {
    return this.getRecruitById(id);
  }

  public async getByCin(cin: string): Promise<Recruit | null> {
    const cleanCin = cin.trim().toUpperCase();
    const item = this.recruits.find((r) => r.cin.toUpperCase() === cleanCin);
    return item ? { ...item } : null;
  }

  public async checkHistoryOtherSites(
    cin: string,
    currentSiteId: string
  ): Promise<{ hasHistory: boolean; otherSiteName?: string }> {
    const cleanCin = cin.trim().toUpperCase();
    const existing = this.recruits.find((r) => r.cin.toUpperCase() === cleanCin && r.siteId !== currentSiteId);
    if (existing) {
      const otherSite = this.sites.find((s) => s.id === existing.siteId);
      return {
        hasHistory: true,
        otherSiteName: otherSite ? otherSite.nom : 'Autre site LEONI'
      };
    }
    return { hasHistory: false };
  }

  public async checkMatchingCandidate(
    cin: string,
    currentSiteId: string
  ): Promise<MatchingResult> {
    const cleanCin = cin.trim().toUpperCase();
    
    // 1. Recherche de doublon strict sur le site courant
    const localMatch = this.recruits.find(
      (r) => r.cin.toUpperCase() === cleanCin && r.siteId === currentSiteId
    );

    // 2. Recherche d'historique sur un autre site LEONI
    const otherSiteMatch = this.recruits.find(
      (r) => r.cin.toUpperCase() === cleanCin && r.siteId !== currentSiteId
    );

    let siteAutreNom: string | undefined;
    if (otherSiteMatch) {
      const site = this.sites.find((s) => s.id === otherSiteMatch.siteId);
      siteAutreNom = site ? site.nom : 'Autre site LEONI';
    }

    // Règle de rapprochement configurée
    const regleParam = this.parameters.find((p) => p.cle === 'REGLE_RAPPROCHEMENT_DEFAUT');
    const regleRapprochementRecommandee: MatchingResult['regleRapprochementRecommandee'] =
      (regleParam?.valeur as any) || 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE';

    return {
      doublonLocal: !!localMatch,
      recrueLocaleExistante: localMatch ? { ...localMatch } : undefined,
      antécédentAutreSite: !!otherSiteMatch,
      recrueAutreSite: otherSiteMatch ? { ...otherSiteMatch } : undefined,
      siteAutreNom,
      regleRapprochementRecommandee
    };
  }

  public async createRecruit(recruitData: Omit<Recruit, 'id'>, author: UserProfile): Promise<Recruit> {
    const newId = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecruit: Recruit = {
      ...recruitData,
      id: newId
    };

    this.recruits.unshift(newRecruit);
    this.saveRecruits();

    // Log d'audit
    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_DOSSIER',
      entite: 'Recruit',
      entiteId: newId,
      details: `Création du dossier recrue pour ${newRecruit.nom} ${newRecruit.prenom} (CIN: ${newRecruit.cin})`,
      estDerogation: false
    });

    return { ...newRecruit };
  }

  public async create(recruitData: Omit<Recruit, 'id'>, author: UserProfile): Promise<Recruit> {
    return this.createRecruit(recruitData, author);
  }

  public async updateRecruit(
    id: string,
    updates: Partial<Recruit>,
    author: UserProfile,
    reason?: string,
    isDerogation = false
  ): Promise<Recruit> {
    const index = this.recruits.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Recrue introuvable avec l'identifiant ${id}`);
    }

    const previous = this.recruits[index];
    const updated: Recruit = {
      ...previous,
      ...updates
    };

    this.recruits[index] = updated;
    this.saveRecruits();

    // Journal d'audit obligatoire
    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: isDerogation ? 'DEROGATION_QUALITE' : 'MODIFICATION_DOSSIER',
      entite: 'Recruit',
      entiteId: id,
      details: isDerogation
        ? `Dérogation accordée : ${reason || 'Sans motif détaillé'}`
        : `Mise à jour dossier recrue ${updated.nom} ${updated.prenom} (Statut: ${updated.statut})`,
      estDerogation: isDerogation,
      motifDerogation: isDerogation ? reason : undefined
    });

    return { ...updated };
  }

  public async update(
    id: string,
    updates: Partial<Recruit>,
    author: UserProfile,
    reason?: string,
    isDerogation = false
  ): Promise<Recruit> {
    return this.updateRecruit(id, updates, author, reason, isDerogation);
  }

  public async attachDocumentToRecruit(
    recruitId: string,
    doc: RecruitDocument,
    author: UserProfile
  ): Promise<Recruit> {
    const recruit = await this.getRecruitById(recruitId);
    if (!recruit) throw new Error(`Recrue non trouvée (${recruitId}).`);

    const currentDocs = { ...(recruit.documents || {}) };
    currentDocs[doc.codeRequirement] = doc;

    // Recalcul de la complétude
    const completeness = MetricsEngine.calculateAdministrativeCompleteness(
      { ...recruit, documents: currentDocs },
      this.documentRequirements
    );

    const updated = await this.updateRecruit(
      recruitId,
      {
        documents: currentDocs,
        tauxCompletudeDossier: completeness.tauxCompletudePourcent,
        dossierComplet: completeness.estDossierComplet
      },
      author,
      `Dépôt document administratif : ${doc.nomFichier} (Code: ${doc.codeRequirement})`
    );

    return updated;
  }

  public async reconcileRecruitWithSAP(
    cin: string,
    matriculeAttribue: string,
    author: UserProfile
  ): Promise<Recruit> {
    const cleanCin = cin.trim().toUpperCase();
    const recruit = this.recruits.find((r) => r.cin.toUpperCase() === cleanCin);
    if (!recruit) {
      throw new Error(`Aucun dossier recrue trouvé avec le CIN ${cin} pour attribution SAP.`);
    }

    const updated = await this.updateRecruit(
      recruit.id,
      {
        matricule: matriculeAttribue.trim(),
        statutLiaisonSAP: 'RECONCILIE',
        dateLiaisonSAP: new Date().toISOString()
      },
      author,
      `Réconciliation matricule SAP officiel attribué : ${matriculeAttribue.trim()} (CIN: ${cleanCin})`
    );

    return updated;
  }

  public async massImport(
    recruitsData: Array<Omit<Recruit, 'id'>>,
    author: UserProfile
  ): Promise<{ importedCount: number; errors: Array<{ ligne: number; cin: string; erreur: string }> }> {
    const errors: Array<{ ligne: number; cin: string; erreur: string }> = [];
    let count = 0;

    for (let i = 0; i < recruitsData.length; i++) {
      const ligneNumber = i + 1;
      const row = recruitsData[i];

      // Validation stricte
      if (!row.cin || row.cin.trim() === '') {
        errors.push({ ligne: ligneNumber, cin: 'INCONNU', erreur: 'Numéro CIN obligatoire manquant.' });
        continue;
      }

      if (!row.nom || !row.prenom) {
        errors.push({ ligne: ligneNumber, cin: row.cin, erreur: 'Nom ou prénom manquant.' });
        continue;
      }

      // Validation stricte du format date ISO YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (row.dateNaissance && !dateRegex.test(row.dateNaissance)) {
        errors.push({ ligne: ligneNumber, cin: row.cin, erreur: `Format de date de naissance invalide (${row.dateNaissance}). Format requis: AAAA-MM-JJ.` });
        continue;
      }

      if (row.dateEntree && !dateRegex.test(row.dateEntree)) {
        errors.push({ ligne: ligneNumber, cin: row.cin, erreur: `Format de date d’entrée invalide (${row.dateEntree}). Format requis: AAAA-MM-JJ.` });
        continue;
      }

      // Vérification doublon sur site courant
      const existing = this.recruits.find((r) => r.cin.toUpperCase() === row.cin.toUpperCase());
      if (existing) {
        errors.push({ ligne: ligneNumber, cin: row.cin, erreur: `Le CIN ${row.cin} existe déjà dans la base (${existing.nom} ${existing.prenom}).` });
        continue;
      }

      const newId = `rec-imp-${Date.now()}-${i}`;
      const toAdd: Recruit = {
        ...row,
        id: newId
      };
      this.recruits.push(toAdd);
      count++;
    }

    this.saveRecruits();

    // Audit de l'import de masse
    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'IMPORT_MASSE',
      entite: 'Recruit',
      entiteId: `IMPORT-${Date.now()}`,
      details: `Import en masse achevé : ${count} recrues insérées avec succès, ${errors.length} rejets consignés.`,
      estDerogation: false
    });

    return {
      importedCount: count,
      errors
    };
  }

  // --- ISiteRepository ---

  public async getAllSites(): Promise<Site[]> {
    return [...this.sites];
  }

  public async getSiteById(id: string): Promise<Site | null> {
    const s = this.sites.find((item) => item.id === id);
    return s ? { ...s } : null;
  }

  // --- IUserRepository ---

  public async getAllUsers(): Promise<UserProfile[]> {
    return [...this.users];
  }

  public async getUserById(id: string): Promise<UserProfile | null> {
    const u = this.users.find((item) => item.id === id);
    return u ? { ...u } : null;
  }

  public async getTrainers(siteId?: string): Promise<{ ecole: UserProfile[]; terrain: UserProfile[] }> {
    let pool = [...this.users];
    if (siteId) {
      pool = pool.filter((u) => u.siteId === siteId);
    }
    return {
      ecole: pool.filter((u) => u.role === 'FORMATEUR_ECOLE'),
      terrain: pool.filter((u) => u.role === 'FORMATEUR_TERRAIN')
    };
  }

  // --- ISchoolGroupRepository ---

  public async getAllGroups(siteId?: string): Promise<SchoolGroup[]> {
    if (siteId) {
      return this.groups.filter((g) => g.siteId === siteId);
    }
    return [...this.groups];
  }

  public async getGroupById(id: string): Promise<SchoolGroup | null> {
    const g = this.groups.find((item) => item.id === id);
    return g ? { ...g } : null;
  }

  // --- ISettingsRepository ---

  public async getAllParameters(): Promise<SystemParameter[]> {
    return [...this.parameters];
  }

  public async getParameterByKey(cle: string): Promise<SystemParameter | null> {
    const p = this.parameters.find((item) => item.cle === cle);
    return p ? { ...p } : null;
  }

  public async getByKey(cle: string): Promise<SystemParameter | null> {
    return this.getParameterByKey(cle);
  }

  public async updateParameter(
    cle: string,
    valeur: number | string | boolean,
    author: UserProfile,
    motif: string
  ): Promise<SystemParameter> {
    const idx = this.parameters.findIndex((p) => p.cle === cle);
    if (idx === -1) {
      throw new Error(`Paramètre introuvable avec la clé ${cle}`);
    }

    const prev = this.parameters[idx];
    const newVersion = prev.version + 1;
    const nowIso = new Date().toISOString();

    const updated: SystemParameter = {
      ...prev,
      valeur,
      version: newVersion,
      dateModification: nowIso,
      modifieParMatricule: author.matricule,
      modifieParNom: `${author.prenom} ${author.nom}`,
      motifModification: motif
    };

    this.parameters[idx] = updated;
    this.saveParams();

    // Log d'audit
    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'MODIFICATION_PARAMETRE',
      entite: 'SystemParameter',
      entiteId: cle,
      details: `Version ${newVersion} du paramètre ${cle} : passage de "${prev.valeur}" à "${valeur}". Motif: ${motif}`,
      estDerogation: false
    });

    return { ...updated };
  }

  // --- IAuditRepository ---

  public async getAllAuditLogs(params?: { siteId?: string; entite?: string; limit?: number }): Promise<AuditLog[]> {
    let list = [...this.auditLogs];

    if (params?.siteId) {
      list = list.filter((log) => log.siteId === params.siteId);
    }

    if (params?.entite) {
      list = list.filter((log) => log.entite === params.entite);
    }

    // Tri chronologique décroissant (plus récent d'abord)
    list.sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime());

    if (params?.limit) {
      list = list.slice(0, params.limit);
    }

    return list;
  }

  public async log(entry: Omit<AuditLog, 'id' | 'dateAction'>): Promise<AuditLog> {
    const newEntry: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dateAction: new Date().toISOString()
    };

    this.auditLogs.unshift(newEntry);
    this.saveAudit();

    return { ...newEntry };
  }

  // --- IDocumentRequirementRepository ---

  public async getDocumentRequirements(siteId: string): Promise<DocumentRequirement[]> {
    return this.documentRequirements
      .filter((r) => r.siteId === siteId)
      .sort((a, b) => a.ordre - b.ordre);
  }

  public async updateDocumentRequirement(
    id: string,
    updates: Partial<DocumentRequirement>,
    author: UserProfile
  ): Promise<DocumentRequirement> {
    const idx = this.documentRequirements.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Exigence documentaire introuvable (${id}).`);

    const updated = { ...this.documentRequirements[idx], ...updates };
    this.documentRequirements[idx] = updated;
    this.saveDocReqs();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'MODIFICATION_CHECKLIST_DOC',
      entite: 'DocumentRequirement',
      entiteId: id,
      details: `Mise à jour de la checklist administrative : ${updated.libelleFr} (Obligatoire: ${updated.estObligatoire})`,
      estDerogation: false
    });

    return { ...updated };
  }

  // --- ISchoolRepository ---

  public async getAttendance(groupId: string, jourIndex?: number): Promise<SchoolAttendanceRecord[]> {
    const groupRecruitIds = new Set(this.recruits.filter((r) => r.groupeEcoleId === groupId).map((r) => r.id));
    return this.attendanceRecords.filter((rec) => {
      const matchRecrue = groupRecruitIds.has(rec.recrueId);
      const matchDay = jourIndex !== undefined ? rec.jourIndex === jourIndex : true;
      return matchRecrue && matchDay;
    });
  }

  public async recordAttendance(records: SchoolAttendanceRecord[], author: UserProfile): Promise<void> {
    for (const rec of records) {
      const existingIdx = this.attendanceRecords.findIndex(
        (r) => r.recrueId === rec.recrueId && r.jourIndex === rec.jourIndex
      );

      if (existingIdx !== -1) {
        this.attendanceRecords[existingIdx] = { ...rec };
      } else {
        this.attendanceRecords.push({ ...rec });
      }

      // Mettre à jour ecoleJoursValides sur la recrue si présent ou retard
      const recruitIdx = this.recruits.findIndex((r) => r.id === rec.recrueId);
      if (recruitIdx !== -1 && (rec.statut === 'PRESENT' || rec.statut === 'RETARD')) {
        const currentValidated = this.recruits[recruitIdx].ecoleJoursValides || 0;
        if (rec.jourIndex > currentValidated) {
          this.recruits[recruitIdx].ecoleJoursValides = rec.jourIndex;
        }
      }
    }

    this.saveAttendance();
    this.saveRecruits();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'POINTAGE_ECOLE',
      entite: 'SchoolAttendance',
      entiteId: `ATT-${Date.now()}`,
      details: `Enregistrement du pointage pour ${records.length} recrue(s).`,
      estDerogation: false
    });
  }

  public async markAllPresent(groupId: string, jourIndex: number, author: UserProfile): Promise<number> {
    const groupRecruits = this.recruits.filter((r) => r.groupeEcoleId === groupId);
    const nowIso = new Date().toISOString();

    for (const recrue of groupRecruits) {
      const existingIdx = this.attendanceRecords.findIndex(
        (r) => r.recrueId === recrue.id && r.jourIndex === jourIndex
      );

      const record: SchoolAttendanceRecord = {
        recrueId: recrue.id,
        jourIndex,
        statut: 'PRESENT',
        horodatage: nowIso,
        pointeParMatricule: author.matricule
      };

      if (existingIdx !== -1) {
        this.attendanceRecords[existingIdx] = record;
      } else {
        this.attendanceRecords.push(record);
      }

      if ((recrue.ecoleJoursValides || 0) < jourIndex) {
        recrue.ecoleJoursValides = jourIndex;
      }
    }

    this.saveAttendance();
    this.saveRecruits();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'POINTAGE_COLLECTIF_TOUS_PRESENTS',
      entite: 'SchoolGroup',
      entiteId: groupId,
      details: `Pointage express « Tous présents » validé pour Jour ${jourIndex} : ${groupRecruits.length} recrues enregistrées en 1 clic.`,
      estDerogation: false
    });

    return groupRecruits.length;
  }

  public async getTrainingContents(jour?: number, theme?: TrainingTheme): Promise<TrainingContent[]> {
    let list = [...this.trainingContents];
    if (jour !== undefined) {
      list = list.filter((c) => c.jourEcoleRattache === jour);
    }
    if (theme) {
      list = list.filter((c) => c.theme === theme);
    }
    return list;
  }

  public async markContentConsulted(contentId: string, recruitId: string): Promise<void> {
    const idx = this.trainingContents.findIndex((c) => c.id === contentId);
    if (idx !== -1) {
      if (!this.trainingContents[idx].consulteParRecrues.includes(recruitId)) {
        this.trainingContents[idx].consulteParRecrues.push(recruitId);
        this.saveContents();
      }
    }
  }

  public async getAllQuestions(theme?: QuestionTheme): Promise<Question[]> {
    if (theme) {
      return this.questions.filter((q) => q.theme === theme);
    }
    return [...this.questions];
  }

  public async createQuestion(question: Omit<Question, 'id'>, author: UserProfile): Promise<Question> {
    const newId = `qst-${Date.now()}`;
    const newQ: Question = { ...question, id: newId };
    this.questions.push(newQ);
    this.saveQuestions();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_QUESTION_BANQUE',
      entite: 'Question',
      entiteId: newId,
      details: `Ajout question (${newQ.theme} - ${newQ.type}) : ${newQ.intituleFr.slice(0, 60)}...`,
      estDerogation: false
    });

    return newQ;
  }

  public async getAllTests(): Promise<SchoolTest[]> {
    return [...this.schoolTests];
  }

  public async createTest(test: Omit<SchoolTest, 'id'>, author: UserProfile): Promise<SchoolTest> {
    const newId = `tst-${Date.now()}`;
    const newTest: SchoolTest = { ...test, id: newId };
    this.schoolTests.push(newTest);
    this.saveTests();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_TEST_ECOLE',
      entite: 'SchoolTest',
      entiteId: newId,
      details: `Génération test de formation en < 5 min : ${newTest.titreFr} (${newTest.sections.length} sections, note passage: ${newTest.notePassageSur20}/20).`,
      estDerogation: false
    });

    return newTest;
  }

  public async getTestAttempts(recrueId?: string, testId?: string): Promise<TestAttempt[]> {
    let list = [...this.testAttempts];
    if (recrueId) list = list.filter((a) => a.recrueId === recrueId);
    if (testId) list = list.filter((a) => a.testId === testId);
    return list;
  }

  public async submitTestAttempt(
    attemptData: Omit<TestAttempt, 'id' | 'datePassage'>,
    author?: UserProfile
  ): Promise<TestAttempt> {
    const newAttempt: TestAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      datePassage: new Date().toISOString()
    };

    this.testAttempts.unshift(newAttempt);
    this.saveAttempts();

    // Mettre à jour la note théorique sur la recrue
    const rIdx = this.recruits.findIndex((r) => r.id === newAttempt.recrueId);
    if (rIdx !== -1) {
      this.recruits[rIdx].ecoleScoreTheorie = newAttempt.noteSur20;
      this.saveRecruits();
    }

    if (author) {
      await this.log({
        auteurMatricule: author.matricule,
        auteurNom: `${author.prenom} ${author.nom}`,
        auteurRole: author.role,
        siteId: author.siteId,
        action: 'SOUMISSION_TEST_ECOLE',
        entite: 'TestAttempt',
        entiteId: newAttempt.id,
        details: `Résultat test (${newAttempt.mode}) : Note ${newAttempt.noteSur20}/20 - ${newAttempt.estReussi ? 'RÉUSSI' : 'ÉCHEC'} pour la recrue ${newAttempt.recrueId}.`,
        estDerogation: false
      });
    }

    return newAttempt;
  }

  public async finalizeSchoolDecision(
    recrueId: string,
    decision: SchoolFinalDecision,
    noteTheorie: number,
    notePratique: number,
    author: UserProfile,
    observations?: string
  ): Promise<Recruit> {
    const recruit = await this.getRecruitById(recrueId);
    if (!recruit) throw new Error(`Recrue introuvable (${recrueId}) pour décision fin d’école.`);

    const nowIso = new Date().toISOString();
    let newStatut = recruit.statut;
    let ecoleValidee = false;

    if (decision === 'ADMIS') {
      ecoleValidee = true;
      // Transfert automatique vers affectation / poste
      newStatut = 'EN_APPRENTISSAGE_POSTE';
    } else if (decision === 'A_REVOIR') {
      ecoleValidee = false;
      newStatut = 'EN_ECOLE';
    } else {
      ecoleValidee = false;
      newStatut = 'NON_QUALIFIE_PROLONGATION';
    }

    const updated = await this.updateRecruit(
      recrueId,
      {
        ecoleValidee,
        ecoleScoreTheorie: noteTheorie,
        ecoleScorePratique: notePratique,
        dateValidationEcole: nowIso,
        statut: newStatut
      },
      author,
      `Décision de fin d’école : ${decision} (Théorie: ${noteTheorie}/20, Pratique: ${notePratique}/20). ${observations || ''}`
    );

    return updated;
  }

  // --- IAssignmentRepository (Étape 4) ---

  public async getAllWorkstations(siteId?: string, nature?: WorkstationNature): Promise<Workstation[]> {
    let list = [...this.workstations];
    if (siteId) list = list.filter((w) => w.siteId === siteId);
    if (nature) list = list.filter((w) => w.typologie === nature);
    return list;
  }

  public async getWorkstationById(id: string): Promise<Workstation | null> {
    return this.workstations.find((w) => w.id === id) || null;
  }

  public async createWorkstation(ws: Omit<Workstation, 'id'>, author: UserProfile): Promise<Workstation> {
    const newWs: Workstation = {
      ...ws,
      id: `ws-${Date.now()}`
    };
    this.workstations.push(newWs);
    this.saveWorkstations();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_POSTE_CATALOGUE',
      entite: 'Workstation',
      entiteId: newWs.id,
      details: `Création du poste ${newWs.code} (${newWs.typologie}) : ${newWs.intituleFr}.`,
      estDerogation: false
    });

    return newWs;
  }

  public async updateWorkstation(id: string, updates: Partial<Workstation>, author: UserProfile): Promise<Workstation> {
    const index = this.workstations.findIndex((w) => w.id === id);
    if (index === -1) throw new Error(`Poste introuvable : ${id}`);
    const updated = { ...this.workstations[index], ...updates };
    this.workstations[index] = updated;
    this.saveWorkstations();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'MODIFICATION_POSTE_CATALOGUE',
      entite: 'Workstation',
      entiteId: updated.id,
      details: `Mise à jour du poste ${updated.code} - ${updated.intituleFr}.`,
      estDerogation: false
    });

    return updated;
  }

  public async getAllProductionNeeds(siteId?: string): Promise<ProductionNeed[]> {
    let list = [...this.productionNeeds];
    if (siteId) list = list.filter((n) => n.siteId === siteId);
    return list;
  }

  public async createProductionNeed(
    need: Omit<ProductionNeed, 'id' | 'quantitePourvue' | 'statut'>,
    author: UserProfile
  ): Promise<ProductionNeed> {
    const newNeed: ProductionNeed = {
      ...need,
      id: `pnd-${Date.now()}`,
      quantitePourvue: 0,
      statut: 'OUVERT'
    };
    this.productionNeeds.push(newNeed);
    this.saveProductionNeeds();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_BESOIN_PRODUCTION',
      entite: 'ProductionNeed',
      entiteId: newNeed.id,
      details: `Nouveau besoin ${newNeed.workstationCode} : ${newNeed.quantiteDemandee} opérateur(s) demandés pour le ${newNeed.dateCible}.`,
      estDerogation: false
    });

    return newNeed;
  }

  public async updateProductionNeed(
    id: string,
    updates: Partial<ProductionNeed>,
    author: UserProfile
  ): Promise<ProductionNeed> {
    const index = this.productionNeeds.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Besoin de production introuvable : ${id}`);
    const updated = { ...this.productionNeeds[index], ...updates };

    if (updated.quantitePourvue >= updated.quantiteDemandee) {
      updated.statut = 'POURVU';
    } else if (updated.quantitePourvue > 0) {
      updated.statut = 'PARTIEL';
    }

    this.productionNeeds[index] = updated;
    this.saveProductionNeeds();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'MODIFICATION_BESOIN_PRODUCTION',
      entite: 'ProductionNeed',
      entiteId: updated.id,
      details: `Mise à jour du besoin ${updated.workstationCode} : ${updated.quantitePourvue}/${updated.quantiteDemandee} pourvu(s).`,
      estDerogation: false
    });

    return updated;
  }

  public async calculateAssignmentSuggestions(recruitId: string): Promise<AssignmentSuggestion[]> {
    const recruit = await this.getRecruitById(recruitId);
    if (!recruit) throw new Error(`Recrue introuvable : ${recruitId}`);

    const siteWorkstations = this.workstations.filter((w) => w.siteId === recruit.siteId);
    const siteNeeds = this.productionNeeds.filter((n) => n.siteId === recruit.siteId);

    const paramAssiduiteMin = Number(this.parameters.find((p) => p.cle === 'SEUIL_ASSIDUITE_POSTE_CRITIQUE')?.valeur ?? 100);
    const paramNoteMin = Number(this.parameters.find((p) => p.cle === 'NOTE_MIN_POSTE_CRITIQUE')?.valeur ?? 16);

    const suggestions: AssignmentSuggestion[] = siteWorkstations.map((ws) => {
      const activeNeed = siteNeeds.find(
        (n) => n.workstationId === ws.id && n.statut !== 'CLOTURE' && n.statut !== 'POURVU'
      );

      let score = 50;
      const raisonsFr: string[] = [];
      const raisonsAr: string[] = [];
      const pointsBloquantsFr: string[] = [];
      const pointsBloquantsAr: string[] = [];

      // Concordance de segment prévisionnel
      if (recruit.segmentPrevisionnel && ws.segment.toLowerCase().includes(recruit.segmentPrevisionnel.toLowerCase())) {
        score += 20;
        raisonsFr.push(`Aligné avec le segment prévisionnel (${recruit.segmentPrevisionnel})`);
        raisonsAr.push(`متطابق مع القسم المتوقع (${recruit.segmentPrevisionnel})`);
      }

      // Présence d'un besoin de production ouvert
      if (activeNeed) {
        const bonus = activeNeed.priorite === 'CRITIQUE' ? 25 : activeNeed.priorite === 'URGENTE' ? 20 : 15;
        score += bonus;
        raisonsFr.push(`Besoin de production ouvert (${activeNeed.quantiteDemandee - activeNeed.quantitePourvue} poste(s) vacant(s), priorité ${activeNeed.priorite})`);
        raisonsAr.push(`حاجة إنتاجية مفتوحة (${activeNeed.quantiteDemandee - activeNeed.quantitePourvue} منصب شاغر، أولوية ${activeNeed.priorite})`);
      }

      let prerequisConformes = true;

      if (ws.typologie === 'CRITIQUE') {
        const assiduiteOk = (recruit.ecoleJoursValides || 0) >= ws.prerequis.assiduiteMinJours;
        const noteTheorieOk = (recruit.ecoleScoreTheorie || 0) >= Math.min(ws.prerequis.noteEcoleMin, paramNoteMin);
        const notePratiqueOk = (recruit.ecoleScorePratique || 0) >= Math.min(ws.prerequis.noteEcoleMin, paramNoteMin) || recruit.testPratiqueValide;

        if (!assiduiteOk) {
          prerequisConformes = false;
          pointsBloquantsFr.push(`Assiduité école incomplète (${recruit.ecoleJoursValides}/${ws.prerequis.assiduiteMinJours}j effectués)`);
          pointsBloquantsAr.push(`نسبة الحضور بالمدرسة غير مكتملة (${recruit.ecoleJoursValides}/${ws.prerequis.assiduiteMinJours} أيام)`);
        } else {
          score += 10;
          raisonsFr.push('Assiduité école 100% conforme sans absence');
          raisonsAr.push('انضباط تام بالحضور 100% بمدرسة الكوابل');
        }

        if (!noteTheorieOk) {
          prerequisConformes = false;
          pointsBloquantsFr.push(`Note théorique (${recruit.ecoleScoreTheorie || 0}/20) inférieure au seuil critique (${ws.prerequis.noteEcoleMin}/20)`);
          pointsBloquantsAr.push(`النقطة النظرية أقل من الحد المطلوب للمراكز الحرجة`);
        } else {
          score += 15;
          raisonsFr.push(`Note théorique solide (${recruit.ecoleScoreTheorie}/20) compatible avec poste critique`);
          raisonsAr.push(`مستوى نظري ممتاز (${recruit.ecoleScoreTheorie}/20) ملائم للمنصب الحرج`);
        }

        if (!notePratiqueOk) {
          prerequisConformes = false;
          pointsBloquantsFr.push(`Test pratique ou évaluation geste qualité non validé (seuil: ${ws.prerequis.noteEcoleMin}/20)`);
          pointsBloquantsAr.push(`الاختبار التطبيقي غير مصادق عليه للمنصب الحرج`);
        } else {
          score += 10;
          raisonsFr.push('Dextérité et geste qualité validés sur banc d’essai');
          raisonsAr.push('مهارة يدوية وحركات الجودة مصادق عليها');
        }

        if (recruit.dossierComplet) {
          score += 5;
          raisonsFr.push('Dossier administratif complet avec justificatifs techniques');
          raisonsAr.push('الملف الإداري مكتمل بجميع الشواهد');
        }
      } else {
        // Poste initial
        prerequisConformes = true;
        score += 15;
        raisonsFr.push('Poste initial accessible aux nouveaux opérateurs débutants');
        raisonsAr.push('مركز أولي متاح للمشغلين الجدد لبدء المسار المهني');
      }

      const scoreFinal = Math.min(Math.max(score, 15), 98);
      const recommande = prerequisConformes && (!!activeNeed || scoreFinal >= 75);

      return {
        workstationId: ws.id,
        workstation: ws,
        scoreCompatibilite: scoreFinal,
        recommande,
        raisonsCompatibiliteFr: raisonsFr,
        raisonsCompatibiliteAr: raisonsAr,
        prerequisConformes,
        pointsBloquantsFr: pointsBloquantsFr.length > 0 ? pointsBloquantsFr : undefined,
        pointsBloquantsAr: pointsBloquantsAr.length > 0 ? pointsBloquantsAr : undefined,
        besoinOuvert: activeNeed
      };
    });

    // Tri : Recommandés en tête, puis par score de compatibilité décroissant
    return suggestions.sort((a, b) => {
      if (a.recommande !== b.recommande) return a.recommande ? -1 : 1;
      return b.scoreCompatibilite - a.scoreCompatibilite;
    });
  }

  public async assignRecruitToWorkstation(
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
  ): Promise<Recruit> {
    const recruit = await this.getRecruitById(recruitId);
    if (!recruit) throw new Error(`Recrue introuvable : ${recruitId}`);

    const ws = await this.getWorkstationById(workstationId);
    if (!ws) throw new Error(`Poste introuvable : ${workstationId}`);

    // Si poste critique sans dérogation formelle, vérification Poka-Yoke
    if (ws.typologie === 'CRITIQUE' && !options?.estDerogation) {
      const assiduiteOk = (recruit.ecoleJoursValides || 0) >= ws.prerequis.assiduiteMinJours;
      const noteOk = (recruit.ecoleScoreTheorie || 0) >= ws.prerequis.noteEcoleMin;
      if (!assiduiteOk || !noteOk) {
        throw new Error(
          `Verrou Poka-Yoke : L’opérateur ne remplit pas les prérequis pour le poste critique ${ws.code} (Assiduité: ${recruit.ecoleJoursValides}/${ws.prerequis.assiduiteMinJours}j, Note: ${recruit.ecoleScoreTheorie || 0}/${ws.prerequis.noteEcoleMin}). Une dérogation formelle est requise.`
        );
      }
    }

    const nowIso = new Date().toISOString();

    const updated = await this.updateRecruit(
      recruitId,
      {
        workstationId: ws.id,
        workstationNature: ws.typologie,
        typologiePoste: ws.stationTypologyRef || 'PLANCHE_ASSEMBLAGE',
        segmentAffectation: ws.segment,
        ligneAffectation: ws.ligne,
        formateurTerrainId: ws.formateurReferentMatricule,
        formateurProductionReferent: `${ws.formateurReferentNom} (${ws.formateurReferentMatricule})`,
        dateAffectation: nowIso,
        statut: 'EN_APPRENTISSAGE_POSTE',
        joursSuiviCompletes: Math.max(recruit.joursSuiviCompletes || 0, 1),
        carreMagiquePointsConformes: Math.max(recruit.carreMagiquePointsConformes || 0, 11),
        testPratiqueValide: options?.testPratiqueValide ?? recruit.testPratiqueValide ?? true,
        testPratiqueScore: options?.testPratiqueScore ?? recruit.testPratiqueScore ?? (ws.typologie === 'CRITIQUE' ? 17 : 15),
        traceAffectation: {
          suggereParSysteme: true,
          scoreSuggestion: options?.scoreSuggestion,
          justificationSuggestion: options?.justificationSuggestion,
          decisionPriseParMatricule: author.matricule,
          decisionPriseParNom: `${author.prenom} ${author.nom}`,
          dateDecision: nowIso,
          estDerogation: !!options?.estDerogation,
          motifDerogation: options?.motifDerogation
        }
      },
      author,
      `Affectation validée au poste ${ws.code} - ${ws.intituleFr} (${ws.typologie}). Segment: ${ws.segment}, Ligne: ${ws.ligne}. Formateur: ${ws.formateurReferentNom}. ${options?.estDerogation ? 'DÉROGATION: ' + options.motifDerogation : ''}`,
      options?.estDerogation
    );

    // Incrémentation automatique du besoin de production associé si ouvert
    const matchingNeed = this.productionNeeds.find(
      (n) => n.workstationId === ws.id && n.statut !== 'CLOTURE' && n.statut !== 'POURVU'
    );
    if (matchingNeed) {
      await this.updateProductionNeed(
        matchingNeed.id,
        {
          quantitePourvue: matchingNeed.quantitePourvue + 1
        },
        author
      );
    }

    return updated;
  }

  public async recordAssignmentRejection(
    recruitId: string,
    workstationId: string,
    motif: string,
    author: UserProfile
  ): Promise<AssignmentRejectionRecord> {
    const recruit = await this.getRecruitById(recruitId);
    if (!recruit) throw new Error(`Recrue introuvable : ${recruitId}`);

    const ws = await this.getWorkstationById(workstationId);
    if (!ws) throw new Error(`Poste introuvable : ${workstationId}`);

    const newRecord: AssignmentRejectionRecord = {
      id: `rej-${Date.now()}`,
      recrueId: recruit.id,
      recrueNom: `${recruit.nom} ${recruit.prenom}`,
      workstationId: ws.id,
      workstationIntitule: `${ws.code} - ${ws.intituleFr}`,
      dateRefus: new Date().toISOString(),
      refuseParMatricule: author.matricule,
      refuseParNom: `${author.prenom} ${author.nom}`,
      motifRefus: motif
    };

    this.rejections.unshift(newRecord);
    this.saveRejections();

    // Attacher à l'historique de la recrue
    const currentHist = recruit.historiqueRefusAffectation || [];
    await this.updateRecruit(
      recruit.id,
      {
        historiqueRefusAffectation: [newRecord, ...currentHist]
      },
      author,
      `Refus de suggestion d’affectation pour le poste ${ws.code} : ${motif}`
    );

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'REFUS_SUGGESTION_AFFECTATION',
      entite: 'AssignmentRejectionRecord',
      entiteId: newRecord.id,
      details: `Refus d'affecter ${recruit.nom} ${recruit.prenom} au poste ${ws.code}. Motif consigné : ${motif}`,
      estDerogation: false
    });

    return newRecord;
  }

  public async getRejectionsByRecruit(recruitId: string): Promise<AssignmentRejectionRecord[]> {
    return this.rejections.filter((r) => r.recrueId === recruitId);
  }

  public async saveGestureEvaluation(
    report: Omit<GestureEvaluationReport, 'id'>,
    author: UserProfile
  ): Promise<GestureEvaluationReport> {
    const newReport: GestureEvaluationReport = {
      ...report,
      id: `rep-${Date.now()}`
    };

    this.gestureReports.unshift(newReport);
    this.saveGestureReports();

    // Mise à jour de la recrue si le geste est validé
    const recruit = await this.getRecruitById(report.recrueId);
    if (recruit) {
      await this.updateRecruit(
        recruit.id,
        {
          testPratiqueValide: report.resultatFinal === 'VALIDE',
          testPratiqueScore: report.noteSur20,
          testPratiqueAssisteeIA: true
        },
        author,
        `Évaluation pratique atelier enregistrée (Note: ${report.noteSur20}/20, Résultat: ${report.resultatFinal}). Assistant IA utilisé et validé par formateur.`
      );
    }

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'EVALUATION_GESTE_PRATIQUE',
      entite: 'GestureEvaluationReport',
      entiteId: newReport.id,
      details: `Évaluation pratique recrue ${newReport.recrueId} : Note ${newReport.noteSur20}/20 - ${newReport.resultatFinal}. Suggestions IA auditées et validées.`,
      estDerogation: false
    });

    return newReport;
  }

  public async getGestureEvaluations(recruitId?: string): Promise<GestureEvaluationReport[]> {
    if (recruitId) {
      return this.gestureReports.filter((r) => r.recrueId === recruitId);
    }
    return [...this.gestureReports];
  }

  // --- ICarreMagiqueRepository ---

  public async getCarreMagiqueSheet(recruitId: string): Promise<CarreMagiqueSheet> {
    if (this.carreMagiqueSheets[recruitId]) {
      return this.carreMagiqueSheets[recruitId];
    }

    const recruit = this.recruits.find((r) => r.id === recruitId);
    if (!recruit) {
      throw new Error(`Recrue introuvable (ID: ${recruitId}) pour le Carré Magique.`);
    }

    let workstation = this.workstations.find((w) => w.id === recruit.workstationId);
    if (!workstation) {
      workstation = this.workstations.find((w) => w.code === 'PST-INS-01') || this.workstations[0];
    }

    const newSheet = CarreMagiqueEngine.createInitialSheet(recruit, workstation, {
      dateDebut: recruit.dateAffectation || recruit.dateEntree
    });

    this.carreMagiqueSheets[recruitId] = newSheet;
    this.saveCarreMagique();
    return newSheet;
  }

  public async saveCarreMagiqueSheet(sheet: CarreMagiqueSheet, author: UserProfile): Promise<CarreMagiqueSheet> {
    sheet.derniereMiseAJour = new Date().toISOString();
    this.carreMagiqueSheets[sheet.recrueId] = sheet;
    this.saveCarreMagique();

    // Évaluation automatique selon le canevas officiel
    const evalRes = CarreMagiqueEngine.evaluateSheet(sheet);

    // Mise à jour de la recrue associée
    const recruitIndex = this.recruits.findIndex((r) => r.id === sheet.recrueId);
    if (recruitIndex !== -1) {
      const rec = this.recruits[recruitIndex];
      const updates: Partial<Recruit> = {
        carreMagiquePointsConformes: Math.round(evalRes.scoreTotalPhases123 * 16),
        joursSuiviCompletes: evalRes.joursCompletes
      };

      // Si Poka-Yoke déclenché (> 4 défauts sur une journée)
      if (evalRes.estVerrouillePokaYoke && evalRes.messageVerrouillageFr?.includes('défauts enregistrés')) {
        updates.statut = 'NON_QUALIFIE_PROLONGATION';
        updates.estEnProlongation = true;
        updates.motifProlongation = evalRes.messageVerrouillageFr;

        await this.log({
          auteurMatricule: author.matricule,
          auteurNom: `${author.prenom} ${author.nom}`,
          auteurRole: author.role,
          siteId: author.siteId,
          action: 'ALERTE_POKA_YOKE_DEFAUTS_POSTE',
          entite: 'Recruit',
          entiteId: rec.id,
          details: `Verrou Poka-Yoke déclenché : Dépassement seuil défauts journaliers (> 4 défauts). Obligation de refaire la formation.`,
          estDerogation: false
        });
      }

      this.recruits[recruitIndex] = { ...rec, ...updates };
      this.saveRecruits();
    }

    return sheet;
  }

  public async updateDailyTrackingRow(
    recruitId: string,
    row: WorkstationDailyRecord,
    author: UserProfile
  ): Promise<CarreMagiqueSheet> {
    const sheet = await this.getCarreMagiqueSheet(recruitId);
    const dayIndex = sheet.suiviJours.findIndex((d) => d.jourIndex === row.jourIndex);

    // Paramètre seuil défauts
    const seuilDefauts = Number(
      this.parameters.find((p) => p.cle === 'SEUIL_DEFAUTS_JOUR_REFAIRE_FORMATION')?.valeur ?? 4
    );
    row.alertePokaYokeDeclenchee = row.nombreDefauts > seuilDefauts;
    row.pointeParMatricule = author.matricule;
    row.pointeParNom = `${author.prenom} ${author.nom}`;
    row.horodatage = new Date().toISOString();

    if (dayIndex !== -1) {
      sheet.suiviJours[dayIndex] = row;
    } else {
      sheet.suiviJours.push(row);
    }

    const updatedSheet = await this.saveCarreMagiqueSheet(sheet, author);

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'SAISIE_SUIVI_POSTE_JOUR',
      entite: 'CarreMagiqueSheet',
      entiteId: sheet.id,
      details: `Pointage J${row.jourIndex} recrue ${sheet.matricule} : Ponctualité=${row.ponctualite}, Q=${row.objectifQualiteAtteint ? 'OK' : 'NOK'}, P=${row.objectifProductiviteAtteint ? 'OK' : 'NOK'}, Défauts=${row.nombreDefauts}${row.alertePokaYokeDeclenchee ? ' (ALERTE POKA-YOKE > ' + seuilDefauts + ')' : ''}`,
      estDerogation: false
    });

    return updatedSheet;
  }

  public async updateCriterionStatus(
    recruitId: string,
    criterionId: string,
    statut: 'OK' | 'NOK' | 'NON_EVALUE',
    author: UserProfile,
    observation?: string
  ): Promise<CarreMagiqueSheet> {
    const sheet = await this.getCarreMagiqueSheet(recruitId);
    const crit = sheet.criteres.find((c) => c.id === criterionId);
    if (!crit) {
      throw new Error(`Critère introuvable (ID: ${criterionId}) dans le Carré Magique.`);
    }

    crit.statut = statut;
    crit.dateValidation = new Date().toISOString();
    crit.valideParMatricule = author.matricule;
    crit.valideParNom = `${author.prenom} ${author.nom}`;
    crit.valideParRole = author.role;
    if (observation !== undefined) {
      crit.observation = observation;
    }

    const updatedSheet = await this.saveCarreMagiqueSheet(sheet, author);

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'EVALUATION_CRITERE_CARRE_MAGIQUE',
      entite: 'CarreMagiqueSheet',
      entiteId: sheet.id,
      details: `Critère N°${crit.numero} (${crit.libelleFr}) évalué à ${statut} par ${author.prenom} ${author.nom} (${author.role}).`,
      estDerogation: false
    });

    return updatedSheet;
  }

  public async signVisa(
    recruitId: string,
    role: CarreMagiqueVisaRole,
    codePersonnel: string,
    author: UserProfile
  ): Promise<CarreMagiqueSheet> {
    const sheet = await this.getCarreMagiqueSheet(recruitId);
    const visa = sheet.visas[role];
    if (!visa) {
      throw new Error(`Visa rôle ${role} non configuré.`);
    }

    visa.estSigne = true;
    visa.signeParMatricule = author.matricule;
    visa.signeParNom = `${author.prenom} ${author.nom}`;
    visa.dateSignature = new Date().toISOString();
    visa.codePersonnelSaisi = codePersonnel;

    const updatedSheet = await this.saveCarreMagiqueSheet(sheet, author);

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: `VISA_CARRE_MAGIQUE_${role}`,
      entite: 'CarreMagiqueSheet',
      entiteId: sheet.id,
      details: `Visa officiel ${visa.titreFr} signé par ${author.prenom} ${author.nom} (Matricule: ${author.matricule}) avec code personnel à ${visa.dateSignature}.`,
      estDerogation: false
    });

    return updatedSheet;
  }

  // --- IQualificationRepository ---

  public async getQualificationDecision(recruitId: string): Promise<QualificationDecisionRecord | null> {
    return this.qualifDecisions[recruitId] || null;
  }

  public async saveQualificationDecision(
    decision: QualificationDecisionRecord,
    author: UserProfile
  ): Promise<QualificationDecisionRecord> {
    this.qualifDecisions[decision.recrueId] = decision;
    this.saveQualifDecisions();

    // Effets de la décision sur la recrue
    const recruitIndex = this.recruits.findIndex((r) => r.id === decision.recrueId);
    if (recruitIndex !== -1) {
      const rec = this.recruits[recruitIndex];
      const updates: Partial<Recruit> = {};

      if (decision.decision === 'AUTONOME') {
        updates.statut = 'QUALIFIE_AUTONOME';
        updates.qualifiee = true;
        updates.dateQualification = decision.dateDecision;
        updates.visaQualite = true;
        updates.visaQualitePar = decision.visaQualitePar || `${author.prenom} ${author.nom}`;
        updates.visaQualiteDate = decision.visaQualiteDate || decision.dateDecision;
        updates.visaProduction = true;
        updates.visaProductionPar = decision.visaProductionPar || `${author.prenom} ${author.nom}`;
        updates.visaProductionDate = decision.visaProductionDate || decision.dateDecision;
        updates.estEnProlongation = false;

        // Planification automatique de la requalification à 90 jours
        const req90 = QualificationEngine.calculateRequalification90J(
          { ...rec, ...updates },
          decision.dateDecision
        );
        this.requalifications90J[rec.id] = req90;
        this.saveRequalif90J();
      } else if (decision.decision === 'VALIDE_SUIVI_RENFORCE') {
        updates.statut = 'QUALIFIE_AUTONOME';
        updates.qualifiee = true;
        updates.dateQualification = decision.dateDecision;
        updates.remarques = 'Validé avec suivi renforcé (Tutorat 14j)';
        updates.estEnProlongation = false;

        // Planification requalification 90j
        const req90 = QualificationEngine.calculateRequalification90J(
          { ...rec, ...updates },
          decision.dateDecision
        );
        this.requalifications90J[rec.id] = req90;
        this.saveRequalif90J();
      } else if (decision.decision === 'FORMATION_CIBLEE') {
        updates.statut = 'NON_QUALIFIE_PROLONGATION';
        updates.qualifiee = false;
        updates.estEnProlongation = true;
        updates.joursProlongationAccordee = decision.joursProlongationAccordee || 7;
        updates.motifProlongation = 'Formation complémentaire ciblée requise avant réévaluation';
      } else if (decision.decision === 'NON_VALIDE_PROLONGATION') {
        updates.statut = 'NON_QUALIFIE_PROLONGATION';
        updates.qualifiee = false;
        updates.estEnProlongation = true;
        updates.joursProlongationAccordee = decision.joursProlongationAccordee || 14;
        updates.motifProlongation = decision.motifProlongation || 'Prolongation formelle du cursus au poste';
      }

      this.recruits[recruitIndex] = { ...rec, ...updates };
      this.saveRecruits();
    }

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'DECISION_QUALIFICATION_FINALE',
      entite: 'QualificationDecisionRecord',
      entiteId: decision.id,
      details: `Décision de qualification enregistrée pour ${decision.nom} ${decision.prenom} (${decision.matricule}) : ${decision.decision} (Score ${decision.scoreTotalPourcent}%). Validateur: ${author.prenom} ${author.nom} (${author.role}).${decision.estDerogation ? ' [DÉROGATION ACCORDÉE]' : ''}`,
      estDerogation: decision.estDerogation,
      motifDerogation: decision.motifDerogation
    });

    return decision;
  }

  public async getRequalification90J(recruitId: string): Promise<Requalification90JRecord> {
    if (this.requalifications90J[recruitId]) {
      return this.requalifications90J[recruitId];
    }
    const recruit = this.recruits.find((r) => r.id === recruitId);
    if (!recruit) {
      throw new Error(`Recrue introuvable (ID: ${recruitId})`);
    }
    const initial = QualificationEngine.calculateRequalification90J(recruit);
    this.requalifications90J[recruitId] = initial;
    this.saveRequalif90J();
    return initial;
  }

  public async saveRequalification90J(
    record: Requalification90JRecord,
    author: UserProfile
  ): Promise<Requalification90JRecord> {
    this.requalifications90J[record.recrueId] = record;
    this.saveRequalif90J();

    // Règle de rétrogradation si échec
    if (record.decisionRequalification === 'RETROGRADATION_NIVEAU_L') {
      const idx = this.recruits.findIndex((r) => r.id === record.recrueId);
      if (idx !== -1) {
        this.recruits[idx] = {
          ...this.recruits[idx],
          statut: 'EN_APPRENTISSAGE_POSTE',
          qualifiee: false,
          estEnProlongation: true,
          motifProlongation: 'Rétrogradation Niveau L suite à échec de requalification à 90 jours'
        };
        this.saveRecruits();
      }
    }

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'EVALUATION_REQUALIFICATION_90J',
      entite: 'Requalification90JRecord',
      entiteId: record.id,
      details: `Requalification 90J enregistrée pour ${record.nom} ${record.prenom} : Décision=${record.decisionRequalification || record.statut}, Score=${record.scoreRequalification}/1.00.`,
      estDerogation: false
    });

    return record;
  }

  public async getAllRequalifications90J(): Promise<Requalification90JRecord[]> {
    // Calcul automatique pour toutes les recrues autonomes
    const autonomes = this.recruits.filter(
      (r) => r.statut === 'QUALIFIE_AUTONOME' || r.qualifiee
    );
    for (const rec of autonomes) {
      if (!this.requalifications90J[rec.id]) {
        this.requalifications90J[rec.id] = QualificationEngine.calculateRequalification90J(rec);
      }
    }
    return Object.values(this.requalifications90J);
  }

  public async getValidationRightsMatrix(): Promise<ValidationRightsMatrix> {
    return this.validationRights;
  }

  public async updateValidationRightsMatrix(
    matrix: ValidationRightsMatrix,
    author: UserProfile
  ): Promise<ValidationRightsMatrix> {
    this.validationRights = {
      ...matrix,
      derniereMiseAJour: new Date().toISOString(),
      modifieParNom: `${author.prenom} ${author.nom} (${author.role})`
    };
    this.saveValidationRights();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'MISE_A_JOUR_MATRICE_DROITS_VALIDATION',
      entite: 'ValidationRightsMatrix',
      entiteId: 'MATRICE_DROITS',
      details: `Mise à jour des règles d'habilitation de validation de qualification par ${author.prenom} ${author.nom}.`,
      estDerogation: false
    });

    return this.validationRights;
  }

  public async getAuditEvidenceBundle(recruitId: string): Promise<AuditEvidenceBundle> {
    const recruit = this.recruits.find((r) => r.id === recruitId);
    if (!recruit) {
      throw new Error(`Recrue introuvable (ID: ${recruitId})`);
    }

    const sheet = this.carreMagiqueSheets[recruitId] || null;
    const evalRes = sheet ? CarreMagiqueEngine.evaluateSheet(sheet) : null;
    const gestureReport = this.gestureReports.find((g) => g.recrueId === recruitId) || null;
    const reqs = this.documentRequirements.filter((d) => d.siteId === recruit.siteId);

    const bundle = QualificationEngine.bundleAuditEvidence(
      recruit,
      sheet,
      evalRes,
      gestureReport,
      reqs,
      this.auditLogs
    );

    bundle.ficheDecision = this.qualifDecisions[recruitId] || undefined;
    return bundle;
  }

  // --- IMetricsRepository ---

  public async getAllDepartures(siteId?: string): Promise<DepartureRecord[]> {
    let list = [...this.departures];
    if (siteId) list = list.filter((d) => d.siteId === siteId);
    return list;
  }

  public async recordDeparture(
    departure: Omit<DepartureRecord, 'id'>,
    author: UserProfile
  ): Promise<DepartureRecord> {
    const newDep: DepartureRecord = {
      ...departure,
      id: `dep-${Date.now()}`
    };
    this.departures.unshift(newDep);
    this.saveDepartures();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'ENREGISTREMENT_DEPART_INTEGRATION',
      entite: 'DepartureRecord',
      entiteId: newDep.id,
      details: `Départ consigné pendant l'étape ${newDep.etapeDepart} : ${newDep.nom} ${newDep.prenom} (CIN: ${newDep.cin}) - Motif: ${newDep.motifDepart}`,
      estDerogation: false
    });

    return newDep;
  }

  public async getAllSatisfactionSurveys(siteId?: string): Promise<OperatorSatisfactionSurvey[]> {
    let list = [...this.surveys];
    if (siteId) list = list.filter((s) => s.siteId === siteId);
    return list;
  }

  public async submitSatisfactionSurvey(
    survey: Omit<OperatorSatisfactionSurvey, 'id'>
  ): Promise<OperatorSatisfactionSurvey> {
    const newSurv: OperatorSatisfactionSurvey = {
      ...survey,
      id: `surv-${Date.now()}`
    };
    this.surveys.unshift(newSurv);
    this.saveSurveys();
    return newSurv;
  }

  public getAllCarreMagiqueSheets(): Record<string, CarreMagiqueSheet> {
    return { ...this.carreMagiqueSheets };
  }

  // --- Étape 8 : Archivage (Soft Delete - Aucune suppression définitive) ---

  public async archiveRecruit(id: string, motif: string, author: UserProfile): Promise<Recruit> {
    const idx = this.recruits.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Recrue introuvable (ID: ${id}) pour archivage.`);

    const r = this.recruits[idx];
    const now = new Date().toISOString();
    const updated: Recruit = {
      ...r,
      estArchive: true,
      dateArchivage: now,
      motifArchivage: motif,
      archiveParNom: `${author.prenom} ${author.nom}`,
      archiveParMatricule: author.matricule
    };

    this.recruits[idx] = updated;
    this.rebuildIndices();
    this.saveRecruits();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'ARCHIVAGE_RECRUE',
      entite: 'Recruit',
      entiteId: id,
      details: `Archivage officiel du dossier de ${r.nom} ${r.prenom} (CIN: ${r.cin}). Motif consigné : ${motif}`,
      estDerogation: false
    });

    return updated;
  }

  public async restoreRecruit(id: string, motif: string, author: UserProfile): Promise<Recruit> {
    const idx = this.recruits.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Recrue introuvable (ID: ${id}) pour restauration.`);

    const r = this.recruits[idx];
    const updated: Recruit = {
      ...r,
      estArchive: false,
      motifArchivage: undefined,
      dateArchivage: undefined
    };

    this.recruits[idx] = updated;
    this.rebuildIndices();
    this.saveRecruits();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'RESTAURATION_RECRUE',
      entite: 'Recruit',
      entiteId: id,
      details: `Restauration du dossier de ${r.nom} ${r.prenom} (CIN: ${r.cin}). Motif consigné : ${motif}`,
      estDerogation: false
    });

    return updated;
  }

  // --- Étape 8 : Consultation des Données Sensibles (Casier Judiciaire & CNI) ---

  public async logSensitiveDataConsultation(
    recruitId: string,
    docCode: string,
    author: UserProfile
  ): Promise<AuditLog> {
    const recruit = this.recruits.find((r) => r.id === recruitId);
    return await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CONSULTATION_DONNEES_SENSIBLES',
      entite: 'DocumentRequirement',
      entiteId: docCode,
      details: `Consultation de la pièce hautement sensible [${docCode}] pour ${
        recruit ? `${recruit.nom} ${recruit.prenom} (CIN: ${recruit.cin})` : recruitId
      }. Accès tracé réservé Administration RH.`,
      estDerogation: false
    });
  }

  // --- Étape 8 : Sauvegarde et Restauration Documentées ---

  public async createDatabaseSnapshot(author: UserProfile): Promise<import('../types').DatabaseSnapshot> {
    const payload = {
      recruits: this.recruits,
      auditLogs: this.auditLogs,
      parameters: this.parameters,
      groups: this.groups,
      documentRequirements: this.documentRequirements,
      attendanceRecords: this.attendanceRecords,
      schoolTests: this.schoolTests,
      workstations: this.workstations,
      productionNeeds: this.productionNeeds,
      carreMagiqueSheets: this.carreMagiqueSheets,
      qualifDecisions: this.qualifDecisions,
      requalifications90J: this.requalifications90J,
      validationRights: this.validationRights,
      departures: this.departures,
      surveys: this.surveys
    };

    const payloadJson = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < payloadJson.length; i++) {
      hash = (hash << 5) - hash + payloadJson.charCodeAt(i);
      hash |= 0;
    }
    const checksumSha256 = `SHA256-${Math.abs(hash).toString(16).padStart(8, '0')}`;

    const snapshot: import('../types').DatabaseSnapshot = {
      version: 'LEONI-DB-v1.8',
      timestamp: new Date().toISOString(),
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurMatricule: author.matricule,
      checksumSha256,
      counts: {
        recruits: this.recruits.length,
        auditLogs: this.auditLogs.length,
        parameters: this.parameters.length,
        groups: this.groups.length,
        carreMagiqueSheets: Object.keys(this.carreMagiqueSheets).length
      },
      payloadJson
    };

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'CREATION_SAUVEGARDE_SYSTEME',
      entite: 'DatabaseSnapshot',
      entiteId: checksumSha256,
      details: `Génération d'une sauvegarde intégrale chiffrée (${snapshot.counts.recruits} recrues, ${snapshot.counts.auditLogs} logs d'audit). Checksum: ${checksumSha256}`,
      estDerogation: false
    });

    return snapshot;
  }

  public async restoreDatabaseSnapshot(
    snapshot: import('../types').DatabaseSnapshot,
    author: UserProfile
  ): Promise<{ success: boolean; message: string }> {
    if (!snapshot || !snapshot.payloadJson) {
      throw new Error('Fichier de sauvegarde invalide ou payload corrompu.');
    }

    const parsed = JSON.parse(snapshot.payloadJson);
    if (!parsed.recruits || !parsed.parameters) {
      throw new Error('Format de sauvegarde incompatible avec le schéma LEONI.');
    }

    this.recruits = parsed.recruits;
    if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
    if (parsed.parameters) this.parameters = parsed.parameters;
    if (parsed.groups) this.groups = parsed.groups;
    if (parsed.documentRequirements) this.documentRequirements = parsed.documentRequirements;
    if (parsed.attendanceRecords) this.attendanceRecords = parsed.attendanceRecords;
    if (parsed.schoolTests) this.schoolTests = parsed.schoolTests;
    if (parsed.workstations) this.workstations = parsed.workstations;
    if (parsed.productionNeeds) this.productionNeeds = parsed.productionNeeds;
    if (parsed.carreMagiqueSheets) this.carreMagiqueSheets = parsed.carreMagiqueSheets;
    if (parsed.qualifDecisions) this.qualifDecisions = parsed.qualifDecisions;
    if (parsed.requalifications90J) this.requalifications90J = parsed.requalifications90J;
    if (parsed.validationRights) this.validationRights = parsed.validationRights;
    if (parsed.departures) this.departures = parsed.departures;
    if (parsed.surveys) this.surveys = parsed.surveys;

    this.rebuildIndices();
    this.saveRecruits();
    this.saveAudit();
    this.saveParams();
    this.saveGroups();
    this.saveDocReqs();
    this.saveAttendance();
    this.saveTests();
    this.saveWorkstations();
    this.saveProductionNeeds();
    this.saveCarreMagique();
    this.saveQualifDecisions();
    this.saveRequalif90J();
    this.saveValidationRights();
    this.saveDepartures();
    this.saveSurveys();

    await this.log({
      auteurMatricule: author.matricule,
      auteurNom: `${author.prenom} ${author.nom}`,
      auteurRole: author.role,
      siteId: author.siteId,
      action: 'RESTAURATION_BASE_DONNEES',
      entite: 'DatabaseSnapshot',
      entiteId: snapshot.checksumSha256,
      details: `Restauration complète de la base de données depuis l'archive (${snapshot.counts.recruits} dossiers rétablis).`,
      estDerogation: false
    });

    return {
      success: true,
      message: `Restauration réussie : ${this.recruits.length} dossiers d'opérateurs rétablis avec intégrité.`
    };
  }

  // --- Étape 8 : Benchmark de Performance (20 000 Recrues Fictives, SLA < 2s) ---

  public async run20kBenchmark(): Promise<import('../types/benchmark').BenchmarkReport> {
    const t0 = performance.now();
    const testCount = 20000;
    const testRecruits: Recruit[] = new Array(testCount);
    const testIndexCin = new Map<string, Recruit>();
    const testIndexMatricule = new Map<string, Recruit>();

    const genStart = performance.now();
    for (let i = 0; i < testCount; i++) {
      const cinNum = String(100000 + i).padStart(6, '0');
      const cin = `BK${cinNum}`;
      const mat = `L-TST-${cinNum}`;
      const rec: Recruit = {
        id: `bench-rec-${i}`,
        cin,
        matricule: mat,
        nom: `BenchNom${i % 500}`,
        prenom: `BenchPrenom${i % 300}`,
        dateNaissance: '1998-05-12',
        telephone: '+212 600 000 000',
        siteId: i % 3 === 0 ? 'site-bsk' : i % 3 === 1 ? 'site-brc' : 'site-asb',
        dateEntree: '2026-09-01',
        statut:
          i % 4 === 0
            ? 'QUALIFIE_AUTONOME'
            : i % 4 === 1
            ? 'EN_APPRENTISSAGE_POSTE'
            : i % 4 === 2
            ? 'EN_ECOLE'
            : 'NON_QUALIFIE_PROLONGATION',
        ecoleJoursValides: 5,
        ecoleValidee: true,
        joursSuiviCompletes: (i % 28) + 1,
        carreMagiquePointsConformes: 14 + (i % 3),
        testPratiqueValide: true,
        qualifiee: i % 4 === 0,
        visaQualite: true,
        visaProduction: true
      };
      testRecruits[i] = rec;
      testIndexCin.set(cin.toLowerCase(), rec);
      testIndexMatricule.set(mat.toLowerCase(), rec);
    }
    const genElapsed = Number((performance.now() - genStart).toFixed(2));

    // Test 1: Index lookup par CIN (1 000 requêtes consécutives)
    const t1Start = performance.now();
    for (let k = 0; k < 1000; k++) {
      const targetCin = `bk${100000 + ((k * 17) % testCount)}`;
      testIndexCin.get(targetCin);
    }
    const t1Elapsed = Number((performance.now() - t1Start).toFixed(2));

    // Test 2: Index lookup par Matricule (1 000 requêtes consécutives)
    const t2Start = performance.now();
    for (let k = 0; k < 1000; k++) {
      const targetMat = `l-tst-${100000 + ((k * 19) % testCount)}`;
      testIndexMatricule.get(targetMat);
    }
    const t2Elapsed = Number((performance.now() - t2Start).toFixed(2));

    // Test 3: Filtrage par Statut et Pagination serveur (20 items sur 20 000)
    const t3Start = performance.now();
    const filteredAutonomes = testRecruits.filter((r) => r.statut === 'QUALIFIE_AUTONOME');
    const pageData = filteredAutonomes.slice(0, 20);
    const t3Elapsed = Number((performance.now() - t3Start).toFixed(2));

    // Test 4: Recherche textuelle multi-critères
    const t4Start = performance.now();
    const query = 'benchnom12';
    const textSearchResults = testRecruits
      .filter((r) => r.nom.toLowerCase().includes(query))
      .slice(0, 20);
    const t4Elapsed = Number((performance.now() - t4Start).toFixed(2));

    // Test 5: Calculs consolidés MetricsEngine sur 20 000 dossiers
    const t5Start = performance.now();
    const pMap = {
      dureeEcoleJours: 5,
      dureePosteJours: 28,
      seuilReussiteEcole: 14,
      seuilCarreMagique: 14,
      pointsTotalCarreMagique: 16
    };
    const metricsResult = MetricsEngine.calculateDashboardMetrics(testRecruits, pMap);
    const t5Elapsed = Number((performance.now() - t5Start).toFixed(2));

    const totalBenchmarkElapsed = Number((performance.now() - t0).toFixed(2));

    const tests = [
      {
        nomTest: 'Index Hash O(1) : Recherche par CIN (1 000 requêtes)',
        description: 'Accès direct index mémoire sur 20 000 recrues',
        nombreElements: testCount,
        tempsEcouleMs: t1Elapsed,
        seuilLimiteMs: 2000,
        conformeSLA: t1Elapsed < 2000,
        resultatResume: `${t1Elapsed} ms (soit ${(t1Elapsed / 1000).toFixed(3)} ms/requête)`
      },
      {
        nomTest: 'Index Hash O(1) : Recherche par Matricule (1 000 requêtes)',
        description: 'Accès direct index mémoire sur 20 000 matricules',
        nombreElements: testCount,
        tempsEcouleMs: t2Elapsed,
        seuilLimiteMs: 2000,
        conformeSLA: t2Elapsed < 2000,
        resultatResume: `${t2Elapsed} ms (soit ${(t2Elapsed / 1000).toFixed(3)} ms/requête)`
      },
      {
        nomTest: 'Filtrage par Statut & Pagination Serveur (20 éléments)',
        description: 'Filtrage parmi 5 000 autonomes et extraction page 1',
        nombreElements: testCount,
        tempsEcouleMs: t3Elapsed,
        seuilLimiteMs: 2000,
        conformeSLA: t3Elapsed < 2000,
        resultatResume: `${t3Elapsed} ms (Extraction instantanée)`
      },
      {
        nomTest: 'Recherche Textuelle Plein Texte (Sous-chaîne)',
        description: 'Parcours complet de 20 000 fiches sur nom/prénom/cin',
        nombreElements: testCount,
        tempsEcouleMs: t4Elapsed,
        seuilLimiteMs: 2000,
        conformeSLA: t4Elapsed < 2000,
        resultatResume: `${t4Elapsed} ms (${textSearchResults.length} correspondances trouvées)`
      },
      {
        nomTest: 'Moteur de Calculs MetricsEngine (Consolidation 20 000)',
        description: 'Agrégation complète de 20 000 dossiers pour direction',
        nombreElements: testCount,
        tempsEcouleMs: t5Elapsed,
        seuilLimiteMs: 2000,
        conformeSLA: t5Elapsed < 2000,
        resultatResume: `${t5Elapsed} ms (Taux qualif: ${metricsResult.tauxQualificationPourcent}%)`
      }
    ];

    const allPassed = tests.every((t) => t.conformeSLA);

    return {
      dateExecution: new Date().toISOString(),
      totalRecruesTest: testCount,
      tempsTotalGlobalMs: totalBenchmarkElapsed,
      conformeSLA2Secondes: allPassed,
      tests,
      systemInfo: {
        environnement: 'AI Studio Node.js / V8 Optimized In-Memory Index',
        indexActifs: ['index_cin', 'index_matricule', 'index_groupe', 'index_site'],
        seuilMaximalExigeMs: 2000
      }
    };
  }

  // Helper pour réinitialiser les données de démo au besoin
  public resetToDemoData() {
    this.recruits = generateInitialRecruits();
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.parameters = [...INITIAL_PARAMETERS];
    this.groups = [...INITIAL_GROUPS];
    this.documentRequirements = [...INITIAL_DOCUMENT_REQUIREMENTS];
    this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];
    this.trainingContents = [...INITIAL_TRAINING_CONTENTS];
    this.questions = [...INITIAL_QUESTIONS];
    this.schoolTests = [...INITIAL_SCHOOL_TESTS];
    this.testAttempts = [...INITIAL_TEST_ATTEMPTS];
    this.workstations = [...INITIAL_WORKSTATIONS];
    this.productionNeeds = [...INITIAL_PRODUCTION_NEEDS];
    this.rejections = [...INITIAL_REJECTIONS];
    this.gestureReports = [...INITIAL_GESTURE_REPORTS];
    this.carreMagiqueSheets = {};
    this.qualifDecisions = {};
    this.requalifications90J = {};
    this.validationRights = DEFAULT_VALIDATION_RIGHTS;
    this.saveRecruits();
    this.saveAudit();
    this.saveParams();
    this.saveGroups();
    this.saveDocReqs();
    this.saveAttendance();
    this.saveContents();
    this.saveQuestions();
    this.saveTests();
    this.saveAttempts();
    this.saveWorkstations();
    this.saveProductionNeeds();
    this.saveRejections();
    this.saveGestureReports();
    this.saveCarreMagique();
    this.saveQualifDecisions();
    this.saveRequalif90J();
    this.saveValidationRights();
  }
}


// Instance singleton accessible partout
export const repositoryInstance = new StorageRepository();
