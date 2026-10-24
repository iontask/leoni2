import React, { useState } from 'react';
import {
  Tablet,
  Printer,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Sparkles,
  Save,
  HelpCircle
} from 'lucide-react';
import {
  Language,
  Question,
  Recruit,
  SchoolTest,
  TestAttempt,
  UserProfile
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';

interface SchoolPassationTabProps {
  tests: SchoolTest[];
  questions: Question[];
  recruits: Recruit[];
  attempts: TestAttempt[];
  currentUser: UserProfile;
  lang: Language;
  onSubmitAttempt: (attempt: Omit<TestAttempt, 'id' | 'datePassage'>) => Promise<TestAttempt>;
}

type PassationMode = 'TABLETTE' | 'VERSION_PAPIER' | 'SAISIE_RAPIDE_FORMATEUR';

export const SchoolPassationTab: React.FC<SchoolPassationTabProps> = ({
  tests,
  questions,
  recruits,
  attempts,
  currentUser,
  lang,
  onSubmitAttempt
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [selectedRecruitId, setSelectedRecruitId] = useState<string>(recruits[0]?.id || '');
  const [mode, setMode] = useState<PassationMode>('TABLETTE');

  // État Mode Tablette (1 question par écran)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isTestCompleted, setIsTestCompleted] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<TestAttempt | null>(null);

  // État Mode Saisie Rapide Formateur (matrice express)
  const [quickAnswers, setQuickAnswers] = useState<Record<string, any>>({});
  const [quickShortScores, setQuickShortScores] = useState<Record<string, number>>({});
  const [quickDirectScore, setQuickDirectScore] = useState<number>(15);

  const activeTest = tests.find((t) => t.id === selectedTestId) || tests[0];
  const activeRecruit = recruits.find((r) => r.id === selectedRecruitId) || recruits[0];

  // Collecter les questions du test actif
  const allQuestionIds = activeTest
    ? activeTest.sections.flatMap((s) => s.questionIds)
    : [];
  const testQuestions = allQuestionIds
    .map((qId) => questions.find((q) => q.id === qId))
    .filter(Boolean) as Question[];

  const currentQ = testQuestions[currentQuestionIndex];

  // Calcul du score et correction automatique
  const calculateResult = (
    answersMap: Record<string, any>,
    passationMode: PassationMode
  ): Omit<TestAttempt, 'id' | 'datePassage'> => {
    let scoreObtenu = 0;
    let totalPoints = 0;

    testQuestions.forEach((q) => {
      totalPoints += q.points;
      const userAns = answersMap[q.id];

      if (q.type === 'QCM_UNIQUE' || q.type === 'ETIQUETAGE_IMAGE' || q.type === 'GRILLE_PRATIQUE_OK_NOK') {
        if (userAns === q.bonneReponseIndex) {
          scoreObtenu += q.points;
        }
      } else if (q.type === 'QCM_MULTIPLE') {
        if (Array.isArray(userAns) && Array.isArray(q.bonneReponseIndex)) {
          const sortedUser = [...userAns].sort();
          const sortedCorrect = [...q.bonneReponseIndex].sort();
          if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
            scoreObtenu += q.points;
          }
        }
      } else if (q.type === 'REPONSE_COURTE') {
        const manualScore = quickShortScores[q.id];
        if (manualScore !== undefined) {
          scoreObtenu += manualScore;
        } else if (
          typeof userAns === 'string' &&
          q.reponseTexteAttendue &&
          userAns.trim().toUpperCase() === q.reponseTexteAttendue.trim().toUpperCase()
        ) {
          scoreObtenu += q.points;
        }
      } else if (q.type === 'REMISE_EN_ORDRE') {
        // Validation simplifiée
        if (userAns === 0 || userAns === true) {
          scoreObtenu += q.points;
        }
      }
    });

    const noteSur20 = totalPoints > 0 ? Number(((scoreObtenu / totalPoints) * 20).toFixed(1)) : 0;
    const estReussi = noteSur20 >= activeTest.notePassageSur20;

    return {
      testId: activeTest.id,
      recrueId: activeRecruit.id,
      mode: passationMode,
      reponses: answersMap,
      scoreTotalObtenu: scoreObtenu,
      totalPointsPossibles: totalPoints,
      noteSur20,
      estReussi,
      dureeSecondes: 420,
      evalueParMatricule: currentUser.matricule
    };
  };

  const handleTabletAnswerSelect = (optionIndex: number) => {
    if (!currentQ) return;
    if (currentQ.type === 'QCM_MULTIPLE') {
      const existing: number[] = Array.isArray(userAnswers[currentQ.id]) ? userAnswers[currentQ.id] : [];
      let updated: number[];
      if (existing.includes(optionIndex)) {
        updated = existing.filter((idx) => idx !== optionIndex);
      } else {
        updated = [...existing, optionIndex];
      }
      setUserAnswers({ ...userAnswers, [currentQ.id]: updated });
    } else {
      setUserAnswers({ ...userAnswers, [currentQ.id]: optionIndex });
    }
  };

  const handleFinalizeTabletTest = async () => {
    const attemptData = calculateResult(userAnswers, 'TABLETTE');
    const result = await onSubmitAttempt(attemptData);
    setLastSubmissionResult(result);
    setIsTestCompleted(true);
  };

  const handleQuickGradingSubmit = async () => {
    const attemptData = calculateResult(quickAnswers, 'SAISIE_RAPIDE_FORMATEUR');
    // Possibilité d'overrider avec note directe si renseignée
    if (quickDirectScore !== undefined) {
      attemptData.noteSur20 = Number(quickDirectScore);
      attemptData.estReussi = attemptData.noteSur20 >= activeTest.notePassageSur20;
    }
    const result = await onSubmitAttempt(attemptData);
    setLastSubmissionResult(result);
    setIsTestCompleted(true);
  };

  const handlePrintPaper = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sélecteurs de Test, Recrue et Choix du Mode */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Évaluation active
            </label>
            <select
              value={selectedTestId}
              onChange={(e) => {
                setSelectedTestId(e.target.value);
                setCurrentQuestionIndex(0);
                setIsTestCompleted(false);
                setUserAnswers({});
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
            >
              {tests.map((tst) => (
                <option key={tst.id} value={tst.id}>
                  {tst.titreFr} (Seuil: {tst.notePassageSur20}/20)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Recrue examinée
            </label>
            <select
              value={selectedRecruitId}
              onChange={(e) => {
                setSelectedRecruitId(e.target.value);
                setIsTestCompleted(false);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
            >
              {recruits.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom} {r.prenom} (CIN: {r.cin})
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur des 3 modes de passation */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Mode de passation
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('TABLETTE');
                  setIsTestCompleted(false);
                }}
                className={`flex-1 min-h-[40px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'TABLETTE'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span>Tablette</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('VERSION_PAPIER')}
                className={`flex-1 min-h-[40px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'VERSION_PAPIER'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Papier PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('SAISIE_RAPIDE_FORMATEUR');
                  setIsTestCompleted(false);
                }}
                className={`flex-1 min-h-[40px] px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'SAISIE_RAPIDE_FORMATEUR'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Saisie Formateur</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1 : PASSATION SUR TABLETTE (1 QUESTION PAR ÉCRAN)          */}
      {/* ============================================================== */}
      {mode === 'TABLETTE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!isTestCompleted && currentQ ? (
            <div>
              {/* Entête de l'épreuve : Progression et Minuteur */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-mono">
                    Question {currentQuestionIndex + 1} / {testQuestions.length}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ({currentQ.points} point{currentQ.points > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>30:00 restant</span>
                </div>
              </div>

              {/* Barre de progression visuelle */}
              <div className="w-full bg-slate-100 h-1.5">
                <div
                  className="bg-blue-600 h-1.5 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%`
                  }}
                />
              </div>

              {/* Corps de la question */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {lang === 'ar' ? currentQ.intituleAr : currentQ.intituleFr}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Type d’épreuve : {currentQ.type}
                  </p>
                </div>

                {/* Si illustration image */}
                {currentQ.imageIllustrationUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-w-md">
                    <img
                      src={currentQ.imageIllustrationUrl}
                      alt="Illustration"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Options tactiles géantes >= 48px */}
                {currentQ.optionsFr && (
                  <div className="space-y-3">
                    {currentQ.optionsFr.map((opt, oIdx) => {
                      const isSelected =
                        currentQ.type === 'QCM_MULTIPLE'
                          ? Array.isArray(userAnswers[currentQ.id]) &&
                            userAnswers[currentQ.id].includes(oIdx)
                          : userAnswers[currentQ.id] === oIdx;

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleTabletAnswerSelect(oIdx)}
                          className={`w-full min-h-[56px] p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-2xs'
                              : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{lang === 'ar' && currentQ.optionsAr ? currentQ.optionsAr[oIdx] : opt}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Réponse courte saisie libre */}
                {currentQ.type === 'REPONSE_COURTE' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      Votre réponse écrite :
                    </label>
                    <input
                      type="text"
                      value={userAnswers[currentQ.id] || ''}
                      onChange={(e) =>
                        setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })
                      }
                      placeholder="Tapez le sigle ou la réponse exacte..."
                      className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 text-sm font-semibold uppercase font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Navigation tactile Suivant / Précédent / Valider */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="min-h-[48px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>

                {currentQuestionIndex < testQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="min-h-[48px] px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalizeTabletTest}
                    className="min-h-[48px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Award className="w-5 h-5" />
                    <span>{t.submitExam}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Écran de résultat après passation */
            <div className="p-8 text-center space-y-5">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white ${
                  lastSubmissionResult?.estReussi ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {lastSubmissionResult?.estReussi ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {lastSubmissionResult?.estReussi
                    ? 'Épreuve validée avec succès !'
                    : 'Note insuffisante au test initial'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Recrue : {activeRecruit.nom} {activeRecruit.prenom} (CIN: {activeRecruit.cin})
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto space-y-2">
                <div className="text-xs text-slate-500">Note obtenue à l'épreuve :</div>
                <div className="text-3xl font-black font-mono text-blue-700">
                  {lastSubmissionResult?.noteSur20} / 20
                </div>
                <div className="text-xs text-slate-400">
                  Seuil de passage requis : {activeTest.notePassageSur20}/20
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestCompleted(false);
                    setCurrentQuestionIndex(0);
                    setUserAnswers({});
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Recommencer le test
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2 : VERSION PAPIER IMPRIMABLE AVEC GRILLE RÉPONSES        */}
      {/* ============================================================== */}
      {mode === 'VERSION_PAPIER' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handlePrintPaper}
              className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le test & grille de réponses</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm font-sans printable-area space-y-6">
            {/* En-tête industriel LEONI Maroc */}
            <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black tracking-tight text-blue-900">
                  LEONI MAROC
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  École de Formation Initiale Câblerie Automobile
                </div>
              </div>
              <div className="text-right text-xs font-mono">
                <div>Document : <strong>LEO-ECL-TST-01</strong></div>
                <div>Durée : <strong>{activeTest.dureeGlobaleMinutes} min</strong></div>
                <div>Seuil requis : <strong>{activeTest.notePassageSur20}/20</strong></div>
              </div>
            </div>

            {/* Cartouche candidat */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-3 gap-3 text-xs font-mono">
              <div>Nom & Prénom : <strong>__________________________</strong></div>
              <div>CIN : <strong>__________________________</strong></div>
              <div>Date : <strong>____ / ____ / 2026</strong></div>
            </div>

            {/* Questions imprimées */}
            <div className="space-y-6 text-xs">
              {testQuestions.map((q, idx) => (
                <div key={q.id} className="border-b border-slate-200 pb-4 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>
                      Question {idx + 1} ({q.points} pt{q.points > 1 ? 's' : ''})
                    </span>
                    <span className="font-mono text-slate-400">[{q.theme}]</span>
                  </div>
                  <p className="text-slate-800">{q.intituleFr}</p>
                  <p className="text-slate-500 font-arabic text-[11px] text-right" dir="rtl">
                    {q.intituleAr}
                  </p>

                  {q.optionsFr && (
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      {q.optionsFr.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded border border-slate-400 flex items-center justify-center font-bold text-[10px]">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Grille de réponses détachable (Feuille OMR) */}
            <div className="border-t-2 border-dashed border-slate-400 pt-6 space-y-3">
              <div className="text-center font-bold uppercase text-xs tracking-wider text-slate-800">
                ✂ GRILLE DE RÉPONSES DÉTACHABLE - À REMETTRE AU FORMATEUR ÉCOLE
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-mono text-xs text-center">
                {testQuestions.map((_, idx) => (
                  <div key={idx} className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="font-bold text-slate-700">Q{idx + 1}</div>
                    <div className="mt-1 h-6 border-b border-slate-400 font-bold text-blue-800">
                      [ &nbsp; ]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3 : SAISIE RAPIDE FORMATEUR DES RÉPONSES PAPIER           */}
      {/* ============================================================== */}
      {mode === 'SAISIE_RAPIDE_FORMATEUR' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-700" />
                Saisie express formateur pour test papier
              </h3>
              <p className="text-xs text-slate-500">
                Pointez les réponses ou entrez directement la note globale (/20).
              </p>
            </div>

            {/* Entrée directe note globale */}
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 whitespace-nowrap">
                Note globale directe :
              </span>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={quickDirectScore}
                onChange={(e) => setQuickDirectScore(Number(e.target.value))}
                className="w-16 min-h-[38px] px-2 rounded-lg bg-white border border-blue-300 text-center font-bold font-mono text-blue-900 text-sm"
              />
              <span className="text-xs font-bold text-blue-800">/20</span>
            </div>
          </div>

          {/* Grille matrice de saisie des réponses */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-y border-slate-200 font-mono uppercase text-slate-500">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Saisie rapide réponse</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {testQuestions.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-700">Q{idx + 1}</td>
                    <td className="p-3 font-sans max-w-xs truncate">{q.intituleFr}</td>
                    <td className="p-3">
                      {q.optionsFr ? (
                        <div className="flex gap-1.5">
                          {q.optionsFr.map((_, oIdx) => (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setQuickAnswers({ ...quickAnswers, [q.id]: oIdx })}
                              className={`w-8 h-8 rounded-lg font-bold border transition-all cursor-pointer ${
                                quickAnswers[q.id] === oIdx
                                  ? 'bg-blue-700 text-white border-blue-800'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Note pt"
                          value={quickShortScores[q.id] ?? ''}
                          onChange={(e) =>
                            setQuickShortScores({
                              ...quickShortScores,
                              [q.id]: Number(e.target.value)
                            })
                          }
                          className="w-20 px-2 py-1 rounded border border-slate-300 font-mono"
                        />
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">{q.points} pt(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleQuickGradingSubmit}
              className="min-h-[48px] px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la notation formateur</span>
            </button>
          </div>
        </div>
      )}

      {/* Historique des passages de tests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Historique des tentatives & résultats certifiés
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {attempts.length} passage(s) enregistré(s)
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {attempts.map((att) => {
            const recruit = recruits.find((r) => r.id === att.recrueId);
            return (
              <div key={att.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {recruit ? `${recruit.nom} ${recruit.prenom}` : att.recrueId}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Date : {att.datePassage.slice(0, 10)} • Mode : {att.mode}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-black font-mono text-slate-900">
                    {att.noteSur20} / 20
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      att.estReussi
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {att.estReussi ? 'Admis' : 'Échec'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
