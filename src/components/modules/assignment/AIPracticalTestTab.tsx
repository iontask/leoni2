/**
 * LEONI QualiTrack - Étape 4 : Test Pratique Assisté par IA (Gemini API)
 * Demandé par la DRH : L'IA est un assistant d'observation, le formateur a la décision exclusive.
 * Affiche obligatoirement « Suggestion IA, à valider » et conserve la double trace.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Save,
  RotateCcw,
  FileText,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import {
  GestureEvaluationCriterion,
  GestureEvaluationReport,
  Language,
  Recruit,
  SystemParameter,
  UserProfile,
  Workstation
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';
import { STANDARD_GESTURE_CRITERIA } from '../../../repositories/mockData';
import { repositoryInstance } from '../../../repositories/storageRepository';

interface AIPracticalTestTabProps {
  recruits: Recruit[];
  workstations: Workstation[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onRefreshParent: () => Promise<void>;
}

// Échantillons d'atelier représentatifs pour test immédiat
const WORKSHOP_SAMPLE_PHOTOS = [
  {
    id: 'sample-01',
    label: 'Insertion connecteur étanche 12 voies avec verrou TPA',
    category: 'Insertion & Verrouillage',
    description: 'Encliquetage axial dans boîtier étanche compartiment moteur VW.',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" fill="%2338bdf8">LEONI BOUSKOURA - POSTE INSERTION</text><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Échantillon atelier : Connecteur étanche 12 voies (Verrou TPA affleurant)</text></svg>'
  },
  {
    id: 'sample-02',
    label: 'Enrubannage régulier à 50% sur dérivation faisceau',
    category: 'Rubanage & Finition',
    description: 'Recouvrement feutrine anti-vibratile selon norme LEONI Wiring.',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" fill="%2334d399">LEONI BOUSKOURA - POSTE RUBANAGE</text><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Échantillon atelier : Bandage feutrine régulier 50% sans pli</text></svg>'
  },
  {
    id: 'sample-03',
    label: 'Positionnement géométrique sur gabarit et clous de guidage',
    category: 'Finition Géométrique',
    description: 'Contrôle des tolérances ±2mm sur planche d’assemblage Planche de bord.',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23172554"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23fbbf24">LEONI BOUSKOURA - GABARIT GÉOMÉTRIQUE</text><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Échantillon atelier : Contrôle tolérances dimensionnelles ±2mm</text></svg>'
  }
];

export const AIPracticalTestTab: React.FC<AIPracticalTestTabProps> = ({
  recruits,
  workstations,
  currentUser,
  parameters,
  lang,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];

  // Paramètre d'activation du module IA (DRH)
  const isAIActive = Boolean(
    parameters.find((p) => p.cle === 'ACTIVE_TEST_PRATIQUE_IA')?.valeur ?? true
  );

  const [selectedRecruitId, setSelectedRecruitId] = useState<string>(recruits[0]?.id || '');
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>(workstations[0]?.id || '');
  const [selectedSample, setSelectedSample] = useState<string>(WORKSHOP_SAMPLE_PHOTOS[0].id);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);

  // Grille de critères en cours d'évaluation
  const [criteria, setCriteria] = useState<GestureEvaluationCriterion[]>(() =>
    STANDARD_GESTURE_CRITERIA.map((c: GestureEvaluationCriterion) => ({
      ...c,
      statutFormateur: 'OK',
      observationFormateur: ''
    }))
  );

  const [aiNoteEstimee, setAiNoteEstimee] = useState<number | null>(null);
  const [aiSynthese, setAiSynthese] = useState<string | null>(null);
  const [isSimulatedResponse, setIsSimulatedResponse] = useState<boolean>(false);
  const [formateurNote, setFormateurNote] = useState<number>(17);
  const [formateurComment, setFormateurComment] = useState<string>(
    'Exécution conforme au standard opératoire LEONI. Bonne maîtrise du verrouillage secondaire.'
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const currentRecruit = recruits.find((r) => r.id === selectedRecruitId);
  const currentWorkstation = workstations.find((w) => w.id === selectedWorkstationId);

  // Gestion du téléversement de fichier photo/vidéo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageUri(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Appel au proxy Express Gemini (/api/gemini/analyze-gesture)
  const handleTriggerAIAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setSavedSuccessMessage(null);

      const activePhoto =
        uploadedImageUri ||
        WORKSHOP_SAMPLE_PHOTOS.find((s) => s.id === selectedSample)?.dataUri ||
        '';

      const response = await fetch('/api/gemini/analyze-gesture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: activePhoto,
          mimeType: activePhoto.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/jpeg',
          workstationTitle: currentWorkstation?.intituleFr || 'Poste Câblage',
          workstationCode: currentWorkstation?.code || 'PST-01',
          criteria: criteria.map((c) => ({
            id: c.id,
            code: c.code,
            libelleFr: c.libelleFr,
            descriptionAttenduFr: c.descriptionAttenduFr,
            estCritique: c.estCritique
          })),
          recruitName: currentRecruit ? `${currentRecruit.nom} ${currentRecruit.prenom}` : 'Opérateur',
          context: `Atelier câblage automobile LEONI Maroc - Poste ${currentWorkstation?.typologie || 'INITIAL'}`
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      setIsSimulatedResponse(!!data.isSimulated);
      setAiSynthese(data.syntheseObservation || null);
      setAiNoteEstimee(data.noteEstimeeSur20 || 17);

      // Met à jour les suggestions IA sur chaque critère tout en conservant la main au formateur
      if (Array.isArray(data.criteres)) {
        setCriteria((prev) =>
          prev.map((c) => {
            const aiCrit = data.criteres.find((ac: any) => ac.id === c.id || ac.code === c.code);
            if (aiCrit) {
              return {
                ...c,
                suggestionIA: aiCrit.statutIA === 'NOK' ? 'NOK' : 'OK',
                observationIA: aiCrit.observationIA,
                confianceIA: aiCrit.confianceIA ?? 90,
                // Le formateur prend initialement la suggestion mais peut la basculer librement
                statutFormateur: aiCrit.statutIA === 'NOK' ? 'NOK' : 'OK',
                observationFormateur: c.observationFormateur || aiCrit.observationIA
              };
            }
            return c;
          })
        );
      }
    } catch (err: any) {
      console.warn('Fallback analyse geste local:', err);
      // Fallback gracieux atelier
      setIsSimulatedResponse(true);
      setAiSynthese('Observation assistée en mode atelier (déclic sonore confirmé, alignement axial régulier).');
      setAiNoteEstimee(17);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enregistrement final avec double traçabilité
  const handleSaveEvaluation = async () => {
    if (!currentRecruit || !currentWorkstation) return;

    try {
      setIsSaving(true);
      const isGlobalOk = criteria.every((c) => (c.estCritique ? c.statutFormateur === 'OK' : true));
      const resultatFinal = isGlobalOk ? 'VALIDE' : 'A_REVOIR';

      await repositoryInstance.saveGestureEvaluation(
        {
          recrueId: currentRecruit.id,
          workstationId: currentWorkstation.id,
          dateEvaluation: new Date().toISOString(),
          formateurMatricule: currentUser.matricule,
          formateurNom: `${currentUser.prenom} ${currentUser.nom}`,
          nomFichierMedia: uploadedImageUri ? 'media-camera-atelier.jpg' : `sample-${selectedSample}.jpg`,
          criteres: criteria,
          noteSur20: formateurNote,
          resultatFinal,
          suggestionIAValideeParFormateur: true,
          commentaireGlobalFormateur: formateurComment,
          horodatageIA: new Date().toISOString(),
          modeleIAUtilise: isSimulatedResponse ? 'simulated-quality-inspector' : 'gemini-3.8-flash'
        },
        currentUser
      );

      setSavedSuccessMessage(
        `Évaluation enregistrée avec succès pour ${currentRecruit.nom} ${currentRecruit.prenom}. Résultat : ${resultatFinal} (${formateurNote}/20). Dossier mis à jour.`
      );
      await onRefreshParent();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bannière de paramétrage DRH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t.tabAIPracticalTest}
              </h2>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isAIActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isAIActive ? 'Module Activé (DRH)' : 'Module Désactivé'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t.aiAssistantNotice}
            </p>
          </div>

          {/* Badge officiel de transparence */}
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold text-indigo-900 shrink-0">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>{t.aiAssistantBadge}</span>
          </div>
        </div>

        {/* Message de succès après enregistrement */}
        {savedSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
            <span className="font-semibold">{savedSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setSavedSuccessMessage(null)}
              className="font-bold text-emerald-700 hover:text-emerald-900 min-h-[40px] px-2"
            >
              Fermer
            </button>
          </div>
        )}
      </div>

      {/* Sélecteurs de contexte : Opérateur & Poste */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Opérateur à évaluer</label>
          <select
            value={selectedRecruitId}
            onChange={(e) => setSelectedRecruitId(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white text-slate-800"
          >
            {recruits.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom} {r.prenom} (CIN: {r.cin}) - {r.ecoleJoursValides}/5j École {r.ecoleValidee ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Poste d'évaluation cible</label>
          <select
            value={selectedWorkstationId}
            onChange={(e) => setSelectedWorkstationId(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white text-slate-800"
          >
            {workstations.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} - {w.intituleFr} ({w.typologie === 'CRITIQUE' ? 'Poste Critique' : 'Poste Initial'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone média du geste : Photo/Vidéo ou Échantillon Atelier */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-700" />
              <span>{t.uploadGestureMedia}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Prenez une photo sur tablette, importez un fichier ou choisissez un échantillon atelier standard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Charger photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleTriggerAIAnalysis}
              disabled={isAnalyzing || !isAIActive}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyse Gemini en cours...' : t.analyzeWithAI}</span>
            </button>
          </div>
        </div>

        {/* Sélecteur d'échantillons d'atelier */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {WORKSHOP_SAMPLE_PHOTOS.map((sample) => {
            const isSelected = selectedSample === sample.id && !uploadedImageUri;
            return (
              <div
                key={sample.id}
                onClick={() => {
                  setSelectedSample(sample.id);
                  setUploadedImageUri(null);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-indigo-700 mb-1">
                  <span>{sample.category}</span>
                  {isSelected && <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded">Sélectionné</span>}
                </div>
                <div className="font-bold text-xs text-slate-800 line-clamp-1">{sample.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sample.description}</div>
              </div>
            );
          })}
        </div>

        {/* Aperçu du média sélectionné */}
        <div className="bg-slate-900 rounded-xl p-3 flex items-center justify-center min-h-[160px] overflow-hidden">
          <img
            src={uploadedImageUri || WORKSHOP_SAMPLE_PHOTOS.find((s) => s.id === selectedSample)?.dataUri}
            alt="Média geste opératoire"
            className="max-h-60 rounded-lg object-contain"
          />
        </div>
      </div>

      {/* Synthèse IA & Badge de confiance */}
      {aiSynthese && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Synthèse de l’observation IA (Gemini 3.8 Flash)</span>
            </span>

            <div className="flex items-center gap-2">
              {isSimulatedResponse && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Mode Simulation Atelier
                </span>
              )}
              {aiNoteEstimee !== null && (
                <span className="text-xs font-bold font-mono text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  Note suggérée : {aiNoteEstimee}/20
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-700 italic leading-relaxed">
            « {aiSynthese} »
          </p>
        </div>
      )}

      {/* Grille des critères qualité LEONI : Comparaison IA vs Décision Formateur */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0 divide-y divide-slate-100">
        <div className="p-4 sm:p-5 bg-slate-50 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900">
              Grille d’évaluation du geste (Norme Usine LEONI)
            </h3>
            <p className="text-xs text-slate-500">
              Le formateur valide ou corrige chaque point. Aucun critère critique ne peut rester NOK pour valider le poste.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {criteria.filter((c) => c.statutFormateur === 'OK').length}/{criteria.length} conformes
          </span>
        </div>

        {criteria.map((crit, index) => {
          const isAiOk = crit.suggestionIA === 'OK';
          const isFormateurOk = crit.statutFormateur === 'OK';

          return (
            <div key={crit.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {crit.code}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {lang === 'ar' ? crit.libelleAr : crit.libelleFr}
                    </span>
                    {crit.estCritique && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Critère Éliminatoire
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? crit.descriptionAttenduAr : crit.descriptionAttenduFr}
                  </p>
                </div>

                {/* Double statut : Suggestion IA vs Décision Formateur */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Suggestion IA */}
                  {crit.suggestionIA && (
                    <div className="bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl text-center space-y-0.5">
                      <span className="text-[9px] uppercase font-extrabold text-indigo-700 block">
                        Suggestion IA
                      </span>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          isAiOk ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                        }`}
                      >
                        {crit.suggestionIA}
                      </span>
                    </div>
                  )}

                  {/* Boutons décision formateur (≥ 48px tactile) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setCriteria((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, statutFormateur: 'OK' } : c))
                        )
                      }
                      className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isFormateurOk
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCriteria((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, statutFormateur: 'NOK' } : c))
                        )
                      }
                      className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        !isFormateurOk
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>NOK</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ligne des observations : IA vs Formateur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {crit.observationIA && (
                  <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 text-indigo-900">
                    <span className="font-bold text-[10px] uppercase text-indigo-700 block">
                      Observation IA :
                    </span>
                    <span>{crit.observationIA}</span>
                  </div>
                )}

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-slate-500 block">
                    {t.observationFormateur} :
                  </span>
                  <input
                    type="text"
                    value={crit.observationFormateur || ''}
                    onChange={(e) =>
                      setCriteria((prev) =>
                        prev.map((c, i) =>
                          i === index ? { ...c, observationFormateur: e.target.value } : c
                        )
                      )
                    }
                    placeholder="Préciser l’observation terrain..."
                    className="w-full mt-1 bg-white px-2 py-1 rounded border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note finale et validation formateur */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Validation formateur & Clôture de l'évaluation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Note pratique finale accordée</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={formateurNote}
                onChange={(e) => setFormateurNote(Number(e.target.value))}
                className="w-24 min-h-[44px] px-3 rounded-xl border border-slate-300 font-mono font-bold text-sm"
              />
              <span className="text-sm font-bold text-slate-500">/ 20</span>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">Commentaire formateur sur la fiche recrue</label>
            <input
              type="text"
              value={formateurComment}
              onChange={(e) => setFormateurComment(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSaveEvaluation}
            disabled={isSaving}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : t.savePracticalEvaluation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
