# Guide d’Administration du Paramétrage Central — LEONI QualiTrack

Ce guide s'adresse aux profils **Référent Formation & Learning** et **Administrateur Système** pour la gestion des paramètres directeurs du système.

---

## 1. Principes de Gouvernance du Paramétrage

1. **Aucun paramètre en dur dans le code :** Toutes les durées, seuils de notes, barèmes de points et règles d'accès proviennent de la table `SystemParameter`.
2. **Versionnage immuable :** Chaque modification incrémente le numéro de version (`version + 1`) et archive la version antérieure.
3. **Traçabilité stricte :** La modification d'un paramètre exige obligatoirement un **motif circonstancié** et l'identité du signataire (matricule et nom).
4. **Habilitation restreinte :** Seuls les rôles `REFERENT_LEARNING` et `ADMIN` disposent des droits d'écriture sur ce module.

---

## 2. Référentiel des Paramètres Directeurs

| Clé Paramètre | Type | Valeur par Défaut | Catégorie | Description & Impact Système |
| :--- | :--- | :--- | :--- | :--- |
| `DUREE_ECOLE_JOURS` | Nombre | `5` | FORMATION | Durée standard du cycle école de câblage (jours). Conditionne le déverrouillage de l'affectation. |
| `DUREE_POSTE_JOURS` | Nombre | `28` | QUALIFICATION | Durée requise pour le suivi au poste avant éligibilité à la validation finale. |
| `NOTE_MIN_REUSSITE_ECOLE` | Nombre | `14` | EVALUATION | Seuil minimal de note théorique/pratique sur 20 pour valider l'école de câblage. |
| `NOTE_MIN_POSTE_CRITIQUE` | Nombre | `16` | QUALIFICATION | Note minimale sur 20 exigée pour autoriser l'affectation à un poste critique. |
| `SEUIL_CARRE_MAGIQUE_POINTS` | Nombre | `14` | QUALIFICATION | Nombre minimal de points conformes sur 16 au Carré Magique pour autoriser l'autonomie. |
| `POINTS_TOTAL_CARRE_MAGIQUE`| Nombre | `16` | QUALIFICATION | Nombre total de points d'évaluation de la grille Carré Magique. |
| `SEUIL_MAX_DEFAUTS_JOUR` | Nombre | `4` | QUALIFICATION | Seuil journalier de défauts. Tout dépassement (> 4) bloque l'autonomie et impose une prolongation. |
| `DELAI_REQUALIFICATION_JOURS`| Nombre | `90` | QUALIFICATION | Périodicité avant déclenchement automatique de la fiche de requalification (Carré Fermé). |
| `DUREE_CONSERVATION_DOCUMENTS_SENSIBLES_MOIS` | Nombre | `60` | SECURITE | Durée légale de rétention des pièces sensibles (CNI, Casier Judiciaire) avant purge/archivage. |
| `REGLE_RAPPROCHEMENT_DEFAUT` | Texte | `CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE` | SECURITE | Règle appliquée en cas de réembauche ou de transfert multisite d'un opérateur. |

---

## 3. Matrice des Droits de Validation & Dérogations

| Action Métier | Rôle Validateur Titulaire | Rôles Habilités à Déroger |
| :--- | :--- | :--- |
| Validation Fin d'École (5j) | `FORMATEUR_ECOLE` | `REFERENT_LEARNING`, `ADMIN` |
| Affectation Poste Standard | `FORMATEUR_ECOLE` / `ADMINISTRATION` | `RESPONSABLE_PRODUCTION`, `REFERENT_LEARNING`, `ADMIN` |
| Affectation Poste Critique | `RESPONSABLE_PRODUCTION` | `RESPONSABLE_PRODUCTION`, `QUALITE`, `ADMIN` |
| Pointage Tutorat Carré Magique | `FORMATEUR_TERRAIN` / `AQL` | `SHIFT_LEADER`, `QUALITE` |
| Visa Qualité Final (28j) | `QUALITE` / `AQL` | `QUALITE`, `ADMIN` |
| Visa Production Final (28j) | `RESPONSABLE_PRODUCTION` | `RESPONSABLE_PRODUCTION`, `ADMIN` |
| Requalification 90 Jours | `FORMATEUR_TERRAIN` + `AQL` | `RESPONSABLE_PRODUCTION`, `QUALITE` |
| Consultation Données Sensibles | `ADMINISTRATION` (Strict) | Aucun (Verrouillage absolu RGPD/CNDP) |
