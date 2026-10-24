/**
 * LEONI QualiTrack - Moteur Officiel Carré Magique & Suivi au Poste 28 Jours
 * 
 * Règle d'or : Reproduction fidèle du canevas officiel LEONI.
 * - Numérotation exacte : 1..18, 20, 21..24, 26, 28, 29 (saute 19, 25, 27) et R1..R7 pour 90J.
 * - Barème des coefficients officiels :
 *     Phase 1 (Niveau I)  : 0,24
 *     Phase 2 (Niveau L)  : 0,50
 *     Phase 3 (Niveau U)  : 0,26
 *     Total P1 + P2 + P3  : 1,00
 *     Requalification 90J : 1,00
 * - 7 Critères bloquants : 15, 16, 17, 18, 20, 26, 29.
 * - Poka-yoke défauts journaliers : > 4 défauts/jour -> refaire la formation.
 * - 28 jours consécutifs Q & P -> acquisition niveau U.
 */

import {
  CarreMagiqueCriterion,
  CarreMagiquePhase,
  CarreMagiqueSheet,
  CarreMagiqueVisaRole,
  DecisionValidationResult,
  DecisionValidationType,
  DefectTypeDefinition,
  ExcelBenchmarkTestCase,
  WorkstationDailyRecord
} from '../types/carreMagique';
import { JobFamily, Recruit, UserProfile, Workstation } from '../types';

/**
 * 10 Types officiels de défauts de câblerie automobile LEONI
 */
export const LEONI_DEFECT_TYPES: DefectTypeDefinition[] = [
  {
    code: 'DEF_01_INVERSION_VOIE',
    numero: 1,
    libelleFr: '1. Inversion de fils / voies',
    libelleAr: '1. قلب مسار الأسلاك / التجويف',
    gravite: 'CRITIQUE',
    descriptionFr: 'Fil inséré dans la mauvaise cavité du connecteur selon le plan de pose.',
    descriptionAr: 'إدخال السلك في تجويف خاطئ وفق مخطط التوصيل.'
  },
  {
    code: 'DEF_02_MAUVAIS_ENCLIQUETAGE',
    numero: 2,
    libelleFr: '2. Mauvais encliquetage / non-verrouillage terminal',
    libelleAr: '2. عدم انغلاق المشبك / عدم تثبيت الرأس',
    gravite: 'CRITIQUE',
    descriptionFr: 'Languette de rétention non engagée (recul cosse possible lors du branchement).',
    descriptionAr: 'عدم انغلاق مشبك التثبيت، مما قد يسبب ارتداد الرأس عند التركيب.'
  },
  {
    code: 'DEF_03_MAUVAIS_SERTISSAGE',
    numero: 3,
    libelleFr: '3. Mauvais sertissage / sous-sertissage',
    libelleAr: '3. كبس معيب / ارتفاع كبس غير مطابق',
    gravite: 'CRITIQUE',
    descriptionFr: 'Hauteur ou largeur de sertissage hors tolérance, brins non emprisonnés.',
    descriptionAr: 'ارتفاع أو عرض الكبس خارج التفاوت المسموح، عدم إمساك الشعيرات.'
  },
  {
    code: 'DEF_04_FIL_BLESSE',
    numero: 4,
    libelleFr: '4. Fil blessé / dénudage non conforme / brins coupés',
    libelleAr: '4. سلك مجروح / تجريد غير مطابق / شعيرات مقطوعة',
    gravite: 'MAJEUR',
    descriptionFr: 'Isolant fendu ou brins de cuivre sectionnés fragilisant la liaison électrique.',
    descriptionAr: 'تمزق العازل أو قطع شعيرات النحاس مما يضعف التوصيل.'
  },
  {
    code: 'DEF_05_MAUVAISE_INSERTION_PUSH_PULL',
    numero: 5,
    libelleFr: '5. Mauvaise insertion / échec Push-Pull (Tug-Test)',
    libelleAr: '5. إدخال غير مكتمل / فشل اختبار السحب اليدوي',
    gravite: 'CRITIQUE',
    descriptionFr: 'Défaut détecté au test manuel de traction immédiat.',
    descriptionAr: 'عيب مكشوف أثناء اختبار الشد اليدوي المباشر.'
  },
  {
    code: 'DEF_06_ENRUBANNAGE_DEFECTUEUX',
    numero: 6,
    libelleFr: '6. Enrubannage défectueux / chevauchement non respecté',
    libelleAr: '6. لف شريط معيب / عدم احترام نسبة التغطية 50%',
    gravite: 'MAJEUR',
    descriptionFr: 'Pas de rubanage irrégulier, plis, fils visibles ou tension excessive.',
    descriptionAr: 'لف شريط غير منتظم، ظهور الأسلاك أو شد زائد.'
  },
  {
    code: 'DEF_07_CONNECTEUR_ENDOMMAGE_TPA',
    numero: 7,
    libelleFr: '7. Connecteur endommagé / TPA-étrier non verrouillé',
    libelleAr: '7. غلاف موصل مكسور / قفل ثانوي TPA غير مغلق',
    gravite: 'CRITIQUE',
    descriptionFr: 'Verrouillage secondaire affleurant non engagé ou détrompeur cassé.',
    descriptionAr: 'عدم إغلاق مشط الأمان الثانوي أو كسر الموجه البلاستيكي.'
  },
  {
    code: 'DEF_08_INVERSION_FUSIBLE_RELAIS',
    numero: 8,
    libelleFr: '8. Inversion calibre fusible / relais',
    libelleAr: '8. قلب موقع الصمامات الكهربائية أو المبدلات',
    gravite: 'CRITIQUE',
    descriptionFr: 'Ampérage non conforme dans la boîte à fusibles / relais.',
    descriptionAr: 'تركيب صمام كهربائي بسعة أمبير غير مطابقة.'
  },
  {
    code: 'DEF_09_MAUVAIS_CHEMINEMENT_LONGUEUR',
    numero: 9,
    libelleFr: '9. Mauvais cheminement fil / longueur hors tolérance',
    libelleAr: '9. مسار سلك خاطئ / طول خارج التفاوت المسموح',
    gravite: 'MINEUR',
    descriptionFr: 'Branche trop tendue ou trop lâche sur la planche d’assemblage.',
    descriptionAr: 'تفرع مشدود بشكل مفرط أو مرتخٍ على لوحة التركيب.'
  },
  {
    code: 'DEF_10_CORPS_ETRANGER_POLLUTION',
    numero: 10,
    libelleFr: '10. Corps étranger / pollution alvéole connecteur',
    libelleAr: '10. وجود شوائب أو أجسام غريبة داخل تجويف الموصل',
    gravite: 'MAJEUR',
    descriptionFr: 'Présence de débris, poussière ou résidus d’adhésif dans le connecteur.',
    descriptionAr: 'وجود بقايا شريط لاصق أو شوائب تمنع التوصيل السليم.'
  }
];

/**
 * Grille officielle des 26 critères Carré Magique (Phases 1, 2, 3) + 7 critères Requalification (90J)
 * Numérotation officielle LEONI strictement respectée.
 */
export const LEONI_CARRE_MAGIQUE_CRITERIA_MASTER: Omit<
  CarreMagiqueCriterion,
  'statut' | 'observation' | 'dateValidation' | 'valideParMatricule' | 'valideParNom' | 'valideParRole'
>[] = [
  // --- PHASE 1 : Niveau I (4 premiers jours) - Total 0,24 ---
  {
    id: 'cm-01',
    numero: 1,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '1. Démarrage lu, compris, appliqué, enregistrements remplis',
    libelleAr: '1. قراءة وفهم وتطبيق تعليمات الانطلاق وملء السجلات',
    descriptionDetailleeFr: 'Vérification du dossier de fabrication, fiches d’instructions de travail au poste et feuille de démarrage.',
    descriptionDetailleeAr: 'التحقق من ملف التصنيع، تعليمات العمل بمركز الإنتاج وسجل الانطلاق اليومي.',
    coefficient: 0.03,
    estBloquant: false
  },
  {
    id: 'cm-02',
    numero: 2,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '2. Respect du 5S',
    libelleAr: '2. احترام معايير النظافة والترتيب 5S',
    descriptionDetailleeFr: 'Poste propre, ordonné, outillage rangé sur son support dédié, râtelier dégagé.',
    descriptionDetailleeAr: 'مركز عمل نظيف ومرتب، الأدوات في أماكنها وحامل الأسلاك غير مكتظ.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-03',
    numero: 3,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '3. Gestes et mesures qualité compris',
    libelleAr: '3. استيعاب حركات وإجراءات الجودة المعتمدة',
    descriptionDetailleeFr: 'Compréhension des gestes clés : insertion axiale, alignement des languettes, manipulation sans tension.',
    descriptionDetailleeAr: 'استيعاب الحركات الأساسية : إدخال مستقيم، محاذاة المشابك وتفادي الشد الزائد.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-04',
    numero: 4,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '4. Standards discipline et sécurité compris',
    libelleAr: '4. استيعاب معايير الانضباط والسلامة المهنية',
    descriptionDetailleeFr: 'Port rigoureux des EPI (chaussures de sécurité, blouse ESD si requis), respect des consignes d’évacuation.',
    descriptionDetailleeAr: 'ارتداء معدات الحماية الفردية واحترام تعليمات السلامة والوقاية.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-05',
    numero: 5,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '5. Plan de chargement compris et respecté',
    libelleAr: '5. استيعاب واحترام مخطط التحميل وتوزيع الكوابل',
    descriptionDetailleeFr: 'Ordre de chargement des circuits sur la planche respecté conformément à la gamme d’assemblage.',
    descriptionDetailleeAr: 'احترام تسلسل وضع الأسلاك على لوحة التركيب حسب بطاقة التعليمات.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-06',
    numero: 6,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '6. Lecture de la planche',
    libelleAr: '6. القراءة الصحيحة لرسومات لوحة التركيب',
    descriptionDetailleeFr: 'Repérage sans hésitation des symboles, codes couleurs, fourches, connecteurs et sorties de branches.',
    descriptionDetailleeAr: 'التعرف السلس على رموز المخطط، ألوان الأسلاك ونقاط تفريع الحزمة.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-07',
    numero: 7,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '7. Mode opératoire lu, compris, appliqué',
    libelleAr: '7. قراءة وفهم وتطبيق مسار العمل المعياري',
    descriptionDetailleeFr: 'Exécution rigoureuse de la séquence opératoire sans omission ni inversion d’étapes.',
    descriptionDetailleeAr: 'تنفيذ خطوات العمل بدقة دون إغفال أو تقديم مرحلة على أخرى.',
    coefficient: 0.03,
    estBloquant: false
  },
  {
    id: 'cm-08',
    numero: 8,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '8. Position des fils et connecteurs dans les toufix',
    libelleAr: '8. الوضع السليم للأسلاك والموصلات داخل التوفيكس (Toufix)',
    descriptionDetailleeFr: 'Fils bien logés au fond des peignes et guides toufix sans pincement ni chevauchement parasite.',
    descriptionDetailleeAr: 'تثبيت الأسلاك والموصلات بعناية داخل التوفيكس دون ضغط غير سليم.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-09',
    numero: 9,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '9. Mise en place des connecteurs dans les contre-parties inertes',
    libelleAr: '9. تثبيت الموصلات داخل الحوامل الثابتة (Contre-parties)',
    descriptionDetailleeFr: 'Encliquetage dans les faux connecteurs de maintien de planche sans forcer sur les étriers.',
    descriptionDetailleeAr: 'تثبيت الموصلات في حوامل اللوحة دون إلحاق أي ضرر بمشابك الإغلاق.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-10',
    numero: 10,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '10. Cheminement et peignage des fils',
    libelleAr: '10. تسيير الأسلاك وتمشيطها بانتظام',
    descriptionDetailleeFr: 'Faisceau peigné parallèlement, absence de fils croisés, de nœuds ou de boucles anormales.',
    descriptionDetailleeAr: 'تمشيط متوازٍ للحزمة، منع تشابك الأسلاك أو وجود طيات غير مسموح بها.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-11',
    numero: 11,
    phase: 'PHASE_1',
    niveau: 'I',
    libelleFr: '11. Règles métier de l’enrubannage',
    libelleAr: '11. القواعد المهنية للف الأشرطة اللاصقة',
    descriptionDetailleeFr: 'Sens de recouvrement, chevauchement régulier (50%), collage d’extrémité affleurant sans décollement.',
    descriptionDetailleeAr: 'تغطية متساوية للشريط بنسبة 50% وإلصاق محكم للنهايات دون انفصال.',
    coefficient: 0.02,
    estBloquant: false
  },

  // --- PHASE 2 : Niveau L (10 premiers jours) - Total 0,50 ---
  {
    id: 'cm-12',
    numero: 12,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '12. Démarrage',
    libelleAr: '12. استقلالية انطلاق العمل',
    descriptionDetailleeFr: 'Autonomie complète dans la prise de poste, contrôle des fiches suiveuses et confirmation outillage.',
    descriptionDetailleeAr: 'استقلالية كاملة في بداية العمل ومراجعة بطاقات التتبع وجاهزية الأدوات.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-13',
    numero: 13,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '13. 5S',
    libelleAr: '13. الحفاظ التام على معايير 5S',
    descriptionDetailleeFr: 'Maintien continu du standard 5S tout au long de la faction sans rappel du tuteur.',
    descriptionDetailleeAr: 'الحفاظ الذاتي على بيئة العمل النظيفة والمنظمة طيلة فترة الوردية.',
    coefficient: 0.02,
    estBloquant: false
  },
  {
    id: 'cm-14',
    numero: 14,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '14. Applique les gestes et mesures qualité',
    libelleAr: '14. تطبيق حركات وإجراءات الجودة بانتظام',
    descriptionDetailleeFr: 'Application naturelle et constante des consignes de propreté, insertion avec déclic et non-torsion.',
    descriptionDetailleeAr: 'التطبيق اليومي التلقائي لمعايير الجودة دون أي تهاون.',
    coefficient: 0.04,
    estBloquant: false
  },
  {
    id: 'cm-15',
    numero: 15,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '15. Applique l’autocontrôle',
    libelleAr: '15. تطبيق المراقبة الذاتية الصارمة (Autocontrôle)',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Test de traction systématique (Push-Pull), contrôle visuel du verrouillage secondaire.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : الفحص الذاتي 100%، اختبار السحب الفوري وتأكيد القفل الثانوي.',
    coefficient: 0.08,
    estBloquant: true
  },
  {
    id: 'cm-16',
    numero: 16,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '16. Comprend les points critiques à contrôler',
    libelleAr: '16. استيعاب النقاط الحرجة الواجب مراقبتها',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Connaissance exacte des zones sensibles (inversions de cavités, étanchéité joints, TPA).',
    descriptionDetailleeAr: 'معيار حاسم إجباري : المعرفة الدقيقة بالمناطق الحساسة ومخاطر ارتداد الأطراف.',
    coefficient: 0.08,
    estBloquant: true
  },
  {
    id: 'cm-17',
    numero: 17,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '17. Connaît les défauts récurrents du segment et les réclamations du site',
    libelleAr: '17. معرفة العيوب المتكررة بالقسم وشكاوى الزبائن',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Restitution claire des 3 principaux défauts historiques du segment et des alertes clients.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : معرفة العيوب الشائعة وملاحظات الجودة الخاصة بالمشروع.',
    coefficient: 0.08,
    estBloquant: true
  },
  {
    id: 'cm-18',
    numero: 18,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '18. Atteinte de l’objectif qualité dans les 10 jours, zéro défaut',
    libelleAr: '18. بلوغ هدف الجودة خلال 10 أيام الأولى (صفر عيب)',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Zéro défaut client ou interne grave généré sur les 10 premiers jours au poste.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : تحقيق معيار صفر عيب على مدار الأيام العشرة الأولى بالورشة.',
    coefficient: 0.10,
    estBloquant: true
  },
  {
    id: 'cm-20',
    numero: 20,
    phase: 'PHASE_2',
    niveau: 'L',
    libelleFr: '20. Arrêt au premier défaut et TNC',
    libelleAr: '20. التوقف الفوري عند أول عيب وتطبيق إجراء TNC',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Réflexe d’arrêt immédiat de la chaîne au moindre doute, alerte formateur et traitement TNC.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : التوقف الفوري عند اكتشاف أي خلل وإشعار المدرب وعزل الحزمة المعيبة.',
    coefficient: 0.08,
    estBloquant: true
  },

  // --- PHASE 3 : Niveau U (12 derniers jours, jusqu'au 28e jour) - Total 0,26 ---
  {
    id: 'cm-21',
    numero: 21,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '21. Démarrage',
    libelleAr: '21. كفاءة الانطلاق والتنظيم الذاتي الكامل',
    descriptionDetailleeFr: 'Démarrage parfait et instantané du poste en début de cycle sans temps mort.',
    descriptionDetailleeAr: 'انطلاق سلس وفوري للعمل مع بداية الوردية دون أي تأخير.',
    coefficient: 0.01,
    estBloquant: false
  },
  {
    id: 'cm-22',
    numero: 22,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '22. 5S',
    libelleAr: '22. ثقافة 5S المترسخة',
    descriptionDetailleeFr: 'Rigueur absolue dans le maintien du poste propre, anticipation du rangement.',
    descriptionDetailleeAr: 'انضباط كامل في نظافة وترتيب مساحة العمل طيلة فترة النشاط.',
    coefficient: 0.01,
    estBloquant: false
  },
  {
    id: 'cm-23',
    numero: 23,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '23. Connaît le temps de cycle',
    libelleAr: '23. المعرفة التامة بزمن الدورة (Cycle Time)',
    descriptionDetailleeFr: 'Connaissance du temps de cycle alloué au poste (en secondes) et de son décomposition.',
    descriptionDetailleeAr: 'معرفة الزمن المخصص لإنجاز الحزمة بالثواني ومراحله الزمنية.',
    coefficient: 0.01,
    estBloquant: false
  },
  {
    id: 'cm-24',
    numero: 24,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '24. Atteint l’objectif de production, cadence',
    libelleAr: '24. تحقيق هدف الإنتاج والوتيرة المعيارية (Cadence 100%)',
    descriptionDetailleeFr: 'Capacité à maintenir le rythme de la ligne sans créer de goulet d’étranglement.',
    descriptionDetailleeAr: 'القدرة على مواكبة وتيرة خط الإنتاج بانتظام دون أي تأخير للتدفق.',
    coefficient: 0.05,
    estBloquant: false
  },
  {
    id: 'cm-26',
    numero: 26,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '26. Maintient le zéro défaut',
    libelleAr: '26. الحفاظ المستمر على جودة صفر عيب',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Zéro réclamation, zéro non-conformité critique sur toute la phase finale.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : الحفاظ التام على صفر عيب طوال المرحلة النهائية للتأهيل.',
    coefficient: 0.05,
    estBloquant: true
  },
  {
    id: 'cm-28',
    numero: 28,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '28. Applique les gestes et mesures qualité',
    libelleAr: '28. التطبيق الدقيق والمتقن لكافة حركات الجودة',
    descriptionDetailleeFr: 'Dextérité exemplaire, régularité du geste, gestuelle fluide conforme au standard usine.',
    descriptionDetailleeAr: 'براعة يدوية وسلاسة في أداء الحركات وفق معايير مصانع ليوني.',
    coefficient: 0.05,
    estBloquant: false
  },
  {
    id: 'cm-29',
    numero: 29,
    phase: 'PHASE_3',
    niveau: 'U',
    libelleFr: '29. Test de vigilance pour validation finale',
    libelleAr: '29. اختبار اليقظة والانتباه للمصادقة النهائية',
    descriptionDetailleeFr: 'CRITÈRE BLOQUANT : Réussite du piège qualité / pièce test insérée par la qualité pour éprouver la vigilance.',
    descriptionDetailleeAr: 'معيار حاسم إجباري : كشف العينة الفخاخية أو الاختبار المفاجئ للجودة دون أي خطأ.',
    coefficient: 0.08,
    estBloquant: true
  },

  // --- REQUALIFICATION À 90 JOURS : Carré Fermé - Total 1,00 ---
  {
    id: 'cm-r1',
    numero: 'R1',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R1. Maîtrise tous les modes opératoires de la ligne, minimum 3 postes',
    libelleAr: 'R1. إتقان جميع مسارات العمل بالخط، 3 مراكز عمل كحد أدنى',
    descriptionDetailleeFr: 'Polyvalence attestée sur au moins trois postes distincts de la ligne d’assemblage.',
    descriptionDetailleeAr: 'تعدد المهارات المعتمد على 3 مراكز عمل مختلفة على الأقل.',
    coefficient: 0.15,
    estBloquant: false
  },
  {
    id: 'cm-r2',
    numero: 'R2',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R2. 5S',
    libelleAr: 'R2. سلوك ريادي في معايير 5S',
    descriptionDetailleeFr: 'Comportement exemplaire en propreté, rangement et tri à 90 jours.',
    descriptionDetailleeAr: 'سلوك نموذجي في الحفاظ على بيئة العمل بعد 90 يوماً من الممارسة.',
    coefficient: 0.15,
    estBloquant: false
  },
  {
    id: 'cm-r3',
    numero: 'R3',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R3. Peut passer sans problème à un autre poste de la ligne',
    libelleAr: 'R3. القدرة على الانتقال الفوري لمركز آخر دون أي ارتباك',
    descriptionDetailleeFr: 'Flexibilité opérationnelle immédiate pour compenser les aléas ou les absences.',
    descriptionDetailleeAr: 'مرونة عالية للتبديل السريع بين المهام لتغطية احتياجات الخط.',
    coefficient: 0.15,
    estBloquant: false
  },
  {
    id: 'cm-r4',
    numero: 'R4',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R4. Capable de former un nouvel opérateur sans déviation',
    libelleAr: 'R4. القدرة على تدريب عامل جديد دون أي انحراف عن المعايير',
    descriptionDetailleeFr: 'Aptitude tutorale : transmission fidèle des bons gestes qualité et des règles de sécurité.',
    descriptionDetailleeAr: 'كفاءة التأطير : نقل الحركات السليمة وقواعد السلامة للملتحقين الجدد.',
    coefficient: 0.15,
    estBloquant: false
  },
  {
    id: 'cm-r5',
    numero: 'R5',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R5. Émet une nouvelle CIP, idée d’amélioration',
    libelleAr: 'R5. تقديم فكرة تحسين مستمر (CIP) جديدة ومفيدة',
    descriptionDetailleeFr: 'Proposition formelle d’une amélioration de poste (Continuous Improvement Process - CIP).',
    descriptionDetailleeAr: 'اقتراح تحسين عملي لمساحة العمل أو وسيلة الإنتاج (CIP).',
    coefficient: 0.10,
    estBloquant: false
  },
  {
    id: 'cm-r6',
    numero: 'R6',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R6. Gestes et mesures qualité',
    libelleAr: 'R6. ترسيخ معايير الجودة الشاملة',
    descriptionDetailleeFr: 'Constance irréprochable de la qualité sur les trois mois écoulés.',
    descriptionDetailleeAr: 'استقرار تام وثابت لمستوى الجودة على مدى ثلاثة أشهر.',
    coefficient: 0.15,
    estBloquant: false
  },
  {
    id: 'cm-r7',
    numero: 'R7',
    phase: 'REQUALIFICATION_90J',
    niveau: 'CARRE_FERME',
    libelleFr: 'R7. Connaît et applique le mode de réaction en situation inhabituelle',
    libelleAr: 'R7. معرفة وتطبيق بروتوكول التصرف في الحالات غير الاعتيادية',
    descriptionDetailleeFr: 'Réaction conforme aux standards LEONI en cas de panne machine, composant douteux ou rupture d’appro.',
    descriptionDetailleeAr: 'التصرف السليم وفق إجراءات ليوني عند حدوث عطل أو شك في مادة أولية.',
    coefficient: 0.15,
    estBloquant: false
  }
];

export class CarreMagiqueEngine {
  /**
   * Crée une fiche Carré Magique vierge ou initialisée pour une recrue affectée
   */
  public static createInitialSheet(
    recruit: Recruit,
    workstation: Workstation,
    options?: {
      raisonSuivi?: string;
      equipe?: string;
      objectifQualite?: string;
      objectifProductivite?: string;
      dateDebut?: string;
    }
  ): CarreMagiqueSheet {
    const today = options?.dateDebut || new Date().toISOString().split('T')[0];

    // Création des 28 jours de suivi quotidien
    const suiviJours: WorkstationDailyRecord[] = [];
    for (let j = 1; j <= 28; j++) {
      const dayDate = new Date(new Date(today).getTime() + (j - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Si la recrue a déjà un avancement partiel
      const isAlreadyDone = j <= (recruit.joursSuiviCompletes || 0);

      suiviJours.push({
        jourIndex: j,
        date: dayDate,
        ponctualite: 'A_L_HEURE',
        retardMinutes: 0,
        objectifQualiteAtteint: isAlreadyDone,
        objectifProductiviteAtteint: isAlreadyDone,
        nombreDefauts: 0,
        defauts: [],
        alertePokaYokeDeclenchee: false,
        pointeParMatricule: isAlreadyDone ? workstation.formateurReferentMatricule : undefined,
        pointeParNom: isAlreadyDone ? workstation.formateurReferentNom : undefined,
        horodatage: isAlreadyDone ? `${dayDate}T16:30:00Z` : undefined
      });
    }

    // Instanciation des critères avec statut
    const criteres: CarreMagiqueCriterion[] = LEONI_CARRE_MAGIQUE_CRITERIA_MASTER.map((m) => {
      // Pré-remplissage selon l'avancement de la recrue
      let statut: 'OK' | 'NOK' | 'NON_EVALUE' = 'NON_EVALUE';
      if ((recruit.joursSuiviCompletes || 0) >= 4 && m.phase === 'PHASE_1') {
        statut = 'OK';
      } else if ((recruit.joursSuiviCompletes || 0) >= 10 && m.phase === 'PHASE_2') {
        statut = 'OK';
      } else if ((recruit.joursSuiviCompletes || 0) >= 28 && m.phase === 'PHASE_3') {
        statut = 'OK';
      }

      return {
        ...m,
        statut,
        observation: statut === 'OK' ? 'Validé en cours de cycle atelier' : undefined,
        dateValidation: statut === 'OK' ? today : undefined,
        valideParMatricule: statut === 'OK' ? workstation.formateurReferentMatricule : undefined,
        valideParNom: statut === 'OK' ? workstation.formateurReferentNom : undefined,
        valideParRole: statut === 'OK' ? 'FORMATEUR_TERRAIN' : undefined
      };
    });

    const visas: Record<CarreMagiqueVisaRole, any> = {
      FORMATEUR_TERRAIN: {
        role: 'FORMATEUR_TERRAIN',
        titreFr: 'Formateur Terrain (Tuteur)',
        titreAr: 'المدرب الميداني (المؤطر)',
        ordre: 1,
        estObligatoire: true,
        estSigne: (recruit.joursSuiviCompletes || 0) >= 28,
        signeParMatricule: (recruit.joursSuiviCompletes || 0) >= 28 ? workstation.formateurReferentMatricule : undefined,
        signeParNom: (recruit.joursSuiviCompletes || 0) >= 28 ? workstation.formateurReferentNom : undefined,
        dateSignature: (recruit.joursSuiviCompletes || 0) >= 28 ? `${today}T17:00:00Z` : undefined,
        codePersonnelSaisi: (recruit.joursSuiviCompletes || 0) >= 28 ? '3010' : undefined
      },
      SHIFT_LEADER: {
        role: 'SHIFT_LEADER',
        titreFr: 'Shift Leader (Chef d’Équipe)',
        titreAr: 'رئيس الوردية (Shift Leader)',
        ordre: 2,
        estObligatoire: true,
        estSigne: false
      },
      RESPONSABLE_PRODUCTION: {
        role: 'RESPONSABLE_PRODUCTION',
        titreFr: 'Responsable Fabrication (RFM)',
        titreAr: 'مسؤول الإنتاج (RFM)',
        ordre: 3,
        estObligatoire: true,
        estSigne: recruit.visaProduction || false,
        signeParNom: recruit.visaProductionPar,
        dateSignature: recruit.visaProductionDate
      },
      QUALITE: {
        role: 'QUALITE',
        titreFr: 'Responsable Qualité Usine',
        titreAr: 'مسؤول الجودة بالمصنع',
        ordre: 4,
        estObligatoire: true,
        estSigne: recruit.visaQualite || false,
        signeParNom: recruit.visaQualitePar,
        dateSignature: recruit.visaQualiteDate
      }
    };

    return {
      id: `cm-sheet-${recruit.id}`,
      recrueId: recruit.id,
      matricule: recruit.matricule || `L-OPR-${recruit.cin.slice(-4)}`,
      nom: recruit.nom,
      prenom: recruit.prenom,
      raisonSuivi: options?.raisonSuivi || 'Intégration nouvelle recrue (Cycle 33 jours)',
      equipe: options?.equipe || 'Équipe A (Matin)',
      posteId: workstation.id,
      posteCode: workstation.code,
      posteIntitule: workstation.intituleFr,
      famillePoste: workstation.familleMetier,
      dateDebutSuivi: today,
      objectifQualite: options?.objectifQualite || '100% Zéro défaut, autocontrôle Push-Pull systématique',
      objectifProductivite: options?.objectifProductivite || 'Temps de cycle standard 120s (Cadence 100%)',
      suiviJours,
      criteres,
      visas,
      derniereMiseAJour: new Date().toISOString()
    };
  }

  /**
   * Évalue fidèlement les scores, critères bloquants, progression Poka-Yoke et décision officielle
   */
  public static evaluateSheet(
    sheet: CarreMagiqueSheet,
    params?: {
      seuilDefautsJourRefaireFormation?: number;
      seuilAutonomePourcent?: number;
      seuilSuiviRenforcePourcent?: number;
      seuilFormationCibleePourcent?: number;
      joursConsecutifsNiveauU?: number;
    }
  ): DecisionValidationResult {
    const seuilDefautsMax = params?.seuilDefautsJourRefaireFormation ?? 4;
    const seuilAutonome = params?.seuilAutonomePourcent ?? 90;
    const seuilRenforce = params?.seuilSuiviRenforcePourcent ?? 80;
    const seuilCiblee = params?.seuilFormationCibleePourcent ?? 70;
    const joursRequisU = params?.joursConsecutifsNiveauU ?? 28;

    // 1. Calcul des scores par phase
    let rawScoreP1 = 0;
    let rawScoreP2 = 0;
    let rawScoreP3 = 0;
    let rawScoreReq = 0;

    const bloquantsNOK: DecisionValidationResult['criteresBloquantsNOK'] = [];
    let bloquantsTotal = 0;
    let bloquantsOK = 0;

    let p1AllOk = true;
    let p2AllOk = true;
    let p3AllOk = true;

    for (const c of sheet.criteres) {
      const isOk = c.statut === 'OK';
      const pts = isOk ? c.coefficient : 0;

      if (c.estBloquant) {
        bloquantsTotal++;
        if (isOk) {
          bloquantsOK++;
        } else {
          bloquantsNOK.push({
            numero: c.numero,
            libelleFr: c.libelleFr,
            libelleAr: c.libelleAr,
            phase: c.phase
          });
        }
      }

      if (c.phase === 'PHASE_1') {
        rawScoreP1 += pts;
        if (!isOk) p1AllOk = false;
      } else if (c.phase === 'PHASE_2') {
        rawScoreP2 += pts;
        if (!isOk) p2AllOk = false;
      } else if (c.phase === 'PHASE_3') {
        rawScoreP3 += pts;
        if (!isOk) p3AllOk = false;
      } else if (c.phase === 'REQUALIFICATION_90J') {
        rawScoreReq += pts;
      }
    }

    // Arrondis certifiés à 4 décimales pour éviter les imprécisions flottantes JS
    const scoreP1 = Math.round(rawScoreP1 * 10000) / 10000;
    const scoreP2 = Math.round(rawScoreP2 * 10000) / 10000;
    const scoreP3 = Math.round(rawScoreP3 * 10000) / 10000;
    const scoreTotalPhases123 = Math.round((scoreP1 + scoreP2 + scoreP3) * 10000) / 10000;
    const scoreTotalPourcent = Math.round(scoreTotalPhases123 * 10000) / 100;
    const scoreRequalification = Math.round(rawScoreReq * 10000) / 10000;
    const scoreRequalificationPourcent = Math.round(scoreRequalification * 10000) / 100;

    // 2. Progression Poka-yoke par phases
    // Règle : Un seul critère NOK empêche de passer au niveau suivant.
    const niveauIValide = p1AllOk;
    const niveauLValide = niveauIValide && p2AllOk;
    const niveauUValide = niveauLValide && p3AllOk;

    // 3. Suivi quotidien : calcul de la série Q & P consécutive et vérification du seuil défauts
    let serieQP = 0;
    let maxSerieQP = 0;
    let aDeclencheAlerteDefauts = false;
    let jourAlerteDefaut: number | null = null;
    let nbDefautsJourAlerte = 0;

    const completedDays = sheet.suiviJours.filter(
      (j) => j.ponctualite === 'A_L_HEURE' || j.ponctualite === 'RETARD'
    ).length;

    for (const row of sheet.suiviJours) {
      // Vérification Poka-Yoke défauts journaliers (> seuilDefautsMax)
      if (row.nombreDefauts > seuilDefautsMax) {
        aDeclencheAlerteDefauts = true;
        if (jourAlerteDefaut === null) {
          jourAlerteDefaut = row.jourIndex;
          nbDefautsJourAlerte = row.nombreDefauts;
        }
      }

      // Série Q & P
      if (row.objectifQualiteAtteint && row.objectifProductiviteAtteint) {
        serieQP++;
        if (serieQP > maxSerieQP) maxSerieQP = serieQP;
      } else {
        serieQP = 0;
      }
    }

    const niveauUAcquisParSerie = maxSerieQP >= joursRequisU;

    // 4. Dispositif de décision finale (Canevas Décision Validation LEONI)
    const tousBloquantsOK = bloquantsNOK.length === 0;

    let decision: DecisionValidationType;
    let decisionLabelFr: string;
    let decisionLabelAr: string;
    let explicationFr: string;
    let explicationAr: string;
    let estVerrouillePokaYoke = false;
    let messageVerrouillageFr: string | undefined;
    let messageVerrouillageAr: string | undefined;

    // RÈGLE POKA-YOKE ABSOLUE : Dépassement de défauts journaliers (> 4)
    if (aDeclencheAlerteDefauts) {
      decision = 'NON_VALIDE_PROLONGATION';
      decisionLabelFr = 'Non validé — Obligation de refaire la formation';
      decisionLabelAr = 'غير مصادق عليه — إلزامي إعادة دورة التكوين';
      explicationFr = `Alerte Poka-Yoke critique : ${nbDefautsJourAlerte} défauts enregistrés au Jour ${jourAlerteDefaut} (seuil maximal autorisé : ${seuilDefautsMax} défauts). L'opérateur doit impérativement refaire la formation.`;
      explicationAr = `إنذار وقائي حاسم : تسجيل ${nbDefautsJourAlerte} عيوب في اليوم ${jourAlerteDefaut} (الحد الأقصى المسموح : ${seuilDefautsMax}). يجب إعادة مسار التكوين.`;
      estVerrouillePokaYoke = true;
      messageVerrouillageFr = explicationFr;
      messageVerrouillageAr = explicationAr;
    }
    // RÈGLE POKA-YOKE : Critères bloquants obligatoirement OK (15, 16, 17, 18, 20, 26, 29)
    else if (!tousBloquantsOK) {
      const listeNumeros = bloquantsNOK.map((b) => b.numero).join(', ');
      decision = scoreTotalPourcent >= 70 ? 'FORMATION_CIBLEE' : 'NON_VALIDE_PROLONGATION';
      decisionLabelFr = 'Validation bloquée — Critère(s) bloquant(s) NOK';
      decisionLabelAr = 'المصادقة موقوفة — عدم استيفاء معايير حاسمة إجبارية';
      explicationFr = `Échec sur ${bloquantsNOK.length} critère(s) bloquant(s) [N° ${listeNumeros}]. Même avec un score de ${scoreTotalPourcent}%, la qualification autonome est strictement interdite tant que ces critères ne sont pas conformes.`;
      explicationAr = `عدم مطابقة ${bloquantsNOK.length} معيار حاسم [رقم ${listeNumeros}]. حتى بنقطة ${scoreTotalPourcent}%، يُمنع المرور للاستقلالية دون استيفاء هذه المعايير.`;
      estVerrouillePokaYoke = true;
      messageVerrouillageFr = explicationFr;
      messageVerrouillageAr = explicationAr;
    }
    // Si tous les critères bloquants sont conformes, application des seuils de score
    else if (scoreTotalPourcent >= seuilAutonome) {
      decision = 'AUTONOME';
      decisionLabelFr = 'Opérateur autonome (Niveau U validé)';
      decisionLabelAr = 'عامل مستقل ومؤهل بالكامل (المستوى U)';
      explicationFr = `Excellence opérationnelle : Score de ${scoreTotalPourcent}% (≥ ${seuilAutonome}%) et 100% des critères bloquants validés. L'opérateur est qualifié pour opérer seul en production.`;
      explicationAr = `كفاءة تامة : نقطة ${scoreTotalPourcent}% وجميع المعايير الحاسمة مستوفاة. العامل مؤهل للاشتغال المستقل بالإنتاج.`;
    } else if (scoreTotalPourcent >= seuilRenforce) {
      decision = 'VALIDE_SUIVI_RENFORCE';
      decisionLabelFr = 'Validé avec suivi renforcé';
      decisionLabelAr = 'مصادق عليه مع تتبع معزز';
      explicationFr = `Score satisfaisant de ${scoreTotalPourcent}% (entre ${seuilRenforce}% et ${seuilAutonome - 1}%). Qualification accordée sous surveillance d’un tuteur de ligne pendant 14 jours.`;
      explicationAr = `نقطة مقبولة ${scoreTotalPourcent}%. المصادقة مشروطة بمواكبة مؤطر الخط لمدة 14 يوماً إضافية.`;
    } else if (scoreTotalPourcent >= seuilCiblee) {
      decision = 'FORMATION_CIBLEE';
      decisionLabelFr = 'Formation complémentaire ciblée requise';
      decisionLabelAr = 'تكوين تكميلي محدد الأهداف مطلوب';
      explicationFr = `Score partiel de ${scoreTotalPourcent}% (entre ${seuilCiblee}% et ${seuilRenforce - 1}%). Nécessite une reprise ciblée des gestes non maîtrisés avant nouvelle évaluation.`;
      explicationAr = `نقطة جزئية ${scoreTotalPourcent}%. يتطلب إعادة تكوين مركز على الحركات الناقصة قبل إعادة التقييم.`;
    } else {
      decision = 'NON_VALIDE_PROLONGATION';
      decisionLabelFr = 'Non validé — Prolongation de la formation';
      decisionLabelAr = 'غير مصادق عليه — تمديد فترة التدريب';
      explicationFr = `Score insuffisant de ${scoreTotalPourcent}% (< ${seuilCiblee}%). Prolongation formelle du cycle au poste de 14 jours ou réorientation.`;
      explicationAr = `نقطة غير كافية ${scoreTotalPourcent}%. تمديد رسمي لفترة التدريب بمركز العمل لمدة 14 يوماً.`;
    }

    return {
      scorePhase1: scoreP1,
      scorePhase2: scoreP2,
      scorePhase3: scoreP3,
      scoreTotalPhases123,
      scoreTotalPourcent,
      scoreRequalification,
      scoreRequalificationPourcent,
      criteresBloquantsTotal: bloquantsTotal,
      criteresBloquantsOK: bloquantsOK,
      criteresBloquantsNOK: bloquantsNOK,
      tousBloquantsOK,
      decision,
      decisionLabelFr,
      decisionLabelAr,
      explicationFr,
      explicationAr,
      niveauIValide,
      niveauLValide,
      niveauUValide,
      niveauUAcquisParSerie,
      serieQPConsecutive: maxSerieQP,
      estVerrouillePokaYoke,
      messageVerrouillageFr,
      messageVerrouillageAr,
      joursCompletes: completedDays,
      joursRequis: 28
    };
  }

  /**
   * Exécute les 3 tests automatiques clés vérifiant la stricte concordance numérique avec le fichier Excel officiel LEONI
   */
  public static runExcelBenchmarkTests(): ExcelBenchmarkTestCase[] {
    const dummyRecruit: Recruit = {
      id: 'test-rec-001',
      cin: 'TEST1234',
      nom: 'Benchmark',
      prenom: 'Automated',
      dateNaissance: '2000-01-01',
      telephone: '+212600000000',
      siteId: 'site-bsk',
      dateEntree: '2026-10-01',
      statut: 'EN_APPRENTISSAGE_POSTE',
      ecoleJoursValides: 5,
      ecoleValidee: true,
      joursSuiviCompletes: 28,
      carreMagiquePointsConformes: 16,
      testPratiqueValide: true,
      qualifiee: false,
      visaQualite: false,
      visaProduction: false
    };

    const dummyWorkstation: Workstation = {
      id: 'ws-test',
      code: 'PST-INS-01',
      intituleFr: 'Insertion Connecteurs',
      intituleAr: 'تركيب الموصلات',
      familleMetier: 'ASSEMBLAGE',
      typologie: 'INITIAL',
      siteId: 'site-bsk',
      segment: 'Habitacle',
      ligne: 'L1',
      aptitudesRequisesFr: [],
      aptitudesRequisesAr: [],
      formateurReferentMatricule: 'L-TRN-301',
      formateurReferentNom: 'Youssef El Amrani',
      prerequis: {
        assiduiteMinJours: 5,
        noteEcoleMin: 14,
        diplomeExige: false,
        testGesteReussiExige: true
      }
    };

    const results: ExcelBenchmarkTestCase[] = [];

    // =========================================================================
    // CAS 1 : Tout OK (Score = 1,00 / 100%, 0 bloquant NOK -> Opérateur autonome)
    // =========================================================================
    {
      const sheet = this.createInitialSheet(dummyRecruit, dummyWorkstation);
      sheet.criteres = sheet.criteres.map((c) => ({
        ...c,
        statut: 'OK'
      }));
      // 28 jours Q & P tenus
      sheet.suiviJours = sheet.suiviJours.map((j) => ({
        ...j,
        ponctualite: 'A_L_HEURE',
        objectifQualiteAtteint: true,
        objectifProductiviteAtteint: true,
        nombreDefauts: 0
      }));

      const evalRes = this.evaluateSheet(sheet);

      const assertions = [
        {
          nom: 'Score Total Phase 1+2+3 == 1.00',
          attendu: 1.0,
          obtenu: evalRes.scoreTotalPhases123,
          reussi: Math.abs(evalRes.scoreTotalPhases123 - 1.0) < 0.0001
        },
        {
          nom: 'Score Pourcentage == 100%',
          attendu: 100,
          obtenu: evalRes.scoreTotalPourcent,
          reussi: evalRes.scoreTotalPourcent === 100
        },
        {
          nom: 'Critères bloquants NOK == 0',
          attendu: 0,
          obtenu: evalRes.criteresBloquantsNOK.length,
          reussi: evalRes.criteresBloquantsNOK.length === 0
        },
        {
          nom: 'Décision finale == AUTONOME',
          attendu: 'AUTONOME',
          obtenu: evalRes.decision,
          reussi: evalRes.decision === 'AUTONOME'
        },
        {
          nom: 'Niveau U acquis par série de 28 jours consécutifs == true',
          attendu: true,
          obtenu: evalRes.niveauUAcquisParSerie,
          reussi: evalRes.niveauUAcquisParSerie === true
        }
      ];

      const allPassed = assertions.every((a) => a.reussi);

      results.push({
        id: 'test-case-1-tout-ok',
        titreFr: 'Cas 1 : Fiche 100% Conforme (Tout OK)',
        titreAr: 'الحالة 1 : استيفاء 100% لكافة المعايير (كل شيء مطابق)',
        description: 'Vérifie que pour toutes les réponses OK, le score atteint exactement 1,00 (0,24 + 0,50 + 0,26), aucun critère bloquant n’est en échec et la décision est "Opérateur autonome".',
        scoreAttendu: 1.0,
        decisionAttendue: 'AUTONOME',
        bloquantsNOKAttendus: [],
        statutTest: allPassed ? 'PASSE' : 'ECHOUE',
        scoreCalcule: evalRes.scoreTotalPhases123,
        decisionCalculee: evalRes.decision,
        bloquantsNOKCalcules: evalRes.criteresBloquantsNOK.map((b) => b.numero),
        assertions
      });
    }

    // ==========================================================================================
    // CAS 2 : Un critère bloquant NOK malgré un score élevé (Critère 26 NOK, score = 0,95 / 95%)
    // ==========================================================================================
    {
      const sheet = this.createInitialSheet(dummyRecruit, dummyWorkstation);
      sheet.criteres = sheet.criteres.map((c) => {
        // Maintient le zéro défaut (Critère 26, coeff 0.05) est mis à NOK !
        if (c.numero === 26) {
          return { ...c, statut: 'NOK' };
        }
        return { ...c, statut: 'OK' };
      });

      const evalRes = this.evaluateSheet(sheet);

      const assertions = [
        {
          nom: 'Score Total == 0.95 (1.00 - 0.05)',
          attendu: 0.95,
          obtenu: evalRes.scoreTotalPhases123,
          reussi: Math.abs(evalRes.scoreTotalPhases123 - 0.95) < 0.0001
        },
        {
          nom: 'Critère bloquant 26 identifié comme NOK',
          attendu: true,
          obtenu: evalRes.criteresBloquantsNOK.some((b) => b.numero === 26),
          reussi: evalRes.criteresBloquantsNOK.some((b) => b.numero === 26)
        },
        {
          nom: 'Verrouillage Poka-Yoke actif == true',
          attendu: true,
          obtenu: evalRes.estVerrouillePokaYoke,
          reussi: evalRes.estVerrouillePokaYoke === true
        },
        {
          nom: 'Décision n’est PAS "AUTONOME" malgré score 95% (Bloqué -> FORMATION_CIBLEE)',
          attendu: 'FORMATION_CIBLEE',
          obtenu: evalRes.decision,
          reussi: evalRes.decision === 'FORMATION_CIBLEE'
        }
      ];

      const allPassed = assertions.every((a) => a.reussi);

      results.push({
        id: 'test-case-2-bloquant-nok',
        titreFr: 'Cas 2 : Critère bloquant N°26 NOK avec score élevé (95%)',
        titreAr: 'الحالة 2 : عدم استيفاء معيار حاسم (رقم 26) رغم نقطة مرتفعة (95%)',
        description: 'Vérifie que l’échec sur le critère bloquant 26 ("Maintient le zéro défaut", coeff 0,05) bloque impérativement la qualification autonome même si la note est de 95% (≥ 90%).',
        scoreAttendu: 0.95,
        decisionAttendue: 'FORMATION_CIBLEE',
        bloquantsNOKAttendus: [26],
        statutTest: allPassed ? 'PASSE' : 'ECHOUE',
        scoreCalcule: evalRes.scoreTotalPhases123,
        decisionCalculee: evalRes.decision,
        bloquantsNOKCalcules: evalRes.criteresBloquantsNOK.map((b) => b.numero),
        assertions
      });
    }

    // =========================================================================
    // CAS 3 : Score de 75 % (Tous bloquants OK -> Formation complémentaire ciblée)
    // =========================================================================
    {
      const sheet = this.createInitialSheet(dummyRecruit, dummyWorkstation);
      // Pour obtenir exactement 0.75 :
      // Total possible = 1.00. Nous devons retirer 0.25 de critères NON bloquants.
      // - Phase 1 : critère 1 (0.03), 2 (0.02), 3 (0.02) NOK -> -0.07
      // - Phase 2 : critère 12 (0.02), 13 (0.02), 14 (0.04) NOK -> -0.08 (tous bloquants 15,16,17,18,20 restent OK)
      // - Phase 3 : critère 24 (0.05), 28 (0.05) NOK -> -0.10 (bloquants 26, 29 restent OK)
      // Somme déduite = 0.07 + 0.08 + 0.10 = 0.25. Score restant = 1.00 - 0.25 = 0.75 (75%) !
      sheet.criteres = sheet.criteres.map((c) => {
        const nokList = [1, 2, 3, 12, 13, 14, 24, 28];
        if (nokList.includes(c.numero as number)) {
          return { ...c, statut: 'NOK' };
        }
        return { ...c, statut: 'OK' };
      });

      const evalRes = this.evaluateSheet(sheet);

      const assertions = [
        {
          nom: 'Score Total == 0.75 (75%)',
          attendu: 0.75,
          obtenu: evalRes.scoreTotalPhases123,
          reussi: Math.abs(evalRes.scoreTotalPhases123 - 0.75) < 0.0001
        },
        {
          nom: 'Tous les critères bloquants sont conformes (0 bloquant NOK)',
          attendu: 0,
          obtenu: evalRes.criteresBloquantsNOK.length,
          reussi: evalRes.criteresBloquantsNOK.length === 0
        },
        {
          nom: 'Palier 70-79% -> Décision FORMATION_CIBLEE',
          attendu: 'FORMATION_CIBLEE',
          obtenu: evalRes.decision,
          reussi: evalRes.decision === 'FORMATION_CIBLEE'
        }
      ];

      const allPassed = assertions.every((a) => a.reussi);

      results.push({
        id: 'test-case-3-score-75',
        titreFr: 'Cas 3 : Score calibré à 75 % (Palier 70-79 %)',
        titreAr: 'الحالة 3 : نقطة محددة بـ 75% (المستوى 70-79%)',
        description: 'Vérifie qu’un profil obtenant exactement 75 % (0,75) avec 100 % des critères bloquants validés est orienté vers "Formation complémentaire ciblée".',
        scoreAttendu: 0.75,
        decisionAttendue: 'FORMATION_CIBLEE',
        bloquantsNOKAttendus: [],
        statutTest: allPassed ? 'PASSE' : 'ECHOUE',
        scoreCalcule: evalRes.scoreTotalPhases123,
        decisionCalculee: evalRes.decision,
        bloquantsNOKCalcules: evalRes.criteresBloquantsNOK.map((b) => b.numero),
        assertions
      });
    }

    return results;
  }
}
