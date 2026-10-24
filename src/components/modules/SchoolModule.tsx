/**
 * LEONI QualiTrack - Module 2 : École de Formation (5 Jours)
 * Phase 1 / Étape 3 :
 * 1. Calendrier du groupe & Formateur identifié (durée école paramétrable)
 * 2. Pointage rapide (1 tap = présent, 2ème geste = retard/absence, bouton Tous présents < 30s)
 * 3. Supports de formation classés par thème & J1..J5 avec suivi de consultation
 * 4. Banque de questions (tous types dont logique) et générateur de tests (< 5 min)
 * 5. Passation 3 modes (tablette 1 question/écran, version papier imprimable OMR, saisie rapide formateur)
 * 6. Fin d'école : note école et décision (Admis, À revoir, Non admis) avec transfert auto vers affectation
 * 7. Fiche contact groupe, modèles SMS / WhatsApp et export des numéros
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  HelpCircle,
  FileCheck,
  Phone,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  Language,
  Question,
  Recruit,
  SchoolAttendanceRecord,
  SchoolFinalDecision,
  SchoolGroup,
  SchoolTest,
  SystemParameter,
  TestAttempt,
  TrainingContent,
  UserProfile
} from '../../types';
import { TRANSLATIONS, formatDateDisplay } from '../../i18n/translations';
import { repositoryInstance } from '../../repositories/storageRepository';
import { SchoolAttendanceTab } from './school/SchoolAttendanceTab';
import { SchoolSupportsTab } from './school/SchoolSupportsTab';
import { SchoolQuestionsAndTestsTab } from './school/SchoolQuestionsAndTestsTab';
import { SchoolPassationTab } from './school/SchoolPassationTab';
import { SchoolDecisionTab } from './school/SchoolDecisionTab';

interface SchoolModuleProps {
  recruits: Recruit[];
  groups: SchoolGroup[];
  trainers: UserProfile[];
  currentUser: UserProfile;
  parameters: SystemParameter[];
  lang: Language;
  onValidateSchoolDay: (recruitId: string, dayNumber: number) => Promise<void>;
  onValidateSchoolFinal: (recruitId: string) => Promise<void>;
  onSelectRecruit: (recruit: Recruit) => void;
  onRefreshParent?: () => Promise<void>;
}

type SchoolTab = 'ATTENDANCE' | 'SUPPORTS' | 'QUESTIONS' | 'PASSATION' | 'DECISION';

export const SchoolModule: React.FC<SchoolModuleProps> = ({
  recruits,
  groups,
  trainers,
  currentUser,
  parameters,
  lang,
  onValidateSchoolDay,
  onValidateSchoolFinal,
  onSelectRecruit,
  onRefreshParent
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[1]?.id || groups[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<SchoolTab>('ATTENDANCE');

  // Données locales École
  const [attendanceRecords, setAttendanceRecords] = useState<SchoolAttendanceRecord[]>([]);
  const [trainingContents, setTrainingContents] = useState<TrainingContent[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [schoolTests, setSchoolTests] = useState<SchoolTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Charger les données de l'école
  const loadSchoolData = async () => {
    try {
      setIsLoading(true);
      const [att, cnt, qst, tst, attempts] = await Promise.all([
        repositoryInstance.getAttendance(selectedGroupId),
        repositoryInstance.getTrainingContents(),
        repositoryInstance.getAllQuestions(),
        repositoryInstance.getAllTests(),
        repositoryInstance.getTestAttempts()
      ]);
      setAttendanceRecords(att);
      setTrainingContents(cnt);
      setQuestions(qst);
      setSchoolTests(tst);
      setTestAttempts(attempts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolData();
  }, [selectedGroupId]);

  // Filtrer les recrues du groupe sélectionné
  const groupRecruits = recruits.filter((r) => r.groupeEcoleId === selectedGroupId);
  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const trainer = trainers.find((tr) => tr.id === currentGroup?.formateurId);

  // --- Handlers Tab 1: Pointage ---
  const handleRecordAttendance = async (records: SchoolAttendanceRecord[]) => {
    await repositoryInstance.recordAttendance(records, currentUser);
    await loadSchoolData();
    if (onRefreshParent) await onRefreshParent();
  };

  const handleMarkAllPresent = async (groupId: string, dayIndex: number) => {
    await repositoryInstance.markAllPresent(groupId, dayIndex, currentUser);
    await loadSchoolData();
    if (onRefreshParent) await onRefreshParent();
  };

  // --- Handlers Tab 2: Supports ---
  const handleMarkConsulted = async (contentId: string, recruitId: string) => {
    await repositoryInstance.markContentConsulted(contentId, recruitId);
    await loadSchoolData();
  };

  // --- Handlers Tab 3: Questions & Tests ---
  const handleCreateQuestion = async (qData: Omit<Question, 'id'>) => {
    const created = await repositoryInstance.createQuestion(qData, currentUser);
    await loadSchoolData();
    return created;
  };

  const handleCreateTest = async (tData: Omit<SchoolTest, 'id'>) => {
    const created = await repositoryInstance.createTest(tData, currentUser);
    await loadSchoolData();
    return created;
  };

  // --- Handlers Tab 4: Passation ---
  const handleSubmitAttempt = async (attemptData: Omit<TestAttempt, 'id' | 'datePassage'>) => {
    const created = await repositoryInstance.submitTestAttempt(attemptData, currentUser);
    await loadSchoolData();
    if (onRefreshParent) await onRefreshParent();
    return created;
  };

  // --- Handlers Tab 5: Décision & Transfert ---
  const handleFinalizeDecision = async (
    recrueId: string,
    decision: SchoolFinalDecision,
    noteTheorie: number,
    notePratique: number,
    observations?: string
  ) => {
    await repositoryInstance.finalizeSchoolDecision(
      recrueId,
      decision,
      noteTheorie,
      notePratique,
      currentUser,
      observations
    );
    await loadSchoolData();
    if (onRefreshParent) await onRefreshParent();
  };

  return (
    <div className="space-y-6">
      {/* En-tête du module avec sélecteur de session */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-blue-700" />
            {t.navEcole}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cursus initial obligatoire de {currentGroup?.dureeJoursEcole || 5} jours : sécurité 5S, normes DIN, technologie de sertissage et encliquetage.
          </p>
        </div>

        {/* Sélecteur de groupe d'école */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Session :
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {groups.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroupId(grp.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGroupId === grp.id
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {grp.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cartouche d'informations de la session active */}
      {currentGroup && (
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-sky-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentGroup.code.slice(-1)}
            </div>
            <div>
              <h2 className="font-extrabold text-base text-sky-950">
                Session {currentGroup.code} • LEONI Bouskoura
              </h2>
              <p className="text-xs text-sky-800">
                Formateur École :{' '}
                <strong className="font-semibold">
                  {trainer ? `${trainer.prenom} ${trainer.nom}` : 'Hassan Berrada (L-TRN-201)'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-lg border border-sky-200">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>
                Début : <strong>{formatDateDisplay(currentGroup.dateDebut)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-lg border border-sky-200">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>
                Cursus : <strong>{currentGroup.dureeJoursEcole || 5} jours</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-lg border border-sky-200">
              <Users className="w-4 h-4 text-blue-700" />
              <span>
                Effectif : <strong>{groupRecruits.length} recrues</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-lg border border-sky-200">
              <span className="font-bold">Statut :</span>
              <span className="uppercase text-[11px] font-mono px-2 py-0.5 rounded-sm bg-sky-200 text-sky-900 font-bold">
                {currentGroup.statut}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'onglets de navigation interne École (5 volets) */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex-1 min-w-[140px] min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ATTENDANCE'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.tabAttendance}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUPPORTS')}
          className={`flex-1 min-w-[140px] min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'SUPPORTS'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.tabSupports}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUESTIONS')}
          className={`flex-1 min-w-[140px] min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'QUESTIONS'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t.tabQuestions}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSATION')}
          className={`flex-1 min-w-[140px] min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'PASSATION'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{t.tabPassation}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DECISION')}
          className={`flex-1 min-w-[140px] min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'DECISION'
              ? 'bg-white text-blue-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t.tabDecision}</span>
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === 'ATTENDANCE' && currentGroup && (
        <SchoolAttendanceTab
          currentGroup={currentGroup}
          recruits={groupRecruits}
          attendanceRecords={attendanceRecords}
          currentUser={currentUser}
          lang={lang}
          onRecordAttendance={handleRecordAttendance}
          onMarkAllPresent={handleMarkAllPresent}
          onSelectRecruit={onSelectRecruit}
        />
      )}

      {activeTab === 'SUPPORTS' && (
        <SchoolSupportsTab
          contents={trainingContents}
          recruits={groupRecruits}
          currentUser={currentUser}
          lang={lang}
          onMarkConsulted={handleMarkConsulted}
        />
      )}

      {activeTab === 'QUESTIONS' && (
        <SchoolQuestionsAndTestsTab
          questions={questions}
          tests={schoolTests}
          currentUser={currentUser}
          lang={lang}
          onCreateQuestion={handleCreateQuestion}
          onCreateTest={handleCreateTest}
        />
      )}

      {activeTab === 'PASSATION' && (
        <SchoolPassationTab
          tests={schoolTests}
          questions={questions}
          recruits={groupRecruits}
          attempts={testAttempts}
          currentUser={currentUser}
          lang={lang}
          onSubmitAttempt={handleSubmitAttempt}
        />
      )}

      {activeTab === 'DECISION' && currentGroup && (
        <SchoolDecisionTab
          currentGroup={currentGroup}
          recruits={groupRecruits}
          currentUser={currentUser}
          lang={lang}
          onFinalizeDecision={handleFinalizeDecision}
          onSelectRecruit={onSelectRecruit}
        />
      )}
    </div>
  );
};
