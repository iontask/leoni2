/**
 * LEONI QualiTrack - Modal d'Import en masse avec Simulation avant Validation
 * Traitement par lots asynchrone non-bloquant (jusqu'à 2 000 recrues),
 * contrôle strict des dates ISO, rapport d'erreurs ligne par ligne et suivi de progression 0-100%.
 */

import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Download,
  PlayCircle,
  X,
  FileSpreadsheet,
  Activity,
  Layers
} from 'lucide-react';
import { Recruit, UserProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface MassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  currentSiteId: string;
  lang: Language;
  onImportComplete: (
    data: Array<Omit<Recruit, 'id'>>
  ) => Promise<{ importedCount: number; errors: Array<{ ligne: number; cin: string; erreur: string }> }>;
}

const SAMPLE_CSV = `cin;matricule;nom;prenom;dateNaissance;telephone;dateEntree;groupeEcoleId;segmentPrevisionnel
BK991122;LEO-26-5001;Tahiri;Mehdi;2002-04-12;+212612345678;2026-10-23;grp-03;Faisceau Moteur
BL882233;LEO-26-5002;Fikri;Salma;2001-09-20;+212623456789;2026-10-23;grp-03;Faisceau Habitacle
BM773344;LEO-26-5003;El Alaoui;Hamza;2000-11-05;+212634567890;2026-10-23;grp-03;Planche Assemblage
BN664455;LEO-26-5004;Gharbi;Zineb;2003-02-18;+212645678901;2026-10-23;grp-03;Haute Tension VE`;

export const MassImportModal: React.FC<MassImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentSiteId,
  lang,
  onImportComplete
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [simulationRun, setSimulationRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressState, setProgressState] = useState<{
    stage: string;
    current: number;
    total: number;
    percent: number;
  } | null>(null);
  const [simulationData, setSimulationData] = useState<Array<Omit<Recruit, 'id'>>>([]);
  const [simulationErrors, setSimulationErrors] = useState<Array<{ ligne: number; cin: string; erreur: string }>>([]);
  const [finalSuccessCount, setFinalSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  // Télécharger le modèle officiel CSV
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LEONI_Modele_Import_Recrues.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Génération rapide d'un lot de 500 recrues
  const handleGenerate500Batch = () => {
    generateBatch(500);
  };

  // Génération d'un lot de 2 000 recrues (Critère de performance Étape 8)
  const handleGenerate2000Batch = () => {
    generateBatch(2000);
  };

  const generateBatch = (count: number) => {
    const lines = ['cin;matricule;nom;prenom;dateNaissance;telephone;dateEntree;groupeEcoleId;segmentPrevisionnel'];
    for (let i = 1; i <= count; i++) {
      const cin = `BZ${String(200000 + i)}`;
      const matricule = `LEO-26-${String(8000 + i)}`;
      const nom = `Operateur${i}`;
      const prenom = `Recrue${i}`;
      const dateNaissance = '2001-03-10';
      const telephone = `+212600${String(1000 + (i % 9000))}`;
      const dateEntree = '2026-10-24';
      const groupe = i % 2 === 0 ? 'grp-02' : 'grp-03';
      const segment = i % 3 === 0 ? 'Faisceau Moteur' : i % 3 === 1 ? 'Faisceau Habitacle' : 'Haute Tension VE';
      lines.push(`${cin};${matricule};${nom};${prenom};${dateNaissance};${telephone};${dateEntree};${groupe};${segment}`);
    }
    setCsvContent(lines.join('\n'));
    setSimulationRun(false);
    setFinalSuccessCount(null);
  };

  // Phase 1 : Simulation par lots asynchrones non-bloquants
  const handleRunSimulation = async () => {
    if (!csvContent.trim()) return;

    setLoading(true);
    setSimulationErrors([]);
    setSimulationData([]);
    setFinalSuccessCount(null);

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const startIdx = lines[0].toLowerCase().includes('cin') ? 1 : 0;
    const totalLines = lines.length - startIdx;

    const parsed: Array<Omit<Recruit, 'id'>> = [];
    const errs: Array<{ ligne: number; cin: string; erreur: string }> = [];
    const seenCins = new Set<string>();

    const CHUNK_SIZE = 250;
    let processed = 0;

    for (let chunkStart = startIdx; chunkStart < lines.length; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(lines.length, chunkStart + CHUNK_SIZE);

      for (let i = chunkStart; i < chunkEnd; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();
        const delimiter = line.includes(';') ? ';' : ',';
        const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

        const cin = (cols[0] || '').toUpperCase();
        const matricule = cols[1] || undefined;
        const nom = cols[2] || '';
        const prenom = cols[3] || '';
        const dateNaissance = cols[4] || '';
        const telephone = cols[5] || '';
        const dateEntree = cols[6] || new Date().toISOString().split('T')[0];
        const groupeEcoleId = cols[7] || undefined;
        const segmentPrevisionnel = cols[8] || 'Faisceau Standard';

        // Validation stricte
        if (!cin) {
          errs.push({ ligne: lineNum, cin: 'VIDE', erreur: 'Numéro CIN obligatoire manquant.' });
          continue;
        }

        if (seenCins.has(cin)) {
          errs.push({ ligne: lineNum, cin, erreur: 'Doublon interne dans le même fichier CSV importé.' });
          continue;
        }
        seenCins.add(cin);

        if (!nom || !prenom) {
          errs.push({ ligne: lineNum, cin, erreur: 'Nom ou prénom obligatoire manquant.' });
          continue;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateNaissance)) {
          errs.push({
            ligne: lineNum,
            cin,
            erreur: `Format date de naissance invalide (${dateNaissance}). Format requis: AAAA-MM-JJ.`
          });
          continue;
        }

        if (!dateRegex.test(dateEntree)) {
          errs.push({
            ligne: lineNum,
            cin,
            erreur: `Format date d’entrée invalide (${dateEntree}). Format requis: AAAA-MM-JJ.`
          });
          continue;
        }

        parsed.push({
          cin,
          matricule,
          statutLiaisonSAP: matricule ? 'RECONCILIE' : 'TRANSMIS_EN_ATTENTE_MATRICULE',
          nom,
          prenom,
          dateNaissance,
          telephone,
          siteId: currentSiteId,
          dateEntree,
          statut: 'EN_ECOLE',
          groupeEcoleId,
          segmentPrevisionnel,
          ecoleJoursValides: 0,
          ecoleValidee: false,
          testPratiqueValide: false,
          joursSuiviCompletes: 0,
          carreMagiquePointsConformes: 0,
          qualifiee: false,
          visaQualite: false,
          visaProduction: false
        });
      }

      processed = Math.min(totalLines, processed + (chunkEnd - chunkStart));
      const pct = Math.round((processed / totalLines) * 100);
      setProgressState({
        stage: 'Simulation syntaxique et validation unitaire...',
        current: processed,
        total: totalLines,
        percent: pct
      });

      // Pause non-bloquante pour restituer la main à l'interface
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    setSimulationData(parsed);
    setSimulationErrors(errs);
    setSimulationRun(true);
    setProgressState(null);
    setLoading(false);
  };

  // Phase 2 : Validation définitive par lots asynchrones
  const handleFinalConfirmImport = async () => {
    if (simulationData.length === 0) return;
    setLoading(true);
    setProgressState({
      stage: 'Insertion par lots sécurisés dans la base...',
      current: 0,
      total: simulationData.length,
      percent: 0
    });

    try {
      const CHUNK_SIZE = 400;
      let totalImported = 0;
      const allErrors: Array<{ ligne: number; cin: string; erreur: string }> = [];

      for (let i = 0; i < simulationData.length; i += CHUNK_SIZE) {
        const chunk = simulationData.slice(i, i + CHUNK_SIZE);
        const result = await onImportComplete(chunk);
        totalImported += result.importedCount;
        if (result.errors.length > 0) {
          allErrors.push(...result.errors);
        }

        const currentDone = Math.min(simulationData.length, i + CHUNK_SIZE);
        const pct = Math.round((currentDone / simulationData.length) * 100);
        setProgressState({
          stage: `Enregistrement du lot ${Math.ceil((i + 1) / CHUNK_SIZE)}...`,
          current: currentDone,
          total: simulationData.length,
          percent: pct
        });

        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      setFinalSuccessCount(totalImported);
      if (allErrors.length > 0) {
        setSimulationErrors((prev) => [...prev, ...allErrors]);
      }
    } finally {
      setProgressState(null);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{t.massImport}</h2>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-sm font-mono">
                  Traitement par Lots Haute Capacité (2 000 recrues)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Traitement asynchrone non-bloquant avec contrôle d'intégrité et suivi de progression 0-100%.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Actions rapides sur le modèle */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-bold hover:bg-blue-50 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Modèle CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setCsvContent(SAMPLE_CSV)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Exemple (4)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate500Batch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold hover:bg-blue-100 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Lot 500 recrues</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate2000Batch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-300 text-purple-900 font-bold hover:bg-purple-100 cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-purple-700" />
                <span>Lot 2 000 recrues (Test Stress)</span>
              </button>
            </div>
          </div>

          {/* Zone de texte du CSV */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Contenu CSV (séparateur point-virgule <code>;</code>) :</span>
              <span className="font-mono">
                {csvContent ? `${csvContent.split('\n').filter((l) => l.trim()).length} lignes` : '0 ligne'}
              </span>
            </div>
            <textarea
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setSimulationRun(false);
              }}
              placeholder="Collez ici le contenu du fichier CSV délimité par point-virgule (;)..."
              rows={6}
              className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 focus:bg-white outline-hidden"
            />
          </div>

          {/* Suivi de progression asynchrone */}
          {progressState && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700 animate-spin" />
                  {progressState.stage}
                </span>
                <span className="font-mono">{progressState.current} / {progressState.total} ({progressState.percent}%)</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-150"
                  style={{ width: `${progressState.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-700">
                Traitement par lots asynchrone non-bloquant : l'interface reste fluide pendant l'opération.
              </p>
            </div>
          )}

          {/* Rapport de simulation avant validation */}
          {simulationRun && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">{simulationData.length} lignes conformes</span>
                    <span>Prêtes pour insertion définitive</span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    simulationErrors.length > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 shrink-0 ${
                      simulationErrors.length > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <span className="font-extrabold text-sm block">
                      {simulationErrors.length} rejet(s) détecté(s)
                    </span>
                    <span>{simulationErrors.length === 0 ? 'Aucune erreur syntaxique' : 'Lignes ignorées'}</span>
                  </div>
                </div>
              </div>

              {simulationErrors.length > 0 && (
                <div className="border border-rose-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto text-xs bg-rose-50/50">
                  <table className="w-full text-left">
                    <thead className="bg-rose-100 text-rose-900 font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Ligne</th>
                        <th className="p-2">CIN</th>
                        <th className="p-2">Anomalie constatée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {simulationErrors.slice(0, 100).map((err, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-bold text-rose-900">{err.ligne}</td>
                          <td className="p-2 font-mono text-slate-700">{err.cin}</td>
                          <td className="p-2 text-rose-800">{err.erreur}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {simulationErrors.length > 100 && (
                    <div className="p-2 text-center text-xs text-rose-800 font-medium bg-rose-100">
                      ... et {simulationErrors.length - 100} autres erreurs.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Succès final après validation */}
          {finalSuccessCount !== null && (
            <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-950 flex items-center gap-3 text-xs font-bold">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                Importation finale réussie : {finalSuccessCount} dossiers créés et consignés dans le registre d’audit !
              </div>
            </div>
          )}
        </div>

        {/* Pied de modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 cursor-pointer text-xs sm:text-sm"
          >
            {t.close}
          </button>

          <div className="flex items-center gap-2">
            {!simulationRun ? (
              <button
                type="button"
                disabled={loading || !csvContent.trim()}
                onClick={handleRunSimulation}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Simuler l’importation</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || simulationData.length === 0 || finalSuccessCount !== null}
                onClick={handleFinalConfirmImport}
                className="min-h-[48px] px-7 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider et insérer ({simulationData.length} recrues)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
