/**
 * LEONI QualiTrack - Saisie Tablette Rapide (< 3 minutes)
 * Formulaire court, tactile (≥ 48px), préremplissage OCR simulé avec relecture obligatoire,
 * contrôle strict des dates (âge ≥ 18 ans), matching temps réel et checklist administrative.
 */

import React, { useState } from 'react';
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
  ChevronLeft
} from 'lucide-react';
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

  // Étape 2 : Pièces jointes & OCR
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, RecruitDocument>>({});
  const [ocrReviewModal, setOcrReviewModal] = useState<OCRSimulationResult | null>(null);

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

  // Simulation d'extraction OCR CNI
  const handleSimulateOCR = () => {
    const ocrData: OCRSimulationResult = {
      cinExtraite: 'BK' + Math.floor(100000 + Math.random() * 900000),
      nomExtrait: 'El Mansouri',
      prenomExtrait: 'Salma',
      dateNaissanceExtraite: '2003-08-22',
      adresseExtraite: 'Lot Al Amal, Bouskoura, Casablanca',
      confianceScore: 97,
      sourceDocument: 'CNI',
      estSimule: true
    };
    setOcrReviewModal(ocrData);
  };

  // Validation de l'écran de relecture OCR obligatoire
  const handleApplyOCR = (ocr: OCRSimulationResult) => {
    setCin(ocr.cinExtraite);
    setNom(ocr.nomExtrait);
    setPrenom(ocr.prenomExtrait);
    setDateNaissance(ocr.dateNaissanceExtraite);
    
    // Ajout automatique du document CNI simulé
    setUploadedDocs((prev) => ({
      ...prev,
      DOC_CNI: {
        id: `doc-cni-${Date.now()}`,
        codeRequirement: 'DOC_CNI',
        nomFichier: `CNI_${ocr.cinExtraite}_RectoVerso.pdf`,
        typeMime: 'application/pdf',
        tailleKo: 450,
        dateDepot: new Date().toISOString(),
        deposeParMatricule: currentUser.matricule,
        apercuUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'
      }
    }));

    handleCinCheck(ocr.cinExtraite);
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
              {/* Bouton d'extraction assistée CNI si activé */}
              {isOcrActive && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-sky-700" />
                    <div className="text-xs">
                      <strong className="text-sky-950 font-bold block">
                        Préremplissage assisté par extraction CNI (Simulation)
                      </strong>
                      <span className="text-sky-800">
                        Extrait automatiquement le CIN, nom, prénom et date de naissance avec relecture obligatoire.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateOCR}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Simuler scan CNI</span>
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
      {ocrReviewModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-bold text-amber-950 text-sm">
                    Relecture Obligatoire de l’Extraction Automatique
                  </h3>
                  <span className="text-[11px] text-amber-800 font-bold">
                    Extraction simulée — À vérifier rigoureusement avant validation
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOcrReviewModal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">CIN extrait :</span>
                  <span className="font-bold font-mono text-sm text-blue-700">{ocrReviewModal.cinExtraite}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom & Prénom :</span>
                  <span className="font-bold text-slate-800">{ocrReviewModal.nomExtrait} {ocrReviewModal.prenomExtrait}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date de naissance :</span>
                  <span className="font-bold text-slate-800">{formatDateDisplay(ocrReviewModal.dateNaissanceExtraite)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Score de confiance :</span>
                  <span className="font-bold text-emerald-700 font-mono">{ocrReviewModal.confianceScore}%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-100/60 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                Avertissement : Cette extraction est simulée pour l’instant et doit être confirmée visuellement contre le document officiel.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOcrReviewModal(null)}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium cursor-pointer"
                >
                  Corriger manuellement
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyOCR(ocrReviewModal)}
                  className="min-h-[48px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer et préremplir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
