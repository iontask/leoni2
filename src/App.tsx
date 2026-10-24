/**
 * LEONI QualiTrack - Application Principale (Socle Industriel Étape 1)
 * Câblage automobile - LEONI Maroc
 */

import React, { useState, useEffect, useTransition } from 'react';
import {
  AuditLog,
  Language,
  Recruit,
  RecruitStatus,
  SchoolGroup,
  Site,
  StationTypology,
  SystemParameter,
  UserProfile,
  Workstation,
  PokaYokeRuleResult,
  DocumentRequirement,
  MatchingResult
} from './types';
import { repositoryInstance } from './repositories/storageRepository';
import { PaginatedResult } from './repositories/types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, AppModule } from './components/layout/Sidebar';
import { RecruitsModule } from './components/modules/RecruitsModule';
import { SchoolModule } from './components/modules/SchoolModule';
import { AssignmentModule } from './components/modules/AssignmentModule';
import { WorkstationFollowupModule } from './components/modules/WorkstationFollowupModule';
import { QualificationModule } from './components/modules/QualificationModule';
import { MetricsModule } from './components/modules/MetricsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { AuditModule } from './components/modules/AuditModule';
import { RecruitDetailModal } from './components/common/RecruitDetailModal';
import { PokaYokeModal } from './components/common/PokaYokeModal';
import { MassImportModal } from './components/common/MassImportModal';
import { TabletRecruitForm } from './components/common/TabletRecruitForm';
import { MatchingReviewModal } from './components/common/MatchingReviewModal';
import { SAPLiaisonModal } from './components/common/SAPLiaisonModal';
import { PokaYokeEngine } from './engine/pokaYoke';
import { TRANSLATIONS } from './i18n/translations';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [activeModule, setActiveModule] = useState<AppModule>('DOSSIERS');

  // Sites & Utilisateurs
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string>('site-bsk');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Groupes & Paramètres & Checklist administrative
  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Données recrues & Pagination
  const [paginatedRecruits, setPaginatedRecruits] = useState<PaginatedResult<Recruit>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [allRecruits, setAllRecruits] = useState<Recruit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RecruitStatus | undefined>(undefined);

  // Modales
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMassImportOpen, setIsMassImportOpen] = useState(false);
  const [isNewRecruitOpen, setIsNewRecruitOpen] = useState(false);
  const [isSAPLiaisonOpen, setIsSAPLiaisonOpen] = useState(false);
  const [matchingModalState, setMatchingModalState] = useState<{
    isOpen: boolean;
    result: MatchingResult | null;
    tentativeData: Partial<Recruit>;
  }>({
    isOpen: false,
    result: null,
    tentativeData: {}
  });

  // Poka-Yoke Modal State
  const [pokaYokeState, setPokaYokeState] = useState<{
    isOpen: boolean;
    result: PokaYokeRuleResult;
    action: string;
    targetRecruit?: Recruit;
  }>({
    isOpen: false,
    result: { autorise: true, derogationPossible: false, rolesHabilitesDerogation: [] },
    action: ''
  });

  const [isPending, startTransition] = useTransition();

  // Initialisation et chargement des repositories
  useEffect(() => {
    loadInitialData();
  }, []);

  // Synchronisation de la direction RTL/LTR
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Rechargement des recrues lorsque la pagination, la recherche, le site ou le statut change
  useEffect(() => {
    loadRecruits();
  }, [currentPage, pageSize, searchQuery, selectedStatus, currentSiteId]);

  const loadInitialData = async () => {
    const allSites = await repositoryInstance.getAllSites();
    setSites(allSites);

    const allUsers = await repositoryInstance.getAllUsers();
    setUsers(allUsers);
    if (allUsers.length > 0 && !currentUser) {
      setCurrentUser(allUsers[0]); // Par défaut : Samira Alami (ADMINISTRATION)
    }

    const allGroups = await repositoryInstance.getAllGroups();
    setGroups(allGroups);

    const allParams = await repositoryInstance.getAllParameters();
    setParameters(allParams);

    const allReqs = await repositoryInstance.getDocumentRequirements(currentSiteId);
    setRequirements(allReqs);

    const allLogs = await repositoryInstance.getAllAuditLogs();
    setAuditLogs(allLogs);
  };

  const loadRecruits = async () => {
    try {
      const [paginated, allForSite] = await Promise.all([
        repositoryInstance.getAll({
          page: currentPage,
          pageSize,
          search: searchQuery,
          siteId: currentSiteId,
          statut: selectedStatus
        }),
        repositoryInstance.getAll({
          page: 1,
          pageSize: 50000,
          siteId: currentSiteId
        })
      ]);
      setPaginatedRecruits(paginated);
      setAllRecruits(allForSite.data);
    } catch (err) {
      console.error('[LEONI-UI] Erreur lors du chargement des recrues:', err);
    }
  };

  const refreshAll = async () => {
    try {
      const [updatedParams, updatedLogs, updatedGroups, updatedReqs] = await Promise.all([
        repositoryInstance.getAllParameters(),
        repositoryInstance.getAllAuditLogs(),
        repositoryInstance.getAllGroups(),
        repositoryInstance.getDocumentRequirements(currentSiteId)
      ]);
      setParameters(updatedParams);
      setAuditLogs(updatedLogs);
      setGroups(updatedGroups);
      setRequirements(updatedReqs);
      await loadRecruits();
    } catch (err) {
      console.error('[LEONI-UI] Erreur lors de l\'actualisation des données:', err);
    }
  };

  // Handlers Étape 2 : Réconciliation SAP
  const handleReconcileSAPBatch = async (items: Array<{ cin: string; matricule: string }>) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    let successCount = 0;
    const errors: string[] = [];
    for (const item of items) {
      try {
        await repositoryInstance.reconcileRecruitWithSAP(item.cin, item.matricule, currentUser);
        successCount++;
      } catch (e: unknown) {
        errors.push(`CIN ${item.cin}: ${e instanceof Error ? e.message : 'Erreur'}`);
      }
    }
    await refreshAll();
    return { successCount, errors };
  };

  // Handlers Étape 2 : Validation Rapprochement Matching
  const handleConfirmMatchingRapprochement = async (
    rule: 'CONSERVER_HISTORIQUE_ET_NOUVEAU_MATRICULE' | 'REPRISE_MATRICULE_EXISTANT',
    previousRecruit: Recruit
  ) => {
    if (!currentUser) return;
    const generatedMatricule =
      rule === 'REPRISE_MATRICULE_EXISTANT' && previousRecruit.matricule
        ? previousRecruit.matricule
        : `LEO-26-${Math.floor(6000 + Math.random() * 3000)}`;

    await repositoryInstance.createRecruit(
      {
        cin: previousRecruit.cin,
        matricule: generatedMatricule,
        statutLiaisonSAP: 'RECONCILIE',
        nom: previousRecruit.nom,
        prenom: previousRecruit.prenom,
        dateNaissance: previousRecruit.dateNaissance,
        telephone: previousRecruit.telephone,
        siteId: currentSiteId,
        dateEntree: new Date().toISOString().split('T')[0],
        statut: 'EN_ECOLE',
        groupeEcoleId: groups[0]?.id,
        segmentPrevisionnel: 'Faisceau Habitacle',
        ecoleJoursValides: previousRecruit.ecoleJoursValides || 0,
        ecoleValidee: previousRecruit.ecoleValidee || false,
        testPratiqueValide: previousRecruit.testPratiqueValide || false,
        joursSuiviCompletes: 0,
        carreMagiquePointsConformes: 0,
        qualifiee: false,
        visaQualite: false,
        visaProduction: false,
        aHistoriqueAutreSite: true,
        siteOriginePrecedent: previousRecruit.siteId,
        matriculeOriginePrecedent: previousRecruit.matricule,
        rapprochementValideParUtilisateur: true,
        dateRapprochement: new Date().toISOString()
      },
      currentUser
    );

    setMatchingModalState({ isOpen: false, result: null, tentativeData: {} });
    setIsNewRecruitOpen(false);
    await refreshAll();
  };

  // Handler Étape 2 : Dépôt de document
  const handleUploadDocument = async (recruitId: string, reqCode: string, fileName: string) => {
    if (!currentUser) return;
    await repositoryInstance.attachDocumentToRecruit(
      recruitId,
      {
        id: `doc-${Date.now()}`,
        codeRequirement: reqCode,
        nomFichier: fileName,
        typeMime: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        tailleKo: 350,
        dateDepot: new Date().toISOString(),
        deposeParMatricule: currentUser.matricule
      },
      currentUser
    );
    await refreshAll();
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'fr' ? 'ar' : 'fr'));
  };

  const handleResetDemo = () => {
    if (window.confirm('Réinitialiser toutes les données de démo au standard usine LEONI ?')) {
      repositoryInstance.resetToDemoData();
      refreshAll();
    }
  };

  // Traitement Poka-Yoke & Dérogation
  const triggerPokaYoke = (action: string, recruit: Recruit, ws?: Workstation) => {
    if (!currentUser) return;
    const check = PokaYokeEngine.evaluate(action as any, {
      recruit,
      currentUser,
      parameters,
      workstation: ws
    });

    setPokaYokeState({
      isOpen: true,
      result: check,
      action,
      targetRecruit: recruit
    });
  };

  const handleConfirmDerogation = async (reason: string) => {
    if (!currentUser || !pokaYokeState.targetRecruit) return;
    const rec = pokaYokeState.targetRecruit;

    if (
      pokaYokeState.action === 'AFFECTATION_POSTE' ||
      pokaYokeState.action === 'AFFECTATION_POSTE_CRITIQUE'
    ) {
      await repositoryInstance.update(
        rec.id,
        {
          statut: 'EN_APPRENTISSAGE_POSTE',
          typologiePoste: 'PLANCHE_ASSEMBLAGE',
          ligneAffectation: 'Ligne 1 (Dérogation)',
          segmentAffectation: 'Habitacle',
          joursSuiviCompletes: 1,
          testPratiqueValide: true
        },
        currentUser,
        reason,
        true
      );
    } else if (
      pokaYokeState.action === 'VISA_QUALIFICATION_QUALITE' ||
      pokaYokeState.action === 'VISA_QUALIFICATION_PRODUCTION' ||
      pokaYokeState.action === 'VALIDATION_FINALE_QUALIFICATION'
    ) {
      await repositoryInstance.update(
        rec.id,
        {
          statut: 'QUALIFIE_AUTONOME',
          qualifiee: true,
          visaQualite: true,
          visaQualitePar: `${currentUser.prenom} ${currentUser.nom}`,
          visaProduction: true,
          visaProductionPar: `${currentUser.prenom} ${currentUser.nom}`
        },
        currentUser,
        reason,
        true
      );
    }

    setPokaYokeState((prev) => ({ ...prev, isOpen: false }));
    await refreshAll();
  };

  // Actions École
  const handleValidateSchoolDay = async (recruitId: string, dayNumber: number) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      { ecoleJoursValides: dayNumber },
      currentUser,
      `Validation de présence et acquisition Jour ${dayNumber} École`
    );
    await refreshAll();
  };

  const handleValidateSchoolFinal = async (recruitId: string) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        ecoleValidee: true,
        ecoleJoursValides: 5,
        ecoleScoreTheorie: 16,
        ecoleScorePratique: 17
      },
      currentUser,
      'Validation officielle de fin de cycle école de câblage'
    );
    await refreshAll();
  };

  // Action Affectation
  const handleAssignStation = async (
    recruitId: string,
    typology: StationTypology,
    ligne: string,
    segment: string
  ) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        statut: 'EN_APPRENTISSAGE_POSTE',
        typologiePoste: typology,
        ligneAffectation: ligne,
        segmentAffectation: segment,
        joursSuiviCompletes: 1,
        carreMagiquePointsConformes: 12
      },
      currentUser,
      `Affectation formelle au poste ${typology} (${ligne})`
    );
    await refreshAll();
  };

  // Action Suivi au Poste
  const handleUpdateFollowupDay = async (
    recruitId: string,
    daysCount: number,
    carreMagiqueScore: number
  ) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        joursSuiviCompletes: daysCount,
        carreMagiquePointsConformes: carreMagiqueScore
      },
      currentUser,
      `Pointage tutorat poste : Jour ${daysCount}/28 et Carré Magique ${carreMagiqueScore}/16`
    );
    await refreshAll();
  };

  // Actions Qualification
  const handleSignQualityVisa = async (recruitId: string) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        visaQualite: true,
        visaQualitePar: `${currentUser.prenom} ${currentUser.nom}`,
        visaQualiteDate: new Date().toISOString()
      },
      currentUser,
      'Visa officiel Qualité apposé'
    );
    await refreshAll();
  };

  const handleSignProductionVisa = async (recruitId: string) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        visaProduction: true,
        visaProductionPar: `${currentUser.prenom} ${currentUser.nom}`,
        visaProductionDate: new Date().toISOString()
      },
      currentUser,
      'Visa officiel Fabrication / RFM apposé'
    );
    await refreshAll();
  };

  const handleFinalizeQualification = async (recruitId: string) => {
    if (!currentUser) return;
    await repositoryInstance.update(
      recruitId,
      {
        statut: 'QUALIFIE_AUTONOME',
        qualifiee: true,
        dateQualification: new Date().toISOString()
      },
      currentUser,
      'Qualification finale validée en production autonome'
    );
    await refreshAll();
  };

  // Action Paramétrage
  const handleUpdateParameter = async (
    cle: string,
    valeur: number | string | boolean,
    motif: string
  ) => {
    if (!currentUser) return;
    await repositoryInstance.updateParameter(cle, valeur, currentUser, motif);
    await refreshAll();
  };

  // Action Import en masse
  const handleMassImport = async (data: Array<Omit<Recruit, 'id'>>) => {
    if (!currentUser) throw new Error('Utilisateur non connecté.');
    const result = await repositoryInstance.massImport(data, currentUser);
    await refreshAll();
    return result;
  };

  // Action Création d'une nouvelle recrue
  const handleCreateRecruit = async (recruitData: Omit<Recruit, 'id'>) => {
    if (!currentUser) return;
    await repositoryInstance.create(recruitData, currentUser);
    await refreshAll();
  };

  const currentSite = sites.find((s) => s.id === currentSiteId) || sites[0] || null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Barre supérieure LEONI */}
      {currentUser && (
        <Navbar
          currentSite={currentSite}
          allSites={sites}
          onSelectSite={(id) => setCurrentSiteId(id)}
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={(u) => setCurrentUser(u)}
          lang={lang}
          onToggleLang={handleToggleLang}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* Corps principal : Sidebar Dynamique + Module actif */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto flex flex-col lg:flex-row">
        {currentUser && (
          <Sidebar
            currentModule={activeModule}
            onSelectModule={(m) => setActiveModule(m)}
            userRole={currentUser.role}
            lang={lang}
            recruits={allRecruits}
            auditLogs={auditLogs}
            currentSiteName={currentSite?.nom}
          />
        )}

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden">
          <ErrorBoundary moduleName={`Module ${activeModule}`}>
            {currentUser && activeModule === 'DOSSIERS' && (
            <RecruitsModule
              paginatedRecruits={paginatedRecruits}
              currentPage={currentPage}
              pageSize={pageSize}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onStatusFilterChange={(st) => {
                setSelectedStatus(st);
                setCurrentPage(1);
              }}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
              onOpenMassImport={() => setIsMassImportOpen(true)}
              onOpenNewRecruit={() => setIsNewRecruitOpen(true)}
              onOpenSAPLiaison={() => setIsSAPLiaisonOpen(true)}
              currentUser={currentUser}
              parameters={parameters}
              lang={lang}
            />
          )}

          {currentUser && activeModule === 'ECOLE' && (
            <SchoolModule
              recruits={allRecruits}
              groups={groups}
              trainers={users}
              currentUser={currentUser}
              parameters={parameters}
              lang={lang}
              onValidateSchoolDay={handleValidateSchoolDay}
              onValidateSchoolFinal={handleValidateSchoolFinal}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
              onRefreshParent={refreshAll}
            />

          )}

          {currentUser && activeModule === 'AFFECTATION' && (
            <AssignmentModule
              recruits={allRecruits}
              currentUser={currentUser}
              parameters={parameters}
              lang={lang}
              onAssignStation={handleAssignStation}
              onTriggerPokaYoke={(act, r, ws) => triggerPokaYoke(act, r, ws)}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
              onRefreshParent={refreshAll}
            />
          )}

          {currentUser && activeModule === 'SUIVI_POSTE' && (
            <WorkstationFollowupModule
              recruits={allRecruits}
              currentUser={currentUser}
              parameters={parameters}
              lang={lang}
              onUpdateFollowupDay={handleUpdateFollowupDay}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
              onRefreshParent={refreshAll}
            />
          )}

          {currentUser && activeModule === 'QUALIFICATION' && (
            <QualificationModule
              recruits={allRecruits}
              currentUser={currentUser}
              parameters={parameters}
              lang={lang}
              onSignQualityVisa={handleSignQualityVisa}
              onSignProductionVisa={handleSignProductionVisa}
              onFinalizeQualification={handleFinalizeQualification}
              onTriggerPokaYoke={(act, r) => triggerPokaYoke(act, r)}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
              onRefreshParent={refreshAll}
            />
          )}

          {currentUser && activeModule === 'INDICATEURS' && (
            <MetricsModule
              recruits={allRecruits}
              parameters={parameters}
              currentUser={currentUser}
              siteName={currentSite?.nom || 'LEONI Bouskoura'}
              lang={lang}
              onSelectRecruit={(r) => {
                setSelectedRecruit(r);
                setIsDetailOpen(true);
              }}
            />
          )}

          {currentUser && activeModule === 'PARAMETRAGE' && (
            <SettingsModule
              parameters={parameters}
              currentUser={currentUser}
              lang={lang}
              onUpdateParameter={handleUpdateParameter}
            />
          )}

          {currentUser && activeModule === 'AUDIT' && (
            <AuditModule
              logs={auditLogs}
              recruits={allRecruits}
              currentUser={currentUser}
              lang={lang}
              onRefreshParent={refreshAll}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Fiche détaillée de la recrue */}
      {currentUser && (
        <RecruitDetailModal
          recruit={selectedRecruit}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedRecruit(null);
          }}
          currentUser={currentUser}
          parameters={parameters}
          requirements={requirements}
          lang={lang}
          onOpenPokaYokeAction={(action, rec) => {
            setIsDetailOpen(false);
            triggerPokaYoke(action, rec);
          }}
          onUploadDoc={handleUploadDocument}
          onRefreshParent={refreshAll}
        />
      )}

      {/* Modal Poka-Yoke & Dérogation */}
      {currentUser && (
        <PokaYokeModal
          isOpen={pokaYokeState.isOpen}
          onClose={() => setPokaYokeState((prev) => ({ ...prev, isOpen: false }))}
          result={pokaYokeState.result}
          currentUser={currentUser}
          lang={lang}
          onConfirmDerogation={handleConfirmDerogation}
        />
      )}

      {/* Modal Import en masse (avec simulation et haute capacité) */}
      {currentUser && (
        <MassImportModal
          isOpen={isMassImportOpen}
          onClose={() => setIsMassImportOpen(false)}
          currentUser={currentUser}
          currentSiteId={currentSiteId}
          lang={lang}
          onImportComplete={handleMassImport}
        />
      )}

      {/* Saisie Tablette Rapide (< 3 min) avec checklist et OCR */}
      {currentUser && (
        <TabletRecruitForm
          isOpen={isNewRecruitOpen}
          onClose={() => setIsNewRecruitOpen(false)}
          currentSite={currentSite}
          groups={groups}
          requirements={requirements}
          currentUser={currentUser}
          parameters={parameters}
          lang={lang}
          onCreated={handleCreateRecruit}
          onTriggerMatchingModal={(result, tentativeData) => {
            setMatchingModalState({
              isOpen: true,
              result,
              tentativeData
            });
          }}
        />
      )}

      {/* Modal de Rapprochement Multisite (Matching) */}
      {currentUser && (
        <MatchingReviewModal
          isOpen={matchingModalState.isOpen}
          onClose={() => setMatchingModalState({ isOpen: false, result: null, tentativeData: {} })}
          matchingResult={matchingModalState.result}
          tentativeData={matchingModalState.tentativeData}
          currentUser={currentUser}
          lang={lang}
          onConfirmRapprochement={handleConfirmMatchingRapprochement}
        />
      )}

      {/* Modal Adaptateur Isolé SAP RH */}
      {currentUser && (
        <SAPLiaisonModal
          isOpen={isSAPLiaisonOpen}
          onClose={() => setIsSAPLiaisonOpen(false)}
          recruits={allRecruits}
          currentSite={currentSite}
          currentUser={currentUser}
          lang={lang}
          onReconcileBatch={handleReconcileSAPBatch}
        />
      )}
    </div>
  );
}
