/**
 * LEONI QualiTrack - Moteur de Verrouillage Qualité Poka-Yoke
 * Une règle bloque une action si une condition n’est pas remplie et explique pourquoi en une phrase.
 * Une dérogation exige un rôle habilité et un motif impératif, et laisse une trace d'audit.
 */

import { PokaYokeRuleResult, Recruit, SystemParameter, UserProfile, UserRole } from '../types';

export type PokaYokeAction =
  | 'AFFECTATION_POSTE'
  | 'AFFECTATION_POSTE_CRITIQUE'
  | 'SAISIE_SUIVI_POSTE'
  | 'VISA_QUALIFICATION_QUALITE'
  | 'VISA_QUALIFICATION_PRODUCTION'
  | 'VALIDATION_FINALE_QUALIFICATION'
  | 'MODIFICATION_PARAMETRE'
  | 'IMPORT_MASSE';

export class PokaYokeEngine {
  /**
   * Évalue si une action est autorisée sur une recrue selon les règles Poka-yoke en vigueur
   */
  public static evaluate(
    action: PokaYokeAction,
    context: {
      recruit?: Recruit;
      currentUser: UserProfile;
      parameters: SystemParameter[];
      workstation?: import('../types').Workstation;
    }
  ): PokaYokeRuleResult {
    const { recruit, currentUser, parameters, workstation } = context;

    switch (action) {
      case 'AFFECTATION_POSTE': {
        if (!recruit) return { autorise: false, derogationPossible: false, rolesHabilitesDerogation: [] };
        
        const ecoleMinJours = Number(parameters.find((p) => p.cle === 'DUREE_ECOLE_JOURS')?.valeur ?? 5);
        const estEcoleValidee = recruit.ecoleValidee && recruit.ecoleJoursValides >= ecoleMinJours;

        if (!estEcoleValidee) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : L’opérateur n’a pas validé les ${ecoleMinJours} jours requis à l’école de câblage.`,
            messageBlocageAr: `إقفال وقائي : المستفيد لم يستكمل أو لم يصادق على ${ecoleMinJours} أيام المطلوبة بمدرسة الكوابل.`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'REFERENT_LEARNING', 'ADMIN']
          };
        }
        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      case 'AFFECTATION_POSTE_CRITIQUE': {
        if (!recruit) return { autorise: false, derogationPossible: false, rolesHabilitesDerogation: [] };

        const ecoleMinJours = Number(parameters.find((p) => p.cle === 'DUREE_ECOLE_JOURS')?.valeur ?? 5);
        const seuilNoteCritique = Number(parameters.find((p) => p.cle === 'NOTE_MIN_POSTE_CRITIQUE')?.valeur ?? 16);
        const wsCode = workstation?.code || 'Poste critique';

        // 1. Assiduité 5j complète
        if (!recruit.ecoleValidee || (recruit.ecoleJoursValides || 0) < ecoleMinJours) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : L’accès au poste critique ${wsCode} exige l'accomplissement des ${ecoleMinJours} jours d'école sans absence.`,
            messageBlocageAr: `إقفال وقائي : التوجيه للمركز الحرج ${wsCode} يستلزم استيفاء ${ecoleMinJours} أيام كاملة بمدرسة التكوين بدون أي غياب.`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'REFERENT_LEARNING', 'QUALITE', 'ADMIN']
          };
        }

        // 2. Note minimale école
        const noteTheorie = recruit.ecoleScoreTheorie || 0;
        if (noteTheorie < seuilNoteCritique) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : Note école (${noteTheorie}/20) insuffisante pour le poste critique ${wsCode} (seuil requis : ${seuilNoteCritique}/20).`,
            messageBlocageAr: `إقفال وقائي : نقطة المدرسة (${noteTheorie}/20) غير كافية لمركز العمل الحرج ${wsCode} (الحد الأدنى : ${seuilNoteCritique}/20).`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'REFERENT_LEARNING', 'QUALITE', 'ADMIN']
          };
        }

        // 3. Test pratique ou validation geste qualité
        const pratiqueOk = (recruit.ecoleScorePratique || 0) >= seuilNoteCritique || recruit.testPratiqueValide;
        if (!pratiqueOk) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : La réussite aux tests généraux ne suffit pas pour un poste critique. L'évaluation pratique du geste doit être validée.`,
            messageBlocageAr: `إقفال وقائي : النجاح في الاختبارات العامة لا يتيح تلقائياً المراكز الحرجة. يجب اجتياز ومصادقة اختبار الحركات التطبيقية.`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'REFERENT_LEARNING', 'QUALITE', 'ADMIN']
          };
        }

        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      case 'SAISIE_SUIVI_POSTE': {
        if (!recruit) return { autorise: false, derogationPossible: false, rolesHabilitesDerogation: [] };
        
        if (!recruit.typologiePoste || recruit.statut === 'EN_ECOLE') {
          return {
            autorise: false,
            messageBlocage: 'Verrou Poka-Yoke : L’opérateur doit être formellement affecté à une typologie de poste avant la saisie au poste.',
            messageBlocageAr: 'إقفال وقائي : يجب توجيه المستفيد رسمياً لمركز عمل وتحديد نوعه قبل بدء تتبع مركز العمل.',
            derogationPossible: false,
            rolesHabilitesDerogation: []
          };
        }
        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      case 'VISA_QUALIFICATION_QUALITE':
      case 'VISA_QUALIFICATION_PRODUCTION':
      case 'VALIDATION_FINALE_QUALIFICATION': {
        if (!recruit) return { autorise: false, derogationPossible: false, rolesHabilitesDerogation: [] };
        
        const dureePosteJours = Number(parameters.find((p) => p.cle === 'DUREE_POSTE_JOURS')?.valeur ?? 28);
        const seuilCM = Number(parameters.find((p) => p.cle === 'SEUIL_CARRE_MAGIQUE_POINTS')?.valeur ?? 14);

        if (recruit.estEnProlongation || recruit.statut === 'NON_QUALIFIE_PROLONGATION') {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : L’opérateur est en prolongation (${recruit.motifProlongation || 'Obligation de refaire la formation suite à dépassement du seuil de défauts'}). Mise en autonomie bloquée.`,
            messageBlocageAr: `إقفال وقائي : المستفيد في فترة تمديد (${recruit.motifProlongation || 'إلزامي إعادة التكوين بسبب تجاوز العيوب'}). المرور للاستقلالية ممنوع.`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN']
          };
        }

        if (recruit.joursSuiviCompletes < dureePosteJours) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : Le cycle de suivi au poste est incomplet (${recruit.joursSuiviCompletes}/${dureePosteJours} jours effectués).`,
            messageBlocageAr: `إقفال وقائي : دورة التتبع بمركز العمل غير مكتملة (${recruit.joursSuiviCompletes}/${dureePosteJours} يوماً منجزة).`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN']
          };
        }

        if (recruit.carreMagiquePointsConformes < seuilCM) {
          return {
            autorise: false,
            messageBlocage: `Verrou Poka-Yoke : Score Carré Magique insuffisant (${recruit.carreMagiquePointsConformes}/16 points, minimum requis : ${seuilCM}).`,
            messageBlocageAr: `إقفال وقائي : نقطة المربع السحري غير كافية (${recruit.carreMagiquePointsConformes}/16، الحد الأدنى المطلوب : ${seuilCM}).`,
            derogationPossible: true,
            rolesHabilitesDerogation: ['RESPONSABLE_PRODUCTION', 'QUALITE', 'ADMIN']
          };
        }

        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      case 'MODIFICATION_PARAMETRE': {
        const estHabilite = currentUser.role === 'REFERENT_LEARNING' || currentUser.role === 'ADMIN';
        if (!estHabilite) {
          return {
            autorise: false,
            messageBlocage: 'Verrou Poka-Yoke : Seuls le Référent Learning et l’Administrateur sont habilités à modifier les paramètres directeurs.',
            messageBlocageAr: 'إقفال وقائي : المسؤول المرجعي للتكوين ومسؤول النظام فقط مؤهلان لتعديل الإعدادات المركزية.',
            derogationPossible: false,
            rolesHabilitesDerogation: []
          };
        }
        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      case 'IMPORT_MASSE': {
        const estHabilite = currentUser.role === 'ADMINISTRATION' || currentUser.role === 'ADMIN';
        if (!estHabilite) {
          return {
            autorise: false,
            messageBlocage: 'Verrou Poka-Yoke : Seule l’Administration RH est habilitée à importer des recrues en masse.',
            messageBlocageAr: 'إقفال وقائي : إدارة الموارد البشرية فقط مخولة باستيراد لوائح المستفيدين بشكل جماعي.',
            derogationPossible: false,
            rolesHabilitesDerogation: []
          };
        }
        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
      }

      default:
        return { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] };
    }
  }

  /**
   * Vérifie si l'utilisateur courant est habilité à accorder une dérogation
   */
  public static canGrantDerogation(currentUserRole: UserRole, authorizedRoles: UserRole[]): boolean {
    if (currentUserRole === 'ADMIN') return true;
    return authorizedRoles.includes(currentUserRole);
  }
}
