/**
 * LEONI QualiTrack - Service Client OCR (Intégration Réelle OCR.space)
 * Permet de téléverser et numériser des documents (CNI marocaine, diplômes, attestations)
 * via le proxy serveur sécurisé et de préremplir automatiquement les champs du dossier.
 */

import { OCRScanResult } from '../types';

export interface ScanDocumentOptions {
  documentType?: 'CNI' | 'DIPLOME' | 'CASIER' | 'MEDICAL' | 'AUTRE';
  requirementCode?: string;
  language?: 'fre' | 'ara' | 'eng';
}

/**
 * Mappe un code de prérequis documentaire (ex: DOC_CNI, DOC_DIPLOME) en type OCR
 */
export function mapRequirementToDocType(code?: string): 'CNI' | 'DIPLOME' | 'CASIER' | 'MEDICAL' | 'AUTRE' {
  if (!code) return 'CNI';
  const c = code.toUpperCase();
  if (c.includes('CNI') || c.includes('CIN')) return 'CNI';
  if (c.includes('DIPLOME') || c.includes('BAC') || c.includes('ATTESTATION')) return 'DIPLOME';
  if (c.includes('CASIER') || c.includes('JUDICIAIRE')) return 'CASIER';
  if (c.includes('MEDIC') || c.includes('APTITUDE')) return 'MEDICAL';
  return 'AUTRE';
}

/**
 * Convertit un objet File en chaîne Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Format de lecture de fichier invalide.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Erreur lecture fichier.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Numérise un fichier réel avec l'API OCR.space via le serveur backend
 */
export async function scanDocumentWithOCR(
  file: File,
  options: ScanDocumentOptions = {}
): Promise<OCRScanResult> {
  const base64Data = await fileToBase64(file);
  return scanBase64WithOCR(base64Data, file.name, options);
}

/**
 * Numérise une image base64 avec l'API OCR.space
 */
export async function scanBase64WithOCR(
  base64Image: string,
  fileName: string = 'document.jpg',
  options: ScanDocumentOptions = {}
): Promise<OCRScanResult> {
  const resolvedType = options.documentType || mapRequirementToDocType(options.requirementCode);
  const { language = 'fre' } = options;

  const response = await fetch('/api/ocr/scan-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64: base64Image,
      documentType: resolvedType,
      language,
      fileName
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erreur serveur OCR (${response.status})`);
  }

  const result = await response.json();
  const data: OCRScanResult = result.data;
  data.apercuUrl = base64Image;
  data.nomFichier = fileName;

  return data;
}

/**
 * Génère une image SVG haute définition d'une CNI marocaine encodée en data URL
 * pour tester immédiatement la reconnaissance réelle OCR.space
 */
export function generateSampleMoroccanCNI(
  cinNum: string = 'BK654321',
  nom: string = 'EL FASSI',
  prenom: string = 'Yassine',
  dateNaissance: string = '14.05.2001'
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" rx="16" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
    <rect x="20" y="20" width="560" height="50" rx="8" fill="#1e3a8a"/>
    <text x="300" y="45" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">ROYAUME DU MAROC / المملكة المغربية</text>
    <text x="300" y="62" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1" text-anchor="middle">CARTE NATIONALE D'IDENTITE / البطاقة الوطنية للتعريف</text>

    <!-- Photo silhouette -->
    <rect x="40" y="90" width="130" height="170" rx="8" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
    <circle cx="105" cy="150" r="35" fill="#94a3b8"/>
    <path d="M 65 240 Q 105 190 145 240 Z" fill="#94a3b8"/>

    <!-- Données CNI -->
    <text x="200" y="120" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-weight="bold">Nom :</text>
    <text x="270" y="120" font-family="Arial, sans-serif" font-size="16" fill="#0f172a" font-weight="bold">${nom}</text>

    <text x="200" y="155" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-weight="bold">Prénom :</text>
    <text x="270" y="155" font-family="Arial, sans-serif" font-size="16" fill="#0f172a" font-weight="bold">${prenom}</text>

    <text x="200" y="190" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-weight="bold">Né le :</text>
    <text x="270" y="190" font-family="Arial, sans-serif" font-size="15" fill="#0f172a" font-weight="bold">${dateNaissance}</text>

    <text x="200" y="225" font-family="Arial, sans-serif" font-size="13" fill="#64748b" font-weight="bold">Valable jusqu'au :</text>
    <text x="330" y="225" font-family="Arial, sans-serif" font-size="14" fill="#0f172a">20.08.2031</text>

    <!-- Numéro CIN Principal -->
    <rect x="200" y="255" width="220" height="42" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="215" y="282" font-family="monospace" font-size="20" font-weight="bold" fill="#1d4ed8">N° ${cinNum}</text>

    <!-- Zone inférieure MRZ -->
    <rect x="20" y="315" width="560" height="45" rx="6" fill="#f1f5f9"/>
    <text x="40" y="335" font-family="monospace" font-size="13" fill="#334155" letter-spacing="3">IDMAR${cinNum}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x="40" y="352" font-family="monospace" font-size="13" fill="#334155" letter-spacing="3">0105140M3108204MAR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
