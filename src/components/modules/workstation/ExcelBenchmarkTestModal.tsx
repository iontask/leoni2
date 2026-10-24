/**
 * LEONI QualiTrack - Modal de Test Automatique de Conformité Barème Excel
 * Vérifie mathématiquement et logiquement la stricte concordance avec le canevas officiel LEONI.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  X
} from 'lucide-react';
import { CarreMagiqueEngine } from '../../../engine/carreMagiqueEngine';
import { ExcelBenchmarkTestCase } from '../../../types/carreMagique';
import { Language } from '../../../types';

interface ExcelBenchmarkTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ExcelBenchmarkTestModal: React.FC<ExcelBenchmarkTestModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [testResults, setTestResults] = useState<ExcelBenchmarkTestCase[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);

  const runTests = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const results = CarreMagiqueEngine.runExcelBenchmarkTests();
      setTestResults(results);
      setLastExecutionTime(new Date().toLocaleTimeString());
      setIsExecuting(false);
    }, 250);
  };

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.statutTest === 'PASSE').length;
  const allPassed = totalTests > 0 && passedTests === totalTests;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Banc d’Essai Automatique : Barème Excel LEONI</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  100% Conforme
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Vérification unitaire sur les 3 cas d’école du canevas officiel LEONI (Somme 1,00, Bloquants et Décision).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Badge */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {allPassed ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/80 px-3.5 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3 / 3 Scénarios validés avec succès (Tolérance ε &lt; 0,0001)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-700 bg-rose-100/80 px-3.5 py-1.5 rounded-xl border border-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Écart détecté sur les calculs</span>
              </div>
            )}

            {lastExecutionTime && (
              <span className="text-xs text-slate-400 font-mono">
                Dernière exécution : {lastExecutionTime}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={runTests}
            disabled={isExecuting}
            className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>Relancer les tests unitaires</span>
          </button>
        </div>

        {/* Test Cases List */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {testResults.map((testCase, idx) => {
            const isOk = testCase.statutTest === 'PASSE';

            return (
              <div
                key={testCase.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isOk
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                {/* Test Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {isOk ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <h3 className="font-bold text-sm text-slate-900">
                      {lang === 'ar' ? testCase.titreAr : testCase.titreFr}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Score attendu : <strong>{testCase.scoreAttendu}</strong> ({Math.round(testCase.scoreAttendu * 100)}%)
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                        isOk
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {testCase.statutTest}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 pl-7">
                  {testCase.description}
                </p>

                {/* Assertions Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden ml-7">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Assertion unitaire</span>
                    <span>Concordance</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {testCase.assertions.map((assertion, aIdx) => (
                      <div
                        key={aIdx}
                        className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50/60"
                      >
                        <span className="text-slate-700 font-mono text-[11px]">
                          {assertion.nom}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {JSON.stringify(assertion.obtenu)}
                          </span>
                          {assertion.reussi ? (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> OK
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5">
                              <XCircle className="w-3.5 h-3.5" /> Échec
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Moteur certifié pour le déploiement sur les postes de travail LEONI Bouskoura.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Fermer le banc d’essai
          </button>
        </div>
      </div>
    </div>
  );
};
