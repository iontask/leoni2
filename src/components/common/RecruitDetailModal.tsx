/**
 * LEONI QualiTrack - Fiche Détail Recrue (Dossier Industriel)
 * Affiche l'historique multisite éventuel, le statut avec badge permanent, et les jalons du parcours 33 jours.
 * Sécurité & Confidentialité : Masquage partiel du CIN (sauf ADMINISTRATION), accès aux pièces sensibles
 * (Casier judiciaire, CNI) strictement réservé à l'Administration avec consultation journalisée,
 * et archivage (soft-delete) avec motif obligatoire consigné.
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Building2,
  Calendar,
  Phone,
  FileCheck2,
  Award,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  ShieldCheck,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  Archive,
  DownloadCloud,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Recruit, UserProfile, Language, SystemParameter, DocumentRequirement, RecruitDocument } from '../../types';
import { TRANSLATIONS, formatDateDisplay, getTypologyLabel, getRoleLabel, maskCIN } from '../../i18n/translations';
import { RecruitStatusBadge } from './RecruitStatusBadge';
import { MetricsEngine } from '../../engine/metrics';
import { repositoryInstance } from '../../repositories/storageRepository';
import { scanDocumentWithOCR, fileToBase64 } from '../../services/ocrService';

interface RecruitDetailModalProps {
  recruit: Recruit | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  parameters: SystemParameter[];
  requirements?: DocumentRequirement[];
  lang: Language;
  onOpenPokaYokeAction?: (action: string, recruit: Recruit) => void;
  onUploadDoc?: (recruitId: string, reqCode: string, fileName: string) => Promise<void>;
  onRefreshParent?: () => Promise<void>;
}

export const RecruitDetailModal: React.FC<RecruitDetailModalProps> = ({
  recruit,
  isOpen,
  onClose,
  currentUser,
  parameters,
  requirements = [],
  lang,
  onOpenPokaYokeAction,
  onUploadDoc,
  onRefreshParent
}) => {
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [motifArchivage, setMotifArchivage] = useState('');
  const [isSubmittingArchive, setIsSubmittingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [consultationNotice, setConsultationNotice] = useState<string | null>(null);
  const [scanningReqCode, setScanningReqCode] = useState<string | null>(null);
  const [activeReqCodeForUpload, setActiveReqCodeForUpload] = useState<string | null>(null);
  const fileInputDetailRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerDocScan = (reqCode: string) => {
    setActiveReqCodeForUpload(reqCode);
    if (fileInputDetailRef.current) {
      fileInputDetailRef.current.value = '';
      fileInputDetailRef.current.click();
    }
  };

  const handleDocFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeReqCodeForUpload || !recruit) return;
    const targetCode = activeReqCodeForUpload;
    setScanningReqCode(targetCode);
    setConsultationNotice(null);

    try {
      const base64Data = await fileToBase64(file);
      const ocrRes = await scanDocumentWithOCR(file, { requirementCode: targetCode });

      const newDoc: RecruitDocument = {
        id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        codeRequirement: targetCode,
        nomFichier: file.name,
        typeMime: file.type || 'image/jpeg',
        tailleKo: Math.max(1, Math.round(file.size / 1024)),
        dateDepot: new Date().toISOString(),
        deposeParMatricule: currentUser.matricule,
        valide: true,
        apercuUrl: base64Data,
        estSimule: ocrRes.estSimule,
        confianceScore: ocrRes.confianceScore
      };

      const updatedDocs = { ...(recruit.documents || {}), [targetCode]: newDoc };
      const totalObligatoires = requirements.filter((r) => r.estObligatoire).length || 1;
      const docsObligatoiresFournis = requirements.filter((r) => r.estObligatoire && updatedDocs[r.code]).length;
      const taux = Math.min(100, Math.round((docsObligatoiresFournis / totalObligatoires) * 100));
      const complet = docsObligatoiresFournis >= totalObligatoires;

      await repositoryInstance.updateRecruit(
        recruit.id,
        {
          documents: updatedDocs,
          tauxCompletudeDossier: taux,
          dossierComplet: complet
        },
        currentUser,
        `Scan OCR.space & ajout document ${targetCode}`
      );

      recruit.documents = updatedDocs;
      recruit.tauxCompletudeDossier = taux;
      recruit.dossierComplet = complet;

      if (onUploadDoc) {
        await onUploadDoc(recruit.id, targetCode, file.name);
      }
      if (onRefreshParent) {
        await onRefreshParent();
      }

      setConsultationNotice(
        `Document "${file.name}" analysé avec succès via OCR.space (${ocrRes.confianceScore}% confiance) et rattaché au dossier.`
      );
      setTimeout(() => setConsultationNotice(null), 5000);
    } catch (err: any) {
      setConsultationNotice(`Erreur lors du scan : ${err.message || "Impossible d'analyser le document"}`);
    } finally {
      setScanningReqCode(null);
      setActiveReqCodeForUpload(null);
    }
  };

  if (!isOpen || !recruit) return null;

  const t = TRANSLATIONS[lang];
  const pMap = MetricsEngine.extractParametersMap(parameters);
  const metrics = MetricsEngine.calculateRecruitMetrics(recruit, pMap);

  const canAccessSensitive = currentUser.role === 'ADMINISTRATION' || currentUser.role === 'ADMIN';

  const isSensitiveDocument = (code: string) => {
    const c = code.toUpperCase();
    return c.includes('CASIER') || c.includes('CNI') || c.includes('CIN') || c.includes('JUDICIAIRE') || c === 'DOC_CNI' || c === 'DOC_CASIER';
  };

  const handleConsultSensitiveDoc = async (reqCode: string, docName: string) => {
    if (!canAccessSensitive) return;
    try {
      await repositoryInstance.logSensitiveDataConsultation(recruit.id, reqCode, currentUser);
      setConsultationNotice(`Consultation de "${docName}" consignée au registre d'audit sous le matricule ${currentUser.matricule}.`);
      if (onRefreshParent) await onRefreshParent();
      setTimeout(() => setConsultationNotice(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmArchive = async () => {
    if (!motifArchivage.trim()) {
      setArchiveError('Le motif circonstancié est obligatoire pour archiver le dossier (exigence IATF 16949 / VDA 6.3).');
      return;
    }
    setIsSubmittingArchive(true);
    setArchiveError(null);
    try {
      await repositoryInstance.archiveRecruit(recruit.id, motifArchivage.trim(), currentUser);
      if (onRefreshParent) await onRefreshParent();
      setArchiveModalOpen(false);
      onClose();
    } catch (err: any) {
      setArchiveError(err.message || "Erreur lors de l'archivage.");
    } finally {
      setIsSubmittingArchive(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
          {/* En-tête */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {recruit.prenom[0]}
                {recruit.nom[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {recruit.nom} {recruit.prenom}
                  </h2>
                  <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                  {recruit.estArchive && (
                    <span className="text-xs font-bold text-slate-700 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-sm">
                      Dossier Archivé
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono font-medium">
                    CIN: <span className="font-bold text-slate-800">{maskCIN(recruit.cin, currentUser.role)}</span>
                    {!canAccessSensitive && (
                      <span className="text-[10px] text-slate-400 ml-1">(Affichage partiel - Donnée sensible)</span>
                    )}
                  </span>
                  <span>•</span>
                  <span className="font-mono">Matr: {recruit.matricule || 'Non attribué'}</span>
                </div>
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

          {/* Corps défilant */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm">
            {/* Notification de consultation de données sensibles */}
            {consultationNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{consultationNotice}</span>
              </div>
            )}

            {/* Alerte antécédent multisite si détecté */}
            {recruit.aHistoriqueAutreSite && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wide">
                    {t.multiSiteAlert}
                  </p>
                  <p className="text-xs mt-0.5">
                    Dossier historique identifié sur le site :{' '}
                    <span className="font-semibold">{recruit.siteOriginePrecedent || 'Site externe LEONI'}</span>.
                    Les jalons antérieurs et motifs d’évaluation ont été consolidés sans rupture de suivi.
                  </p>
                </div>
              </div>
            )}

            {/* Synthèse globale du parcours (33 jours) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-700" />
                  Progression globale du parcours (École 5j + Poste 28j = 33 jours)
                </span>
                <span className="text-sm font-extrabold text-blue-700 font-mono">
                  {metrics.progressionGlobalePourcent}% ({metrics.joursTotalEffectues}/33 jours)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.progressionGlobalePourcent}%` }}
                />
              </div>
            </div>

            {/* Grille des étapes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Étape 1 & Données RH */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    Identité & Administration RH
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                      recruit.statutLiaisonSAP === 'RECONCILIE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {recruit.statutLiaisonSAP === 'RECONCILIE' ? 'SAP Réconcilié' : 'En attente SAP'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">{t.entryDate}</span>
                    <span className="font-medium text-slate-800">{formatDateDisplay(recruit.dateEntree)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.birthDate}</span>
                    <span className="font-medium text-slate-800">{formatDateDisplay(recruit.dateNaissance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.phone}</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {canAccessSensitive ? recruit.telephone || '-' : '•••••••••• (Protégé)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.group}</span>
                    <span className="font-medium text-slate-800 font-mono">{recruit.groupeEcoleId || 'Non assigné'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Segment Prévisionnel</span>
                    <span className="font-semibold text-slate-800">{recruit.segmentPrevisionnel || 'Faisceau Habitacle'}</span>
                  </div>
                </div>
              </div>

              {/* Checklist Administrative Paramétrable & Données Sensibles */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    Checklist & Données Sensibles ({recruit.tauxCompletudeDossier || 0}%)
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      recruit.dossierComplet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {recruit.dossierComplet ? 'Dossier Conforme' : 'Pièces Manquantes'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(requirements || []).map((req) => {
                    const doc = recruit.documents ? recruit.documents[req.code] : undefined;
                    const isSensitive = isSensitiveDocument(req.code);

                    return (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {doc ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  req.estObligatoire ? 'text-rose-500' : 'text-slate-400'
                                }`}
                              />
                            )}
                            <span className={`font-semibold ${doc ? 'text-slate-800' : 'text-slate-500'}`}>
                              {req.libelleFr}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
                                  Fournie (Conforme)
                                </span>
                                {doc.confianceScore !== undefined && (
                                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded-xs">
                                    OCR: {doc.confianceScore}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-xs border border-rose-200">
                                  Non fournie
                                </span>
                                <button
                                  type="button"
                                  disabled={scanningReqCode === req.code}
                                  onClick={() => handleTriggerDocScan(req.code)}
                                  className="min-h-[26px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer border border-blue-200 shadow-2xs transition-colors"
                                  title="Scanner ce document avec l'API OCR.space"
                                >
                                  {scanningReqCode === req.code ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-blue-700" />
                                      <span>Scan OCR...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Camera className="w-3 h-3 text-blue-700" />
                                      <span>Scanner (OCR)</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Traitement spécifique des pièces très sensibles (Casier judiciaire & CNI) */}
                        {isSensitive && (
                          <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
                            {canAccessSensitive ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-amber-800 flex items-center gap-1 font-medium">
                                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                                  Pièce hautement confidentielle
                                </span>
                                {doc && (
                                  <button
                                    type="button"
                                    onClick={() => handleConsultSensitiveDoc(req.code, req.libelleFr)}
                                    className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 cursor-pointer border border-blue-200 shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Consulter (Journalisé)</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="w-full flex items-center gap-1.5 text-slate-500 bg-slate-100 p-1.5 rounded text-[10px]">
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Fichier verrouillé : consultation réservée à l'Administration RH</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Étape 2 : École de formation (5 jours) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-sky-600" />
                    École de Câblage (5 jours)
                  </h3>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                      recruit.ecoleValidee ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {recruit.ecoleValidee ? 'Validée' : `${recruit.ecoleJoursValides}/5 jours`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">{t.theoryScore}</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {recruit.ecoleScoreTheorie !== undefined ? `${recruit.ecoleScoreTheorie}/20` : 'En attente'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.practiceScore}</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {recruit.ecoleScorePratique !== undefined ? `${recruit.ecoleScorePratique}/20` : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Étape 3 : Affectation au poste */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  Affectation & Typologie Poste
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block">{t.station} :</span>
                    <span className="font-semibold text-slate-800">
                      {getTypologyLabel(recruit.typologiePoste, lang)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">{t.line}</span>
                      <span className="font-medium text-slate-700">{recruit.ligneAffectation || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{t.segment}</span>
                      <span className="font-medium text-slate-700">{recruit.segmentAffectation || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Étape 4 & 5 : Suivi Poste (28j) & Carré Magique */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Carré Magique (28 jours)
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                    {recruit.joursSuiviCompletes}/28 jours
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Conformité Carré Magique</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {recruit.carreMagiquePointsConformes}/16 points ({metrics.scoreConformiteCarreMagiquePourcent}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.complianceAQL}</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {recruit.tauxRespectAQL ? `${recruit.tauxRespectAQL}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloc Validation de Qualification */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Visas & Habilitation Finale (Poka-Yoke & Traçabilité)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{t.visaQuality}</span>
                    <span className="text-slate-500 text-[11px]">
                      {recruit.visaQualite ? `Signé par ${recruit.visaQualitePar}` : 'En attente de visa Qualité'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md font-semibold text-[11px] ${
                      recruit.visaQualite ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {recruit.visaQualite ? 'Visé' : 'Non visé'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{t.visaProd}</span>
                    <span className="text-slate-500 text-[11px]">
                      {recruit.visaProduction ? `Signé par ${recruit.visaProductionPar}` : 'En attente de visa RFM'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md font-semibold text-[11px] ${
                      recruit.visaProduction ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {recruit.visaProduction ? 'Visé' : 'Non visé'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de modal avec cibles tactiles ≥ 48px */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Profil actif : <strong className="text-slate-800">{getRoleLabel(currentUser.role, lang)}</strong>
              </span>

              {/* Bouton Archiver (Soft-Delete) réservé RH */}
              {canAccessSensitive && !recruit.estArchive && (
                <button
                  type="button"
                  onClick={() => setArchiveModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Archivage avec motif obligatoire (aucune suppression définitive)"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archiver le dossier</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {recruit.statut === 'EN_ECOLE' && (
                <button
                  type="button"
                  onClick={() => onOpenPokaYokeAction && onOpenPokaYokeAction('AFFECTATION_POSTE', recruit)}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs md:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Affecter au poste (Poka-Yoke)</span>
                </button>
              )}

              {recruit.statut === 'EN_APPRENTISSAGE_POSTE' && (
                <button
                  type="button"
                  onClick={() => onOpenPokaYokeAction && onOpenPokaYokeAction('VALIDATION_FINALE_QUALIFICATION', recruit)}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs md:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Viser la qualification</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs md:text-sm cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation d'archivage avec motif obligatoire */}
      {archiveModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-300 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Archiver le dossier opérateur (Soft-Delete)</h3>
                <p className="text-xs text-slate-500">
                  Aucune suppression définitive autorisée selon IATF 16949. Le dossier est retiré du flux actif et conservé dans le registre d'audit.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Opérateur :</strong> {recruit.nom} {recruit.prenom}</div>
              <div><strong>CIN :</strong> {maskCIN(recruit.cin, currentUser.role)}</div>
              <div><strong>Matricule :</strong> {recruit.matricule || 'Non attribué'}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Motif circonstancié d'archivage <span className="text-rose-600">*</span> :
              </label>
              <textarea
                value={motifArchivage}
                onChange={(e) => setMotifArchivage(e.target.value)}
                placeholder="Indiquez la raison exacte (ex: Désistement candidat le J3, départ volontaire avant fin intégration, fin de contrat)..."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
              {archiveError && (
                <p className="text-xs text-rose-600 font-medium">{archiveError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setArchiveModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmittingArchive || !motifArchivage.trim()}
                onClick={handleConfirmArchive}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Archive className="w-4 h-4" />
                <span>Confirmer l'archivage</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Input de fichier masqué pour numérisation directe OCR */}
      <input
        ref={fileInputDetailRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleDocFileSelected}
      />
    </>
  );
};
