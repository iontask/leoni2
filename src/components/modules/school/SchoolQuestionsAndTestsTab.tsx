import React, { useState } from 'react';
import {
  HelpCircle,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Search,
  Filter,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Language,
  Question,
  QuestionTheme,
  QuestionType,
  SchoolTest,
  TestSection,
  UserProfile
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';

interface SchoolQuestionsAndTestsTabProps {
  questions: Question[];
  tests: SchoolTest[];
  currentUser: UserProfile;
  lang: Language;
  onCreateQuestion: (question: Omit<Question, 'id'>) => Promise<Question>;
  onCreateTest: (test: Omit<SchoolTest, 'id'>) => Promise<SchoolTest>;
}

export const SchoolQuestionsAndTestsTab: React.FC<SchoolQuestionsAndTestsTabProps> = ({
  questions,
  tests,
  currentUser,
  lang,
  onCreateQuestion,
  onCreateTest
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedTheme, setSelectedTheme] = useState<QuestionTheme | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<QuestionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewQuestionModal, setShowNewQuestionModal] = useState<boolean>(false);
  const [showNewTestModal, setShowNewTestModal] = useState<boolean>(false);

  // Formulaire nouvelle question
  const [newQTheme, setNewQTheme] = useState<QuestionTheme>('THEORIE_CABLERIE');
  const [newQType, setNewQType] = useState<QuestionType>('QCM_UNIQUE');
  const [newQTextFr, setNewQTextFr] = useState<string>('');
  const [newQTextAr, setNewQTextAr] = useState<string>('');
  const [newQPoints, setNewQPoints] = useState<number>(2);
  const [newQOptionsFr, setNewQOptionsFr] = useState<string>('Option 1\nOption 2\nOption 3');
  const [newQCorrectIdx, setNewQCorrectIdx] = useState<number>(0);
  const [newQShortAnswer, setNewQShortAnswer] = useState<string>('');
  const [newQExplanation, setNewQExplanation] = useState<string>('');

  // Formulaire nouveau test (< 5 min)
  const [testTitleFr, setTestTitleFr] = useState<string>('Contrôle de validation école - Session B');
  const [testTitleAr, setTestTitleAr] = useState<string>('اختبار تقييم المدرسة - الفوج ب');
  const [testTheme, setTestTheme] = useState<QuestionTheme>('THEORIE_CABLERIE');
  const [testPassingGrade, setTestPassingGrade] = useState<number>(14); // Défaut 14/20 "à confirmer"
  const [testDuration, setTestDuration] = useState<number>(30); // 30 min
  const [testMaxAttempts, setTestMaxAttempts] = useState<number>(2);
  const [testRandomOrder, setTestRandomOrder] = useState<boolean>(false); // Défaut désactivé "à confirmer"
  const [selectedQuestionIdsForTest, setSelectedQuestionIdsForTest] = useState<string[]>(
    questions.slice(0, 5).map((q) => q.id)
  );

  const canManage = ['FORMATEUR_ECOLE', 'REFERENT_LEARNING', 'ADMIN'].includes(currentUser.role);

  // Filtrage questions
  const filteredQuestions = questions.filter((q) => {
    const matchTheme = selectedTheme === 'ALL' || q.theme === selectedTheme;
    const matchType = selectedType === 'ALL' || q.type === selectedType;
    const matchSearch =
      searchQuery.trim() === '' ||
      q.intituleFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.intituleAr.includes(searchQuery);
    return matchTheme && matchType && matchSearch;
  });

  const getThemeLabel = (theme: QuestionTheme) => {
    switch (theme) {
      case 'THEORIE_CABLERIE':
        return 'Théorie Câblerie';
      case 'GESTE_QUALITE':
        return 'Geste Qualité';
      case 'SECURITE_5S':
        return 'Sécurité & 5S';
      case 'TEST_LOGIQUE_PRESELECTION':
        return 'Test Logique (Banque)';
    }
  };

  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTextFr) return;

    const options = newQOptionsFr
      .split('\n')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    await onCreateQuestion({
      theme: newQTheme,
      type: newQType,
      intituleFr: newQTextFr,
      intituleAr: newQTextAr || newQTextFr,
      optionsFr: options.length > 0 ? options : undefined,
      optionsAr: options.length > 0 ? options : undefined,
      bonneReponseIndex: newQType === 'QCM_UNIQUE' ? newQCorrectIdx : undefined,
      reponseTexteAttendue: newQType === 'REPONSE_COURTE' ? newQShortAnswer : undefined,
      points: Number(newQPoints),
      explicationFr: newQExplanation || undefined
    });

    setShowNewQuestionModal(false);
    setNewQTextFr('');
    setNewQTextAr('');
  };

  const handleCreateTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitleFr || selectedQuestionIdsForTest.length === 0) return;

    // Découpage automatique en 2 sections équilibrées
    const half = Math.ceil(selectedQuestionIdsForTest.length / 2);
    const sec1Ids = selectedQuestionIdsForTest.slice(0, half);
    const sec2Ids = selectedQuestionIdsForTest.slice(half);

    const sections: TestSection[] = [
      {
        id: `sec-auto-1`,
        titreFr: 'Section 1 : Principes fondamentaux & Règles sécurité',
        titreAr: 'القسم 1 : المبادئ الأساسية وقواعد السلامة',
        dureeMinutes: Math.round(testDuration / 2),
        questionIds: sec1Ids,
        seuilObligatoirePourcent: 60
      }
    ];

    if (sec2Ids.length > 0) {
      sections.push({
        id: `sec-auto-2`,
        titreFr: 'Section 2 : Gestuelle et conformité industrielle',
        titreAr: 'القسم 2 : حركات الجودة والمطابقة الصناعية',
        dureeMinutes: Math.round(testDuration / 2),
        questionIds: sec2Ids,
        seuilObligatoirePourcent: 60
      });
    }

    await onCreateTest({
      titreFr: testTitleFr,
      titreAr: testTitleAr || testTitleFr,
      theme: testTheme,
      sections,
      dureeGlobaleMinutes: Number(testDuration),
      notePassageSur20: Number(testPassingGrade),
      seuilEliminatoirePourcent: 60,
      maxTentatives: Number(testMaxAttempts),
      tirageAleatoire: testRandomOrder,
      langue: 'both'
    });

    setShowNewTestModal(false);
  };

  const toggleQuestionSelectionForTest = (qId: string) => {
    if (selectedQuestionIdsForTest.includes(qId)) {
      setSelectedQuestionIdsForTest(selectedQuestionIdsForTest.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIdsForTest([...selectedQuestionIdsForTest, qId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'action supérieure */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-700" />
            {lang === 'ar' ? 'بنك الأسئلة والمصفوفات الاختبارية' : 'Banque de questions & Évaluations standardisées'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Questions classées par thème : QCM, remise en ordre, étiquetage d’image, réponse courte et grille pratique OK/NOK.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewQuestionModal(true)}
              className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>Ajouter une question</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewTestModal(true)}
              className="min-h-[44px] px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Générateur de test (&lt; 5 min)</span>
            </button>
          </div>
        )}
      </div>

      {/* Cartouches des tests actifs existants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((tst) => (
          <div
            key={tst.id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold">
                  {getThemeLabel(tst.theme)}
                </span>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {tst.dureeGlobaleMinutes} min
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ar' ? tst.titreAr : tst.titreFr}
              </h3>
              <div className="text-xs text-slate-600 flex flex-wrap gap-3 pt-1">
                <span>
                  Sections : <strong>{tst.sections.length}</strong>
                </span>
                <span>
                  Questions :{' '}
                  <strong>
                    {tst.sections.reduce((acc, s) => acc + s.questionIds.length, 0)}
                  </strong>
                </span>
                <span>
                  Note de passage : <strong className="text-blue-700">{tst.notePassageSur20}/20</strong>
                </span>
                <span>
                  Ordre aléatoire :{' '}
                  <strong>{tst.tirageAleatoire ? 'Oui' : 'Non (Fixe formateur)'}</strong>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Max tentatives : {tst.maxTentatives}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Opérationnel
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres & Recherche de questions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question par mot-clé (DIN, sertissage, toufix, 5S)..."
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as any)}
              className="min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
            >
              <option value="ALL">Tous les thèmes</option>
              <option value="THEORIE_CABLERIE">Théorie Câblerie</option>
              <option value="GESTE_QUALITE">Geste Qualité</option>
              <option value="SECURITE_5S">Sécurité & 5S</option>
              <option value="TEST_LOGIQUE_PRESELECTION">Test Logique (Banque)</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
            >
              <option value="ALL">Tous les types de questions</option>
              <option value="QCM_UNIQUE">QCM Unique</option>
              <option value="QCM_MULTIPLE">QCM Multiple</option>
              <option value="REMISE_EN_ORDRE">Remise en ordre</option>
              <option value="ETIQUETAGE_IMAGE">Étiquetage Image</option>
              <option value="REPONSE_COURTE">Réponse courte</option>
              <option value="GRILLE_PRATIQUE_OK_NOK">Grille pratique OK/NOK</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {filteredQuestions.length} question(s) répertoriée(s) dans la banque.
        </div>
      </div>

      {/* Liste des questions de la banque */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
                  {getThemeLabel(q.theme)}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {q.type}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {q.points} point{q.points > 1 ? 's' : ''}
              </span>
            </div>

            <p className="font-bold text-sm text-slate-900 pt-1">
              {lang === 'ar' ? q.intituleAr : q.intituleFr}
            </p>

            {/* Aperçu des options ou de la bonne réponse */}
            {q.optionsFr && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                {q.optionsFr.map((opt, oIdx) => {
                  const isCorrect = Array.isArray(q.bonneReponseIndex)
                    ? q.bonneReponseIndex.includes(oIdx)
                    : q.bonneReponseIndex === oIdx;

                  return (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-slate-50/50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-mono font-bold text-[10px]">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span className="line-clamp-1">{opt}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {q.itemsOrdonnes && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 font-mono">
                {q.itemsOrdonnes.map((item, iIdx) => (
                  <div key={iIdx}>{item}</div>
                ))}
              </div>
            )}

            {q.reponseTexteAttendue && (
              <div className="text-xs text-slate-600 font-mono">
                Réponse attendue : <strong className="text-blue-700">{q.reponseTexteAttendue}</strong>
              </div>
            )}

            {q.explicationFr && (
              <div className="text-xs text-slate-500 italic pt-1 border-t border-slate-100">
                💡 Règle atelier : {q.explicationFr}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal : Générateur de test (< 5 minutes) */}
      {showNewTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Générateur d’évaluation rapide (&lt; 5 min)
                </h3>
                <p className="text-xs text-slate-500">
                  Sélectionnez les questions de la banque et paramétrez le seuil de passage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTestModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Titre du test (Français)
                </label>
                <input
                  type="text"
                  required
                  value={testTitleFr}
                  onChange={(e) => setTestTitleFr(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Note de passage (/20)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={20}
                    value={testPassingGrade}
                    onChange={(e) => setTestPassingGrade(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-bold font-mono text-blue-700"
                  />
                  <span className="text-[10px] text-slate-400">Défaut standard: 14/20</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Durée globale (minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Max tentatives
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={testMaxAttempts}
                    onChange={(e) => setTestMaxAttempts(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Option tirage aléatoire */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="randomOrderToggle"
                  checked={testRandomOrder}
                  onChange={(e) => setTestRandomOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="randomOrderToggle" className="text-xs font-semibold text-slate-700">
                  Tirage aléatoire des questions (optionnel, désactivé par défaut selon cadrage)
                </label>
              </div>

              {/* Sélection des questions dans la banque */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs">
                    Questions incluses ({selectedQuestionIdsForTest.length} sélectionnée(s)) :
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQuestionIdsForTest(
                        selectedQuestionIdsForTest.length === questions.length
                          ? []
                          : questions.map((q) => q.id)
                      )
                    }
                    className="text-blue-700 hover:underline font-semibold"
                  >
                    {selectedQuestionIdsForTest.length === questions.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {questions.map((q) => {
                    const isSelected = selectedQuestionIdsForTest.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className={`p-2.5 rounded-lg flex items-start gap-2.5 cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleQuestionSelectionForTest(q.id)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 line-clamp-1">
                            {q.intituleFr}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {getThemeLabel(q.theme)} • {q.points} pt(s)
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTestModal(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={selectedQuestionIdsForTest.length === 0}
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white font-bold cursor-pointer"
                >
                  Générer et publier le test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Ajouter une question à la banque */}
      {showNewQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Ajouter une question à la banque LEONI
              </h3>
              <button
                type="button"
                onClick={() => setShowNewQuestionModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestionSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Thème
                  </label>
                  <select
                    value={newQTheme}
                    onChange={(e) => setNewQTheme(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="THEORIE_CABLERIE">Théorie Câblerie</option>
                    <option value="GESTE_QUALITE">Geste Qualité</option>
                    <option value="SECURITE_5S">Sécurité & 5S</option>
                    <option value="TEST_LOGIQUE_PRESELECTION">Test Logique (Présélection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Type de question
                  </label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value as any)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="QCM_UNIQUE">QCM Unique</option>
                    <option value="QCM_MULTIPLE">QCM Multiple</option>
                    <option value="REPONSE_COURTE">Réponse courte</option>
                    <option value="GRILLE_PRATIQUE_OK_NOK">Grille pratique OK/NOK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Intitulé de la question (Français)
                </label>
                <textarea
                  required
                  rows={2}
                  value={newQTextFr}
                  onChange={(e) => setNewQTextFr(e.target.value)}
                  placeholder="Ex: Quelle est la fonction du verrou secondaire TPA ?"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Options de réponses (une par ligne)
                </label>
                <textarea
                  rows={3}
                  value={newQOptionsFr}
                  onChange={(e) => setNewQOptionsFr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Index bonne réponse (0 pour la 1ère)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={newQCorrectIdx}
                    onChange={(e) => setNewQCorrectIdx(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Points attribués
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newQPoints}
                    onChange={(e) => setNewQPoints(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Explication règle qualité / Poka-Yoke
                </label>
                <input
                  type="text"
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  placeholder="Justification métier LEONI..."
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewQuestionModal(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  Enregistrer la question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
