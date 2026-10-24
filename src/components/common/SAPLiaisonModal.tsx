/**
 * LEONI QualiTrack - Adaptateur Isolé de Liaison SAP RH
 * Export CSV pour SAP Personnel Administration (PA), Réconciliation des matricules par import CSV,
 * et interface de préfiguration de la zone temporaire (staged data).
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  Copy
} from 'lucide-react';
import { Recruit, Site, UserProfile, Language } from '../../types';
import { sapConnector } from '../../services/sapConnector';

interface SAPLiaisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  recruits: Recruit[];
  currentSite: Site | null;
  currentUser: UserProfile;
  lang: Language;
  onReconcileBatch: (
    items: Array<{ cin: string; matricule: string }>
  ) => Promise<{ successCount: number; errors: string[] }>;
}

const SAMPLE_SAP_RETURN = `CIN;Matricule;Statut;Remarques
BK654321;LEO-26-8801;VALIDE;Création fiche PA réussie
BL765432;LEO-26-8802;VALIDE;Création fiche PA réussie
BE876543;LEO-26-8803;VALIDE;Création fiche PA réussie`;

export const SAPLiaisonModal: React.FC<SAPLiaisonModalProps> = ({
  isOpen,
  onClose,
  recruits,
  currentSite,
  currentUser,
  lang,
  onReconcileBatch
}) => {
  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT' | 'STAGING'>('EXPORT');
  const [csvInput, setCsvInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ successCount: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const siteCode = currentSite?.code || 'LEONI-BSK';
  const pendingSAPRecruits = recruits.filter((r) => !r.matricule || r.statutLiaisonSAP !== 'RECONCILIE');

  // Export CSV
  const handleDownloadSAPExport = () => {
    const csvData = sapConnector.exportRecruitsToCSV(recruits, siteCode);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LEONI_SAP_EXPORT_${siteCode}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Traitement Réconciliation SAP
  const handleProcessReconciliation = async () => {
    if (!csvInput.trim()) return;
    setLoading(true);
    setReport(null);

    const parsed = sapConnector.parseReconciliationCSV(csvInput);
    if (parsed.errors.length > 0) {
      setReport({
        successCount: 0,
        errors: parsed.errors.map((e) => `Ligne ${e.ligne} [CIN: ${e.cin}]: ${e.erreur}`)
      });
      setLoading(false);
      return;
    }

    try {
      const items = parsed.rows
        .filter((r) => r.statutSAP === 'VALIDE')
        .map((r) => ({ cin: r.cin, matricule: r.matriculeAttribue }));

      const res = await onReconcileBatch(items);
      setReport(res);
    } catch (err: unknown) {
      setReport({
        successCount: 0,
        errors: [err instanceof Error ? err.message : 'Erreur critique lors de la réconciliation.']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* En-tête */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Adaptateur Isolé de Liaison SAP RH
              </h2>
              <p className="text-xs text-slate-500">
                Intégration hors SAP via fichiers d’échange et réconciliation sans rupture d’historique.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('EXPORT')}
            className={`min-h-[44px] px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'EXPORT'
                ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Exporter vers SAP ({recruits.length} recrues)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('IMPORT')}
            className={`min-h-[44px] px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'IMPORT'
                ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Réconcilier Matricules SAP (Retour CSV)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STAGING')}
            className={`min-h-[44px] px-4 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'STAGING'
                ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Spécification Zone Temporaire (Futur)
          </button>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {/* ONGLET 1 : EXPORT */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
                <span className="font-bold text-blue-900 block">
                  Format standard d’embauche SAP PA (Personnel Administration)
                </span>
                <p className="text-blue-800">
                  Le fichier CSV généré contient les informations requises pour l’ouverture des contrats dans SAP : CIN, nom, prénom, date de naissance ISO (AAAA-MM-JJ), téléphone, code site ({siteCode}) et segment d’affectation.
                </p>
                <div className="font-mono text-[11px] bg-white p-2 rounded-md border border-blue-200 text-slate-700 overflow-x-auto">
                  CIN;Nom;Prenom;DateNaissance_ISO;Telephone;Site_Code;DateEntree_ISO;SegmentPrevisionnel;Statut_Integration
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Recrues prêtes pour transmission SAP</span>
                  <span className="text-slate-500">
                    {pendingSAPRecruits.length} recrue(s) sans matricule définitif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSAPExport}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le CSV pour SAP</span>
                </button>
              </div>
            </div>
          )}

          {/* ONGLET 2 : IMPORT & RÉCONCILIATION */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Collez le retour CSV de SAP pour affecter les matricules officiels :
                </span>
                <button
                  type="button"
                  onClick={() => setCsvInput(SAMPLE_SAP_RETURN)}
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Charger un exemple</span>
                </button>
              </div>

              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="CIN;Matricule;Statut;Remarques..."
                rows={5}
                className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 bg-slate-50 focus:bg-white outline-hidden"
              />

              {report && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    report.errors.length === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold">
                    {report.successCount} recrue(s) réconciliée(s) avec leur matricule officiel.
                  </p>
                  {report.errors.length > 0 && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {report.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={loading || !csvInput.trim()}
                  onClick={handleProcessReconciliation}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Traitement...' : 'Réconcilier les dossiers'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ONGLET 3 : SPÉCIFICATION ZONE TEMPORAIRE */}
          {activeTab === 'STAGING' && (
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Layers className="w-5 h-5 text-blue-700" />
                Spécification d’Interface : Zone Temporaire SAP (Staged Area)
              </div>
              <p>
                Conformément aux directives d’architecture, cette zone temporaire dans SAP reste à valider techniquement et n’est pas implémentée directement.
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="text-blue-700 font-bold">// Contrat d’interface TypeScript disponible :</div>
                <div>interface ISAPStagingArea &#123;</div>
                <div className="pl-4">stagedBatchesCount: number;</div>
                <div className="pl-4">lastSyncTimestamp?: string;</div>
                <div>&#125;</div>
              </div>
              <p className="text-slate-500">
                La plateforme fonctionne aujourd’hui de manière autonome et sécurisée via l’adaptateur isolé de liaison CSV ci-contre.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
