/**
 * LEONI QualiTrack - Adaptateur Isolé de Liaison SAP RH
 * Gère l'export CSV des recrues confirmées vers SAP et l'import de réconciliation des matricules attribués par SAP.
 * Prévoit l'interface de la future zone temporaire (staged data) sans implémentation prématurée.
 */

import { Recruit, SAPExportRow, SAPImportRow, ISAPStagingArea } from '../types';

export interface ISAPAdapter {
  exportRecruitsToCSV(recruits: Recruit[], siteCode: string): string;
  parseReconciliationCSV(csvContent: string): {
    rows: SAPImportRow[];
    errors: Array<{ ligne: number; cin: string; erreur: string }>;
  };
  getStagingAreaInfo(): ISAPStagingArea;
}

export class SAPConnectorService implements ISAPAdapter {
  /**
   * Génère le fichier CSV d'embauche pour intégration dans SAP Personnel Administration (PA).
   * Format délimité par point-virgule (;).
   */
  public exportRecruitsToCSV(recruits: Recruit[], siteCode: string): string {
    const headers = 'CIN;Nom;Prenom;DateNaissance_ISO;Telephone;Site_Code;DateEntree_ISO;SegmentPrevisionnel;Statut_Integration\n';

    const lines = recruits.map((r) => {
      const cin = r.cin;
      const nom = r.nom.replace(/;/g, ' ');
      const prenom = r.prenom.replace(/;/g, ' ');
      const dateNaissance = r.dateNaissance;
      const telephone = r.telephone || '';
      const dateEntree = r.dateEntree;
      const segment = r.segmentPrevisionnel || r.segmentAffectation || 'Standard Câblage';
      const statut = r.matricule ? 'DEJA_MATRICULE' : 'EN_ATTENTE_MATRICULE';

      return `${cin};${nom};${prenom};${dateNaissance};${telephone};${siteCode};${dateEntree};${segment};${statut}`;
    });

    return headers + lines.join('\n');
  }

  /**
   * Analyse le fichier CSV retourné par SAP contenant les matricules officiels attribués.
   * Format attendu : CIN;Matricule;Statut;Remarques
   */
  public parseReconciliationCSV(csvContent: string): {
    rows: SAPImportRow[];
    errors: Array<{ ligne: number; cin: string; erreur: string }>;
  } {
    const rows: SAPImportRow[] = [];
    const errors: Array<{ ligne: number; cin: string; erreur: string }> = [];

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { rows, errors };
    }

    const startIdx = lines[0].toLowerCase().includes('cin') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();
      const delimiter = line.includes(';') ? ';' : ',';
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));

      const cin = (cols[0] || '').toUpperCase();
      const matriculeAttribue = (cols[1] || '').trim();
      const statut = (cols[2] || 'VALIDE').toUpperCase();
      const remarque = cols[3] || undefined;

      if (!cin) {
        errors.push({ ligne: lineNum, cin: 'INCONNU', erreur: 'Numéro CIN manquant sur la ligne retour SAP.' });
        continue;
      }

      if (!matriculeAttribue) {
        errors.push({ ligne: lineNum, cin, erreur: 'Matricule attribué par SAP manquant.' });
        continue;
      }

      rows.push({
        cin,
        matriculeAttribue,
        statutSAP: statut === 'REJETE' ? 'REJETE' : 'VALIDE',
        remarque
      });
    }

    return { rows, errors };
  }

  /**
   * Spécification de l'interface pour la zone temporaire de données SAP (staged area)
   * Envisagée techniquement, déclarée ici sans implémentation concrète superflue.
   */
  public getStagingAreaInfo(): ISAPStagingArea {
    return {
      stagedBatchesCount: 0,
      lastSyncTimestamp: undefined
    };
  }
}

export const sapConnector = new SAPConnectorService();
