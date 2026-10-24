# Spécification du Schéma de Données (Data Schema) — LEONI QualiTrack

Ce document détaille les modèles de données fondamentaux utilisés dans l'application pour garantir la cohérence des flux d'intégration, du Carré Magique et du registre d'audit IATF 16949.

---

## 1. Modèle Recrue (`Recruit`)

| Champ | Type | Nullable | Description & Règles Métier |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Non | Identifiant technique unique (`rec-...` ou `UUID`) |
| `cin` | `string` | Non | Numéro de Carte Nationale d'Identité (clé d'unicité candidat, indexée) |
| `matricule` | `string` | Oui | Matricule officiel SAP RH (attribué après réconciliation) |
| `statutLiaisonSAP` | `enum` | Non | `NON_TRANSMIS`, `TRANSMIS_EN_ATTENTE_MATRICULE`, `RECONCILIE` |
| `nom` | `string` | Non | Nom de famille de l'opérateur |
| `prenom` | `string` | Non | Prénom de l'opérateur |
| `dateNaissance` | `string` | Non | Date de naissance au format ISO `AAAA-MM-JJ` |
| `telephone` | `string` | Non | Numéro de téléphone de contact (donnée sensible protégée) |
| `siteId` | `string` | Non | Identifiant du site de rattachement (`site-bsk`, `site-brc`, `site-asb`) |
| `dateEntree` | `string` | Non | Date de premier jour d'intégration au format ISO `AAAA-MM-JJ` |
| `statut` | `enum` | Non | `EN_ECOLE`, `EN_APPRENTISSAGE_POSTE`, `QUALIFIE_AUTONOME`, `NON_QUALIFIE_PROLONGATION` |
| `groupeEcoleId` | `string` | Oui | Foj de formation en école de câblage |
| `segmentPrevisionnel` | `string` | Oui | Segment de production pressenti |
| `ecoleJoursValides` | `number` | Non | Nombre de jours d'école validés (0 à 5) |
| `ecoleValidee` | `boolean` | Non | `true` si l'opérateur a réussi l'école de formation |
| `ecoleScoreTheorie` | `number` | Oui | Note d'examen théorique sur 20 |
| `ecoleScorePratique` | `number` | Oui | Note d'évaluation pratique sur 20 |
| `typologiePoste` | `enum` | Oui | Typologie de poste affectée (`PLANCHE_ASSEMBLAGE`, `TOUFIX_CLIPSAGE`, etc.) |
| `ligneAffectation` | `string` | Oui | Ligne de production d'affectation |
| `segmentAffectation` | `string` | Oui | Segment de production confirmé |
| `joursSuiviCompletes`| `number` | Non | Nombre de jours de suivi au poste complétés (0 à 28) |
| `carreMagiquePointsConformes` | `number` | Non | Points conformes au Carré Magique (0 à 16) |
| `tauxRespectAQL` | `number` | Oui | Pourcentage de conformité aux audits qualité de ligne |
| `qualifiee` | `boolean` | Non | Indicateur final d'autonomie en production |
| `visaQualite` | `boolean` | Non | Visa formel apposé par la Qualité |
| `visaProduction` | `boolean` | Non | Visa formel apposé par la Fabrication / RFM |
| `estArchive` | `boolean` | Non | Indicateur de soft-delete (aucune suppression définitive) |
| `motifArchivage` | `string` | Oui | Motif circonstancié d'archivage obligatoire |

---

## 2. Modèle Carré Magique (`CarreMagiqueSheet`)

Structure modélisant la grille officielle d'évaluation en 3 phases sur 28 jours :

- **Phase 1 (Niveau I) — 4 premiers jours :** Coefficient pondéré `0,24` (4 critères de sécurité et gestes fondamentaux).
- **Phase 2 (Niveau L) — 10 premiers jours :** Coefficient pondéré `0,50` (7 critères de cadence et conformité d'encliquetage).
- **Phase 3 (Niveau U) — Jusqu'au 28e jour :** Coefficient pondéré `0,26` (5 critères de régularité et autonomie).
- **Total pondéré :** `1,00`
- **Requalification à 90 Jours :** Évaluation des critères R1 à R7 pour l'obtention du *Carré Fermé* (Total `1,00`).

---

## 3. Registre d'Audit (`AuditLog`)

Tableau en ajout seul (Append-Only) garantissant l'immuabilité des actions :
- `id` : Identifiant unique de l'événement d'audit.
- `dateAction` : Horodatage ISO complet certifié.
- `auteurMatricule` : Matricule officiel de l'utilisateur.
- `auteurNom` : Prénom et nom de l'auteur.
- `auteurRole` : Rôle habilité de l'auteur.
- `action` : Code d'action normalisé (`CREATION_DOSSIER`, `VALIDATION_ECOLE`, `DEROGATION_AFFECTATION`, `CONSULTATION_DONNEES_SENSIBLES`, `ARCHIVAGE_RECRUE`, etc.).
- `entite` / `entiteId` : Ressource concernée.
- `details` : Description factuelle de l'opération.
- `estDerogation` : `true` si l'action a nécessité une dérogation formelle.
- `motifDerogation` : Justification circonstanciée obligatoire.
