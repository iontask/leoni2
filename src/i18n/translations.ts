/**
 * LEONI QualiTrack - Dictionnaire de libellés bilingue (Français / Arabe)
 * Terminologie métier câblage automobile
 */

import { RecruitStatus, StationTypology, UserRole } from '../types';

export const TRANSLATIONS = {
  fr: {
    // App & Header
    appTitle: 'LEONI QualiTrack',
    appSubtitle: 'Plateforme Industrielle d’Intégration & Qualification',
    site: 'Site',
    userRole: 'Profil / Rôle',
    connectedAs: 'Connecté en tant que',
    logout: 'Déconnexion',
    switchRole: 'Changer de profil',
    language: 'Langue',
    searchPlaceholder: 'Rechercher par CIN, nom, matricule ou groupe...',
    allSites: 'Tous les sites LEONI',
    filterBySite: 'Filtrer par site',
    
    // Modules navigation
    navDossiers: 'Administration Dossiers',
    navEcole: 'École de Formation (5j)',
    navAffectation: 'Affectation & Tests',
    navSuiviPoste: 'Suivi au Poste (28j)',
    navQualification: 'Validation Qualification',
    navIndicateurs: 'Tableau des Indicateurs',
    navParametrage: 'Paramétrage Central',
    navAudit: 'Journal d’Audit',

    // Statuts de qualification
    status_EN_ECOLE: 'En école de formation',
    status_EN_APPRENTISSAGE_POSTE: 'En apprentissage au poste',
    status_QUALIFIE_AUTONOME: 'Qualifié autonome (Production)',
    status_NON_QUALIFIE_PROLONGATION: 'Non qualifié (En prolongation)',

    // Typologies de poste
    typology_PLANCHE_ASSEMBLAGE: 'Planche d’assemblage',
    typology_TOUFIX_CLIPSAGE: 'Toufix & Clipsage',
    typology_TEST_ELECTRIQUE_TNC: 'Test Électrique (TNC)',
    typology_ENCLIQUETAGE_CONNECTEUR: 'Encliquetage connecteur',
    typology_BANDAGE_RUBANAGE: 'Bandage & Rubanage',
    typology_SERTISSAGE_MANUEL: 'Sertissage manuel & Contrôle',

    // Rôles
    role_ADMINISTRATION: 'Administration RH',
    role_FORMATEUR_ECOLE: 'Formateur École',
    role_FORMATEUR_TERRAIN: 'Formateur Terrain',
    role_AQL: 'Auditeur Qualité Ligne (AQL)',
    role_SHIFT_LEADER: 'Chef d’Équipe (Shift Leader)',
    role_RESPONSABLE_PRODUCTION: 'Resp. Fabrication / RFM',
    role_QUALITE: 'Responsable Qualité',
    role_REFERENT_LEARNING: 'Référent Formation & Learning',
    role_DRH_DIRECTION: 'Direction & DRH',
    role_ADMIN: 'Administrateur Système',

    // Vocabulaire atelier
    cin: 'N° CIN',
    matricule: 'Matricule',
    fullName: 'Nom et Prénom',
    birthDate: 'Date de naissance',
    phone: 'Téléphone',
    entryDate: 'Date d’entrée',
    group: 'Groupe École',
    station: 'Poste de travail',
    segment: 'Segment',
    line: 'Ligne',
    board: 'Planche',
    trainer: 'Formateur',
    schoolDays: 'Jours École',
    postDays: 'Jours au Poste',
    carreMagique: 'Carré Magique',
    complianceAQL: 'Taux AQL',
    theoryScore: 'Test Théorique',
    practiceScore: 'Test Pratique',
    qualifVisa: 'Visa de qualification',
    visaQuality: 'Visa Qualité',
    visaProd: 'Visa Production (RFM)',

    // Actions & Boutons (cibles tactiles)
    actions: 'Actions',
    viewDetails: 'Consulter la fiche',
    edit: 'Modifier',
    validate: 'Valider',
    refuse: 'Refuser',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    filter: 'Filtrer',
    reset: 'Réinitialiser',
    massImport: 'Import en masse (CSV/Excel)',
    newRecruit: 'Nouvelle recrue',
    requestDerogation: 'Dérogation exceptionnelle',
    exportData: 'Exporter',
    printPaperTest: 'Imprimer version papier',
    
    // Poka-Yoke & Sécurité
    pokaYokeAlertTitle: 'Règle de verrouillage (Poka-Yoke)',
    pokaYokeLocked: 'Action bloquée par règle qualité',
    pokaYokeDerogationTitle: 'Demande de dérogation formelle',
    pokaYokeReasonPlaceholder: 'Motif impératif de la dérogation (obligatoire, audité)...',
    pokaYokeAuthorizedRoles: 'Rôles habilités pour cette dérogation',
    pokaYokeSignAndProceed: 'Signer la dérogation et forcer',
    pokaYokeWarning: 'Toute dérogation est enregistrée nominativement dans le registre d’audit LEONI.',

    // Messages & Statuts
    noDataFound: 'Aucune recrue trouvée avec ces critères.',
    itemsCount: 'recrues affichées',
    page: 'Page',
    of: 'sur',
    previous: 'Précédent',
    next: 'Suivant',
    rowsPerPage: 'Lignes par page',
    auditBadge: 'Audit & Traçabilité active',
    demoNote: 'Données de démonstration fictives générées pour le site pilote LEONI Maroc.',
    multiSiteAlert: 'Attention : antécédent détecté sur un autre site LEONI pour ce CIN.',
    
    // Paramétrage
    paramVersion: 'Version',
    paramLastModified: 'Dernière modification',
    paramAuthor: 'Signé par',
    paramReason: 'Motif du changement',
    paramSaveNewVersion: 'Valider nouvelle version paramètre',

    // École de formation (Étape 3)
    tabAttendance: 'Pointage Quotidien',
    tabSupports: 'Supports & Bibliothèque',
    tabQuestions: 'Banque & Tests',
    tabPassation: 'Passation & Correction',
    tabDecision: 'Décision Fin d’École & Contacts',
    allPresentButton: 'Tous présents (1 clic)',
    allPresentSuccess: 'Toutes les recrues ont été pointées PRÉSENTES avec succès.',
    markPresent: 'Présent',
    markLate: 'Retard',
    markAbsent: 'Absent',
    markDropout: 'Abandon',
    lateMinutes: 'Minutes de retard',
    absenceReason: 'Motif de l’absence',
    attendanceRate: 'Taux d’assiduité',
    consultTrainingDoc: 'Consulter le support',
    markAsConsulted: 'Marquer comme consulté',
    alreadyConsulted: 'Consulté',
    generateTestTitle: 'Générateur de test (< 5 min)',
    modeTablet: 'Passation Tablette',
    modePaper: 'Version Papier Imprimable',
    modeQuickGrading: 'Saisie Rapide Formateur',
    answerGrid: 'Grille de réponses',
    submitExam: 'Soumettre l’examen',
    decisionAdmis: 'ADMIS (Passage en production)',
    decisionRevoir: 'À REVOIR (Rattrapage)',
    decisionNonAdmis: 'NON ADMIS (Échec)',
    autoTransferNotice: 'Le passage au statut ADMIS transfère automatiquement le dossier vers le Module 3 (Affectation au poste).',
    groupContacts: 'Répertoire de contact du groupe',
    whatsappMessageTemplate: 'Modèle de convocation SMS / WhatsApp',
    copyPhoneList: 'Copier les numéros',

    // Étape 4 : Affectation aux Postes selon Typologie & Tests
    tabCatalogue: 'Catalogue Postes & Besoins',
    tabSmartAssignment: 'Affectation Intelligente (J5+)',
    tabAIPracticalTest: 'Test Pratique Assisté par IA',
    tabWorkstationRules: 'Règles & Postes Critiques',
    workstationInitial: 'Poste Initial (Accessible Débutants)',
    workstationCritical: 'Poste Critique (Haut Risque Qualité)',
    workstationPrerequisites: 'Prérequis d’accès au poste',
    productionNeedsTitle: 'Besoins de Production Ouverts',
    addProductionNeed: 'Nouveau besoin de production',
    whyThisSuggestion: 'Pourquoi cette suggestion ?',
    rejectSuggestion: 'Refuser la suggestion',
    rejectionReasonPrompt: 'Motif impératif du refus',
    confirmAssignment: 'Valider l’affectation au poste',
    aiAssistantBadge: 'Suggestion IA, à valider par le formateur',
    aiAssistantNotice: 'L’assistant IA analyse le geste et fournit des observations objectives. Aucun résultat IA n’est enregistré comme décision sans validation explicite du formateur.',
    uploadGestureMedia: 'Photo ou média du geste',
    analyzeWithAI: 'Analyser avec l’Assistant IA',
    observationFormateur: 'Observation / Correction Formateur',
    savePracticalEvaluation: 'Enregistrer l’évaluation pratique',
    criticalPostLockWarning: 'Verrou Poka-Yoke Poste Critique : Les prérequis spécifiques (assiduité 100%, note ≥ 16/20, diplôme et test geste) sont obligatoires.',

    // Étape 4 Métier : 28 Jours de Suivi au Poste et Carré Magique
    tabCarreMagiqueSheet: 'Fiche 28 Jours & Carré Magique',
    tabTodayTrainer: 'À faire aujourd’hui (Formateur)',
    tabExcelBenchmark: 'Test Barème Excel (Validation auto)',
    reasonForFollowup: 'Raison du suivi',
    teamShift: 'Équipe',
    workstationFamily: 'Famille de poste',
    startDate: 'Date début de suivi',
    qualityTarget: 'Objectif Qualité (Q)',
    productivityTarget: 'Objectif Productivité (P)',
    targetMet: 'Atteint',
    targetNotMet: 'Non atteint',
    defectsCount: 'Nombre de défauts',
    defectTypes: 'Types de défauts',
    defectTypesList: 'Types de défauts atelier',
    consecutiveStreak: 'Série Q&P consécutive',
    streakBanner: 'Série consécutive en cours',
    levelUAcquired: 'Niveau U acquis (28 jours consécutifs)',
    pokaYokeDefectAlert: 'Alerte Poka-Yoke : Dépassement de 4 défauts/jour',
    pokaYokeDefectExplanation: 'L’opérateur doit obligatoirement refaire la formation suite au dépassement du seuil journalier.',
    phase1Title: 'PHASE 1 : Niveau I — Maîtrise dans les 4 premiers jours (Total 0,24)',
    phase2Title: 'PHASE 2 : Niveau L — Maîtrise dans les 10 premiers jours (Total 0,50)',
    phase3Title: 'PHASE 3 : Niveau U — Maîtrise jusqu’au 28e jour (Total 0,26)',
    requalifTitle: 'REQUALIFICATION À 90 JOURS — Carré fermé (Total 1,00)',
    blockingCriterionBadge: 'BLOQUANT',
    officialDecision: 'Dispositif de Décision Finale',
    scoreSummary: 'Synthèse des Scores Officiels',
    printOfficialCanvas: 'Imprimer le canevas officiel LEONI',
    signWithPin: 'Viser avec code personnel',
    personalPinCode: 'Code PIN personnel',

    // Étape 5 - Validation de la Qualification
    qualifTabDecisions: 'Fiche & Décision de Qualification',
    qualifTabAuditVault: 'Coffre-fort Preuves d’Audit (< 2 min)',
    qualifTabRequalif90J: 'Requalification 90J (Carré Fermé)',
    qualifTabRights: 'Matrice des Droits & Habilitations',
    passportQualification: 'Passeport de Qualification',
    decisionAutonome: 'Qualifié Autonome',
    decisionSuiviRenforce: 'Validé avec suivi renforcé',
    decisionFormationCiblee: 'Formation complémentaire ciblée',
    decisionNonValideProlongation: 'Non validé, prolongation du cursus',
    operatorAuditDossier: 'Dossier d’Audit de l’Opérateur',
    searchAuditorPlaceholder: 'Rechercher par CIN, Matricule, Nom, Ligne ou Poste...',
    auditProofCompleteness: 'Indice de complétude des preuves',
    auditSearchSpeed: 'Temps de recherche : < 10 secondes',
    requalifCountdown: 'Compte à rebours avant réévaluation',
    retrogradeWarning: 'Règle Poka-Yoke : Si les critères R1 à R7 ne sont pas validés, retour immédiat au Niveau L',
    authorizedDerogation: 'Dérogation formelle habilitée',
    prolongationTitle: 'Prolongation de formation',
    newTargetDate: 'Nouvelle date de fin'
  },

  ar: {
    // App & Header
    appTitle: 'ليوني كواليتراك',
    appSubtitle: 'المنصة الصناعية للتأهيل والإدماج - لوني المغرب',
    site: 'الموقع الصناعي',
    userRole: 'الملف / الدور',
    connectedAs: 'متصل بصوت',
    logout: 'تسجيل الخروج',
    switchRole: 'تغيير الملف',
    language: 'اللغة',
    searchPlaceholder: 'بحث برقم البطاقة الوطنية، الاسم، الرقم المهني أو الفوج...',
    allSites: 'جميع مواقع ليوني',
    filterBySite: 'تصفية حسب الموقع',
    
    // Modules navigation
    navDossiers: 'إدارة الملفات والمستفيدين',
    navEcole: 'مدرسة التكوين (5 أيام)',
    navAffectation: 'التوجيه والاختبارات',
    navSuiviPoste: 'تتبع مركز العمل (28 يوماً)',
    navQualification: 'مصادقة التأهيل النهائي',
    navIndicateurs: 'لوحة المؤشرات',
    navParametrage: 'الإعدادات المركزية',
    navAudit: 'سجل التتبع والتدقيق',

    // Statuts de qualification
    status_EN_ECOLE: 'في مدرسة التكوين',
    status_EN_APPRENTISSAGE_POSTE: 'في مرحلة التعلم بمركز العمل',
    status_QUALIFIE_AUTONOME: 'مؤهل مستقل (جاهز للإنتاج)',
    status_NON_QUALIFIE_PROLONGATION: 'غير مؤهل (فترة تمديد إضافية)',

    // Typologies de poste
    typology_PLANCHE_ASSEMBLAGE: 'لوحة التجميع (Planche)',
    typology_TOUFIX_CLIPSAGE: 'توفيكس وتثبيت المشابك (Toufix)',
    typology_TEST_ELECTRIQUE_TNC: 'الفحص الكهربائي (TNC)',
    typology_ENCLIQUETAGE_CONNECTEUR: 'تركيب الموصلات',
    typology_BANDAGE_RUBANAGE: 'العزل واللف الشريطي',
    typology_SERTISSAGE_MANUEL: 'الكبس اليدوي والمراقبة',

    // Rôles
    role_ADMINISTRATION: 'إدارة الموارد البشرية',
    role_FORMATEUR_ECOLE: 'مدرب المدرسة',
    role_FORMATEUR_TERRAIN: 'مدرب ورشة الإنتاج',
    role_AQL: 'مراقب جودة الخط (AQL)',
    role_SHIFT_LEADER: 'رئيس الفريق (Shift Leader)',
    role_RESPONSABLE_PRODUCTION: 'مسؤول الإنتاج (RFM)',
    role_QUALITE: 'مسؤول إدارة الجودة',
    role_REFERENT_LEARNING: 'المسؤول المرجعي للتكوين',
    role_DRH_DIRECTION: 'إدارة الموارد البشرية والمديرية',
    role_ADMIN: 'مسؤول النظام',

    // Vocabulaire atelier
    cin: 'رقم البطاقة الوطنية',
    matricule: 'الرقم المهني',
    fullName: 'الاسم والنسب',
    birthDate: 'تاريخ الازدياد',
    phone: 'رقم الهاتف',
    entryDate: 'تاريخ الدخول',
    group: 'فوج التكوين',
    station: 'مركز العمل',
    segment: 'القطاع',
    line: 'خط الإنتاج',
    board: 'اللوحة',
    trainer: 'المؤطر / المدرب',
    schoolDays: 'أيام المدرسة',
    postDays: 'أيام مركز العمل',
    carreMagique: 'المربع السحري (Carré Magique)',
    complianceAQL: 'نسبة مطابقة الجودة (AQL)',
    theoryScore: 'الاختبار النظري',
    practiceScore: 'الاختبار التطبيقي',
    qualifVisa: 'تأشيرة التأهيل',
    visaQuality: 'تأشيرة الجودة',
    visaProd: 'تأشيرة الإنتاج (RFM)',

    // Actions & Boutons
    actions: 'إجراءات',
    viewDetails: 'عرض الملف',
    edit: 'تعديل',
    validate: 'مصادقة',
    refuse: 'رفض',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
    filter: 'تصفية',
    reset: 'إعادة ضبط',
    massImport: 'استيراد جماعي (CSV/Excel)',
    newRecruit: 'مستفيد جديد',
    requestDerogation: 'طلب استثناء إداري',
    exportData: 'تصدير البيانات',
    printPaperTest: 'طباعة نسخة ورقية',

    // Poka-Yoke & Sécurité
    pokaYokeAlertTitle: 'قاعدة الإقفال الوقائي (Poka-Yoke)',
    pokaYokeLocked: 'الإجراء مقفل بموجب معايير الجودة',
    pokaYokeDerogationTitle: 'طلب استثناء استثنائي ومبرر',
    pokaYokeReasonPlaceholder: 'سبب الاستثناء الإلزامي (مفروض ومسجل في التدقيق)...',
    pokaYokeAuthorizedRoles: 'الأدوار المخولة بمنح هذا الاستثناء',
    pokaYokeSignAndProceed: 'توقيع الاستثناء والمتابعة',
    pokaYokeWarning: 'كل استثناء يسجل اسمياً في سجل التدقيق الرسمي لشركة ليوني.',

    // Messages & Statuts
    noDataFound: 'لم يتم العثور على أي مستفيد وفق هذه المعايير.',
    itemsCount: 'مستفيد معروض',
    page: 'الصفحة',
    of: 'من',
    previous: 'السابق',
    next: 'التالي',
    rowsPerPage: 'الأسطر في كل صفحة',
    auditBadge: 'سجل التتبع والتدقيق مفعل',
    demoNote: 'بيانات افتراضية مخصصة للعرض في الموقع النموذجي ليوني المغرب.',
    multiSiteAlert: 'تنبيه : تم رصد سوابق مسجلة لهذا المعرف في موقع آخر لشركة ليوني.',

    // Paramétrage
    paramVersion: 'الإصدار',
    paramLastModified: 'تاريخ آخر تعديل',
    paramAuthor: 'موقع من طرف',
    paramReason: 'سبب التعديل',
    paramSaveNewVersion: 'المصادقة على إصدار جديد للمعيار',

    // مدرسة التكوين (المرحلة 3)
    tabAttendance: 'التسجيل اليومي للحضور',
    tabSupports: 'المكتبة ودعامات التكوين',
    tabQuestions: 'بنك الأسئلة والاختبارات',
    tabPassation: 'إجراء الاختبار والتصحيح',
    tabDecision: 'قرار التخرج وبيانات الاتصال',
    allPresentButton: 'الجميع حاضرون (ضغطة واحدة)',
    allPresentSuccess: 'تم تسجيل جميع المستفيدين حاضرين بنجاح.',
    markPresent: 'حاضر',
    markLate: 'تأخر',
    markAbsent: 'غائب',
    markDropout: 'انقطاع',
    lateMinutes: 'دقائق التأخير',
    absenceReason: 'مبرر الغياب',
    attendanceRate: 'نسبة المواظبة',
    consultTrainingDoc: 'الاطلاع على المحتوى',
    markAsConsulted: 'تحديد كتم الاطلاع',
    alreadyConsulted: 'تم الاطلاع',
    generateTestTitle: 'منشئ الاختبارات السريع (< 5 دقائق)',
    modeTablet: 'إجراء عبر اللوحة الإلكترونية',
    modePaper: 'نسخة ورقية قابلة للطباعة',
    modeQuickGrading: 'التنقيط السريع للمؤطر',
    answerGrid: 'شبكة الإجابات',
    submitExam: 'تسجيل نتائج الاختبار',
    decisionAdmis: 'مؤهل للمرور (ناجح للإنتاج)',
    decisionRevoir: 'استدراك للمراجعة',
    decisionNonAdmis: 'غير مؤهل (راسب)',
    autoTransferNotice: 'النجاح في المدرسة يحول الملف آلياً إلى وحدة التوجيه نحو مراكز العمل (الوحدة 3).',
    groupContacts: 'دليل أرقام وبيانات تواصل الفوج',
    whatsappMessageTemplate: 'نموذج استدعاء عبر واتساب / رسالة نصية',
    copyPhoneList: 'نسخ أرقام الهواتف',

    // Étape 4 : Affectation aux Postes selon Typologie & Tests
    tabCatalogue: 'دليل المناصب والاحتياجات',
    tabSmartAssignment: 'التوجيه الذكي للمناصب (J5+)',
    tabAIPracticalTest: 'الاختبار التطبيقي المساعد بالذكاء الاصطناعي',
    tabWorkstationRules: 'قواعد المناصب الحرجة والوقاية',
    workstationInitial: 'مركز أولي (متاح للمبتدئين)',
    workstationCritical: 'مركز حرج (عالي الدقة والمخاطر)',
    workstationPrerequisites: 'شروط الولوج المسبقة للمركز',
    productionNeedsTitle: 'الاحتياجات المفتوحة بالإنتاج',
    addProductionNeed: 'إضافة احتياج إنتاجي جديد',
    whyThisSuggestion: 'لماذا هذا الاقتراح ؟',
    rejectSuggestion: 'رفض الاقتراح',
    rejectionReasonPrompt: 'السبب الإلزامي لرفض الاقتراح',
    confirmAssignment: 'المصادقة على التوجيه لمركز العمل',
    aiAssistantBadge: 'اقتراح ذكاء اصطناعي، يستوجب مصادقة المؤطر',
    aiAssistantNotice: 'يحلل المساعد الآلي الحركات ويقدم ملاحظات دقيقة. لا تسجل أي نتيجة آلية كقرار دون مصادقة صريحة من المؤطر.',
    uploadGestureMedia: 'صورة أو تسجيل للحركة التطبيقية',
    analyzeWithAI: 'تحليل عبر المساعد الذكي',
    observationFormateur: 'ملاحظة وتعديل المؤطر المباشر',
    savePracticalEvaluation: 'تسجيل التقييم التطبيقي',
    criticalPostLockWarning: 'إقفال وقائي للمناصب الحرجة : الشروط الخاصة (حضور 100%، نقطة ≥ 16/20، الدبلوم واختبار الحركات) إلزامية.',

    // Étape 4 Métier : 28 Jours de Suivi au Poste et Carré Magique
    tabCarreMagiqueSheet: 'بطاقة 28 يوماً والمربع السحري',
    tabTodayTrainer: 'المهام اليومية (المؤطر الميداني)',
    tabExcelBenchmark: 'اختبار مطابقة الإكسيل (فحص تلقائي)',
    reasonForFollowup: 'سبب التتبع',
    teamShift: 'فوج العمل (الوردية)',
    workstationFamily: 'عائلة مركز العمل',
    startDate: 'تاريخ بداية التتبع',
    qualityTarget: 'هدف الجودة (Q)',
    productivityTarget: 'هدف الإنتاجية (P)',
    targetMet: 'متحقق',
    targetNotMet: 'غير متحقق',
    defectsCount: 'عدد العيوب',
    defectTypes: 'أنواع العيوب',
    defectTypesList: 'قائمة عيوب الورشة المعتمدة',
    consecutiveStreak: 'سلسلة Q&P المتواصلة',
    streakBanner: 'سلسلة الأيام المستوفية قيد الإنجاز',
    levelUAcquired: 'تم اكتساب المستوى U (28 يوماً متتالية)',
    pokaYokeDefectAlert: 'إنذار وقائي : تجاوز 4 عيوب في اليوم',
    pokaYokeDefectExplanation: 'يجب على العامل إعادة مسار التكوين كاملاً لتجاوز الحد الأقصى للعيوب اليومية.',
    phase1Title: 'المرحلة 1 : المستوى I — إتقان العمل في 4 أيام الأولى (المجموع 0,24)',
    phase2Title: 'المرحلة 2 : المستوى L — إتقان العمل في 10 أيام الأولى (المجموع 0,50)',
    phase3Title: 'المرحلة 3 : المستوى U — الاستقلالية حتى اليوم 28 (المجموع 0,26)',
    requalifTitle: 'إعادة التأهيل بعد 90 يوماً — المربع المغلق (المجموع 1,00)',
    blockingCriterionBadge: 'معيار حاسم إجباري',
    officialDecision: 'آلية القرار والمصادقة النهائية',
    scoreSummary: 'ملخص النقط والنتائج الرسمية',
    printOfficialCanvas: 'طباعة النموذج الرسمي المعتمد ليوني',
    signWithPin: 'تأشير الرمز الشخصي',
    personalPinCode: 'الرمز السري الشخصي PIN',

    // Étape 5 - Validation de la Qualification
    qualifTabDecisions: 'بطاقة وقرار التأهيل النهائي',
    qualifTabAuditVault: 'خزينة أدلة التدقيق (أقل من دقيقتين)',
    qualifTabRequalif90J: 'إعادة التأهيل بعد 90 يوماً (المربع المغلق)',
    qualifTabRights: 'مصفوفة صلاحيات المصادقة',
    passportQualification: 'جواز التأهيل الصناعي',
    decisionAutonome: 'مؤهل مستقل',
    decisionSuiviRenforce: 'مصادق مع تتبع معزز',
    decisionFormationCiblee: 'تكوين تكميلي موجه',
    decisionNonValideProlongation: 'غير مصادق مع تمديد الفترة',
    operatorAuditDossier: 'ملف التدقيق الخاص بالعامل',
    searchAuditorPlaceholder: 'بحث برقم البطاقة، الرقم المهني، الاسم أو المنصب...',
    auditProofCompleteness: 'مؤشر اكتمال الأدلة',
    auditSearchSpeed: 'سرعة استرجاع الأدلة : أقل من 10 ثوانٍ',
    requalifCountdown: 'العد التنازلي قبل إعادة التقييم',
    retrogradeWarning: 'قاعدة بوكا-يوكي : إذا لم يتم استيفاء معايير R1-R7، يتم الرجوع الفوري إلى المستوى L',
    authorizedDerogation: 'ترخيص استثنائي رسمي',
    prolongationTitle: 'تمديد فترة التكوين',
    newTargetDate: 'تاريخ الانتهاء الجديد'
  }
};


export function getStatusLabel(status: RecruitStatus, lang: 'fr' | 'ar' = 'fr'): string {
  const key = `status_${status}` as keyof typeof TRANSLATIONS['fr'];
  return TRANSLATIONS[lang][key] || status;
}

export function getRoleLabel(role: UserRole, lang: 'fr' | 'ar' = 'fr'): string {
  const key = `role_${role}` as keyof typeof TRANSLATIONS['fr'];
  return TRANSLATIONS[lang][key] || role;
}

export function getTypologyLabel(typology?: StationTypology, lang: 'fr' | 'ar' = 'fr'): string {
  if (!typology) return lang === 'ar' ? 'غير محدد' : 'Non assigné';
  const key = `typology_${typology}` as keyof typeof TRANSLATIONS['fr'];
  return TRANSLATIONS[lang][key] || typology;
}

/**
 * Formatage strict des dates au format JJ/MM/AAAA
 */
export function formatDateDisplay(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const parts = isoDateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDateString;
  }
}

/**
 * Masquage partiel du CIN pour la protection des données sensibles (Étape 8)
 * Accès en clair réservé exclusivement au rôle ADMINISTRATION et ADMIN.
 * Pour les autres rôles, les caractères centraux sont masqués (ex: BK••••21).
 */
export function maskCIN(cin: string, role?: UserRole): string {
  if (!cin) return '-';
  if (role === 'ADMINISTRATION' || role === 'ADMIN') {
    return cin;
  }
  if (cin.length <= 4) return cin;
  const prefix = cin.slice(0, 2);
  const suffix = cin.slice(-2);
  return `${prefix}••••${suffix}`;
}
