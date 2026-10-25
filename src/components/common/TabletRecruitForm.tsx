/**
 * LEONI QualiTrack - Saisie Tablette Rapide (< 3 minutes)
 * Formulaire court, tactile (≥ 48px), préremplissage OCR simulé avec relecture obligatoire,
 * contrôle strict des dates (âge ≥ 18 ans), matching temps réel et checklist administrative.
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Sparkles,
  Eye,
  FileCheck2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  FileSearch,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  scanDocumentWithOCR,
  scanBase64WithOCR,
  generateSampleMoroccanCNI,
  cleanseAndValidateWithAI
} from '../../services/ocrService';
import {
  DocumentRequirement,
  Language,
  MatchingResult,
  OCRSimulationResult,
  Recruit,
  RecruitDocument,
  SchoolGroup,
  Site,
  SystemParameter,
  UserProfile
} from '../../types';
import { TRANSLATIONS, formatDateDisplay } from '../../i18n/translations';
import { repositoryInstance } from '../../repositories/storageRepository';
import { MetricsEngine } from '../../engine/metrics';

interface TabletRecruitFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: Site | null;
  groups: SchoolGroup[];
  requirements: DocumentRequirement[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onCreated: (recruit: Omit<Recruit, 'id'>) => Promise<void>;
  onTriggerMatchingModal: (result: MatchingResult, tentativeData: Partial<Recruit>) => void;
}

export const TabletRecruitForm: React.FC<TabletRecruitFormProps> = ({
  isOpen,
  onClose,
  currentSite,
  groups,
  requirements,
  currentUser,
  parameters,
  lang,
  onCreated,
  onTriggerMatchingModal
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : Identité & Contrôle CIN
  const [cin, setCin] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('2002-06-15');
  const [telephone, setTelephone] = useState('+212 6');
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().split('T')[0]);

  // Étape 2 : Pièces jointes & OCR (Intégration Réelle OCR.space + Nettoyage IA Gemini)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, RecruitDocument>>({});
  const [ocrReviewModal, setOcrReviewModal] = useState<OCRSimulationResult | null>(null);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isAIPostProcessing, setIsAIPostProcessing] = useState(false);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);
  const [rawTextToAnalyze, setRawTextToAnalyze] = useState('');
  const [lastAiPopulatedFields, setLastAiPopulatedFields] = useState<string[] | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [activeScanFileName, setActiveScanFileName] = useState<string>('');
  const [showRawOcrText, setShowRawOcrText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Étape 3 : Affectation prévisionnelle & SAP
  const [groupeEcoleId, setGroupeEcoleId] = useState(groups[0]?.id || '');
  const [segmentPrevisionnel, setSegmentPrevisionnel] = useState('Faisceau Habitacle Principal');
  const [matriculeImmediat, setMatriculeImmediat] = useState(false);
  const [matriculeManuel, setMatriculeManuel] = useState('');

  // Erreurs & États
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [matchingWarning, setMatchingWarning] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  // Paramètres système actifs
  const isOcrActive = parameters.find((p) => p.cle === 'EXTRACTION_AUTO_CNI_ACTIVE')?.valeur !== false;
  const minAgeYears = Number(parameters.find((p) => p.cle === 'CONTROLE_AGE_LEGAL_MINIMUM')?.valeur ?? 18);

  // Validation en temps réel de l'âge légal (≥ 18 ans)
  const validateAge = (birthDateStr: string, entryDateStr: string): boolean => {
    if (!birthDateStr || !entryDateStr) return false;
    const b = new Date(birthDateStr);
    const e = new Date(entryDateStr);
    const ageDiffMs = e.getTime() - b.getTime();
    const ageYears = ageDiffMs / (1000 * 60 * 60 * 24 * 365.25);
    return ageYears >= minAgeYears;
  };

  // Validation CIN format marocain
  const validateCINFormat = (cinValue: string): boolean => {
    const cinRegex = /^[A-Z]{1,2}\d{5,7}$/i;
    return cinRegex.test(cinValue.trim());
  };

  // Vérification instantanée du CIN lors de la frappe ou perte de focus
  const handleCinCheck = async (cinVal: string) => {
    const clean = cinVal.trim().toUpperCase();
    if (clean.length >= 4 && currentSite) {
      try {
        const matchRes = await repositoryInstance.checkMatchingCandidate(clean, currentSite.id);
        if (matchRes.doublonLocal) {
          setErrors((prev) => ({
            ...prev,
            cin:
              lang === 'ar'
                ? `تنبيه : هذا المعرف مسجل بالفعل في هذا الموقع (${matchRes.recrueLocaleExistante?.nom} ${matchRes.recrueLocaleExistante?.prenom}).`
                : `Doublon bloquant : Ce CIN est déjà enregistré sur ce site (${matchRes.recrueLocaleExistante?.nom} ${matchRes.recrueLocaleExistante?.prenom}).`
          }));
          setMatchingWarning(matchRes);
        } else if (matchRes.antécédentAutreSite) {
          setMatchingWarning(matchRes);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cin;
            return next;
          });
        } else {
          setMatchingWarning(null);
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cin;
            return next;
          });
        }
      } catch {
        // Ignorer
      }
    }
  };

  // Numérisation d'un document réel (Photo caméra, PNG, JPG, PDF) via l'API réelle OCR.space + Analyse IA
  const handleFileSelectedForOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);
    setOcrError(null);
    setActiveScanFileName(file.name);

    try {
      const ocrResult = await scanDocumentWithOCR(file, { documentType: 'CNI', language: 'fre' });

      // Peuplement automatique immédiat des champs du formulaire par l'IA
      const populated: string[] = [];
      if (ocrResult.cinExtraite) {
        setCin(ocrResult.cinExtraite);
        handleCinCheck(ocrResult.cinExtraite);
        populated.push(`CIN: ${ocrResult.cinExtraite}`);
      }
      if (ocrResult.nomExtrait && ocrResult.nomExtrait !== 'Nom non détecté') {
        setNom(ocrResult.nomExtrait);
        populated.push(`Nom: ${ocrResult.nomExtrait}`);
      }
      if (ocrResult.prenomExtrait && ocrResult.prenomExtrait !== 'Prénom non détecté') {
        setPrenom(ocrResult.prenomExtrait);
        populated.push(`Prénom: ${ocrResult.prenomExtrait}`);
      }
      if (ocrResult.dateNaissanceExtraite) {
        setDateNaissance(ocrResult.dateNaissanceExtraite);
        populated.push(`Date de Naissance: ${ocrResult.dateNaissanceExtraite}`);
      }

      if (populated.length > 0) {
        setLastAiPopulatedFields(populated);
      }

      // Ajout automatique du document CNI numérisé dans la checklist administrative
      setUploadedDocs((prev) => ({
        ...prev,
        DOC_CNI: {
          id: `doc-cni-${Date.now()}`,
          codeRequirement: 'DOC_CNI',
          nomFichier: ocrResult.nomFichier || file.name,
          typeMime: ocrResult.apercuUrl?.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
          tailleKo: Math.round((file.size || 480000) / 1024),
          dateDepot: new Date().toISOString(),
          deposeParMatricule: currentUser.matricule,
          apercuUrl: ocrResult.apercuUrl
        }
      }));

      setOcrReviewModal(ocrResult);
    } catch (err: any) {
      setOcrError(err.message || 'Échec de la numérisation avec OCR.space.');
    } finally {
      setIsScanningOCR(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Numérisation d'un échantillon CNI officiel marocain pour test immédiat d'OCR.space + Nettoyage IA
  const handleScanSampleCNI = async () => {
    setIsScanningOCR(true);
    setOcrError(null);
    setActiveScanFileName('Echantillon_CNI_Maroc_Test.svg');

    try {
      const sampleCin = 'BK' + Math.floor(100000 + Math.random() * 900000);
      const sampleB64 = generateSampleMoroccanCNI(sampleCin, 'EL FASSI', 'Yassine', '14.05.2001');
      const ocrResult = await scanBase64WithOCR(sampleB64, 'Echantillon_CNI_Maroc_Test.svg', {
        documentType: 'CNI',
        language: 'fre'
      });

      // Peuplement automatique immédiat des champs du formulaire par l'IA
      const populated: string[] = [];
      if (ocrResult.cinExtraite) {
        setCin(ocrResult.cinExtraite);
        handleCinCheck(ocrResult.cinExtraite);
        populated.push(`CIN: ${ocrResult.cinExtraite}`);
      }
      if (ocrResult.nomExtrait && ocrResult.nomExtrait !== 'Nom non détecté') {
        setNom(ocrResult.nomExtrait);
        populated.push(`Nom: ${ocrResult.nomExtrait}`);
      }
      if (ocrResult.prenomExtrait && ocrResult.prenomExtrait !== 'Prénom non détecté') {
        setPrenom(ocrResult.prenomExtrait);
        populated.push(`Prénom: ${ocrResult.prenomExtrait}`);
      }
      if (ocrResult.dateNaissanceExtraite) {
        setDateNaissance(ocrResult.dateNaissanceExtraite);
        populated.push(`Date de Naissance: ${ocrResult.dateNaissanceExtraite}`);
      }

      if (populated.length > 0) {
        setLastAiPopulatedFields(populated);
      }

      setUploadedDocs((prev) => ({
        ...prev,
        DOC_CNI: {
          id: `doc-cni-${Date.now()}`,
          codeRequirement: 'DOC_CNI',
          nomFichier: 'Echantillon_CNI_Maroc_Test.svg',
          typeMime: 'image/jpeg',
          tailleKo: 480,
          dateDepot: new Date().toISOString(),
          deposeParMatricule: currentUser.matricule,
          apercuUrl: sampleB64
        }
      }));

      setOcrReviewModal(ocrResult);
    } catch (err: any) {
      setOcrError(err.message || 'Échec de la numérisation avec OCR.space.');
    } finally {
      setIsScanningOCR(false);
    }
  };

  // Analyse directe d'un texte brut par l'IA Gemini et peuplement automatique des champs
  const handleAnalyzeRawTextDirectly = async (text: string) => {
    if (!text.trim()) return;
    setIsAIPostProcessing(true);
    setOcrError(null);

    try {
      const aiCleanse = await cleanseAndValidateWithAI(
        text,
        'Saisie_Texte_Brut_OCR.txt',
        'CNI',
        { cin, nom, prenom, dateNaissance }
      );

      const populated: string[] = [];
      if (aiCleanse.cin) {
        setCin(aiCleanse.cin);
        handleCinCheck(aiCleanse.cin);
        populated.push(`CIN: ${aiCleanse.cin}`);
      }
      if (aiCleanse.nom) {
        setNom(aiCleanse.nom);
        populated.push(`Nom: ${aiCleanse.nom}`);
      }
      if (aiCleanse.prenom) {
        setPrenom(aiCleanse.prenom);
        populated.push(`Prénom: ${aiCleanse.prenom}`);
      }
      if (aiCleanse.dateNaissance) {
        setDateNaissance(aiCleanse.dateNaissance);
        populated.push(`Date de Naissance: ${aiCleanse.dateNaissance}`);
      }

      setLastAiPopulatedFields(populated);

      // Préparer un résultat d'audit pour la modale
      const reviewData: OCRSimulationResult = {
        cinExtraite: aiCleanse.cin,
        nomExtrait: aiCleanse.nom,
        prenomExtrait: aiCleanse.prenom,
        dateNaissanceExtraite: aiCleanse.dateNaissance,
        dateExpirationExtraite: aiCleanse.dateExpiration,
        adresseExtraite: aiCleanse.adresse,
        confianceScore: aiCleanse.confianceGlobale,
        sourceDocument: 'CNI',
        estSimule: false,
        rawText: text,
        nomFichier: 'Texte_Brut_OCR.txt',
        aiValidation: {
          analyseEffectuee: true,
          estConformeAgeLegal: aiCleanse.estConformeAgeLegal,
          correctionsApportees: aiCleanse.correctionsApportees,
          remarqueSynthese: aiCleanse.remarqueSynthese,
          modeleUtilise: aiCleanse.modeleUtilise,
          confianceIA: aiCleanse.confianceGlobale
        }
      };

      setIsRawTextModalOpen(false);
      setOcrReviewModal(reviewData);
    } catch (err: any) {
      setOcrError(err.message || "Échec de l'analyse IA du texte brut.");
    } finally {
      setIsAIPostProcessing(false);
    }
  };

  // Ré-analyse à la demande par l'IA Gemini pour affiner ou corriger les champs
  const handleReanalyzeWithAI = async () => {
    if (!ocrReviewModal) return;
    setIsAIPostProcessing(true);
    try {
      const aiCleanse = await cleanseAndValidateWithAI(
        ocrReviewModal.rawText || '',
        ocrReviewModal.nomFichier || activeScanFileName || 'document.jpg',
        ocrReviewModal.sourceDocument || 'CNI',
        {
          cin: ocrReviewModal.cinExtraite,
          nom: ocrReviewModal.nomExtrait,
          prenom: ocrReviewModal.prenomExtrait,
          dateNaissance: ocrReviewModal.dateNaissanceExtraite
        }
      );

      setOcrReviewModal((prev) =>
        prev
          ? {
              ...prev,
              cinExtraite: aiCleanse.cin || prev.cinExtraite,
              nomExtrait: aiCleanse.nom || prev.nomExtrait,
              prenomExtrait: aiCleanse.prenom || prev.prenomExtrait,
              dateNaissanceExtraite: aiCleanse.dateNaissance || prev.dateNaissanceExtraite,
              dateExpirationExtraite: aiCleanse.dateExpiration || prev.dateExpirationExtraite,
              adresseExtraite: aiCleanse.adresse || prev.adresseExtraite,
              confianceScore: Math.max(prev.confianceScore, aiCleanse.confianceGlobale),
              aiValidation: {
                analyseEffectuee: true,
                estConformeAgeLegal: aiCleanse.estConformeAgeLegal,
                correctionsApportees: aiCleanse.correctionsApportees,
                remarqueSynthese: aiCleanse.remarqueSynthese,
                modeleUtilise: aiCleanse.modeleUtilise,
                confianceIA: aiCleanse.confianceGlobale
              }
            }
          : null
      );
    } catch (err: any) {
      console.warn('[LEONI-OCR-AI] Erreur ré-analyse manuelle:', err);
    } finally {
      setIsAIPostProcessing(false);
    }
  };

  // Validation de l'écran de relecture OCR obligatoire et remplissage automatique des champs
  const handleApplyOCR = (ocr: OCRSimulationResult) => {
    if (ocr.cinExtraite) setCin(ocr.cinExtraite);
    if (ocr.nomExtrait && ocr.nomExtrait !== 'Nom non détecté') setNom(ocr.nomExtrait);
    if (ocr.prenomExtrait && ocr.prenomExtrait !== 'Prénom non détecté') setPrenom(ocr.prenomExtrait);
    if (ocr.dateNaissanceExtraite) setDateNaissance(ocr.dateNaissanceExtraite);

    // Ajout automatique du document CNI numérisé dans la checklist administrative
    setUploadedDocs((prev) => ({
      ...prev,
      DOC_CNI: {
        id: `doc-cni-${Date.now()}`,
        codeRequirement: 'DOC_CNI',
        nomFichier: ocr.nomFichier || `CNI_${ocr.cinExtraite}_Scanne.jpg`,
        typeMime: ocr.apercuUrl?.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
        tailleKo: 480,
        dateDepot: new Date().toISOString(),
        deposeParMatricule: currentUser.matricule,
        apercuUrl:
          ocr.apercuUrl ||
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'
      }
    }));

    if (ocr.cinExtraite) {
      handleCinCheck(ocr.cinExtraite);
    }
    setOcrReviewModal(null);
  };

  // Dépôt de fichier simulé pour une pièce de la checklist
  const handleSimulateUpload = (reqCode: string, fileName: string) => {
    setUploadedDocs((prev) => ({
      ...prev,
      [reqCode]: {
        id: `doc-${reqCode}-${Date.now()}`,
        codeRequirement: reqCode,
        nomFichier: fileName,
        typeMime: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        tailleKo: Math.floor(250 + Math.random() * 600),
        dateDepot: new Date().toISOString(),
        deposeParMatricule: currentUser.matricule
      }
    }));
  };

  // Calcul du taux de complétude en direct
  const totalObligatoires = requirements.filter((r) => r.estObligatoire).length;
  const obligatoiresFournies = requirements.filter((r) => r.estObligatoire && uploadedDocs[r.code]).length;
  const completudePourcent = Math.round((Object.keys(uploadedDocs).length / requirements.length) * 100);

  // Navigation Étape 1 -> Étape 2
  const handleGoStep2 = () => {
    const errs: { [key: string]: string } = {};

    if (!cin.trim()) errs.cin = 'Le CIN est obligatoire (clé d’identification).';
    else if (!validateCINFormat(cin)) errs.cin = 'Format CIN invalide (ex: BK123456).';

    if (!nom.trim()) errs.nom = 'Le nom de famille est obligatoire.';
    if (!prenom.trim()) errs.prenom = 'Le prénom est obligatoire.';

    if (!dateNaissance) errs.dateNaissance = 'La date de naissance est obligatoire.';
    if (!dateEntree) errs.dateEntree = 'La date d’entrée est obligatoire.';

    if (dateNaissance && dateEntree && !validateAge(dateNaissance, dateEntree)) {
      errs.dateNaissance = `L’opérateur doit être majeur (au moins ${minAgeYears} ans à la date d’entrée).`;
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStep(2);
  };

  // Soumission finale du dossier
  const handleFinalSubmit = async () => {
    if (matchingWarning?.doublonLocal) {
      alert('Impossible d’enregistrer : un dossier avec ce CIN existe déjà sur ce site.');
      return;
    }

    setLoading(true);
    try {
      await onCreated({
        cin: cin.trim().toUpperCase(),
        matricule: matriculeImmediat ? matriculeManuel : undefined,
        statutLiaisonSAP: matriculeImmediat ? 'RECONCILIE' : 'TRANSMIS_EN_ATTENTE_MATRICULE',
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance,
        telephone: telephone.trim(),
        siteId: currentSite?.id || 'site-bsk',
        dateEntree,
        statut: 'EN_ECOLE',
        documents: uploadedDocs,
        tauxCompletudeDossier: completudePourcent,
        dossierComplet: obligatoiresFournies >= totalObligatoires,
        groupeEcoleId,
        segmentPrevisionnel,
        ecoleJoursValides: 0,
        ecoleValidee: false,
        testPratiqueValide: false,
        joursSuiviCompletes: 0,
        carreMagiquePointsConformes: 0,
        qualifiee: false,
        visaQualite: false,
        visaProduction: false,
        aHistoriqueAutreSite: !!matchingWarning?.antécédentAutreSite,
        siteOriginePrecedent: matchingWarning?.antécédentAutreSite ? matchingWarning.siteAutreNom : undefined
      });
      onClose();
    } catch (err: unknown) {
      setErrors({ global: err instanceof Error ? err.message : 'Erreur de création.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[94vh]">
        {/* En-tête tablette */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Saisie Rapide Recrue (Tablette Atelier)
                </h2>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-sm font-mono">
                  &lt; 3 minutes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Site : <strong className="text-slate-700">{currentSite?.nom}</strong> • Formulaire en 3 étapes tactiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Indicateur d'étapes (Stepper) */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-3 gap-2 text-xs font-bold text-center">
          <div
            className={`py-2 px-3 rounded-xl transition-all ${
              step === 1 ? 'bg-blue-700 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            1. Identité & CIN
          </div>
          <div
            className={`py-2 px-3 rounded-xl transition-all ${
              step === 2 ? 'bg-blue-700 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            2. Pièces & Complétude ({obligatoiresFournies}/{totalObligatoires})
          </div>
          <div
            className={`py-2 px-3 rounded-xl transition-all ${
              step === 3 ? 'bg-blue-700 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            3. École, Segment & SAP
          </div>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Alerte doublon ou antécédent multisite en temps réel */}
          {matchingWarning && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                matchingWarning.doublonLocal
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  matchingWarning.doublonLocal ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div className="flex-1 text-xs">
                {matchingWarning.doublonLocal ? (
                  <div>
                    <strong className="font-bold text-rose-900 block text-sm">
                      Doublon détecté sur ce site !
                    </strong>
                    <p className="mt-0.5">
                      Ce numéro de CIN est déjà attribué à{' '}
                      <strong>
                        {matchingWarning.recrueLocaleExistante?.nom} {matchingWarning.recrueLocaleExistante?.prenom}
                      </strong>{' '}
                      (Matricule: {matchingWarning.recrueLocaleExistante?.matricule}). L’enregistrement d’un doublon strict est interdit.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-amber-900 text-sm">
                        Antécédent multisite détecté ({matchingWarning.siteAutreNom})
                      </strong>
                      <button
                        type="button"
                        onClick={() =>
                          onTriggerMatchingModal(matchingWarning, {
                            cin,
                            nom,
                            prenom,
                            dateNaissance,
                            dateEntree
                          })
                        }
                        className="bg-amber-700 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-amber-800 cursor-pointer"
                      >
                        Consulter et Rapprocher
                      </button>
                    </div>
                    <p className="mt-0.5">
                      L’opérateur a déjà effectué un parcours sur le site de {matchingWarning.siteAutreNom}. Les données et antécédents peuvent être consolidés automatiquement.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE 1 : Identité & Contrôle de cohérence */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Carte Numérisation OCR.space Réelle */}
              {isOcrActive && (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-sky-50 to-indigo-50/60 border border-blue-200 rounded-2xl shadow-2xs space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelectedForOCR}
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-bold">
                            Numérisation CNI & Documents (API OCR.space Réelle)
                          </strong>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                            API Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Extrait automatiquement le CIN marocain, nom, prénom et date de naissance avec remplissage direct des champs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanningOCR}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                        title="Prendre en photo ou importer un fichier CNI"
                      >
                        {isScanningOCR ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        <span>{isScanningOCR ? 'Numérisation...' : 'Prendre photo / Importer'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleScanSampleCNI}
                        disabled={isScanningOCR}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                        title="Tester immédiatement l'API avec un échantillon CNI marocain"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Échantillon Test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRawTextToAnalyze('');
                          setIsRawTextModalOpen(true);
                        }}
                        disabled={isScanningOCR || isAIPostProcessing}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs border border-indigo-300 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                        title="Coller ou tester directement du texte brut extrait par OCR pour que l'IA peuple les champs"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Analyser Texte Brut (IA)</span>
                      </button>
                    </div>
                  </div>

                  {/* État de chargement / progression OCR + IA */}
                  {isScanningOCR && (
                    <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-xl flex items-center gap-3 text-xs text-blue-950 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
                      <div>
                        <span className="font-bold">Numérisation & Phase IA en cours : </span>
                        <span>Reconnaissance optique sur {activeScanFileName || 'le document'} suivie du nettoyage et validation automatique par IA Gemini...</span>
                      </div>
                    </div>
                  )}

                  {/* Alerte erreur éventuelle */}
                  {ocrError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{ocrError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOcrError(null)}
                        className="text-xs font-bold text-rose-700 hover:underline"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notification dynamique : Champs peuplés par l'IA Gemini */}
              {lastAiPopulatedFields && lastAiPopulatedFields.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-slate-800 shadow-2xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-emerald-950">Champs peuplés automatiquement par l'IA : </span>
                      <span className="font-semibold text-emerald-900">{lastAiPopulatedFields.join(' • ')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastAiPopulatedFields(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-white/60 cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.cin} (Clé Pivot LEONI) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => {
                      setCin(e.target.value.toUpperCase());
                      handleCinCheck(e.target.value);
                    }}
                    placeholder="Ex: BK789012"
                    className={`w-full min-h-[48px] px-3.5 rounded-xl border text-sm font-mono font-extrabold tracking-wider bg-white ${
                      errors.cin ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors.cin && <p className="text-xs font-bold text-rose-600 mt-1">{errors.cin}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.phone} <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom de famille <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: El Amrani"
                    className={`w-full min-h-[48px] px-3.5 rounded-xl border text-sm font-semibold bg-white ${
                      errors.nom ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors.nom && <p className="text-xs font-bold text-rose-600 mt-1">{errors.nom}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prénom <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Ex: Youssef"
                    className={`w-full min-h-[48px] px-3.5 rounded-xl border text-sm font-semibold bg-white ${
                      errors.prenom ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors.prenom && <p className="text-xs font-bold text-rose-600 mt-1">{errors.prenom}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.birthDate} (Âge légal ≥ {minAgeYears} ans) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className={`w-full min-h-[48px] px-3.5 rounded-xl border text-sm font-medium bg-white ${
                      errors.dateNaissance ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors.dateNaissance && (
                    <p className="text-xs font-bold text-rose-600 mt-1">{errors.dateNaissance}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.entryDate} en usine <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateEntree}
                    onChange={(e) => setDateEntree(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Checklist Administrative & Dépôt des pièces */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Complétude administrative du dossier
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {obligatoiresFournies} / {totalObligatoires} pièces obligatoires fournies ({completudePourcent}%)
                  </div>
                </div>

                <div className="w-44 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      obligatoiresFournies >= totalObligatoires ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${completudePourcent}%` }}
                  />
                </div>
              </div>

              {/* Grille des pièces de la checklist administrative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requirements.map((req) => {
                  const uploaded = uploadedDocs[req.code];

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        uploaded
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                          : req.estObligatoire
                          ? 'bg-white border-amber-300 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs">{req.libelleFr}</span>
                            {req.estObligatoire && (
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-xs">
                                Requis
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {req.descriptionFr || req.libelleAr}
                          </p>
                        </div>

                        {uploaded ? (
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload(req.code, `${req.code}_${cin || 'recrue'}.pdf`)}
                              className="min-h-[44px] min-w-[44px] rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center cursor-pointer border border-blue-200"
                              title="Déposer fichier"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSimulateUpload(req.code, `PHOTO_${req.code}_${cin || 'recrue'}.jpg`)}
                              className="min-h-[44px] min-w-[44px] rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer border border-slate-200"
                              title="Prendre photo sur tablette"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {uploaded && (
                        <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px] text-emerald-900 font-mono">
                          <span className="truncate max-w-[200px]">{uploaded.nomFichier}</span>
                          <span>{uploaded.tailleKo} Ko</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Affectation École, Segment & SAP */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Groupe École de Câblage (5j) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={groupeEcoleId}
                    onChange={(e) => setGroupeEcoleId(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code} (Début : {formatDateDisplay(g.dateDebut)} — Statut : {g.statut})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Segment Prévisionnel d’affectation <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={segmentPrevisionnel}
                    onChange={(e) => setSegmentPrevisionnel(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                  >
                    <option value="Faisceau Habitacle Principal">Faisceau Habitacle Principal</option>
                    <option value="Faisceau Moteur & Compartiment">Faisceau Moteur & Compartiment</option>
                    <option value="Faisceau Portières & Hayon">Faisceau Portières & Hayon</option>
                    <option value="Haute Tension & Batterie (VE)">Haute Tension & Batterie (VE)</option>
                    <option value="Planche d’Assemblage Ligne 1">Planche d’Assemblage Ligne 1</option>
                  </select>
                </div>
              </div>

              {/* Option d'attribution matricule vs Liaison SAP différée */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Attribution du Matricule LEONI & Liaison SAP RH
                    </strong>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Une recrue peut être intégrée immédiatement sans matricule, puis réconciliée via l’adaptateur SAP par lot.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={matriculeImmediat}
                      onChange={(e) => setMatriculeImmediat(e.target.checked)}
                      className="w-5 h-5 rounded-md text-blue-700"
                    />
                    <span>Saisir un matricule manuel</span>
                  </label>
                </div>

                {matriculeImmediat ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Matricule officiel immédiat :
                    </label>
                    <input
                      type="text"
                      value={matriculeManuel}
                      onChange={(e) => setMatriculeManuel(e.target.value)}
                      placeholder="Ex: LEO-26-9045"
                      className="w-full sm:w-64 min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      Dossier créé avec statut <strong className="font-mono">EN_ATTENTE_MATRICULE_SAP</strong>. Le matricule officiel sera synchronisé sans rupture d’historique.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modal avec cibles tactiles ≥ 48px */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => ((prev - 1) as any))}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
            >
              {t.cancel}
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleGoStep2}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Continuer ({step}/3)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || Boolean(matchingWarning?.doublonLocal)}
                onClick={handleFinalSubmit}
                className="min-h-[48px] px-7 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{loading ? 'Création en cours...' : 'Finaliser et intégrer la recrue'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Écran de Relecture Obligatoire OCR (Règle 4) */}
      {ocrReviewModal && (() => {
        const isPdf =
          Boolean(ocrReviewModal.nomFichier?.toLowerCase().endsWith('.pdf')) ||
          Boolean(ocrReviewModal.apercuUrl?.startsWith('data:application/pdf'));
        const aDetecteTexte = ocrReviewModal.confianceScore > 0 || (ocrReviewModal.rawText && ocrReviewModal.rawText.trim().length > 5);

        return (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
              {/* Entête dynamique selon résultat OCR réel */}
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  aDetecteTexte
                    ? ocrReviewModal.confianceScore >= 60
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {aDetecteTexte && ocrReviewModal.confianceScore >= 60 ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  )}
                  <div>
                    <h3
                      className={`font-bold text-sm ${
                        aDetecteTexte && ocrReviewModal.confianceScore >= 60
                          ? 'text-emerald-950'
                          : 'text-amber-950'
                      }`}
                    >
                      Relecture & Validation des Données
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          aDetecteTexte
                            ? ocrReviewModal.confianceScore >= 60
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {aDetecteTexte
                          ? `OCR.space : ${ocrReviewModal.confianceScore}%`
                          : 'Texte non détecté'}
                      </span>
                      {ocrReviewModal.aiValidation?.analyseEffectuee && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Nettoyé & Validé IA</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOcrReviewModal(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
                {/* Aperçu du document scanné avec support dédié PDF & Images */}
                {ocrReviewModal.apercuUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    {isPdf ? (
                      <div className="w-14 h-14 rounded-lg bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                        <FileText className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={ocrReviewModal.apercuUrl}
                        alt="Aperçu document scanné"
                        className="w-20 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0 bg-white"
                      />
                    )}
                    <div className="overflow-hidden">
                      <span className="text-[11px] text-slate-500 font-medium block">Document source</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {ocrReviewModal.nomFichier || (isPdf ? 'Document.pdf' : 'CIN-Maroc.jpg')}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Fichier attaché à la checklist du dossier
                      </span>
                    </div>
                  </div>
                )}

                {/* Bloc Phase IA : Nettoyage & Validation */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 rounded-xl border border-indigo-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Phase IA (Gemini 3.8 Flash) — Nettoyage & Validation</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleReanalyzeWithAI}
                      disabled={isAIPostProcessing}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 font-semibold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                      title="Relancer l'analyse et le nettoyage IA sur les champs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAIPostProcessing ? 'animate-spin' : ''}`} />
                      <span>{isAIPostProcessing ? 'Nettoyage...' : 'Ré-analyser IA'}</span>
                    </button>
                  </div>

                  {/* Contrôle Âge Légal */}
                  {ocrReviewModal.aiValidation?.estConformeAgeLegal !== undefined && (
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
                        ocrReviewModal.aiValidation.estConformeAgeLegal
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                      }`}
                    >
                      {ocrReviewModal.aiValidation.estConformeAgeLegal ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span>
                        {ocrReviewModal.aiValidation.estConformeAgeLegal
                          ? 'Conformité légale : Opérateur majeur (âge ≥ 18 ans validé)'
                          : 'Alerte RH : Opérateur mineur ou date incompatible (âge < 18 ans)'}
                      </span>
                    </div>
                  )}

                  {/* Synthèse IA */}
                  {ocrReviewModal.aiValidation?.remarqueSynthese && (
                    <p className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100 leading-relaxed">
                      <span className="font-semibold text-indigo-950">Synthèse : </span>
                      {ocrReviewModal.aiValidation.remarqueSynthese}
                    </p>
                  )}

                  {/* Corrections & Normalisations apportées */}
                  {ocrReviewModal.aiValidation?.correctionsApportees &&
                    ocrReviewModal.aiValidation.correctionsApportees.length > 0 && (
                      <div className="pt-1 border-t border-indigo-100">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-800 block mb-1">
                          Corrections & normalisations automatiques ({ocrReviewModal.aiValidation.correctionsApportees.length}) :
                        </span>
                        <ul className="space-y-0.5 text-[11px] text-indigo-900">
                          {ocrReviewModal.aiValidation.correctionsApportees.map((corr, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                              <span>{corr}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Information si le texte n'a pas été détecté */}
                {!aDetecteTexte && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Aucun texte lisible détecté sur le document.</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Vous pouvez renseigner directement les champs ci-dessous pour préremplir votre dossier sans recommencer.
                      </p>
                    </div>
                  </div>
                )}

                {/* Grille des champs éditables en direct dans la modal */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-700 font-bold text-xs">N° CIN Marocain :</label>
                      {ocrReviewModal.cinExtraite ? (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Détecté
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold">À renseigner</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={ocrReviewModal.cinExtraite}
                      onChange={(e) =>
                        setOcrReviewModal((prev) =>
                          prev ? { ...prev, cinExtraite: e.target.value.toUpperCase() } : null
                        )
                      }
                      placeholder="Ex: BK789012"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-700 text-sm bg-white uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-slate-700 font-medium text-[11px] block mb-1">Nom de famille :</label>
                      <input
                        type="text"
                        value={ocrReviewModal.nomExtrait}
                        onChange={(e) =>
                          setOcrReviewModal((prev) =>
                            prev ? { ...prev, nomExtrait: e.target.value.toUpperCase() } : null
                          )
                        }
                        placeholder="Ex: BENANI"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs bg-white uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-medium text-[11px] block mb-1">Prénom :</label>
                      <input
                        type="text"
                        value={ocrReviewModal.prenomExtrait}
                        onChange={(e) =>
                          setOcrReviewModal((prev) =>
                            prev ? { ...prev, prenomExtrait: e.target.value } : null
                          )
                        }
                        placeholder="Ex: Youssra"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-medium text-[11px] block mb-1">Date de naissance :</label>
                    <input
                      type="date"
                      value={ocrReviewModal.dateNaissanceExtraite || ''}
                      onChange={(e) =>
                        setOcrReviewModal((prev) =>
                          prev ? { ...prev, dateNaissanceExtraite: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Visualiseur de texte brut OCR collapsible si du texte est présent */}
                {ocrReviewModal.rawText && ocrReviewModal.rawText.trim().length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRawOcrText((prev) => !prev)}
                      className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 flex items-center justify-between text-slate-700 font-medium text-[11px] cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Texte brut détecté par l'OCR ({ocrReviewModal.rawText.length} caractères)
                      </span>
                      {showRawOcrText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showRawOcrText && (
                      <div className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                        {ocrReviewModal.rawText}
                      </div>
                    )}
                  </div>
                )}

                {/* Avertissement conformité IATF */}
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-950 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
                  <span>
                    <strong>Contrôle IATF 16949 :</strong> Les informations confirmées ci-dessous seront reportées dans le dossier recrue et rattachées au document scanné.
                  </span>
                </div>

                {/* Actions tactiles ≥ 48px */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setOcrReviewModal(null)}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyOCR(ocrReviewModal)}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer & Préremplir le formulaire</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modale d'Analyse directe de Texte Brut OCR par l'IA Gemini */}
      {isRawTextModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-indigo-200 bg-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-sm text-indigo-950">
                  Analyse IA du Texte Brut OCR & Peuplement Direct
                </h3>
              </div>
              <button
                onClick={() => setIsRawTextModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Collez ci-dessous le texte brut issu d'un scan ou d'un flux OCR. L'IA (Gemini 3.8 Flash) va extraire automatiquement le <strong>CIN</strong>, le <strong>Nom</strong>, le <strong>Prénom</strong> et la <strong>Date de naissance</strong>, et peupler directement les champs du formulaire.
              </p>

              <textarea
                value={rawTextToAnalyze}
                onChange={(e) => setRawTextToAnalyze(e.target.value)}
                placeholder={`Exemple de texte brut OCR :\nROYAUME DU MAROC\nCARTE NATIONALE D'IDENTITE\nNom : BENJELLOUN\nPrénom : Amine\nNé le : 22.08.1999\nN° BK789456\nIDMARBK789456<<<<<<<<<<<<<<<`}
                rows={7}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRawTextToAnalyze(
                      `ROYAUME DU MAROC\nCARTE NATIONALE D'IDENTITE\nNom : CHRAIBI\nPrénom : Youssra\nNée le : 14.05.2001\nN° BK654021\nValable jusqu'au : 20.08.2031\nIDMARBK654021<<<<<<<<<<<<<<<\n0105140F3108204MAR<<<<<<<<<<<4\nCHRAIBI<<YOUSSRA<<<<<<<<<<<<<<`
                    );
                  }}
                  className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer"
                >
                  Insérer exemple de texte brut CNI
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRawTextModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!rawTextToAnalyze.trim() || isAIPostProcessing}
                    onClick={() => handleAnalyzeRawTextDirectly(rawTextToAnalyze)}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isAIPostProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isAIPostProcessing ? 'Analyse...' : 'Analyser & Peupler avec l\'IA'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
