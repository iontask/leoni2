/**
 * LEONI QualiTrack - Jeu de données de démonstration fictif et cohérent
 * Site pilote : LEONI Bouskoura (Câblage Automobile Maroc)
 * Date de référence : 2026-10-23
 */

import {
  AssignmentRejectionRecord,
  AuditLog,
  GestureEvaluationCriterion,
  GestureEvaluationReport,
  ProductionNeed,
  Question,
  Recruit,
  SchoolAttendanceRecord,
  SchoolGroup,
  SchoolTest,
  Site,
  SystemParameter,
  TestAttempt,
  TrainingContent,
  UserProfile,
  Workstation
} from '../types';

export const INITIAL_SITES: Site[] = [
  {
    id: 'site-bsk',
    code: 'LEONI-BSK',
    nom: 'LEONI Bouskoura (Câblage Moteur & Habitacle)',
    ville: 'Casablanca (Bouskoura)',
    pays: 'Maroc',
    estPilote: true
  },
  {
    id: 'site-brc',
    code: 'LEONI-BRC',
    nom: 'LEONI Berrechid (Faisceaux Haute Tension & Batterie)',
    ville: 'Berrechid',
    pays: 'Maroc',
    estPilote: false
  },
  {
    id: 'site-asb',
    code: 'LEONI-ASB',
    nom: 'LEONI Aïn Sebaâ (Systèmes & Connectique Spéciale)',
    ville: 'Casablanca (Aïn Sebaâ)',
    pays: 'Maroc',
    estPilote: false
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-adm-01',
    matricule: 'L-ADM-101',
    nom: 'Alami',
    prenom: 'Samira',
    role: 'ADMINISTRATION',
    siteId: 'site-bsk',
    email: 'samira.alami@leoni.example.com',
    telephone: '+212 661 100 201'
  },
  {
    id: 'usr-trn-01',
    matricule: 'L-TRN-201',
    nom: 'Berrada',
    prenom: 'Hassan',
    role: 'FORMATEUR_ECOLE',
    siteId: 'site-bsk',
    email: 'hassan.berrada@leoni.example.com',
    telephone: '+212 661 100 202'
  },
  {
    id: 'usr-trn-02',
    matricule: 'L-TRN-202',
    nom: 'Cherkaoui',
    prenom: 'Amina',
    role: 'FORMATEUR_ECOLE',
    siteId: 'site-bsk',
    email: 'amina.cherkaoui@leoni.example.com',
    telephone: '+212 661 100 203'
  },
  {
    id: 'usr-trn-03',
    matricule: 'L-TRN-203',
    nom: 'Idrissi',
    prenom: 'Fatima-Zahra',
    role: 'FORMATEUR_ECOLE',
    siteId: 'site-bsk',
    email: 'fatima.idrissi@leoni.example.com',
    telephone: '+212 661 100 204'
  },
  {
    id: 'usr-trn-04',
    matricule: 'L-TRN-301',
    nom: 'El Amrani',
    prenom: 'Youssef',
    role: 'FORMATEUR_TERRAIN',
    siteId: 'site-bsk',
    email: 'youssef.elamrani@leoni.example.com',
    telephone: '+212 661 100 205'
  },
  {
    id: 'usr-trn-05',
    matricule: 'L-TRN-302',
    nom: 'Tazi',
    prenom: 'Sara',
    role: 'FORMATEUR_TERRAIN',
    siteId: 'site-bsk',
    email: 'sara.tazi@leoni.example.com',
    telephone: '+212 661 100 206'
  },
  {
    id: 'usr-trn-06',
    matricule: 'L-TRN-303',
    nom: 'Benjelloun',
    prenom: 'Reda',
    role: 'FORMATEUR_TERRAIN',
    siteId: 'site-bsk',
    email: 'reda.benjelloun@leoni.example.com',
    telephone: '+212 661 100 207'
  },
  {
    id: 'usr-aql-01',
    matricule: 'L-AQL-401',
    nom: 'Bennani',
    prenom: 'Nadia',
    role: 'AQL',
    siteId: 'site-bsk',
    email: 'nadia.bennani@leoni.example.com',
    telephone: '+212 661 100 208'
  },
  {
    id: 'usr-shf-01',
    matricule: 'L-SHF-501',
    nom: 'Mansouri',
    prenom: 'Tariq',
    role: 'SHIFT_LEADER',
    siteId: 'site-bsk',
    email: 'tariq.mansouri@leoni.example.com',
    telephone: '+212 661 100 209'
  },
  {
    id: 'usr-rfm-01',
    matricule: 'L-RFM-601',
    nom: 'Benzekri',
    prenom: 'Karim',
    role: 'RESPONSABLE_PRODUCTION',
    siteId: 'site-bsk',
    email: 'karim.benzekri@leoni.example.com',
    telephone: '+212 661 100 210'
  },
  {
    id: 'usr-qal-01',
    matricule: 'L-QAL-701',
    nom: 'Belkacem',
    prenom: 'Houda',
    role: 'QUALITE',
    siteId: 'site-bsk',
    email: 'houda.belkacem@leoni.example.com',
    telephone: '+212 661 100 211'
  },
  {
    id: 'usr-lrn-01',
    matricule: 'L-LRN-801',
    nom: 'Ouazzani',
    prenom: 'Omar',
    role: 'REFERENT_LEARNING',
    siteId: 'site-bsk',
    email: 'omar.ouazzani@leoni.example.com',
    telephone: '+212 661 100 212'
  },
  {
    id: 'usr-drh-01',
    matricule: 'L-DRH-901',
    nom: 'Chraibi',
    prenom: 'Leila',
    role: 'DRH_DIRECTION',
    siteId: 'site-bsk',
    email: 'leila.chraibi@leoni.example.com',
    telephone: '+212 661 100 213'
  },
  {
    id: 'usr-sys-01',
    matricule: 'L-SYS-001',
    nom: 'Bouzidi',
    prenom: 'Mehdi',
    role: 'ADMIN',
    siteId: 'site-bsk',
    email: 'mehdi.bouzidi@leoni.example.com',
    telephone: '+212 661 100 214'
  }
];

export const INITIAL_GROUPS: SchoolGroup[] = [
  {
    id: 'grp-01',
    code: 'GRP-2026-A',
    siteId: 'site-bsk',
    formateurId: 'usr-trn-01',
    dateDebut: '2026-10-12',
    dateFinPrevue: '2026-10-16',
    statut: 'CLOTURE'
  },
  {
    id: 'grp-02',
    code: 'GRP-2026-B',
    siteId: 'site-bsk',
    formateurId: 'usr-trn-02',
    dateDebut: '2026-10-19',
    dateFinPrevue: '2026-10-23',
    statut: 'EN_COURS'
  },
  {
    id: 'grp-03',
    code: 'GRP-2026-C',
    siteId: 'site-bsk',
    formateurId: 'usr-trn-03',
    dateDebut: '2026-10-26',
    dateFinPrevue: '2026-10-30',
    statut: 'A_VENIR'
  }
];

export const INITIAL_PARAMETERS: SystemParameter[] = [
  {
    id: 'param-01',
    cle: 'DUREE_ECOLE_JOURS',
    valeur: 5,
    unite: 'jours',
    description: 'Nombre de jours obligatoires de formation initiale à l’école de câblage.',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Standardisation industrielle LEONI Maroc - Révision annuelle'
  },
  {
    id: 'param-02',
    cle: 'DUREE_POSTE_JOURS',
    valeur: 28,
    unite: 'jours',
    description: 'Durée obligatoire du cycle de suivi et d’apprentissage au poste de travail.',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Standardisation du parcours 33 jours (5j école + 28j poste)'
  },
  {
    id: 'param-03',
    cle: 'SEUIL_REUSSITE_ECOLE_NOTE',
    valeur: 14,
    unite: '/20',
    description: 'Note minimale requise à l’évaluation théorique et pratique de l’école de câblage.',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Norme d’exigence qualité zéro défaut LEONI'
  },
  {
    id: 'param-04',
    cle: 'SEUIL_CARRE_MAGIQUE_POINTS',
    valeur: 14,
    unite: '/16 points',
    description: 'Seuil minimum de points conformes requis sur la grille Carré Magique pour éligibilité au visa.',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Matrice de conformité auditée par la direction Qualité'
  },
  {
    id: 'param-05',
    cle: 'POINTS_TOTAL_CARRE_MAGIQUE',
    valeur: 16,
    unite: 'points',
    description: 'Nombre total de critères audités sur la grille Carré Magique (sécurité, geste, cadence, 5S).',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Format standardisé 16 critères atelier'
  },
  {
    id: 'param-06',
    cle: 'SEUIL_AQL_MINIMUM_POURCENT',
    valeur: 98,
    unite: '%',
    description: 'Taux de conformité AQL minimum mesuré en bord de ligne pour autoriser la validation.',
    version: 1,
    dateModification: '2026-09-01T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Niveau d’acceptation qualité client automobile'
  },
  {
    id: 'param-07',
    cle: 'EXTRACTION_AUTO_CNI_ACTIVE',
    valeur: true,
    unite: 'booléen',
    description: 'Active la pré-saisie assistée par extraction automatique (CNI/Diplôme) avec relecture obligatoire.',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Accélération de la saisie tablette (< 3 min par recrue) avec écran de relecture'
  },
  {
    id: 'param-08',
    cle: 'REGLE_RAPPROCHEMENT_DEFAUT',
    valeur: 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE',
    unite: 'code',
    description: 'Règle par défaut pour le matching d’un opérateur avec antécédent sur un autre site LEONI.',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Paramétrage de la politique de réembauche inter-sites LEONI Maroc'
  },
  {
    id: 'param-09',
    cle: 'CONTROLE_AGE_LEGAL_MINIMUM',
    valeur: 18,
    unite: 'ans',
    description: 'Âge minimum légal requis à la date d’embauche pour intégration en usine.',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Conformité au code du travail marocain et normes audits IATF'
  },
  {
    id: 'param-10',
    cle: 'SEUIL_DEFAUTS_JOUR_REFAIRE_FORMATION',
    valeur: 4,
    unite: 'défauts/jour',
    description: 'Règle Poka-Yoke : au-delà de 4 défauts dans la journée, l’opérateur doit refaire la formation.',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Seuil Poka-Yoke strict qualité zéro défaut canevas officiel LEONI'
  },
  {
    id: 'param-11',
    cle: 'SEUIL_VALIDATION_AUTONOME_CM',
    valeur: 90,
    unite: '%',
    description: 'Score final Carré Magique minimum pour être déclaré Opérateur Autonome (sans critère bloquant NOK).',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Grille officielle feuille décision validation LEONI'
  },
  {
    id: 'param-12',
    cle: 'SEUIL_VALIDATION_SUIVI_RENFORCE_CM',
    valeur: 80,
    unite: '%',
    description: 'Score final Carré Magique pour validation avec suivi renforcé (80% à 89%).',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Grille officielle feuille décision validation LEONI'
  },
  {
    id: 'param-13',
    cle: 'SEUIL_FORMATION_CIBLEE_CM',
    valeur: 70,
    unite: '%',
    description: 'Score final Carré Magique nécessitant une formation complémentaire ciblée (70% à 79%).',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Grille officielle feuille décision validation LEONI'
  },
  {
    id: 'param-14',
    cle: 'JOURS_CONSECUTIFS_NIVEAU_U',
    valeur: 28,
    unite: 'jours consécutifs',
    description: 'Nombre de jours consécutifs avec objectifs Qualité (Q) et Productivité (P) atteints pour acquérir le niveau U.',
    version: 1,
    dateModification: '2026-10-23T08:00:00Z',
    modifieParMatricule: 'L-LRN-801',
    modifieParNom: 'Omar Ouazzani',
    motifModification: 'Condition d’acquisition du niveau U par série continue de conformité'
  }
];

export const INITIAL_DOCUMENT_REQUIREMENTS: import('../types').DocumentRequirement[] = [
  {
    id: 'req-cni-bsk',
    siteId: 'site-bsk',
    code: 'DOC_CNI',
    libelleFr: 'Carte Nationale d’Identité (CNI / CIN)',
    libelleAr: 'بطاقة التعريف الوطنية (الوجهان)',
    estObligatoire: true,
    ordre: 1,
    descriptionFr: 'Copie recto/verso lisible de la carte d’identité nationale marocaine en cours de validité.'
  },
  {
    id: 'req-casier-bsk',
    siteId: 'site-bsk',
    code: 'DOC_CASIER',
    libelleFr: 'Extrait de Casier Judiciaire (Fiche Anthropométrique)',
    libelleAr: 'مستخرج السجل العدلي أو بطاقة السوابق',
    estObligatoire: true,
    ordre: 2,
    descriptionFr: 'Document officiel délivré depuis moins de 3 mois.'
  },
  {
    id: 'req-diplome-bsk',
    siteId: 'site-bsk',
    code: 'DOC_DIPLOME',
    libelleFr: 'Attestation de Scolarité ou Diplôme (CQP / Bac)',
    libelleAr: 'شهادة مدرسية أو دبلوم التأهيل المهني',
    estObligatoire: true,
    ordre: 3,
    descriptionFr: 'Justificatif du niveau académique ou qualification professionnelle.'
  },
  {
    id: 'req-reglement-bsk',
    siteId: 'site-bsk',
    code: 'DOC_REGLEMENT',
    libelleFr: 'Formulaire d’engagement & Règlement intérieur LEONI signé',
    libelleAr: 'استمارة الالتزام والنظام الداخلي موقعة',
    estObligatoire: true,
    ordre: 4,
    descriptionFr: 'Engagement qualité zéro défaut et respect des règles 5S de sécurité.'
  },
  {
    id: 'req-adresse-bsk',
    siteId: 'site-bsk',
    code: 'DOC_ADRESSE',
    libelleFr: 'Certificat de Résidence ou Quittance d’électricité',
    libelleAr: 'شهادة السكنى أو فاتورة الكهرباء والماء',
    estObligatoire: false,
    ordre: 5,
    descriptionFr: 'Justificatif de domicile récent pour l’affectation de ligne de transport.'
  },
  {
    id: 'req-transport-bsk',
    siteId: 'site-bsk',
    code: 'DOC_TRANSPORT',
    libelleFr: 'Fiche d’affectation Circuit de Ramassage Transport',
    libelleAr: 'بطاقة تحديد مسار حافلة نقل المستخدمين',
    estObligatoire: false,
    ordre: 6,
    descriptionFr: 'Choix de l’arrêt et de la ligne de bus desservant le site de Bouskoura.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    dateAction: '2026-10-12T07:30:00Z',
    auteurMatricule: 'L-ADM-101',
    auteurNom: 'Samira Alami',
    auteurRole: 'ADMINISTRATION',
    siteId: 'site-bsk',
    action: 'IMPORT_MASSE',
    entite: 'Recruit',
    entiteId: 'BATCH-2026-OCT-1',
    details: 'Import initial de 25 recrues confirmées via fichier RH d’intégration.',
    estDerogation: false
  },
  {
    id: 'aud-002',
    dateAction: '2026-10-16T16:00:00Z',
    auteurMatricule: 'L-TRN-201',
    auteurNom: 'Hassan Berrada',
    auteurRole: 'FORMATEUR_ECOLE',
    siteId: 'site-bsk',
    action: 'VALIDATION_ECOLE',
    entite: 'SchoolGroup',
    entiteId: 'grp-01',
    details: 'Validation collective de fin de cursus école pour 10 recrues du groupe GRP-2026-A.',
    estDerogation: false
  },
  {
    id: 'aud-003',
    dateAction: '2026-10-19T08:15:00Z',
    auteurMatricule: 'L-RFM-601',
    auteurNom: 'Karim Benzekri',
    auteurRole: 'RESPONSABLE_PRODUCTION',
    siteId: 'site-bsk',
    action: 'DEROGATION_AFFECTATION',
    entite: 'Recruit',
    entiteId: 'rec-015',
    details: 'Dérogation accordée pour affectation anticipée sur Planche Ligne 3 suite à besoin critique client.',
    estDerogation: true,
    motifDerogation: 'Renfort urgent ligne faisceau moteur après validation partielle école'
  }
];

// Génération réaliste des 40 recrues réparties rigoureusement dans toutes les étapes
const NOMS_MAROCAINS = [
  { nom: 'El Fassi', prenom: 'Yassine', cin: 'BK654321' },
  { nom: 'Amrani', prenom: 'Kaoutar', cin: 'BL765432' },
  { nom: 'Bennani', prenom: 'Hamza', cin: 'BE876543' },
  { nom: 'Kabbaj', prenom: 'Imane', cin: 'BW987654' },
  { nom: 'Slaoui', prenom: 'Mehdi', cin: 'BA123789' },
  { nom: 'Alaoui', prenom: 'Nawal', cin: 'BB234890' },
  { nom: 'Ouazzani', prenom: 'Othmane', cin: 'BC345901' },
  { nom: 'Tazi', prenom: 'Salma', cin: 'BD456012' },
  { nom: 'Lahlou', prenom: 'Anas', cin: 'BE567123' },
  { nom: 'Filali', prenom: 'Khadija', cin: 'BF678234' },
  { nom: 'Chraibi', prenom: 'Zineb', cin: 'BG789345' },
  { nom: 'Berrada', prenom: 'Mohamed', cin: 'BH890456' },
  { nom: 'Idrissi', prenom: 'Ghita', cin: 'BJ901567' },
  { nom: 'Zouhair', prenom: 'Tariq', cin: 'BK012678' },
  { nom: 'Belkadi', prenom: 'Asmaa', cin: 'BL123789' },
  { nom: 'Bouazza', prenom: 'Ayoub', cin: 'BM234890' },
  { nom: 'Kettani', prenom: 'Fatima', cin: 'BN345901' },
  { nom: 'Mansouri', prenom: 'Rachid', cin: 'BP456012' },
  { nom: 'Raji', prenom: 'Houda', cin: 'BQ567123' },
  { nom: 'Sabir', prenom: 'Saad', cin: 'BR678234' },
  { nom: 'Tahiri', prenom: 'Meriem', cin: 'BS789345' },
  { nom: 'Wahbi', prenom: 'Soufiane', cin: 'BT890456' },
  { nom: 'Yousfi', prenom: 'Chaimaa', cin: 'BU901567' },
  { nom: 'Zeroual', prenom: 'Amine', cin: 'BV012678' },
  { nom: 'Ait Oufkir', prenom: 'Sanaa', cin: 'BW123789' },
  { nom: 'Benmoussa', prenom: 'Adil', cin: 'BX234890' },
  { nom: 'Chaoui', prenom: 'Hajar', cin: 'BY345901' },
  { nom: 'Daoudi', prenom: 'Walid', cin: 'BZ456012' },
  { nom: 'Ennajari', prenom: 'Noura', cin: 'CA567123' },
  { nom: 'Fassi Fihri', prenom: 'Karim', cin: 'CB678234' },
  { nom: 'Ghellab', prenom: 'Latifa', cin: 'CC789345' },
  { nom: 'Hassani', prenom: 'Hicham', cin: 'CD890456' },
  { nom: 'Jaouhari', prenom: 'Samia', cin: 'CE901567' },
  { nom: 'Kassimi', prenom: 'Nabil', cin: 'CF012678' },
  { nom: 'Lemrini', prenom: 'Zakaria', cin: 'CG123789' },
  { nom: 'Meftah', prenom: 'Btissam', cin: 'CH234890' },
  { nom: 'Naciri', prenom: 'Ismail', cin: 'CJ345901' },
  { nom: 'Omari', prenom: 'Loubna', cin: 'CK456012' },
  { nom: 'Rhanem', prenom: 'Brahim', cin: 'CL567123' },
  { nom: 'Snoussi', prenom: 'Wafaa', cin: 'CM678234' }
];

export function generateInitialRecruits(): Recruit[] {
  const recruits: Recruit[] = [];

  for (let i = 0; i < 40; i++) {
    const person = NOMS_MAROCAINS[i];
    const id = `rec-${String(i + 1).padStart(3, '0')}`;
    const matricule = `LEO-26-${String(4000 + i + 1)}`;
    const telephone = `+212 6${String(60000000 + i * 2345).slice(0, 8)}`;
    
    // Antécédent multisite simulé pour deux personnes (pour tester le repérage inter-sites)
    const aHistoriqueAutreSite = i === 4 || i === 18;
    const siteOriginePrecedent = aHistoriqueAutreSite ? 'LEONI Berrechid' : undefined;

    let statut: Recruit['statut'] = 'EN_ECOLE';
    let ecoleJoursValides = 0;
    let ecoleValidee = false;
    let ecoleScoreTheorie: number | undefined;
    let ecoleScorePratique: number | undefined;
    let typologiePoste: Recruit['typologiePoste'] = undefined;
    let ligneAffectation: string | undefined;
    let segmentAffectation: string | undefined;
    let testPratiqueValide = false;
    let joursSuiviCompletes = 0;
    let carreMagiquePointsConformes = 0;
    let qualifiee = false;
    let visaQualite = false;
    let visaQualitePar: string | undefined;
    let visaQualiteDate: string | undefined;
    let visaProduction = false;
    let visaProductionPar: string | undefined;
    let visaProductionDate: string | undefined;
    let estEnProlongation = false;
    let joursProlongationAccordee = 0;
    let motifProlongation: string | undefined;
    let dateEntree = '2026-10-19';
    let groupeEcoleId: string | undefined = 'grp-02';

    if (i < 12) {
      // 12 en école
      statut = 'EN_ECOLE';
      groupeEcoleId = 'grp-02';
      dateEntree = '2026-10-19';
      ecoleJoursValides = (i % 4) + 1; // 1 à 4 jours
      ecoleScoreTheorie = 12 + (i % 8);
      ecoleScorePratique = 11 + (i % 7);
      ecoleValidee = false;
    } else if (i < 20) {
      // 8 en affectation (école 5j validée, test pratique en cours ou planifié)
      statut = 'EN_ECOLE'; // ou transition
      groupeEcoleId = 'grp-01';
      dateEntree = '2026-10-12';
      ecoleJoursValides = 5;
      ecoleValidee = true;
      ecoleScoreTheorie = 16;
      ecoleScorePratique = 17;
      typologiePoste = i % 2 === 0 ? 'PLANCHE_ASSEMBLAGE' : 'TOUFIX_CLIPSAGE';
      ligneAffectation = `Ligne ${((i % 3) + 1)}`;
      segmentAffectation = 'Habitacle Principal';
      testPratiqueValide = i >= 16;
    } else if (i < 32) {
      // 12 en apprentissage poste (28 jours de suivi)
      statut = 'EN_APPRENTISSAGE_POSTE';
      groupeEcoleId = 'grp-01';
      dateEntree = '2026-09-15';
      ecoleJoursValides = 5;
      ecoleValidee = true;
      ecoleScoreTheorie = 15;
      ecoleScorePratique = 16;
      testPratiqueValide = true;
      typologiePoste = (['PLANCHE_ASSEMBLAGE', 'TEST_ELECTRIQUE_TNC', 'ENCLIQUETAGE_CONNECTEUR', 'TOUFIX_CLIPSAGE'] as const)[i % 4];
      ligneAffectation = `Ligne ${((i % 4) + 1)}`;
      segmentAffectation = i % 2 === 0 ? 'Moteur Diesel' : 'Faisceau Tableau de Bord';
      joursSuiviCompletes = 8 + ((i - 20) * 1.5); // 8 à 25 jours
      carreMagiquePointsConformes = 12 + (i % 5); // 12 à 16
    } else if (i < 37) {
      // 5 qualifiés autonomes
      statut = 'QUALIFIE_AUTONOME';
      dateEntree = '2026-09-01';
      ecoleJoursValides = 5;
      ecoleValidee = true;
      ecoleScoreTheorie = 18;
      ecoleScorePratique = 18;
      testPratiqueValide = true;
      typologiePoste = 'PLANCHE_ASSEMBLAGE';
      ligneAffectation = 'Ligne 1';
      segmentAffectation = 'Faisceau Moteur';
      joursSuiviCompletes = 28;
      carreMagiquePointsConformes = 16;
      qualifiee = true;
      visaQualite = true;
      visaQualitePar = 'Houda Belkacem';
      visaQualiteDate = '2026-10-18T10:00:00Z';
      visaProduction = true;
      visaProductionPar = 'Karim Benzekri';
      visaProductionDate = '2026-10-18T11:30:00Z';
    } else {
      // 3 en prolongation
      statut = 'NON_QUALIFIE_PROLONGATION';
      dateEntree = '2026-09-01';
      ecoleJoursValides = 5;
      ecoleValidee = true;
      testPratiqueValide = true;
      typologiePoste = 'TEST_ELECTRIQUE_TNC';
      ligneAffectation = 'Ligne 2';
      segmentAffectation = 'Contrôle Final TNC';
      joursSuiviCompletes = 28;
      carreMagiquePointsConformes = 11; // inférieur à 14 -> déclenche prolongation
      qualifiee = false;
      estEnProlongation = true;
      joursProlongationAccordee = 7;
      motifProlongation = 'Défaut de répétabilité sur le test électrique TNC - Cycle de 7 jours additionnels sous tutorat AQL';
    }

    // Documents administratifs simulés
    const documents: Record<string, import('../types').RecruitDocument> = {
      DOC_CNI: {
        id: `doc-cni-${id}`,
        codeRequirement: 'DOC_CNI',
        nomFichier: `CNI_${person.cin}_recto_verso.pdf`,
        typeMime: 'application/pdf',
        tailleKo: 420,
        dateDepot: '2026-10-18T09:00:00Z',
        deposeParMatricule: 'L-ADM-101',
        apercuUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'
      }
    };

    if (i % 2 === 0) {
      documents['DOC_CASIER'] = {
        id: `doc-cas-${id}`,
        codeRequirement: 'DOC_CASIER',
        nomFichier: `Fiche_Anthropometrique_${person.cin}.pdf`,
        typeMime: 'application/pdf',
        tailleKo: 310,
        dateDepot: '2026-10-18T09:15:00Z',
        deposeParMatricule: 'L-ADM-101'
      };
      documents['DOC_DIPLOME'] = {
        id: `doc-dip-${id}`,
        codeRequirement: 'DOC_DIPLOME',
        nomFichier: `Attestation_CQP_Cablerie.pdf`,
        typeMime: 'application/pdf',
        tailleKo: 540,
        dateDepot: '2026-10-18T09:20:00Z',
        deposeParMatricule: 'L-ADM-101'
      };
      documents['DOC_REGLEMENT'] = {
        id: `doc-reg-${id}`,
        codeRequirement: 'DOC_REGLEMENT',
        nomFichier: `Reglement_Interieur_Signe.pdf`,
        typeMime: 'application/pdf',
        tailleKo: 280,
        dateDepot: '2026-10-18T09:25:00Z',
        deposeParMatricule: 'L-ADM-101'
      };
    }

    const nbFournies = Object.keys(documents).length;
    const tauxCompletudeDossier = Math.round((nbFournies / 6) * 100);
    const dossierComplet = nbFournies >= 4; // 4 obligatoires fournies

    recruits.push({
      id,
      cin: person.cin,
      matricule,
      statutLiaisonSAP: 'RECONCILIE',
      dateLiaisonSAP: '2026-10-19T08:00:00Z',
      nom: person.nom,
      prenom: person.prenom,
      dateNaissance: '2001-05-14',
      telephone,
      siteId: 'site-bsk',
      dateEntree,
      statut,
      documents,
      tauxCompletudeDossier,
      dossierComplet,
      segmentPrevisionnel: i % 2 === 0 ? 'Faisceau Moteur' : 'Habitacle Principal',
      groupeEcoleId,
      ecoleJoursValides,
      ecoleValidee,
      ecoleScoreTheorie,
      ecoleScorePratique,
      typologiePoste,
      ligneAffectation,
      segmentAffectation,
      testPratiqueValide,
      joursSuiviCompletes,
      carreMagiquePointsConformes,
      tauxRespectAQL: 98.5,
      qualifiee,
      visaQualite,
      visaQualitePar,
      visaQualiteDate,
      visaProduction,
      visaProductionPar,
      visaProductionDate,
      estEnProlongation,
      joursProlongationAccordee,
      motifProlongation,
      aHistoriqueAutreSite,
      siteOriginePrecedent
    });
  }

  return recruits;
}

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'qst-01',
    theme: 'THEORIE_CABLERIE',
    type: 'QCM_UNIQUE',
    intituleFr: 'Selon la norme internationale DIN 72551 pour le câblage automobile, que désigne conventionnellement un conducteur de couleur MARRON (BR) ?',
    intituleAr: 'وفق المعيار الدولي DIN 72551 لأسلاك السيارات، إلى ماذا يشير السلك ذو اللون البني (BR) ؟',
    optionsFr: [
      'Alimentation directe batterie (+30 / 12V permanent)',
      'Masse électrique du châssis / Retour terre (Ground / GND)',
      'Signal multiplexé du bus CAN High',
      'Ligne de commande démarreur / contact (+15)'
    ],
    optionsAr: [
      'تغذية كهربائية مباشرة من البطارية (+30 مستمر)',
      'التأريض وهيكل السيارة الكهربائي (Ground / GND)',
      'إشارة شبكة البيانات CAN High',
      'خط تشغيل المحرك والمفتاح (+15)'
    ],
    bonneReponseIndex: 1,
    points: 2,
    explicationFr: 'Dans les faisceaux automobiles selon DIN, le marron est réservé à la masse (borne 31).',
    explicationAr: 'في أسلاك السيارات حسب معايير DIN، يخصص اللون البني حصرياً للتأريض (Masse).'
  },
  {
    id: 'qst-02',
    theme: 'THEORIE_CABLERIE',
    type: 'QCM_MULTIPLE',
    intituleFr: 'Quels défauts sur un sertissage mécanique (Crimping) sont considérés comme ÉLIMINATOIRES chez LEONI ? (Plusieurs réponses possibles)',
    intituleAr: 'ما هي عيوب الكبس الميكانيكي (Crimping) التي تعتبر غير مقبولة نهائياً في شركة ليوني ؟ (اختر جميع الإجابات الصحيحة)',
    optionsFr: [
      'Brins de cuivre coupés ou cisaillés à l’arrière de l’ailette',
      'Isolant du câble non pris dans les ailettes de sertissage d’isolant',
      'Présence d’un micro-espace de ventilation homologué',
      'Ailettes de sertissage d’âme dissymétriques ou ouvertes'
    ],
    optionsAr: [
      'شعيرات نحاسية مقطوعة أو مشوهة خلف الجناح',
      'عدم مسك العازل بإحكام داخل أجنحة عزل الكبس',
      'وجود فراغ تهوية مصرح به',
      'أجنحة كبس السلك النحاسي غير متناظرة أو مفتوحة'
    ],
    bonneReponseIndex: [0, 1, 3],
    points: 3,
    explicationFr: 'Le sertissage parfait exige la prise correcte de l’isolant et de tous les brins de cuivre sans coupe ni dissymétrie.',
    explicationAr: 'يتطلب الكبس السليم إمساك العازل وجميع شعيرات النحاس دون أي قطع أو اختلال توازن.'
  },
  {
    id: 'qst-03',
    theme: 'GESTE_QUALITE',
    type: 'QCM_UNIQUE',
    intituleFr: 'Quelle est la gestuelle obligatoire (Poka-Yoke opérateur) immédiatement après avoir inséré un contact dans un boîtier connecteur ?',
    intituleAr: 'ما هي الحركة الإلزامية التي يجب على العامل تطبيقها فور إدخال الموصل في غلافه البلاستيكي ؟',
    optionsFr: [
      'Taper deux fois avec un tournevis plat',
      'Effectuer un test de traction manuel modéré (« Tug Test ») pour vérifier l’encliquetage',
      'Appliquer de la colle thermofusible instantanée',
      'Passer immédiatement au câble suivant sans vérifier'
    ],
    optionsAr: [
      'النقر مرتين باستخدام مفك براغي',
      'إجراء اختبار السحب اليدوي المعتدل (Tug Test) للتأكد من انغلاق المشبك',
      'وضع غراء حراري للتثبيت',
      'الانتقال فوراً إلى السلك الموالي دون فحص'
    ],
    bonneReponseIndex: 1,
    points: 3,
    explicationFr: 'Le « Tug Test » (traction manuelle sans à-coup) garantit que la languette de verrouillage est bien engagée.',
    explicationAr: 'اختبار السحب (Tug Test) يضمن تثبيت المشبك الداخلي بإحكام داخل التجويف.'
  },
  {
    id: 'qst-04',
    theme: 'GESTE_QUALITE',
    type: 'REMISE_EN_ORDRE',
    intituleFr: 'Ordonner chronologiquement les 4 étapes de montage d’un contact avec joint d’étanchéité individuel (Single Wire Seal) :',
    intituleAr: 'رتب زمنياً المراحل الأربع لتركيب موصل مزود بمانع تسرب فردي (Single Wire Seal) :',
    itemsOrdonnes: [
      '1. Vérifier la présence, l’intégrité et l’orientation correcte du joint silicone',
      '2. Insérer le terminal dans la cavité du connecteur jusqu’au déclic audible (clic)',
      '3. Réaliser le contrôle manuel de traction (Tug Test)',
      '4. Verrouiller le système de sécurité secondaire (TPA / Secondary Lock)'
    ],
    points: 4,
    explicationFr: 'L’ordre séquentiel garantit l’étanchéité IP67 et la tenue mécanique du connecteur.',
    explicationAr: 'الترتيب الصحيح يضمن العزل التام ومقاومة الماء والاهتزازات في المركبة.'
  },
  {
    id: 'qst-05',
    theme: 'GESTE_QUALITE',
    type: 'ETIQUETAGE_IMAGE',
    intituleFr: 'Sur une planche d’assemblage (Forming Board), quel est le rôle primordial des accessoires de guidage appelés « TOUFIX » ?',
    intituleAr: 'على لوحة التجميع (Planche)، ما هو الدور الأساسي لملحقات التوجيه المسماة (Toufix) ؟',
    optionsFr: [
      'Maintenir le faisceau dans son tracé géométrique avant bandage et garantir les longueurs',
      'Chauffer les câbles pour les assouplir',
      'Mesurer la résistance ohmique en direct',
      'Imprimer les étiquettes code-barres'
    ],
    optionsAr: [
      'تثبيت مسار الأسلاك الهندسي وضمان الأطوال بدقة قبل التغليف الشريطي',
      'تسخين الأسلاك لزيادة مرونتها',
      'قياس المقاومة الكهربائية مباشرة',
      'طباعة ملصقات الباركود'
    ],
    bonneReponseIndex: 0,
    points: 2,
    imageIllustrationUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    explicationFr: 'Les toufix définissent les points de dérivation et les tolérances dimensionnelles du faisceau.',
    explicationAr: 'تحدد حوامل التوفيكس تفرعات الفايسو والأبعاد المطابقة لدفتر الشروط.'
  },
  {
    id: 'qst-06',
    theme: 'THEORIE_CABLERIE',
    type: 'REPONSE_COURTE',
    intituleFr: 'Quel est le sigle exact du test électrique final à 100% contrôlant la continuité, les courts-circuits et les inversions sur table d’essai ?',
    intituleAr: 'ما هو الرمز المهني المعتمد لجهاز الفحص الكهربائي الشامل 100% للأسلاك والتوصيلات ؟',
    reponseTexteAttendue: 'TNC',
    points: 2,
    explicationFr: 'TNC désigne le banc de Test Non-Conformité / Test de continuité électrique.',
    explicationAr: 'TNC يشير إلى منصة الفحص الكهربائي الإجباري لكافة الفايسوهات.'
  },
  {
    id: 'qst-07',
    theme: 'SECURITE_5S',
    type: 'QCM_UNIQUE',
    intituleFr: 'Sur une ligne de production LEONI, lorsqu’un opérateur identifie un composant ou un sertissage défectueux, où doit-il le placer immédiatement ?',
    intituleAr: 'على خط الإنتاج في ليوني، إذا اكتشف العامل قطعة أو كبساً معيباً، أين يجب وضعه على الفور ؟',
    optionsFr: [
      'Dans le bac ROUGE réservé aux rebuts et non-conformités (Zone Rouge Rebut)',
      'Dans sa poche pour le montrer à la pause',
      'Sous la planche de travail en attendant la fin du shift',
      'Dans le bac bleu des pièces conformes en espérant qu’il passe le TNC'
    ],
    optionsAr: [
      'في الصندوق الأحمر المخصص للمتلاشيات والقطع غير المطابقة (Zone Rouge)',
      'في جيبه لعرضه أثناء فترة الاستراحة',
      'تحت لوحة العمل إلى حين انتهاء فترة العمل',
      'في الصندوق الأزرق للقطع السليمة'
    ],
    bonneReponseIndex: 0,
    points: 2,
    explicationFr: 'La règle 5S et Poka-Yoke LEONI impose la ségrégation instantanée dans le bac rouge.',
    explicationAr: 'تفرض معايير الجودة 5S العزل الفوري لأي قطعة معيبة في الصندوق الأحمر تجنباً للاختلاط.'
  },
  {
    id: 'qst-08',
    theme: 'SECURITE_5S',
    type: 'QCM_UNIQUE',
    intituleFr: 'Quels sont les Équipements de Protection Individuelle (EPI) obligatoires pour accéder et opérer sur les lignes de câblage LEONI Maroc ?',
    intituleAr: 'ما هي معدات الوقاية الفردية (EPI) الإلزامية للعمل داخل ورشات الكابلاج في ليوني المغرب ؟',
    optionsFr: [
      'Chaussures de sécurité avec semelle antistatique (ESD) et blouse atelier fermée',
      'Gants de boxe et lunettes de soleil',
      'Casque lourd de chantier minier et bottes en caoutchouc',
      'Aucun équipement particulier n’est exigé'
    ],
    optionsAr: [
      'حذاء السلامة بمواصفات مضادة للشحنات الساكنة (ESD) ووزرة العمل مغلقة',
      'قفازات رياضية ونظارات شمسية',
      'خوذة مناجم ثقيلة وحذاء مطاطي',
      'لا توجد أي معدات وقاية مطلوبة'
    ],
    bonneReponseIndex: 0,
    points: 2,
    explicationFr: 'La sécurité corporelle et la protection ESD des composants électroniques embarqués exigent chaussures ESD et blouse.',
    explicationAr: 'حذاء السلامة والوزرة يحميان العامل والمكونات الإلكترونية الحساسة من الشحنات الكهربائية.'
  },
  {
    id: 'qst-09',
    theme: 'TEST_LOGIQUE_PRESELECTION',
    type: 'QCM_UNIQUE',
    intituleFr: '[Banque Logique] Suite de repérage : Câble 1 = BLANC, Câble 2 = BLEU, Câble 3 = VERT. Si la séquence se répète avec un fil bicolore tous les 4 câbles, quelle sera la couleur du Câble 8 ?',
    intituleAr: '[بنك المنطق] تسلسل التمييز : السلك 1 = أبيض، السلك 2 = أزرق، السلك 3 = أخضر. إذا كان كل رابع سلك ثنائي اللون، فما هو لون السلك الثامن ؟',
    optionsFr: [
      'Fil bicolore (ex: Blanc/Bleu ou Vert/Jaune)',
      'Blanc pur',
      'Bleu pur',
      'Noir standard'
    ],
    optionsAr: [
      'سلك ثنائي اللون (مثال: أبيض/أزرق)',
      'أبيض ناصع',
      'أزرق خالص',
      'أسود عادي'
    ],
    bonneReponseIndex: 0,
    points: 2,
    explicationFr: 'Les positions 4 et 8 sont des multiples de 4, donc attribuées aux fils bicolores.',
    explicationAr: 'الموضعان 4 و8 من مضاعفات العدد 4، وبالتالي يخصصان للأسلاك ثنائية اللون.'
  },
  {
    id: 'qst-10',
    theme: 'TEST_LOGIQUE_PRESELECTION',
    type: 'QCM_UNIQUE',
    intituleFr: '[Banque Logique] Une planche comporte 4 branches principales. Chaque branche porte 3 dérivations et chaque dérivation alimente 2 connecteurs terminaux. Combien de connecteurs au total composent ce faisceau ?',
    intituleAr: '[بنك المنطق] لوحة تجميع بها 4 فروع رئيسية، كل فرع يضم 3 تفرعات، وكل تفرع ينتهي بموصلين (Connecteurs). ما هو العدد الإجمالي للموصلات ؟',
    optionsFr: [
      '24 connecteurs (4 × 3 × 2)',
      '18 connecteurs',
      '12 connecteurs',
      '32 connecteurs'
    ],
    optionsAr: [
      '24 موصلاً (4 × 3 × 2)',
      '18 موصلاً',
      '12 موصلاً',
      '32 موصلاً'
    ],
    bonneReponseIndex: 0,
    points: 2,
    explicationFr: 'Calcul de combinatoire arborescente : 4 × 3 × 2 = 24 terminaux.',
    explicationAr: 'حساب الفروع المتفرعة : 4 فروع × 3 تفرعات × 2 موصلات = 24 موصلاً.'
  },
  {
    id: 'qst-11',
    theme: 'GESTE_QUALITE',
    type: 'GRILLE_PRATIQUE_OK_NOK',
    intituleFr: 'Grille d’évaluation pratique : Réalisation du rubanage (Bandage) - Recouvrement à 50% de spires régulières sans pli ni décollement.',
    intituleAr: 'شبكة التقييم العملي : إنجاز اللف الشريطي (Bandage) - تغطية منتظمة بنسبة 50% بدون أي انثناء أو تراخي.',
    optionsFr: ['CONFORME (OK - Tension constante, sans bulle)', 'NON CONFORME (NOK - Pli ou décollement visible)'],
    optionsAr: ['مطابق (OK - شد منتظم وبدون فقاعات)', 'غير مطابق (NOK - انثناء أو ارتخاء واضح)'],
    bonneReponseIndex: 0,
    points: 3,
    explicationFr: 'Le rubanage protège mécaniquement et thermiquement le faisceau dans la baie moteur.',
    explicationAr: 'يحمي اللف الشريطي الأسلاك من الاحتكاك الميكانيكي وارتفاع درجات الحرارة.'
  },
  {
    id: 'qst-12',
    theme: 'GESTE_QUALITE',
    type: 'GRILLE_PRATIQUE_OK_NOK',
    intituleFr: 'Grille d’évaluation pratique : Encliquetage du verrouillage secondaire TPA (Terminal Position Assurance) enfoncé à ras du boîtier sans forçage destructif.',
    intituleAr: 'شبكة التقييم العملي : إغلاق القفل الثانوي TPA بإحكام وتطابق كامل مع الغلاف دون إتلاف.',
    optionsFr: ['CONFORME (OK - Verrouillage complet affleurant)', 'NON CONFORME (NOK - Saillie ou ergot coincé)'],
    optionsAr: ['مطابق (OK - إقفال تام ومحكم)', 'غير مطابق (NOK - بروز أو انحشار غير مكتمل)'],
    bonneReponseIndex: 0,
    points: 3,
    explicationFr: 'Le TPA empêche tout recul de broche lors de l’accouplement véhicule.',
    explicationAr: 'القفل الثانوي يمنع ارتداد الأطراف عند تركيب الفايسو في السيارة.'
  }
];

export const INITIAL_SCHOOL_TESTS: SchoolTest[] = [
  {
    id: 'tst-01',
    titreFr: 'Évaluation Théorique & Pratique Initiale Câblerie (Norme École 5 Jours)',
    titreAr: 'الاختبار النظري والتطبيقي الأولي لكابلاج السيارات (معيار المدرسة 5 أيام)',
    theme: 'THEORIE_CABLERIE',
    sections: [
      {
        id: 'sec-01',
        titreFr: 'Section 1 : Règles de Sécurité Industrielle & Standards 5S',
        titreAr: 'القسم 1 : قواعد السلامة المهنية ومعايير 5S',
        dureeMinutes: 10,
        questionIds: ['qst-07', 'qst-08'],
        seuilObligatoirePourcent: 100
      },
      {
        id: 'sec-02',
        titreFr: 'Section 2 : Technologie du Câblage Automobile & Normes DIN',
        titreAr: 'القسم 2 : تكنولوجيا أسلاك السيارات ومعايير DIN',
        dureeMinutes: 15,
        questionIds: ['qst-01', 'qst-02', 'qst-06'],
        seuilObligatoirePourcent: 60
      },
      {
        id: 'sec-03',
        titreFr: 'Section 3 : Gestuelle Qualité, Encliquetage & Contrôle Visuel',
        titreAr: 'القسم 3 : حركات الجودة، تركيب الموصلات والمراقبة البصرية',
        dureeMinutes: 15,
        questionIds: ['qst-03', 'qst-04', 'qst-05', 'qst-11', 'qst-12'],
        seuilObligatoirePourcent: 70
      }
    ],
    dureeGlobaleMinutes: 40,
    notePassageSur20: 14,
    seuilEliminatoirePourcent: 60,
    maxTentatives: 2,
    tirageAleatoire: false,
    langue: 'both'
  },
  {
    id: 'tst-02',
    titreFr: 'Banque de Test Logique & Aptitude Spatiale (Évaluation d’entrée)',
    titreAr: 'بنك اختبار المنطق والقدرات المكانية (تقييم الدخول الأولي)',
    theme: 'TEST_LOGIQUE_PRESELECTION',
    sections: [
      {
        id: 'sec-log-01',
        titreFr: 'Section Logique : Repérage arborescent et combinatoire câbles',
        titreAr: 'قسم المنطق : تحديد المسارات والحساب التجميعي للأسلاك',
        dureeMinutes: 20,
        questionIds: ['qst-09', 'qst-10'],
        seuilObligatoirePourcent: 50
      }
    ],
    dureeGlobaleMinutes: 20,
    notePassageSur20: 12,
    seuilEliminatoirePourcent: 50,
    maxTentatives: 1,
    tirageAleatoire: false,
    langue: 'both'
  }
];

export const INITIAL_TRAINING_CONTENTS: TrainingContent[] = [
  {
    id: 'cnt-01',
    code: 'DOC-ECOLE-J1',
    titreFr: 'J1 : Accueil, Culture d’Entreprise LEONI, Sécurité & Standards 5S',
    titreAr: 'اليوم 1 : الاستقبال، ثقافة ليوني، السلامة ومعايير 5S',
    theme: 'SECURITE_5S',
    typeSupport: 'PDF',
    jourEcoleRattache: 1,
    dureeEstimeeMinutes: 60,
    urlSupport: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    descriptionFr: 'Présentation de l’usine LEONI Bouskoura, port des EPIs, bacs rouges et organisation des postes.',
    descriptionAr: 'التعريف بمصنع ليوني، ارتداء معدات الوقاية، صناديق العزل الحمراء وتنظيم مراكز العمل.',
    consulteParRecrues: ['rec-001', 'rec-002', 'rec-003', 'rec-004']
  },
  {
    id: 'cnt-02',
    code: 'DOC-ECOLE-J2',
    titreFr: 'J2 : Lecture de Schéma de Câblage, Code des Couleurs & Normes DIN',
    titreAr: 'اليوم 2 : قراءة مخططات الأسلاك، ترميز الألوان ومعايير DIN',
    theme: 'CABLERIE_BASE',
    typeSupport: 'PDF',
    jourEcoleRattache: 2,
    dureeEstimeeMinutes: 75,
    urlSupport: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    descriptionFr: 'Correspondance des couleurs primaires et secondaires, sections de fil (0.35 mm² à 2.5 mm²), tolérances.',
    descriptionAr: 'مطابقة الألوان الأساسية والثانوية، مقاطع الأسلاك ومجالات التسامح المسموح بها.',
    consulteParRecrues: ['rec-001', 'rec-002', 'rec-003']
  },
  {
    id: 'cnt-03',
    code: 'DOC-ECOLE-J3',
    titreFr: 'J3 : Technologie de Dénudage & Sertissage Mécanique (Crimping)',
    titreAr: 'اليوم 3 : تكنولوجيا تعرية الأسلاك والكبس الميكانيكي (Crimping)',
    theme: 'GESTE_POSTE',
    typeSupport: 'IMAGE',
    jourEcoleRattache: 3,
    dureeEstimeeMinutes: 90,
    urlSupport: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
    descriptionFr: 'Hauteur et largeur de sertissage, contrôle de traction destructif périodique et micrographie.',
    descriptionAr: 'ارتفاع وعرض الكبس، فحص قوة الشد الدورية والمجهرية.',
    consulteParRecrues: ['rec-001', 'rec-002']
  },
  {
    id: 'cnt-04',
    code: 'DOC-ECOLE-J4',
    titreFr: 'J4 : Insertion dans Boîtiers, Tug-Test & Système de Maintien Toufix',
    titreAr: 'اليوم 4 : تركيب الموصلات، اختبار السحب اليدوي ونظام توفيكس',
    theme: 'CONNECTIQUE',
    typeSupport: 'VIDEO',
    jourEcoleRattache: 4,
    dureeEstimeeMinutes: 80,
    urlSupport: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    descriptionFr: 'Démonstration vidéo du bon geste d’encliquetage, verrou secondaire TPA et pose sur planche Toufix.',
    descriptionAr: 'عرض مرئي للحركة السليمة للتركيب، إغلاق القفل الثانوي والتثبيت على لوحة التوفيكس.',
    consulteParRecrues: ['rec-001']
  },
  {
    id: 'cnt-05',
    code: 'DOC-ECOLE-J5',
    titreFr: 'J5 : Rubanage, Contrôle Visuel 100% & Préparation au Banc d’Essai TNC',
    titreAr: 'اليوم 5 : التغليف الشريطي، الفحص البصري والتحضير لاختبار TNC',
    theme: 'QUALITE_DEFAUT',
    typeSupport: 'PDF',
    jourEcoleRattache: 5,
    dureeEstimeeMinutes: 60,
    urlSupport: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    descriptionFr: 'Validation finale du geste qualité, critères zéro défaut et passation des épreuves de fin d’école.',
    descriptionAr: 'المصادقة النهائية على حركات الجودة ومعايير خلو العيوب واختبارات إنهاء المدرسة.',
    consulteParRecrues: []
  }
];

export const INITIAL_ATTENDANCE_RECORDS: SchoolAttendanceRecord[] = [
  // Groupe 2 (en cours) - J1 à J3 pointés
  {
    recrueId: 'rec-001',
    jourIndex: 1,
    statut: 'PRESENT',
    horodatage: '2026-10-19T07:55:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-001',
    jourIndex: 2,
    statut: 'PRESENT',
    horodatage: '2026-10-20T07:58:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-001',
    jourIndex: 3,
    statut: 'PRESENT',
    horodatage: '2026-10-21T07:50:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-002',
    jourIndex: 1,
    statut: 'PRESENT',
    horodatage: '2026-10-19T07:52:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-002',
    jourIndex: 2,
    statut: 'RETARD',
    retardMinutes: 15,
    motifAbsence: 'Retard navette transport Ligne 4',
    horodatage: '2026-10-20T08:15:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-002',
    jourIndex: 3,
    statut: 'PRESENT',
    horodatage: '2026-10-21T07:56:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-003',
    jourIndex: 1,
    statut: 'PRESENT',
    horodatage: '2026-10-19T07:48:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-003',
    jourIndex: 2,
    statut: 'ABSENT',
    motifAbsence: 'Certificat médical d’indisposition',
    horodatage: '2026-10-20T08:00:00Z',
    pointeParMatricule: 'L-TRN-202'
  },
  {
    recrueId: 'rec-003',
    jourIndex: 3,
    statut: 'PRESENT',
    horodatage: '2026-10-21T07:50:00Z',
    pointeParMatricule: 'L-TRN-202'
  }
];

export const INITIAL_TEST_ATTEMPTS: TestAttempt[] = [
  {
    id: 'att-001',
    testId: 'tst-01',
    recrueId: 'rec-001',
    datePassage: '2026-10-22T14:30:00Z',
    mode: 'TABLETTE',
    reponses: {
      'qst-01': 1,
      'qst-02': [0, 1, 3],
      'qst-03': 1,
      'qst-06': 'TNC',
      'qst-07': 0,
      'qst-08': 0,
      'qst-11': 0,
      'qst-12': 0
    },
    scoreTotalObtenu: 19,
    totalPointsPossibles: 22,
    noteSur20: 17.3,
    estReussi: true,
    dureeSecondes: 1240,
    evalueParMatricule: 'L-TRN-202'
  }
];

export const INITIAL_WORKSTATIONS: Workstation[] = [
  {
    id: 'ws-01',
    code: 'PST-INS-01',
    intituleFr: 'Insertion Connecteurs & Pull-Test',
    intituleAr: 'إدخال الموصلات واختبار السحب اليدوي',
    familleMetier: 'ASSEMBLAGE',
    typologie: 'INITIAL',
    stationTypologyRef: 'ENCLIQUETAGE_CONNECTEUR',
    siteId: 'site-bsk',
    segment: 'Faisceau Habitacle',
    ligne: 'Ligne 1',
    aptitudesRequisesFr: ['Précision visuelle', 'Mémorisation des couleurs', 'Dextérité fine', 'Détrompage mécanique'],
    aptitudesRequisesAr: ['دقة بصرية', 'حفظ رموز الألوان', 'مهارة يدوية دقيقة', 'التحقق الميكانيكي'],
    formateurReferentMatricule: 'L-TRN-301',
    formateurReferentNom: 'Youssef El Amrani',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 12,
      diplomeExige: false,
      testGesteReussiExige: false,
      specialitesCompatibles: ['Câblage général', 'Opérateur assemblage standard']
    },
    descriptionFr: 'Poste initial accessible aux débutants : insertion des voies, déclic franc et test de traction unitaire.',
    descriptionAr: 'مركز عمل أولي متاح للمبتدئين : إدخال الأسلاك في الحجرات، سماع صوت التثبيت واختبار السحب.'
  },
  {
    id: 'ws-02',
    code: 'PST-BAN-01',
    intituleFr: 'Enrubannage & Bandage Faisceau',
    intituleAr: 'تغليف وتضميد حزم الكوابل بالشريط اللاصق',
    familleMetier: 'FINITION',
    typologie: 'INITIAL',
    stationTypologyRef: 'BANDAGE_RUBANAGE',
    siteId: 'site-bsk',
    segment: 'Faisceau Moteur',
    ligne: 'Ligne 2',
    aptitudesRequisesFr: ['Dextérité manuelle', 'Régularité du pas d’enroulement', 'Résistance physique', 'Tension constante'],
    aptitudesRequisesAr: ['مهارة يدوية', 'انتظام خطوة اللف', 'قدرة التحمل', 'شد ثابت للشريط'],
    formateurReferentMatricule: 'L-TRN-302',
    formateurReferentNom: 'Tariq Mansour',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 12,
      diplomeExige: false,
      testGesteReussiExige: false,
      specialitesCompatibles: ['Câblage général', 'Opérateur rubanage standard']
    },
    descriptionFr: 'Poste initial : rubanage PVC ou feutrine à recouvrement 50%, protection des dérivations sans fil pincé.',
    descriptionAr: 'مركز أولي : لف الأشرطة البلاستيكية أو الصوفية بنسبة تغطية 50% وحماية التفرعات.'
  },
  {
    id: 'ws-03',
    code: 'PST-GEO-01',
    intituleFr: 'Finition Géométrique & Gabarits',
    intituleAr: 'التشطيب الهندسي ومطابقة القوالب والأبعاد',
    familleMetier: 'FINITION',
    typologie: 'CRITIQUE',
    stationTypologyRef: 'PLANCHE_ASSEMBLAGE',
    siteId: 'site-bsk',
    segment: 'Planche de Bord',
    ligne: 'Ligne 1',
    aptitudesRequisesFr: ['Précision dimensionnelle', 'Tolérance ±2mm', 'Lecture plan de pose', 'Autocontrôle qualité rigoureux'],
    aptitudesRequisesAr: ['دقة في الأبعاد', 'احترام التفاوت ±2 مم', 'قراءة مخطط الوضع', 'مراقبة ذاتية صارمة'],
    formateurReferentMatricule: 'L-TRN-301',
    formateurReferentNom: 'Youssef El Amrani',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 16,
      diplomeExige: true,
      testGesteReussiExige: true,
      specialitesCompatibles: ['Électromécanique', 'Câblage automobile certifié', 'Bac technique / CQP']
    },
    descriptionFr: 'Poste critique : contrôle des longueurs de branches, positionnement des agrafes et conformité tridimensionnelle.',
    descriptionAr: 'مركز عمل حرج : قياس أطوال التفرعات، وضع المشابك ومطابقة الهيكل الثلاثي الأبعاد.'
  },
  {
    id: 'ws-04',
    code: 'PST-AGRF-01',
    intituleFr: 'Test AGRF Étanchéité & Verrouillage',
    intituleAr: 'اختبار AGRF للإحكام والتثبيت الثانوي',
    familleMetier: 'CONTROLE_ELECTRIQUE',
    typologie: 'CRITIQUE',
    stationTypologyRef: 'TEST_ELECTRIQUE_TNC',
    siteId: 'site-bsk',
    segment: 'Faisceau Moteur',
    ligne: 'Ligne 2',
    aptitudesRequisesFr: ['Réflexe qualité zéro défaut', 'Contrôle joints silicone', 'Assiduité exemplaire', 'Rapidité d’analyse'],
    aptitudesRequisesAr: ['يقظة جودة قصوى', 'فحص سدادات السيليكون', 'انضباط تام بالحضور', 'سرعة التحليل والتدقيق'],
    formateurReferentMatricule: 'L-TRN-302',
    formateurReferentNom: 'Tariq Mansour',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 16,
      diplomeExige: true,
      testGesteReussiExige: true,
      specialitesCompatibles: ['Électromécanique', 'Maintenance industrielle', 'Électricité auto']
    },
    descriptionFr: 'Poste critique étanchéité moteur : mise sous pression d’air, détection fuites mbar, verrouillage TPA/CPA.',
    descriptionAr: 'مركز حرج لحزم المحرك : ضغط الهواء لكشف التسرب بالميليبار وتأكيد القفل الثانوي.'
  },
  {
    id: 'ws-05',
    code: 'PST-BOL-01',
    intituleFr: 'Contrôle Électrique Bol / TNC',
    intituleAr: 'فحص التوصيل الكهربائي عبر البول واختبار عدم التداخل',
    familleMetier: 'CONTROLE_ELECTRIQUE',
    typologie: 'CRITIQUE',
    stationTypologyRef: 'TEST_ELECTRIQUE_TNC',
    siteId: 'site-bsk',
    segment: 'Faisceau Habitacle',
    ligne: 'Ligne 3',
    aptitudesRequisesFr: ['Détection interversions', 'Concentration continue', 'Schématique électrique', 'Traçabilité séquentielle'],
    aptitudesRequisesAr: ['كشف تداخل الدوائر', 'تركيز ذهني مستمر', 'قراءة المخطط الكهربائي', 'تتبع تسلسلي'],
    formateurReferentMatricule: 'L-TRN-301',
    formateurReferentNom: 'Youssef El Amrani',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 16.5,
      diplomeExige: true,
      testGesteReussiExige: true,
      specialitesCompatibles: ['Électronique', 'Électrotechnique', 'Câblage embarqué']
    },
    descriptionFr: 'Poste critique : contrôle de continuité 100%, résistance d’isolement et absence d’inversion pinout.',
    descriptionAr: 'مركز حرج : الفحص الشامل 100% للتوصيل والعزل الكهربائي وعدم قلب أي خط.'
  },
  {
    id: 'ws-06',
    code: 'PST-CND-01',
    intituleFr: 'Conditionnement & Palettisation',
    intituleAr: 'التغليف النهائي وتجهيز شحنات التصدير',
    familleMetier: 'CONDITIONNEMENT',
    typologie: 'CRITIQUE',
    stationTypologyRef: 'PLANCHE_ASSEMBLAGE',
    siteId: 'site-bsk',
    segment: 'Logistique Finale',
    ligne: 'Ligne 1',
    aptitudesRequisesFr: ['Rayons de courbure minimaux', 'Protection des capuchons', 'Rigueur d’emballage', 'Flashage code-barres'],
    aptitudesRequisesAr: ['احترام نصف قطر الانحناء', 'حماية أغطية الموصلات', 'إتقان التعبئة', 'مسح الباركود'],
    formateurReferentMatricule: 'L-TRN-302',
    formateurReferentNom: 'Tariq Mansour',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 15,
      diplomeExige: false,
      testGesteReussiExige: true,
      specialitesCompatibles: ['Logistique industrielle', 'Câblage général', 'Conditionnement automobile']
    },
    descriptionFr: 'Poste critique : pliage sécurisé sans écrasement des connecteurs, pose des détrompeurs de transport.',
    descriptionAr: 'مركز حرج : طي آمن لحزم الكوابل دون إتلاف الموصلات ووضع علامات الشحن والتصدير.'
  },
  {
    id: 'ws-07',
    code: 'PST-FIL-01',
    intituleFr: 'Filiste & Débit / Sertissage Komax',
    intituleAr: 'تقطيع الأسلاك وكبس الرؤوس الأوتوماتيكي',
    familleMetier: 'PREPARATION',
    typologie: 'CRITIQUE',
    stationTypologyRef: 'SERTISSAGE_MANUEL',
    siteId: 'site-bsk',
    segment: 'Préparation Coupe',
    ligne: 'Ligne 1',
    aptitudesRequisesFr: ['Réglage haute cadence Komax', 'Hauteur de sertissage Crimp Height', 'Zéro entaille de brins', 'Contrôle traction'],
    aptitudesRequisesAr: ['ضبط ماكينة كوماكس', 'قياس ارتفاع الكبس', 'سلامة شعيرات النحاس', 'اختبار شد الرؤوس'],
    formateurReferentMatricule: 'L-TRN-301',
    formateurReferentNom: 'Youssef El Amrani',
    prerequis: {
      assiduiteMinJours: 5,
      noteEcoleMin: 16,
      diplomeExige: true,
      testGesteReussiExige: true,
      specialitesCompatibles: ['Mécanique de précision', 'Câblage machine', 'Opérateur Komax certifié']
    },
    descriptionFr: 'Poste critique de préparation amont : coupe, dénudage au millimètre et sertissage selon norme LEONI Crimp.',
    descriptionAr: 'مركز حرج لتهيئة الأسلاك : القطع والتجريد الدقيق وكبس الموصلات وفق معايير ليوني المعتمدة.'
  }
];

export const INITIAL_PRODUCTION_NEEDS: ProductionNeed[] = [
  {
    id: 'pnd-01',
    siteId: 'site-bsk',
    workstationId: 'ws-01',
    workstationCode: 'PST-INS-01',
    workstationIntituleFr: 'Insertion Connecteurs & Pull-Test',
    workstationIntituleAr: 'إدخال الموصلات واختبار السحب اليدوي',
    typologie: 'INITIAL',
    segment: 'Faisceau Habitacle',
    ligne: 'Ligne 1',
    quantiteDemandee: 4,
    quantitePourvue: 2,
    dateCible: '2026-10-30',
    priorite: 'URGENTE',
    statut: 'PARTIEL'
  },
  {
    id: 'pnd-02',
    siteId: 'site-bsk',
    workstationId: 'ws-02',
    workstationCode: 'PST-BAN-01',
    workstationIntituleFr: 'Enrubannage & Bandage Faisceau',
    workstationIntituleAr: 'تغليف وتضميد حزم الكوابل بالشريط اللاصق',
    typologie: 'INITIAL',
    segment: 'Faisceau Moteur',
    ligne: 'Ligne 2',
    quantiteDemandee: 3,
    quantitePourvue: 1,
    dateCible: '2026-10-28',
    priorite: 'NORMALE',
    statut: 'PARTIEL'
  },
  {
    id: 'pnd-03',
    siteId: 'site-bsk',
    workstationId: 'ws-03',
    workstationCode: 'PST-GEO-01',
    workstationIntituleFr: 'Finition Géométrique & Gabarits',
    workstationIntituleAr: 'التشطيب الهندسي ومطابقة القوالب والأبعاد',
    typologie: 'CRITIQUE',
    segment: 'Planche de Bord',
    ligne: 'Ligne 1',
    quantiteDemandee: 2,
    quantitePourvue: 1,
    dateCible: '2026-10-27',
    priorite: 'CRITIQUE',
    statut: 'PARTIEL'
  },
  {
    id: 'pnd-04',
    siteId: 'site-bsk',
    workstationId: 'ws-04',
    workstationCode: 'PST-AGRF-01',
    workstationIntituleFr: 'Test AGRF Étanchéité & Verrouillage',
    workstationIntituleAr: 'اختبار AGRF للإحكام والتثبيت الثانوي',
    typologie: 'CRITIQUE',
    segment: 'Faisceau Moteur',
    ligne: 'Ligne 2',
    quantiteDemandee: 2,
    quantitePourvue: 0,
    dateCible: '2026-10-26',
    priorite: 'URGENTE',
    statut: 'OUVERT'
  },
  {
    id: 'pnd-05',
    siteId: 'site-bsk',
    workstationId: 'ws-05',
    workstationCode: 'PST-BOL-01',
    workstationIntituleFr: 'Contrôle Électrique Bol / TNC',
    workstationIntituleAr: 'فحص التوصيل الكهربائي عبر البول واختبار عدم التداخل',
    typologie: 'CRITIQUE',
    segment: 'Faisceau Habitacle',
    ligne: 'Ligne 3',
    quantiteDemandee: 2,
    quantitePourvue: 0,
    dateCible: '2026-10-26',
    priorite: 'CRITIQUE',
    statut: 'OUVERT'
  }
];

export const STANDARD_GESTURE_CRITERIA: GestureEvaluationCriterion[] = [
  {
    id: 'crit-01',
    code: 'C01_POSTURE_5S',
    libelleFr: 'Posture & Ergonomie 5S du poste',
    libelleAr: 'الوضعية السليمة وتنظيم مساحة العمل 5S',
    descriptionAttenduFr: 'Opérateur positionné face au râtelier, fils non emmêlés, respect des distances de confort articulaire.',
    descriptionAttenduAr: 'وقوف ملائم أمام حامل الأسلاك، تجنب تشابك الخيوط واحترام التموضع المريح.',
    estCritique: false
  },
  {
    id: 'crit-02',
    code: 'C02_INSERTION_CLIC',
    libelleFr: 'Insertion axiale franche avec « Clic » sonore',
    libelleAr: 'إدخال محوري مستقيم مع سماع نقرة التثبيت',
    descriptionAttenduFr: 'Introduction sans angle de biais, enfoncement complet du terminal jusqu’à l’encliquetage audible.',
    descriptionAttenduAr: 'إدخال السلك بشكل مستقيم تماماً حتى سماع طقة التثبيت داخل الحجرة.',
    estCritique: true
  },
  {
    id: 'crit-03',
    code: 'C03_VERROU_SECONDAIRE',
    libelleFr: 'Engagement affleurant du verrou secondaire (TPA / CPA)',
    libelleAr: 'إغلاق القفل الثانوي بشكل متساوٍ ومحكم',
    descriptionAttenduFr: 'Le peigne ou volet de sécurité doit s’enfoncer sans forcer et être parfaitement aligné.',
    descriptionAttenduAr: 'تثبيت مشط أو غالق الأمان الثانوي دون مقاومة وبمحاذاة كاملة للهيكل.',
    estCritique: true
  },
  {
    id: 'crit-04',
    code: 'C04_PULL_TEST_MANUEL',
    libelleFr: 'Test de traction manuel systématique (Pull-Test 1-2 N)',
    libelleAr: 'اختبار السحب اليدوي الفوري لكل سلك (Pull-Test)',
    descriptionAttenduFr: 'Légère traction axiale vers l’arrière sur chaque fil immédiatement après insertion.',
    descriptionAttenduAr: 'سحب خفيف للخلف لكل سلك فور إدخاله للتأكد التام من استقراره.',
    estCritique: true
  },
  {
    id: 'crit-05',
    code: 'C05_INTEGRITE_ISOLANT',
    libelleFr: 'Absence d’entaille, de pli ou d’écrasement d’isolant',
    libelleAr: 'سلامة العازل البلاستيكي من أي خدش أو طي أو ضغط',
    descriptionAttenduFr: 'Gaine plastique intacte, aucun brin de cuivre apparent hors de la zone de sertissage.',
    descriptionAttenduAr: 'غلاف السلك سليم تماماً وبدون أي بروز لشعيرات النحاس.',
    estCritique: false
  },
  {
    id: 'crit-06',
    code: 'C06_DETROMPAGE_COULEUR',
    libelleFr: 'Autocontrôle visuel 100% de concordance des couleurs',
    libelleAr: 'المراقبة البصرية الذاتية الكاملة لتطابق الألوان والمواقع',
    descriptionAttenduFr: 'Vérification méticuleuse du plan de câblage : chaque couleur de fil dans sa voie dédiée.',
    descriptionAttenduAr: 'التحقق الدقيق من مخطط التوصيل : كل لون سلك في موضعه المخصص بالضبط.',
    estCritique: true
  }
];

export const INITIAL_REJECTIONS: AssignmentRejectionRecord[] = [
  {
    id: 'rej-001',
    recrueId: 'rec-003',
    recrueNom: 'Chraibi Anas',
    workstationId: 'ws-04',
    workstationIntitule: 'Test AGRF Étanchéité & Verrouillage',
    dateRefus: '2026-10-21T16:00:00Z',
    refuseParMatricule: 'L-TRN-302',
    refuseParNom: 'Tariq Mansour',
    motifRefus: 'Score pratique école (13/20) insuffisant pour poste critique AGRF (seuil requis: 16/20). Réorienté vers poste initial insertion pour consolidation.'
  }
];

export const INITIAL_GESTURE_REPORTS: GestureEvaluationReport[] = [
  {
    id: 'rep-001',
    recrueId: 'rec-001',
    workstationId: 'ws-01',
    dateEvaluation: '2026-10-22T15:30:00Z',
    formateurMatricule: 'L-TRN-301',
    formateurNom: 'Youssef El Amrani',
    nomFichierMedia: 'photo-geste-insertion-rec001.jpg',
    criteres: [
      {
        id: 'crit-01',
        code: 'C01_POSTURE_5S',
        libelleFr: 'Posture & Ergonomie 5S du poste',
        libelleAr: 'الوضعية السليمة وتنظيم مساحة العمل 5S',
        descriptionAttenduFr: 'Opérateur positionné face au râtelier, fils non emmêlés.',
        descriptionAttenduAr: 'وقوف ملائم أمام حامل الأسلاك.',
        estCritique: false,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Posture stable et râtelier ordonné.',
        observationFormateur: 'Très bonne discipline 5S.',
        confianceIA: 94
      },
      {
        id: 'crit-02',
        code: 'C02_INSERTION_CLIC',
        libelleFr: 'Insertion axiale franche avec « Clic » sonore',
        libelleAr: 'إدخال محوري مستقيم مع سماع نقرة التثبيت',
        descriptionAttenduFr: 'Introduction sans angle de biais, enfoncement complet.',
        descriptionAttenduAr: 'إدخال السلك بشكل مستقيم تماماً.',
        estCritique: true,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Axe d’insertion rectiligne respecté à 100%.',
        observationFormateur: 'Déclic sonore net confirmé au banc d’essai.',
        confianceIA: 96
      },
      {
        id: 'crit-03',
        code: 'C03_VERROU_SECONDAIRE',
        libelleFr: 'Engagement affleurant du verrou secondaire (TPA / CPA)',
        libelleAr: 'إغلاق القفل الثانوي بشكل متساوٍ ومحكم',
        descriptionAttenduFr: 'Volet de sécurité affleurant.',
        descriptionAttenduAr: 'تثبيت مشط الأمان.',
        estCritique: true,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Verrouillage secondaire affleurant sans jeu détecté.',
        observationFormateur: 'Conforme.',
        confianceIA: 92
      },
      {
        id: 'crit-04',
        code: 'C04_PULL_TEST_MANUEL',
        libelleFr: 'Test de traction manuel systématique (Pull-Test 1-2 N)',
        libelleAr: 'اختبار السحب اليدوي الفوري لكل سلك (Pull-Test)',
        descriptionAttenduFr: 'Traction unitaire immédiate.',
        descriptionAttenduAr: 'سحب خفيف للخلف.',
        estCritique: true,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Geste de traction observé sur chaque voie.',
        observationFormateur: 'Réflexe d’autocontrôle parfaitement acquis.',
        confianceIA: 90
      },
      {
        id: 'crit-05',
        code: 'C05_INTEGRITE_ISOLANT',
        libelleFr: 'Absence d’entaille, de pli ou d’écrasement d’isolant',
        libelleAr: 'سلامة العازل البلاستيكي',
        descriptionAttenduFr: 'Gaine intacte.',
        descriptionAttenduAr: 'غلاف السلك سليم.',
        estCritique: false,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Aucun dommage de surface visible sur les isolants.',
        observationFormateur: 'Parfait.',
        confianceIA: 95
      },
      {
        id: 'crit-06',
        code: 'C06_DETROMPAGE_COULEUR',
        libelleFr: 'Autocontrôle visuel 100% de concordance des couleurs',
        libelleAr: 'المراقبة البصرية الذاتية الكاملة لتطابق الألوان',
        descriptionAttenduFr: 'Chaque couleur dans sa voie dédiée.',
        descriptionAttenduAr: 'كل لون سلك في موضعه.',
        estCritique: true,
        statutFormateur: 'OK',
        suggestionIA: 'OK',
        observationIA: 'Codes couleurs conformes au schéma de pose VW.',
        observationFormateur: 'Aucune inversion.',
        confianceIA: 98
      }
    ],
    noteSur20: 19,
    resultatFinal: 'VALIDE',
    suggestionIAValideeParFormateur: true,
    commentaireGlobalFormateur: 'Excellent geste technique, aptitude confirmée pour affectation au poste.',
    horodatageIA: '2026-10-22T15:28:45Z',
    modeleIAUtilise: 'gemini-3.8-flash'
  }
];

export const INITIAL_DEPARTURES: import('../types/metrics').DepartureRecord[] = [
  {
    id: 'dep-001',
    recrueId: 'rec-dep-01',
    cin: 'BK990011',
    nom: 'Benani',
    prenom: 'Ibrahim',
    matricule: 'L-OPR-9011',
    siteId: 'site-bsk',
    groupeEcoleId: 'grp-01',
    groupeCode: 'GRP-2026-A',
    etapeDepart: 'ECOLE_FORMATION',
    motifDepart: 'Inadaptation au travail posté (2x8 / 3x8)',
    dateDepart: '2026-10-14',
    joursPassesDansEtape: 3,
    commentaire: 'Difficultés déclarées avec le rythme des horaires d’équipe.'
  },
  {
    id: 'dep-002',
    recrueId: 'rec-dep-02',
    cin: 'BL887766',
    nom: 'Khadiri',
    prenom: 'Meryem',
    matricule: 'L-OPR-7766',
    siteId: 'site-bsk',
    groupeEcoleId: 'grp-01',
    groupeCode: 'GRP-2026-A',
    etapeDepart: 'AFFECTATION_LIGNE',
    motifDepart: 'Reconversion professionnelle',
    dateDepart: '2026-10-18',
    joursPassesDansEtape: 1,
    commentaire: 'Admise dans un cursus universitaire en alternance.'
  },
  {
    id: 'dep-003',
    recrueId: 'rec-dep-03',
    cin: 'BE445566',
    nom: 'Tlemcani',
    prenom: 'Walid',
    matricule: 'L-OPR-5566',
    siteId: 'site-bsk',
    groupeEcoleId: 'grp-01',
    groupeCode: 'GRP-2026-A',
    etapeDepart: 'SUIVI_POSTE_28J',
    motifDepart: 'Raisons personnelles et familiales',
    dateDepart: '2026-10-20',
    joursPassesDansEtape: 12,
    commentaire: 'Déménagement familial en dehors de la région du Grand Casablanca.'
  },
  {
    id: 'dep-004',
    recrueId: 'rec-dep-04',
    cin: 'BW112233',
    nom: 'Ghazali',
    prenom: 'Soufiane',
    matricule: 'L-OPR-2233',
    siteId: 'site-bsk',
    groupeEcoleId: 'grp-02',
    groupeCode: 'GRP-2026-B',
    etapeDepart: 'SUIVI_POSTE_28J',
    motifDepart: 'Autre opportunité industrielle',
    dateDepart: '2026-10-22',
    joursPassesDansEtape: 8,
    commentaire: 'Offre reçue dans le secteur aéronautique à Nouaceur.'
  }
];

export const INITIAL_SURVEYS: import('../types/metrics').OperatorSatisfactionSurvey[] = [
  {
    id: 'surv-001',
    recrueId: 'rec-001',
    nom: 'El Fassi',
    prenom: 'Yassine',
    cin: 'BK654321',
    siteId: 'site-bsk',
    etape: 'FIN_ECOLE',
    dateEnquete: '2026-10-16',
    clarteFormationSur5: 5,
    accompagnementFormateurSur5: 5,
    accueilEquipePosteSur5: 4,
    confianceAutonomieSur5: 4,
    scoreGlobalSur5: 4.5,
    recommandeLeoniNPS: 9,
    commentaire: 'Formation école très claire, maquettes d’entraînement fidèles à l’atelier.'
  },
  {
    id: 'surv-002',
    recrueId: 'rec-013',
    nom: 'Slaoui',
    prenom: 'Mehdi',
    cin: 'BA123789',
    siteId: 'site-bsk',
    etape: 'FIN_ECOLE',
    dateEnquete: '2026-10-16',
    clarteFormationSur5: 5,
    accompagnementFormateurSur5: 5,
    accueilEquipePosteSur5: 5,
    confianceAutonomieSur5: 4,
    scoreGlobalSur5: 4.75,
    recommandeLeoniNPS: 10,
    commentaire: 'Excellente pédagogie des formateurs sur les gestes qualité et la sécurité 5S.'
  },
  {
    id: 'surv-003',
    recrueId: 'rec-033',
    nom: 'Belkadi',
    prenom: 'Asmaa',
    cin: 'BL123789',
    siteId: 'site-bsk',
    etape: 'FIN_SUIVI_POSTE',
    dateEnquete: '2026-10-18',
    clarteFormationSur5: 5,
    accompagnementFormateurSur5: 5,
    accueilEquipePosteSur5: 5,
    confianceAutonomieSur5: 5,
    scoreGlobalSur5: 5.0,
    recommandeLeoniNPS: 10,
    commentaire: 'Le suivi 28 jours au poste m’a permis de maîtriser la cadence sans stress.'
  },
  {
    id: 'surv-004',
    recrueId: 'rec-034',
    nom: 'Bouazza',
    prenom: 'Ayoub',
    cin: 'BM234890',
    siteId: 'site-bsk',
    etape: 'FIN_SUIVI_POSTE',
    dateEnquete: '2026-10-18',
    clarteFormationSur5: 4,
    accompagnementFormateurSur5: 5,
    accueilEquipePosteSur5: 4,
    confianceAutonomieSur5: 5,
    scoreGlobalSur5: 4.5,
    recommandeLeoniNPS: 9,
    commentaire: 'Tutorat très présent lors des points critiques et des contrôles de connecteurs.'
  },
  {
    id: 'surv-005',
    recrueId: 'rec-035',
    nom: 'Naciri',
    prenom: 'Hajar',
    cin: 'BN345901',
    siteId: 'site-bsk',
    etape: 'FIN_SUIVI_POSTE',
    dateEnquete: '2026-10-19',
    clarteFormationSur5: 5,
    accompagnementFormateurSur5: 4,
    accueilEquipePosteSur5: 5,
    confianceAutonomieSur5: 4,
    scoreGlobalSur5: 4.5,
    recommandeLeoniNPS: 9,
    commentaire: 'Intégration rapide au sein de l’équipe du Shift A.'
  }
];


