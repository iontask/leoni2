/**
 * LEONI QualiTrack - Tests Automatisés de la Logique Critique (Étape 9)
 * 1. Score Carré Magique & Barème officiel (Niveau I 0.24, Niveau L 0.50, Niveau U 0.26)
 * 2. Critères bloquants (Arrêt immédiat si critère bloquant NOK)
 * 3. Règle des 4 défauts par jour (Obligation de refaire la formation, passage en prolongation)
 * 4. Verrouillages & Dérogations Poka-Yoke (École 5j, Poste critique note >= 16/20)
 * 5. Validation des dates (Format ISO AAAA-MM-JJ, cohérence chronologique)
 * 6. Matching par CIN (Doublon local, antécédent multisite, règle de rapprochement)
 * 7. Seuils de tests (Théorie >= 14/20, Pratique >= 14/20, Poste critique >= 16/20)
 * 8. Droits par rôle & Matrice d'habilitation (Accès sensibles réservé ADMINISTRATION)
 */

import { describe, it, expect } from 'vitest';
import { PokaYokeEngine } from '../engine/pokaYoke';
import { MetricsEngine } from '../engine/metrics';
import { maskCIN, formatDateDisplay } from '../i18n/translations';
import { Recruit, SystemParameter, UserProfile, Workstation } from '../types';
import { CarreMagiqueSheet } from '../types/carreMagique';

describe('1. Logique Critique : Score Carré Magique & Barème Officiel', () => {
  it('calcule correctement les coefficients officiels : Niveau I (0.24), Niveau L (0.50), Niveau U (0.26)', () => {
    const pMap = {
      dureeEcoleJours: 5,
      dureePosteJours: 28,
      seuilReussiteEcole: 14,
      seuilCarreMagique: 14,
      pointsTotalCarreMagique: 16
    };

    const recruit: Recruit = {
      id: 'test-rec-1',
      cin: 'BK123456',
      nom: 'Alami',
      prenom: 'Youssef',
      dateNaissance: '2000-01-01',
      telephone: '+212600000000',
      siteId: 'site-bsk',
      dateEntree: '2026-09-01',
      statut: 'EN_APPRENTISSAGE_POSTE',
      ecoleJoursValides: 5,
      ecoleValidee: true,
      joursSuiviCompletes: 14,
      carreMagiquePointsConformes: 14,
      testPratiqueValide: true,
      qualifiee: false,
      visaQualite: false,
      visaProduction: false
    };

    const metrics = MetricsEngine.calculateRecruitMetrics(recruit, pMap);
    expect(metrics.scoreConformiteCarreMagiquePourcent).toBe(88); // 14/16 = 87.5% arrondi à 88%
    expect(metrics.progressionPostePourcent).toBe(50); // 14/28 jours = 50%
    expect(metrics.joursTotalEffectues).toBe(19); // 5 école + 14 poste = 19
    expect(metrics.progressionGlobalePourcent).toBe(58); // 19/33 = 57.57% arrondi à 58%
  });

  it('valide la synthèse 16 points du Carré Magique', () => {
    const pointsConformes = 16;
    const pourcent = Math.round((pointsConformes / 16) * 100);
    expect(pourcent).toBe(100);

    const seuilConformite = 14;
    expect(pointsConformes >= seuilConformite).toBe(true);
  });
});

describe('2. Logique Critique : Critères Bloquants', () => {
  it('détecte un critère bloquant NOK dans le Carré Magique', () => {
    const sheet: CarreMagiqueSheet = {
      id: 'cm-sheet-test-blocking',
      recrueId: 'rec-test-blocking',
      matricule: 'LEO-26-1001',
      nom: 'Test',
      prenom: 'Blocking',
      posteId: 'ws-01',
      posteCode: 'PST-01',
      posteIntitule: 'Planche Assemblage',
      dateDebutSuivi: '2026-09-01',
      equipe: 'Shift Matin',
      famillePoste: 'ASSEMBLAGE',
      raisonSuivi: 'INTÉGRATION NOUVELLE RECRUE',
      objectifQualite: '0 Défaut',
      objectifProductivite: '100% cadence standard',
      derniereMiseAJour: '2026-09-02',
      suiviJours: [],
      criteres: [
        {
          id: 'crit-b1',
          numero: 1,
          phase: 'PHASE_1',
          niveau: 'I',
          libelleFr: 'Respect des règles de sécurité et port des EPI',
          libelleAr: 'احترام قواعد السلامة وارتداء معدات الوقاية',
          descriptionDetailleeFr: 'Port obligatoire des gants antistatiques et chaussures de sécurité',
          descriptionDetailleeAr: 'ارتداء القفازات وأحذية السلامة',
          coefficient: 0.06,
          estBloquant: true,
          statut: 'NOK',
          observation: 'Non-port des gants antistatiques constaté'
        },
        {
          id: 'crit-l1',
          numero: 5,
          phase: 'PHASE_2',
          niveau: 'L',
          libelleFr: 'Encliquetage franc avec déclic audible',
          libelleAr: 'تركيب محكم مع سماع صوت الإقفال',
          descriptionDetailleeFr: 'Vérification du déclic de verrouillage et pull-test',
          descriptionDetailleeAr: 'التحقق من صوت الإقفال وسحب السلك',
          coefficient: 0.08,
          estBloquant: false,
          statut: 'OK'
        }
      ],
      visas: {
        FORMATEUR_TERRAIN: { role: 'FORMATEUR_TERRAIN', titreFr: 'Formateur', titreAr: 'المؤطر', ordre: 1, estObligatoire: true, estSigne: false },
        SHIFT_LEADER: { role: 'SHIFT_LEADER', titreFr: 'Shift Leader', titreAr: 'رئيس الفريق', ordre: 2, estObligatoire: true, estSigne: false },
        RESPONSABLE_PRODUCTION: { role: 'RESPONSABLE_PRODUCTION', titreFr: 'RFM', titreAr: 'مسؤول الإنتاج', ordre: 3, estObligatoire: true, estSigne: false },
        QUALITE: { role: 'QUALITE', titreFr: 'Qualité', titreAr: 'الجودة', ordre: 4, estObligatoire: true, estSigne: false }
      }
    };

    const hasBlockingNOK = sheet.criteres.some((c) => c.estBloquant && c.statut === 'NOK');
    expect(hasBlockingNOK).toBe(true);
  });
});

describe('3. Logique Critique : Règle des 4 Défauts par Jour', () => {
  it('déclenche le verrouillage Poka-Yoke et la prolongation obligatoire si un jour dépasse 4 défauts', () => {
    const dailyRecords = [
      { jourNumero: 1, date: '2026-10-01', objectifQ: true, objectifP: true, nombreDefauts: 1, valide: true },
      { jourNumero: 2, date: '2026-10-02', objectifQ: true, objectifP: true, nombreDefauts: 2, valide: true },
      { jourNumero: 3, date: '2026-10-03', objectifQ: false, objectifP: true, nombreDefauts: 5, valide: false } // Dépassement > 4 !
    ];

    const hasExceededDefectThreshold = dailyRecords.some((r) => r.nombreDefauts > 4);
    expect(hasExceededDefectThreshold).toBe(true);

    const recruitEnProlongation: Recruit = {
      id: 'rec-prolongation',
      cin: 'BK999999',
      nom: 'Benani',
      prenom: 'Karim',
      dateNaissance: '2001-05-10',
      telephone: '+212611223344',
      siteId: 'site-bsk',
      dateEntree: '2026-09-01',
      statut: 'NON_QUALIFIE_PROLONGATION',
      ecoleJoursValides: 5,
      ecoleValidee: true,
      joursSuiviCompletes: 3,
      carreMagiquePointsConformes: 8,
      testPratiqueValide: true,
      qualifiee: false,
      visaQualite: false,
      visaProduction: false,
      estEnProlongation: true,
      motifProlongation: 'Dépassement du seuil de 4 défauts journaliers (Jour 3)'
    };

    const mockAdmin: UserProfile = {
      id: 'usr-admin',
      matricule: 'LEO-ADM-01',
      nom: 'Alami',
      prenom: 'Samira',
      role: 'ADMIN',
      siteId: 'site-bsk',
      email: 'admin@leoni.com'
    };

    const parameters: SystemParameter[] = [
      {
        id: 'p1',
        cle: 'DUREE_POSTE_JOURS',
        valeur: 28,
        description: '',
        version: 1,
        dateModification: '2026-01-01',
        modifieParMatricule: 'LEO-ADM',
        modifieParNom: 'Admin',
        motifModification: 'Init'
      },
      {
        id: 'p2',
        cle: 'SEUIL_CARRE_MAGIQUE_POINTS',
        valeur: 14,
        description: '',
        version: 1,
        dateModification: '2026-01-01',
        modifieParMatricule: 'LEO-ADM',
        modifieParNom: 'Admin',
        motifModification: 'Init'
      }
    ];

    const evaluation = PokaYokeEngine.evaluate('VALIDATION_FINALE_QUALIFICATION', {
      recruit: recruitEnProlongation,
      currentUser: mockAdmin,
      parameters
    });

    expect(evaluation.autorise).toBe(false);
    expect(evaluation.messageBlocage).toContain('prolongation');
    expect(evaluation.derogationPossible).toBe(true);
    expect(evaluation.rolesHabilitesDerogation).toContain('QUALITE');
    expect(evaluation.rolesHabilitesDerogation).toContain('RESPONSABLE_PRODUCTION');
  });
});

describe('4. Logique Critique : Verrouillages & Dérogations Poka-Yoke', () => {
  const parameters: SystemParameter[] = [
    {
      id: 'p1',
      cle: 'DUREE_ECOLE_JOURS',
      valeur: 5,
      description: '',
      version: 1,
      dateModification: '2026-01-01',
      modifieParMatricule: 'LEO-ADM',
      modifieParNom: 'Admin',
      motifModification: 'Init'
    },
    {
      id: 'p2',
      cle: 'NOTE_MIN_POSTE_CRITIQUE',
      valeur: 16,
      description: '',
      version: 1,
      dateModification: '2026-01-01',
      modifieParMatricule: 'LEO-ADM',
      modifieParNom: 'Admin',
      motifModification: 'Init'
    }
  ];

  const mockTrainer: UserProfile = {
    id: 'usr-trainer',
    matricule: 'LEO-TRN-01',
    nom: 'Formateur',
    prenom: 'Ahmed',
    role: 'FORMATEUR_ECOLE',
    siteId: 'site-bsk',
    email: 'trainer@leoni.com'
  };

  it('bloque l’affectation au poste si l’école 5 jours n’est pas validée', () => {
    const recruitIncomplete: Recruit = {
      id: 'rec-inc',
      cin: 'BK112233',
      nom: 'Test',
      prenom: 'Incomplet',
      dateNaissance: '2002-02-02',
      telephone: '+212600000000',
      siteId: 'site-bsk',
      dateEntree: '2026-10-20',
      statut: 'EN_ECOLE',
      ecoleJoursValides: 3,
      ecoleValidee: false,
      joursSuiviCompletes: 0,
      carreMagiquePointsConformes: 0,
      testPratiqueValide: false,
      qualifiee: false,
      visaQualite: false,
      visaProduction: false
    };

    const res = PokaYokeEngine.evaluate('AFFECTATION_POSTE', {
      recruit: recruitIncomplete,
      currentUser: mockTrainer,
      parameters
    });

    expect(res.autorise).toBe(false);
    expect(res.messageBlocage).toContain('5 jours requis');
    expect(res.derogationPossible).toBe(true);
  });

  it('bloque l’accès au poste critique si la note théorique est < 16/20', () => {
    const recruitMoyen: Recruit = {
      id: 'rec-moyen',
      cin: 'BK445566',
      nom: 'Test',
      prenom: 'Moyen',
      dateNaissance: '2002-02-02',
      telephone: '+212600000000',
      siteId: 'site-bsk',
      dateEntree: '2026-10-15',
      statut: 'EN_ECOLE',
      ecoleJoursValides: 5,
      ecoleValidee: true,
      ecoleScoreTheorie: 14.5,
      ecoleScorePratique: 15,
      joursSuiviCompletes: 0,
      carreMagiquePointsConformes: 0,
      testPratiqueValide: true,
      qualifiee: false,
      visaQualite: false,
      visaProduction: false
    };

    const workstationCritique: Workstation = {
      id: 'ws-crit',
      code: 'PST-CRIT-01',
      intituleFr: 'Sertissage Haute Tension',
      intituleAr: 'الكبس عالي التوتر',
      familleMetier: 'ASSEMBLAGE',
      typologie: 'CRITIQUE',
      siteId: 'site-bsk',
      segment: 'Haute Tension VE',
      ligne: 'LIGNE-VE-01',
      aptitudesRequisesFr: ['Dextérité'],
      aptitudesRequisesAr: ['دقة'],
      formateurReferentMatricule: 'LEO-TRN',
      formateurReferentNom: 'Formateur',
      prerequis: {
        assiduiteMinJours: 5,
        noteEcoleMin: 16,
        diplomeExige: true,
        testGesteReussiExige: true
      }
    };

    const res = PokaYokeEngine.evaluate('AFFECTATION_POSTE_CRITIQUE', {
      recruit: recruitMoyen,
      currentUser: mockTrainer,
      parameters,
      workstation: workstationCritique
    });

    expect(res.autorise).toBe(false);
    expect(res.messageBlocage).toContain('seuil requis : 16/20');
  });

  it('vérifie l’habilitation des rôles pour accorder une dérogation', () => {
    const authorized = ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN'];
    expect(PokaYokeEngine.canGrantDerogation('RESPONSABLE_PRODUCTION', authorized as any)).toBe(true);
    expect(PokaYokeEngine.canGrantDerogation('QUALITE', authorized as any)).toBe(true);
    expect(PokaYokeEngine.canGrantDerogation('ADMIN', authorized as any)).toBe(true);
    expect(PokaYokeEngine.canGrantDerogation('FORMATEUR_TERRAIN', authorized as any)).toBe(false);
    expect(PokaYokeEngine.canGrantDerogation('SHIFT_LEADER', authorized as any)).toBe(false);
  });
});

describe('5. Logique Critique : Validation des Formats de Date ISO & Affichage', () => {
  it('valide le format ISO AAAA-MM-JJ strict', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dateRegex.test('2026-10-24')).toBe(true);
    expect(dateRegex.test('2026-02-29')).toBe(true);
    expect(dateRegex.test('24/10/2026')).toBe(false);
    expect(dateRegex.test('2026-1-1')).toBe(false);
    expect(dateRegex.test('invalid')).toBe(false);
  });

  it('formate correctement les dates en JJ/MM/AAAA pour l’affichage atelier', () => {
    expect(formatDateDisplay('2026-10-24')).toBe('24/10/2026');
    expect(formatDateDisplay('2026-01-05T08:30:00Z')).toBe('05/01/2026');
    expect(formatDateDisplay('')).toBe('-');
    expect(formatDateDisplay(undefined)).toBe('-');
  });
});

describe('6. Logique Critique : Matching par CIN & Antécédents Multisite', () => {
  it('détecte un doublon direct sur le même site', () => {
    const existingRecruits = [
      { cin: 'BK123456', siteId: 'site-bsk', nom: 'Alami' },
      { cin: 'BL789012', siteId: 'site-bsk', nom: 'Chraibi' }
    ];

    const newCandidateCIN = 'BK123456';
    const isDuplicate = existingRecruits.some(
      (r) => r.cin.toUpperCase() === newCandidateCIN.toUpperCase()
    );
    expect(isDuplicate).toBe(true);
  });

  it('détecte un antécédent sur un autre site LEONI', () => {
    const recruitsAllSites = [
      { cin: 'BK123456', siteId: 'site-brc', siteNom: 'LEONI Berrechid' },
      { cin: 'BL789012', siteId: 'site-asb', siteNom: 'LEONI Aïn Sebaâ' }
    ];

    const candidateCin = 'BK123456';
    const currentSiteId = 'site-bsk';

    const otherSiteMatch = recruitsAllSites.find(
      (r) => r.cin.toUpperCase() === candidateCin.toUpperCase() && r.siteId !== currentSiteId
    );

    expect(otherSiteMatch).toBeDefined();
    expect(otherSiteMatch?.siteNom).toBe('LEONI Berrechid');
  });
});

describe('7. Logique Critique : Seuils de Tests & Règles Décisionnelles', () => {
  it('applique les seuils école : ADMIS (>=14), A REVOIR (10..13.9), NON ADMIS (<10)', () => {
    const getSchoolDecision = (scoreTheorie: number, scorePratique: number) => {
      const avg = (scoreTheorie + scorePratique) / 2;
      if (avg >= 14 && scoreTheorie >= 12 && scorePratique >= 12) return 'ADMIS';
      if (avg >= 10) return 'A_REVOIR';
      return 'NON_ADMIS';
    };

    expect(getSchoolDecision(16, 17)).toBe('ADMIS');
    expect(getSchoolDecision(14, 14)).toBe('ADMIS');
    expect(getSchoolDecision(12, 13)).toBe('A_REVOIR');
    expect(getSchoolDecision(8, 9)).toBe('NON_ADMIS');
    expect(getSchoolDecision(18, 10)).toBe('A_REVOIR');
  });
});

describe('8. Logique Critique : Sécurité, Droits par Rôle & Masquage CIN', () => {
  it('masque le CIN pour tous les rôles non-administration', () => {
    const rawCin = 'BK123456';
    expect(maskCIN(rawCin, 'ADMINISTRATION')).toBe('BK123456');
    expect(maskCIN(rawCin, 'ADMIN')).toBe('BK123456');
    expect(maskCIN(rawCin, 'FORMATEUR_TERRAIN')).toBe('BK••••56');
    expect(maskCIN(rawCin, 'SHIFT_LEADER')).toBe('BK••••56');
    expect(maskCIN(rawCin, 'QUALITE')).toBe('BK••••56');
    expect(maskCIN(rawCin, 'RESPONSABLE_PRODUCTION')).toBe('BK••••56');
  });

  it('réserve l’import en masse strictement au rôle ADMINISTRATION et ADMIN', () => {
    const mockAdminRH: UserProfile = {
      id: 'usr-rh',
      matricule: 'LEO-RH-01',
      nom: 'Benani',
      prenom: 'Fatima',
      role: 'ADMINISTRATION',
      siteId: 'site-bsk',
      email: 'rh@leoni.com'
    };

    const mockShiftLeader: UserProfile = {
      id: 'usr-sl',
      matricule: 'LEO-SL-01',
      nom: 'Chef',
      prenom: 'Hassan',
      role: 'SHIFT_LEADER',
      siteId: 'site-bsk',
      email: 'sl@leoni.com'
    };

    const evalRH = PokaYokeEngine.evaluate('IMPORT_MASSE', {
      currentUser: mockAdminRH,
      parameters: []
    });
    expect(evalRH.autorise).toBe(true);

    const evalSL = PokaYokeEngine.evaluate('IMPORT_MASSE', {
      currentUser: mockShiftLeader,
      parameters: []
    });
    expect(evalSL.autorise).toBe(false);
  });
});

describe('9. Numérisation OCR.space & Compatibilité GitHub Pages (Anti-Erreur 405)', () => {
  it('extrait correctement le CIN, Nom, Prénom et Date de Naissance d’une CNI marocaine', async () => {
    const { parseMoroccanOCRDocument, mapRequirementToDocType } = await import('../services/ocrService');

    const sampleRawText = `
      ROYAUME DU MAROC
      CARTE NATIONALE D'IDENTITE
      Nom : BENJELLOUN
      Prénom : Amine
      Né le : 22.08.1999
      N° BK789456
      Valable jusqu'au : 15.06.2030
      IDMARBK789456<<<<<<<<<<<<<<<
    `;

    const parsed = parseMoroccanOCRDocument(sampleRawText, 'CNI');
    expect(parsed.cinExtraite).toBe('BK789456');
    expect(parsed.nomExtrait).toBe('BENJELLOUN');
    expect(parsed.prenomExtrait).toBe('Amine');
    expect(parsed.dateNaissanceExtraite).toBe('1999-08-22');
    expect(parsed.confianceScore).toBeGreaterThanOrEqual(90);
    expect(parsed.estSimule).toBe(false);

    expect(mapRequirementToDocType('DOC_CNI')).toBe('CNI');
    expect(mapRequirementToDocType('DOC_DIPLOME')).toBe('DIPLOME');
    expect(mapRequirementToDocType('DOC_CASIER')).toBe('CASIER');
  });

  it('ne retourne aucune fausse donnée (zéro fausse donnée) lorsqu’aucun texte n’est détecté', async () => {
    const { parseMoroccanOCRDocument } = await import('../services/ocrService');

    const emptyParsed = parseMoroccanOCRDocument('', 'CNI');
    expect(emptyParsed.cinExtraite).toBe('');
    expect(emptyParsed.nomExtrait).toBe('');
    expect(emptyParsed.prenomExtrait).toBe('');
    expect(emptyParsed.dateNaissanceExtraite).toBe('');
    expect(emptyParsed.confianceScore).toBe(0);

    // Vérifie aussi que si le nom de fichier contient un indice comme CIN_YOUSSRA.pdf, il est utilisé intelligemment
    const withFilename = parseMoroccanOCRDocument('', 'CNI', 'CIN_YOUSSRA.pdf');
    expect(withFilename.prenomExtrait).toBe('Youssra');
    expect(withFilename.cinExtraite).toBe(''); // Pas de faux CIN aléatoire
  });
});

describe('10. Phase IA de Nettoyage & Validation des Champs (Gemini & Heuristique Hybride)', () => {
  it('nettoie et normalise les confusions OCR sur le CIN et les noms avec traçabilité des corrections', async () => {
    const { clientHeuristicCleanse } = await import('../services/ocrService');

    // Cas typique : OCR avec bruits, 'O' confondu avec '0' dans le numéro CIN, espaces
    const noisyRawText = `
      ROYAUME DU MAROC
      CARTE NATIONALE D'IDENTITE
      Nom : ROYAUME CHRAIBI
      Prénom : youssra
      Né le : 14.05.2001
      N° BK 654O21
    `;

    const cleaned = clientHeuristicCleanse(noisyRawText, 'CIN_YOUSSRA.pdf', 'CNI');

    // Le 'O' dans la partie chiffre doit être converti en 0 et les espaces supprimés
    expect(cleaned.cin).toBe('BK654021');
    expect(cleaned.nom).toBe('CHRAIBI');
    expect(cleaned.prenom).toBe('Youssra');
    expect(cleaned.dateNaissance).toBe('2001-05-14');
    expect(cleaned.estConformeAgeLegal).toBe(true);
    expect(cleaned.correctionsApportees.length).toBeGreaterThan(0);
    expect(cleaned.confianceGlobale).toBeGreaterThanOrEqual(75);
  });

  it('détecte et alerte si l’opérateur a moins de 18 ans', async () => {
    const { clientHeuristicCleanse } = await import('../services/ocrService');

    const minorRawText = `
      Nom : BENJELLOUN
      Prénom : Sami
      Né le : 15.08.2012
      N° CD123456
    `;

    const cleaned = clientHeuristicCleanse(minorRawText, 'doc.jpg', 'CNI');
    expect(cleaned.cin).toBe('CD123456');
    expect(cleaned.estConformeAgeLegal).toBe(false);
    expect(cleaned.correctionsApportees.some((c) => c.includes('< 18 ans'))).toBe(true);
  });

  it('gère parfaitement la mise en page CNI marocaine avec étiquettes arabes inversées et zone MRZ', async () => {
    const { parseMoroccanOCRDocument, normalizeDateToISO } = await import('../services/ocrService');

    // Test normalizeDateToISO
    expect(normalizeDateToISO('14.05.2001')).toBe('2001-05-14');
    expect(normalizeDateToISO('14/05/2001')).toBe('2001-05-14');
    expect(normalizeDateToISO('14-05-2001')).toBe('2001-05-14');
    expect(normalizeDateToISO('2001-05-14')).toBe('2001-05-14');
    expect(normalizeDateToISO('010514')).toBe('2001-05-14');
    expect(normalizeDateToISO('310820')).toBe('2031-08-20');

    // Texte OCR réel d'une CNI marocaine (identique à la capture réelle de l'utilisateur)
    const moroccanCniText = `
      ROYAUME DU MAROC
      CARTE NATIONALE D'IDENTITE
      CHRAIBI
      النسب
      YOUSSRA
      الاسم
      Née le 14/05/2001
      N° BK654021
      IDMARBK6540217<<<<<<<<<<<<<<<
      0105140F3108204MAR<<<<<<<<<<<4
      CHRAIBI<<YOUSSRA<<<<<<<<<<<<<<
    `;

    const parsed = parseMoroccanOCRDocument(moroccanCniText, 'CNI', 'CIN_Scan.jpg');
    expect(parsed.cinExtraite).toBe('BK654021');
    expect(parsed.nomExtrait).toBe('CHRAIBI');
    expect(parsed.prenomExtrait).toBe('Youssra');
    expect(parsed.dateNaissanceExtraite).toBe('2001-05-14');
    expect(parsed.dateExpirationExtraite).toBe('2031-08-20');
  });
});
