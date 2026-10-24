# LEONI QualiTrack — Plateforme Industrielle d'Intégration & Qualification

> Système de gestion et de certification du parcours d’intégration et de qualification des opérateurs de câblage automobile (sites LEONI Maroc : Bouskoura, Berrechid, Aïn Sebaâ). Conforme aux normes **IATF 16949:2016** et **VDA 6.3**.

---

## 1. Vue d'Ensemble & Périmètre Métier

Le système structure le parcours complet d'un opérateur de câblage automobile sur **33 jours ouvrés** (+ requalification à 90 jours) :
- **École de Formation (5 jours) :** Sécurité, 5S, ergonomie, gestuelle de base, connectique et contrôle qualité (Assiduité 100%, tests théoriques et pratiques $\ge 14/20$).
- **Affectation au Poste :** Rapprochement intelligent basé sur les compétences, les besoins de production et la classification des postes (Postes Initiaux vs Postes Critiques).
- **Suivi au Poste (28 jours) :** Tutorat au poste, objectifs quotidiens Qualité (Q) et Productivité (P), grille d'évaluation **Carré Magique** en 3 phases (Niveau I : 0,24, Niveau L : 0,50, Niveau U : 0,26).
- **Règle des 4 Défauts par Jour :** Tout dépassement de 4 défauts sur un jour bloque l'autonomie et déclenche une prolongation obligatoire du cursus.
- **Validation Finale & Habilitation :** Triple visa Formateur, Auditeur Qualité Ligne (AQL) et Responsable Fabrication (RFM).
- **Requalification à 90 Jours :** Évaluation des critères R1 à R7 pour l'obtention du *Carré Fermé* (Total 1,00) ou rétrogradation au Niveau L si écarts constatés.

---

## 2. Architecture Technique

- **Frontend :** React 19 SPA, Tailwind CSS v4, Lucide Icons, support bilingue complet Français / Arabe avec bascule RTL native (`dir="rtl"`).
- **Backend :** Serveur Express Node.js (`server.ts`) avec middlewares de contrôle d'accès RBAC et proxy pour l'API Gemini (`@google/genai`).
- **Moteur de Calculs Unique (`src/engine/metrics.ts`) :** Source unique de vérité mathématique pour l'ensemble des indicateurs de tableau de bord (zéro divergence, zéro chiffre en dur).
- **Moteur Poka-Yoke (`src/engine/pokaYoke.ts`) :** Verrouillage strict des actions illégitimes avec dérogations formelles tracées au journal d'audit.
- **Persistance & Haute Performance :** Repository avec indexation mémoire Hash Map $O(1)$ sur `CIN`, `Matricule`, `Groupe` et `Site`, répondant en moins de **150 ms** sur un volume de **20 000 recrues** (SLA < 2 secondes respecté).
- **Sécurité des Données Sensibles :** Stockage isolé et traçabilité de consultation pour les copies de CNI et Casier Judiciaire (accès réservé exclusivement à l'Administration RH, masquage partiel du CIN `BK••••21` pour les autres profils).

---

## 3. Installation et Démarrage

### Prérequis
- Node.js version $\ge 18$
- npm ou bun

### Installation des dépendances
```bash
npm install
```

### Démarrage en mode développement (Port 3000)
```bash
npm run dev
```

### Validation et Tests Automatisés
```bash
# Vérification du typage TypeScript
npm run lint

# Exécution de la suite de tests unitaires critiques (Vitest)
npm test

# Compilation de production
npm run build
```

---

## 4. Documentation Détaillée

- [Schéma des Données & Modèle Entités (`docs/DATA_SCHEMA.md`)](./docs/DATA_SCHEMA.md)
- [Guide d'Administration du Paramétrage (`docs/ADMIN_PARAMETERS_GUIDE.md`)](./docs/ADMIN_PARAMETERS_GUIDE.md)
- [Spécification & Modèle d'Import CSV (`docs/IMPORT_TEMPLATE_GUIDE.md`)](./docs/IMPORT_TEMPLATE_GUIDE.md)
- [Variables d'Environnement (`.env.example`)](./.env.example)
