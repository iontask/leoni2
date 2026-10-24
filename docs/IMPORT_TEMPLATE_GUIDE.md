# Spécification du Modèle d'Import CSV — LEONI QualiTrack

Ce document décrit le format officiel pour l'intégration de lots de recrues (jusqu'à **2 000 recrues** par opération avec suivi asynchrone 0–100%).

---

## 1. Format Général du Fichier

- **Type de fichier :** CSV délimité par des points-virgules (`;`) ou des virgules (`,`).
- **Encodage :** `UTF-8`.
- **Ligne d'en-tête :** Obligatoire.
- **Rôle habilité à l'import :** Exclusivement `ADMINISTRATION` ou `ADMIN`.

---

## 2. Dictionnaire des Colonnes

| Nom de Colonne | Obligatoire | Format Attendu | Exemple | Règles & Contrôles Poka-Yoke |
| :--- | :--- | :--- | :--- | :--- |
| `cin` | **Oui** | Chaîne alphanumérique (6 à 10 car.) | `BK991122` | Clé d'unicité. Rejet immédiat si vide ou doublon dans le fichier/base. |
| `matricule` | Non | Chaîne alphanumérique | `LEO-26-5001` | Optionnel à l'entrée. Si absent, le dossier est créé en statut *TRANSMIS_EN_ATTENTE_MATRICULE*. |
| `nom` | **Oui** | Texte alphabétique | `Tahiri` | Nom de famille de l'opérateur. |
| `prenom` | **Oui** | Texte alphabétique | `Mehdi` | Prénom de l'opérateur. |
| `dateNaissance` | **Oui** | Date ISO `AAAA-MM-JJ` | `2002-04-12` | Contrôle strict du format date. Rejet en cas de format invalide. |
| `telephone` | Non | Téléphone international | `+212612345678` | Donnée protégée masquée pour les profils d'atelier. |
| `dateEntree` | **Oui** | Date ISO `AAAA-MM-JJ` | `2026-10-24` | Date de démarrage en école de câblage. |
| `groupeEcoleId` | Non | Identifiant de groupe | `grp-03` | Foj de formation en école. |
| `segmentPrevisionnel` | Non | Texte | `Faisceau Habitacle` | Segment d'affectation prévisionnelle. |

---

## 3. Exemple de Contenu CSV Conforme

```csv
cin;matricule;nom;prenom;dateNaissance;telephone;dateEntree;groupeEcoleId;segmentPrevisionnel
BK991122;LEO-26-5001;Tahiri;Mehdi;2002-04-12;+212612345678;2026-10-24;grp-03;Faisceau Moteur
BL882233;LEO-26-5002;Fikri;Salma;2001-09-20;+212623456789;2026-10-24;grp-03;Faisceau Habitacle
BM773344;LEO-26-5003;El Alaoui;Hamza;2000-11-05;+212634567890;2026-10-24;grp-03;Planche Assemblage
BN664455;LEO-26-5004;Gharbi;Zineb;2003-02-18;+212645678901;2026-10-24;grp-03;Haute Tension VE
```

---

## 4. Protocole de Simulation et Traitement par Lots

1. **Phase 1 — Simulation préalable :**
   - Le système analyse chaque ligne sans modifier la base de données.
   - Contrôle la validité syntaxique, le format des dates et l'absence de doublons CIN.
   - Présente un rapport clair des lignes conformes et des anomalies détectées.
2. **Phase 2 — Insertion asynchrone non-bloquante :**
   - Pour les lots massifs (jusqu'à 2 000 recrues), l'insertion s'effectue par blocs asynchrones.
   - L'interface utilisateur reste totalement fluide, avec une barre de progression de 0 à 100%.
   - Un événement unique d'audit `IMPORT_MASSE` consigne le nombre de dossiers créés et les rejets éventuels.
