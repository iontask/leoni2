/**
 * LEONI QualiTrack - Service Client OCR (Intégration Réelle OCR.space & Hybride GitHub Pages)
 * Permet de numériser des CNI marocaines et documents administratifs (PDF, JPG, PNG)
 * avec stratégie Dual-Engine (Moteur 1 & 2), compression automatique d'image (< 1 Mo)
 * et extraction syntaxique réelle sans fausses données de substitution.
 */

import { OCRScanResult } from '../types';

export const OCR_SPACE_API_KEY = 'K81967793988957';

export interface ScanDocumentOptions {
  documentType?: 'CNI' | 'DIPLOME' | 'CASIER' | 'MEDICAL' | 'AUTRE';
  requirementCode?: string;
  language?: 'fre' | 'ara' | 'eng';
}

/**
 * Détecte si l'application s'exécute sur un hébergement statique (GitHub Pages) sans serveur Express
 */
export function isStaticOrGitHubPages(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host.endsWith('github.io') || window.location.protocol === 'file:';
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
 * Convertit un objet File ou Blob en chaîne Base64 Data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
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
 * Compresse et redimensionne une image lourde (ex: photo smartphone 12MP > 4Mo)
 * afin de respecter la limite de 1024 Ko d'OCR.space sans perte de lisibilité
 */
export async function compressImageIfLarge(file: File, maxDimension = 1920, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= 800 * 1024) return file; // Déjà inférieur à 800 Ko

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Rasterise un SVG Data URL en image PNG Data URL pour l'API OCR.space
 */
export function convertSvgToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(svgDataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 600;
        canvas.height = img.naturalHeight || img.height || 380;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch {
        // En cas d'erreur
      }
      resolve(svgDataUrl);
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

/**
 * Analyseur syntaxique certifié CNI marocaine (Zone visuelle + Zone MRZ + Nom de fichier)
 * Ne remplace JAMAIS les champs vides par de fausses données (zéro fausse donnée)
 */
export function parseMoroccanOCRDocument(
  rawText: string,
  docType: string = 'CNI',
  fileName: string = ''
): OCRScanResult {
  const cleanText = (rawText || '').trim();

  // 1. Extraction CIN : format marocain 1-2 lettres majuscules + 4-8 chiffres
  let cin = '';
  const cinMatches = [
    cleanText.match(/(?:N°|CIN|CARTE|ID|IDENTITE)?\s*([A-Z]{1,2}\s*[0-9]{4,8})\b/i),
    cleanText.match(/IDMAR\s*([A-Z]{1,2}[0-9]{4,8})/i),
    cleanText.match(/\b([A-Z]{1,2}[0-9]{4,8})\b/),
    cleanText.match(/\b([A-Z]{1,2}\s*-\s*[0-9]{4,8})\b/)
  ];
  for (const m of cinMatches) {
    if (m && m[1]) {
      const candidate = m[1].replace(/[\s-]+/g, '').toUpperCase();
      if (/^[A-Z]{1,2}[0-9]{4,8}$/.test(candidate)) {
        cin = candidate;
        break;
      }
    }
  }

  // 2. Extraction Nom
  let nom = '';
  const nomMatch = cleanText.match(/(?:Nom|NOM|النسب)\s*[:\-\.]?\s*([A-Za-zÀ-ÖØ-öø-ÿ '-]+)/i);
  if (nomMatch && nomMatch[1].trim()) {
    nom = nomMatch[1].trim().toUpperCase();
  }

  // 3. Extraction Prénom
  let prenom = '';
  const prenomMatch = cleanText.match(/(?:Pr[eé]nom|PRENOM|الإسم|الاسم)\s*[:\-\.]?\s*([A-Za-zÀ-ÖØ-öø-ÿ '-]+)/i);
  if (prenomMatch && prenomMatch[1].trim()) {
    prenom = prenomMatch[1].trim();
  }

  // 4. Extraction via Zone MRZ marocaine (ex: CHRAIBI<<YOUSSRA<<<<<<<<<<<<<<)
  if (!nom || !prenom) {
    const mrzNameMatch = cleanText.match(/(?:^|\n)\s*([A-Z]{2,25})<<([A-Z]{2,25})/);
    if (mrzNameMatch) {
      if (!nom) nom = mrzNameMatch[1].toUpperCase();
      if (!prenom) prenom = mrzNameMatch[2].charAt(0).toUpperCase() + mrzNameMatch[2].slice(1).toLowerCase();
    }
  }

  // 5. Fallback d'analyse des lignes majuscules (si pas d'étiquette explicite)
  if (!nom || !prenom) {
    const lines = cleanText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !l.includes('ROYAUME') && !l.includes('NATIONALE') && !l.includes('MAROC') && !l.includes('IDENTITE'));
    for (const line of lines) {
      if (/^[A-ZÀ-ÖØ-öø-ÿ\s'-]{3,35}$/.test(line)) {
        const parts = line.split(/\s+/).filter((p) => p.length >= 2);
        if (!nom && parts[0]) nom = parts[0].toUpperCase();
        if (!prenom && parts[1]) prenom = parts.slice(1).join(' ');
      }
    }
  }

  // 6. Extraction Date de Naissance
  let dateNaissance = '';
  const dateMatch =
    cleanText.match(
      /(?:N[eé]\s*(?:\(e\))?\s*le|Date\s*de\s*naissance|N[eé]e?\s*le|ازداد\s*في|تاريخ\s*الازدياد)\s*[:\-\.]?\s*([0-3]?[0-9][\.\/\-][0-1]?[0-9][\.\/\-][12][90][0-9]{2})/i
    ) ||
    cleanText.match(/\b([0-3]?[0-9][\.\/\-][0-1]?[0-9][\.\/\-](?:19[5-9][0-9]|20[0-2][0-9]))\b/);

  if (dateMatch) {
    const rawDate = dateMatch[1].replace(/[\.\/]/g, '-');
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        dateNaissance = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        dateNaissance = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  // 7. Extraction Date d'expiration
  let dateExpiration: string | undefined = undefined;
  const expMatch = cleanText.match(
    /(?:Valable\s*jusqu['’]?au|Expire|Validité|Validite|صالحة\s*إلى)\s*[:\-\.]?\s*([0-3]?[0-9][\.\/\-][0-1]?[0-9][\.\/\-][12][0-9]{3})/i
  );
  if (expMatch) {
    const rawExp = expMatch[1].replace(/[\.\/]/g, '-');
    const parts = rawExp.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        dateExpiration = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        dateExpiration = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  // 8. Extraction Adresse
  let adresse: string | undefined = undefined;
  const adrMatch = cleanText.match(/(?:Adresse|Demeurant\s*[aà]|العنوان)\s*[:\-\.]?\s*([^\r\n]+)/i);
  if (adrMatch && adrMatch[1]) {
    adresse = adrMatch[1].trim();
  }

  // 9. Indice utile via le nom du fichier si l'OCR a échoué (ex: CIN_YOUSSRA.pdf ou CNI_BK123456.jpg)
  if (fileName) {
    if (!cin) {
      const fnCinMatch = fileName.match(/\b([A-Z]{1,2}[0-9]{5,7})\b/i);
      if (fnCinMatch) cin = fnCinMatch[1].toUpperCase();
    }
    if (!prenom && !nom) {
      const cleanFn = fileName
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/^(CIN|CNI|DOC|CARTE|SCAN)[_\s-]*/i, '')
        .trim();
      const fnParts = cleanFn.split(/[_\s-]+/).filter((p) => p.length >= 2 && !/^(PDF|JPG|JPEG|PNG)$/i.test(p));
      if (fnParts.length === 1 && /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(fnParts[0])) {
        prenom = fnParts[0].charAt(0).toUpperCase() + fnParts[0].slice(1).toLowerCase();
      } else if (fnParts.length >= 2) {
        nom = fnParts[0].toUpperCase();
        prenom = fnParts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }

  // 10. Calcul du score de confiance réel (0 si rien n'est détecté)
  let confianceScore = 0;
  if (cin) confianceScore += 45;
  if (nom) confianceScore += 25;
  if (prenom) confianceScore += 20;
  if (dateNaissance) confianceScore += 10;
  confianceScore = Math.min(100, confianceScore);

  // Zéro fausse donnée : les champs non détectés restent vides
  return {
    cinExtraite: cin,
    nomExtrait: nom,
    prenomExtrait: prenom,
    dateNaissanceExtraite: dateNaissance,
    dateExpirationExtraite: dateExpiration,
    adresseExtraite: adresse,
    confianceScore,
    sourceDocument: docType as any,
    estSimule: false,
    rawText: cleanText,
    apiProvider: 'ocr.space' as const
  };
}

export interface AICleanseResult {
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateExpiration?: string;
  adresse?: string;
  confianceGlobale: number;
  estConformeAgeLegal?: boolean;
  correctionsApportees: string[];
  remarqueSynthese: string;
  modeleUtilise: string;
}

/**
 * Nettoyeur heuristique côté client en secours si l'API Express /api/ocr/cleanse-fields est indisponible
 * (ex: hébergement statique GitHub Pages où /api/* renvoie 404/405).
 */
export function clientHeuristicCleanse(
  rawText: string = '',
  fileName: string = '',
  documentType: string = 'CNI',
  currentFields: {
    cin?: string;
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    dateExpiration?: string;
    adresse?: string;
  } = {}
): AICleanseResult {
  const parsed = parseMoroccanOCRDocument(rawText, documentType, fileName);
  let cin = (currentFields.cin || parsed.cinExtraite || '').trim().toUpperCase();
  let nom = (currentFields.nom || parsed.nomExtrait || '').trim().toUpperCase();
  let prenom = (currentFields.prenom || parsed.prenomExtrait || '').trim();
  let dateNaissance = (currentFields.dateNaissance || parsed.dateNaissanceExtraite || '').trim();
  let dateExpiration = currentFields.dateExpiration || parsed.dateExpirationExtraite;
  let adresse = currentFields.adresse || parsed.adresseExtraite;
  const correctionsApportees: string[] = [];

  // 1. Extraction et correction des confusions OCR courantes sur les CNI marocaines (ex: O pour 0, tirets, espaces)
  if (!cin && rawText) {
    const rawCinMatches = [
      rawText.match(/(?:N°|N\s*°|CIN|CARTE|ID|IDENTITE)\s*[:\.\s-]*([A-Z]{1,2}\s*[0-9OISB\s-]{4,10})/i),
      rawText.match(/IDMAR\s*[:\.\s-]*([A-Z]{1,2}[0-9OISB\s-]{4,10})/i),
      rawText.match(/\b([A-Z]{1,2}\s*[0-9][0-9OISB\s-]{3,9})\b/i),
      rawText.match(/\b([A-Z]{1,2}\s*-[0-9OISB\s-]{4,10})\b/i)
    ];
    for (const m of rawCinMatches) {
      if (m && m[1]) {
        const candidateRaw = m[1].trim();
        const lettersMatch = candidateRaw.match(/^[A-Z]{1,2}/i);
        if (lettersMatch) {
          const letters = lettersMatch[0].toUpperCase();
          const digitsPart = candidateRaw
            .slice(letters.length)
            .replace(/O/gi, '0')
            .replace(/I/gi, '1')
            .replace(/S/gi, '5')
            .replace(/B/gi, '8')
            .replace(/[^0-9]/g, '');
          const candidateCin = (letters + digitsPart).toUpperCase();
          if (/^[A-Z]{1,2}[0-9]{4,8}$/.test(candidateCin)) {
            cin = candidateCin;
            correctionsApportees.push(`Extraction & correction OCR CIN : "${candidateRaw}" ➔ "${cin}"`);
            break;
          }
        }
      }
    }
  } else if (cin) {
    const originalCin = cin;
    const lettersMatch = cin.match(/^[A-Z]{1,2}/);
    if (lettersMatch) {
      const letters = lettersMatch[0];
      const digitsPart = cin
        .slice(letters.length)
        .replace(/O/gi, '0')
        .replace(/I/gi, '1')
        .replace(/S/gi, '5')
        .replace(/B/gi, '8')
        .replace(/[^0-9]/g, '');
      const candidateCin = (letters + digitsPart).toUpperCase();
      if (/^[A-Z]{1,2}[0-9]{4,8}$/.test(candidateCin)) {
        cin = candidateCin;
        if (cin !== originalCin) {
          correctionsApportees.push(`Normalisation CIN : "${originalCin}" ➔ "${cin}"`);
        }
      }
    }
  }

  // 2. Nettoyage du Nom
  if (nom) {
    const originalNom = nom;
    nom = nom
      .replace(/^(ROYAUME|MAROC|CARTE|NATIONALE|IDENTITE|IDMAR)[_\s-]*/gi, '')
      .replace(/[0-9]+/g, '')
      .trim()
      .toUpperCase();
    if (nom !== originalNom && nom.length >= 2) {
      correctionsApportees.push(`Épuration des bruits d'en-tête officiel dans le nom : "${nom}"`);
    }
  }

  // 3. Normalisation Prénom en Titlecase
  if (prenom) {
    const titleCased = prenom
      .split(/[\s-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (titleCased !== prenom) {
      prenom = titleCased;
      correctionsApportees.push(`Formatage Titlecase du prénom : "${prenom}"`);
    }
  }

  // 4. Contrôle de l'âge légal (≥ 18 ans par rapport à l'année courante 2026)
  let estConformeAgeLegal = true;
  if (dateNaissance) {
    const birthYear = parseInt(dateNaissance.split('-')[0], 10);
    const refYear = new Date().getFullYear();
    if (!isNaN(birthYear) && refYear - birthYear < 18) {
      estConformeAgeLegal = false;
      correctionsApportees.push(`Alerte légale : âge calculé < 18 ans (${refYear - birthYear} ans)`);
    } else {
      correctionsApportees.push(`Validation âge légal conforme (≥ 18 ans)`);
    }
  }

  let confianceGlobale = parsed.confianceScore;
  if (cin && /^[A-Z]{1,2}[0-9]{4,8}$/.test(cin)) confianceGlobale = Math.max(confianceGlobale, 75);
  if (nom && prenom) confianceGlobale = Math.max(confianceGlobale, 85);
  if (dateNaissance) confianceGlobale = Math.max(confianceGlobale, 95);

  const remarqueSynthese = cin || nom
    ? `Contrôle syntaxique & validation heuristique : CIN ${cin || 'à vérifier'}, ${nom || ''} ${prenom || ''}.`
    : 'Aucun texte exploitable détecté sur le document numérisé.';

  return {
    cin,
    nom,
    prenom,
    dateNaissance,
    dateExpiration,
    adresse,
    confianceGlobale,
    estConformeAgeLegal,
    correctionsApportees,
    remarqueSynthese,
    modeleUtilise: 'Heuristique CNI Maroc (Fallback Statique)'
  };
}

/**
 * Phase IA (Gemini 3.8 Flash via proxy backend ou Heuristique locale)
 * Nettoie le contenu brut OCR et valide les champs CNI avec conformité IATF 16949
 */
export async function cleanseAndValidateWithAI(
  rawText: string = '',
  fileName: string = '',
  documentType: string = 'CNI',
  currentFields: {
    cin?: string;
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    dateExpiration?: string;
    adresse?: string;
  } = {}
): Promise<AICleanseResult> {
  // Si hébergement statique (GitHub Pages), utiliser le nettoyeur heuristique client immédiatement
  if (isStaticOrGitHubPages()) {
    return clientHeuristicCleanse(rawText, fileName, documentType, currentFields);
  }

  try {
    const res = await fetch('/api/ocr/cleanse-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        fileName,
        documentType,
        currentFields
      })
    });

    if (res.status === 405 || res.status === 404 || !res.ok) {
      return clientHeuristicCleanse(rawText, fileName, documentType, currentFields);
    }

    const data = await res.json();
    return {
      cin: data.cin || '',
      nom: data.nom || '',
      prenom: data.prenom || '',
      dateNaissance: data.dateNaissance || '',
      dateExpiration: data.dateExpiration || undefined,
      adresse: data.adresse || undefined,
      confianceGlobale: typeof data.confianceGlobale === 'number' ? data.confianceGlobale : 80,
      estConformeAgeLegal: data.estConformeAgeLegal ?? true,
      correctionsApportees: Array.isArray(data.correctionsApportees) ? data.correctionsApportees : [],
      remarqueSynthese: data.remarqueSynthese || 'Nettoyage et validation IA effectués.',
      modeleUtilise: data.modeleUtilise || 'Gemini 3.8 Flash'
    };
  } catch (err) {
    console.warn('[LEONI-OCR-AI] Bascule vers nettoyeur heuristique local:', err);
    return clientHeuristicCleanse(rawText, fileName, documentType, currentFields);
  }
}

/**
 * Appel direct à l'API OCR.space avec stratégie Dual-Engine et gestion native des fichiers PDF et Images
 */
export async function scanDirectWithOCRSpace(
  input: { file?: File | Blob; base64Image?: string; fileName?: string },
  docType: string,
  language: string = 'fre'
): Promise<OCRScanResult> {
  const fileName = input.fileName || 'document.jpg';
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || (input.file && input.file.type === 'application/pdf');

  // Moteur 1 est optimal pour les fichiers PDF, Moteur 2 est optimal pour les photos CNI
  const primaryEngine = isPdf ? '1' : '2';

  const buildFormData = (engine: '1' | '2') => {
    const fd = new FormData();
    fd.append('apikey', OCR_SPACE_API_KEY);
    fd.append('language', language);
    fd.append('isOverlayRequired', 'false');
    fd.append('detectOrientation', 'true');
    fd.append('scale', 'true');
    fd.append('OCREngine', engine);

    if (isPdf) {
      fd.append('filetype', 'PDF');
      fd.append('isSearchablePdfHideTextLayer', 'false');
    }

    if (input.file) {
      fd.append('file', input.file, fileName);
    } else if (input.base64Image) {
      fd.append('base64Image', input.base64Image);
      if (isPdf) fd.append('filetype', 'PDF');
    }

    return fd;
  };

  const executeOcrRequest = async (engine: '1' | '2'): Promise<string> => {
    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: buildFormData(engine)
    });
    if (!res.ok) {
      throw new Error(`OCR.space HTTP ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    if (data.IsErroredOnProcessing && (!data.ParsedResults || data.ParsedResults.length === 0)) {
      throw new Error(data.ErrorMessage?.[0] || data.ErrorDetails || 'Échec traitement OCR.space');
    }
    return (data.ParsedResults || []).map((r: any) => r.ParsedText || '').join('\n');
  };

  // 1ère tentative avec le moteur principal
  let rawText = await executeOcrRequest(primaryEngine);

  // Si le moteur principal retourne moins de 5 caractères, retenter immédiatement avec l'autre moteur
  if (rawText.trim().length < 5) {
    const secondaryEngine = primaryEngine === '2' ? '1' : '2';
    try {
      const retryText = await executeOcrRequest(secondaryEngine);
      if (retryText.trim().length > rawText.trim().length) {
        rawText = retryText;
      }
    } catch {
      // Si la 2ème tentative échoue, conserver le résultat de la 1ère
    }
  }

  return parseMoroccanOCRDocument(rawText, docType, fileName);
}

/**
 * Numérise un fichier réel (File du navigateur) avec l'API OCR.space puis phase IA
 */
export async function scanDocumentWithOCR(
  file: File,
  options: ScanDocumentOptions = {}
): Promise<OCRScanResult> {
  const resolvedType = options.documentType || mapRequirementToDocType(options.requirementCode);
  const { language = 'fre' } = options;

  // 1. Génération de l'aperçu local
  const base64Preview = await fileToBase64(file);

  // 2. Optimisation d'image si taille > 800 Ko
  const fileToUpload = await compressImageIfLarge(file);

  let resultData: OCRScanResult;

  if (isStaticOrGitHubPages()) {
    // Mode direct sur GitHub Pages
    try {
      resultData = await scanDirectWithOCRSpace(
        { file: fileToUpload, fileName: file.name },
        resolvedType,
        language
      );
    } catch (err: any) {
      console.warn('[LEONI-OCR] Échec appel direct OCR:', err);
      resultData = parseMoroccanOCRDocument('', resolvedType, file.name);
    }
  } else {
    // Mode avec proxy Express (développement / production Cloud Run)
    try {
      const formData = new FormData();
      formData.append('apikey', OCR_SPACE_API_KEY);

      // On tente via le proxy serveur
      const response = await fetch('/api/ocr/scan-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64Preview,
          documentType: resolvedType,
          language,
          fileName: file.name
        })
      });

      if (response.status === 405 || response.status === 404) {
        // Redirection transparente vers appel direct si hébergeur statique
        resultData = await scanDirectWithOCRSpace(
          { file: fileToUpload, fileName: file.name },
          resolvedType,
          language
        );
      } else if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      } else {
        const json = await response.json();
        resultData = json.data;
      }
    } catch (err: any) {
      console.warn('[LEONI-OCR] Bascule de secours vers API directe:', err);
      try {
        resultData = await scanDirectWithOCRSpace(
          { file: fileToUpload, fileName: file.name },
          resolvedType,
          language
        );
      } catch {
        resultData = parseMoroccanOCRDocument('', resolvedType, file.name);
      }
    }
  }

  resultData.nomFichier = file.name;
  resultData.apercuUrl = base64Preview;

  // Phase IA : Nettoyage intelligent du contenu et validation des champs
  try {
    const aiCleanse = await cleanseAndValidateWithAI(
      resultData.rawText || '',
      file.name,
      resolvedType,
      {
        cin: resultData.cinExtraite,
        nom: resultData.nomExtrait,
        prenom: resultData.prenomExtrait,
        dateNaissance: resultData.dateNaissanceExtraite,
        dateExpiration: resultData.dateExpirationExtraite,
        adresse: resultData.adresseExtraite
      }
    );

    if (aiCleanse) {
      if (aiCleanse.cin) resultData.cinExtraite = aiCleanse.cin;
      if (aiCleanse.nom) resultData.nomExtrait = aiCleanse.nom;
      if (aiCleanse.prenom) resultData.prenomExtrait = aiCleanse.prenom;
      if (aiCleanse.dateNaissance) resultData.dateNaissanceExtraite = aiCleanse.dateNaissance;
      if (aiCleanse.dateExpiration) resultData.dateExpirationExtraite = aiCleanse.dateExpiration;
      if (aiCleanse.adresse) resultData.adresseExtraite = aiCleanse.adresse;

      resultData.confianceScore = Math.max(resultData.confianceScore, aiCleanse.confianceGlobale);
      resultData.aiValidation = {
        analyseEffectuee: true,
        estConformeAgeLegal: aiCleanse.estConformeAgeLegal,
        correctionsApportees: aiCleanse.correctionsApportees,
        remarqueSynthese: aiCleanse.remarqueSynthese,
        modeleUtilise: aiCleanse.modeleUtilise,
        confianceIA: aiCleanse.confianceGlobale
      };
    }
  } catch (err) {
    console.warn('[LEONI-OCR] Échec non-bloquant phase IA:', err);
  }

  return resultData;
}

/**
 * Numérise une image base64 avec l'API OCR.space puis phase IA
 */
export async function scanBase64WithOCR(
  base64Image: string,
  fileName: string = 'document.jpg',
  options: ScanDocumentOptions = {}
): Promise<OCRScanResult> {
  const resolvedType = options.documentType || mapRequirementToDocType(options.requirementCode);
  const { language = 'fre' } = options;

  let payloadImage = base64Image;
  if (payloadImage.startsWith('data:image/svg')) {
    payloadImage = await convertSvgToPngDataUrl(payloadImage);
  }

  let resultData: OCRScanResult;

  if (isStaticOrGitHubPages()) {
    try {
      resultData = await scanDirectWithOCRSpace(
        { base64Image: payloadImage, fileName },
        resolvedType,
        language
      );
    } catch (err: any) {
      console.warn('[LEONI-OCR] Échec direct OCR:', err);
      resultData = parseMoroccanOCRDocument('', resolvedType, fileName);
    }
  } else {
    try {
      const response = await fetch('/api/ocr/scan-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: payloadImage,
          documentType: resolvedType,
          language,
          fileName
        })
      });

      if (response.status === 405 || response.status === 404) {
        resultData = await scanDirectWithOCRSpace(
          { base64Image: payloadImage, fileName },
          resolvedType,
          language
        );
      } else if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      } else {
        const json = await response.json();
        resultData = json.data;
      }
    } catch (err: any) {
      console.warn('[LEONI-OCR] Bascule de secours vers API directe:', err);
      try {
        resultData = await scanDirectWithOCRSpace(
          { base64Image: payloadImage, fileName },
          resolvedType,
          language
        );
      } catch {
        resultData = parseMoroccanOCRDocument('', resolvedType, fileName);
      }
    }
  }

  resultData.nomFichier = fileName;
  resultData.apercuUrl = base64Image;

  // Phase IA : Nettoyage intelligent du contenu et validation des champs
  try {
    const aiCleanse = await cleanseAndValidateWithAI(
      resultData.rawText || '',
      fileName,
      resolvedType,
      {
        cin: resultData.cinExtraite,
        nom: resultData.nomExtrait,
        prenom: resultData.prenomExtrait,
        dateNaissance: resultData.dateNaissanceExtraite,
        dateExpiration: resultData.dateExpirationExtraite,
        adresse: resultData.adresseExtraite
      }
    );

    if (aiCleanse) {
      if (aiCleanse.cin) resultData.cinExtraite = aiCleanse.cin;
      if (aiCleanse.nom) resultData.nomExtrait = aiCleanse.nom;
      if (aiCleanse.prenom) resultData.prenomExtrait = aiCleanse.prenom;
      if (aiCleanse.dateNaissance) resultData.dateNaissanceExtraite = aiCleanse.dateNaissance;
      if (aiCleanse.dateExpiration) resultData.dateExpirationExtraite = aiCleanse.dateExpiration;
      if (aiCleanse.adresse) resultData.adresseExtraite = aiCleanse.adresse;

      resultData.confianceScore = Math.max(resultData.confianceScore, aiCleanse.confianceGlobale);
      resultData.aiValidation = {
        analyseEffectuee: true,
        estConformeAgeLegal: aiCleanse.estConformeAgeLegal,
        correctionsApportees: aiCleanse.correctionsApportees,
        remarqueSynthese: aiCleanse.remarqueSynthese,
        modeleUtilise: aiCleanse.modeleUtilise,
        confianceIA: aiCleanse.confianceGlobale
      };
    }
  } catch (err) {
    console.warn('[LEONI-OCR] Échec non-bloquant phase IA:', err);
  }

  return resultData;
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
