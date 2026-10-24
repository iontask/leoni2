/**
 * LEONI QualiTrack - Composant ErrorBoundary
 * Capture les exceptions d'exécution inattendues dans l'arborescence des composants React
 * et affiche une interface de récupération sécurisée sans bloquer l'application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[LEONI-ERROR-BOUNDARY] Erreur interceptée dans ${this.props.moduleName || 'Application'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleHardReset = () => {
    try {
      // Nettoyage sécurisé du cache corrompu éventuel
      localStorage.removeItem('leoni_sidebar_collapsed');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-white border border-rose-200 rounded-2xl shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 mx-auto mb-3 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Une interruption est survenue dans {this.props.moduleName || 'ce module'}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Le système de protection industrielle a isolé l'erreur pour préserver l'intégrité de vos données.
          </p>

          {this.state.error && (
            <div className="text-start p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-rose-700 mb-4 max-h-32 overflow-y-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réessayer l'affichage</span>
            </button>

            <button
              type="button"
              onClick={this.handleHardReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser l'application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
