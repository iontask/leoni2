import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  Zap,
  Users,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AttendanceStatus,
  Language,
  Recruit,
  SchoolAttendanceRecord,
  SchoolGroup,
  UserProfile
} from '../../../types';
import { TRANSLATIONS } from '../../../i18n/translations';
import { RecruitStatusBadge } from '../../common/RecruitStatusBadge';

interface SchoolAttendanceTabProps {
  currentGroup: SchoolGroup;
  recruits: Recruit[];
  attendanceRecords: SchoolAttendanceRecord[];
  currentUser: UserProfile;
  lang: Language;
  onRecordAttendance: (records: SchoolAttendanceRecord[]) => Promise<void>;
  onMarkAllPresent: (groupId: string, dayIndex: number) => Promise<void>;
  onSelectRecruit: (recruit: Recruit) => void;
}

export const SchoolAttendanceTab: React.FC<SchoolAttendanceTabProps> = ({
  currentGroup,
  recruits,
  attendanceRecords,
  currentUser,
  lang,
  onRecordAttendance,
  onMarkAllPresent,
  onSelectRecruit
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeModalRecruit, setActiveModalRecruit] = useState<Recruit | null>(null);
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('RETARD');
  const [retardMinutes, setRetardMinutes] = useState<number>(15);
  const [motifAbsence, setMotifAbsence] = useState<string>('Transport navette retardé');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const canEdit = ['FORMATEUR_ECOLE', 'REFERENT_LEARNING', 'ADMIN'].includes(currentUser.role);
  const totalDays = currentGroup.dureeJoursEcole || 5;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Filtrer les présences du jour sélectionné
  const dayRecordsMap = new Map<string, SchoolAttendanceRecord>();
  attendanceRecords
    .filter((r) => r.jourIndex === selectedDay)
    .forEach((r) => dayRecordsMap.set(r.recrueId, r));

  // Statistiques du jour
  const countPresent = recruits.filter((r) => dayRecordsMap.get(r.id)?.statut === 'PRESENT').length;
  const countRetard = recruits.filter((r) => dayRecordsMap.get(r.id)?.statut === 'RETARD').length;
  const countAbsent = recruits.filter((r) => dayRecordsMap.get(r.id)?.statut === 'ABSENT').length;
  const countAbandon = recruits.filter((r) => dayRecordsMap.get(r.id)?.statut === 'ABANDON').length;
  const totalAssidus = countPresent + countRetard;
  const tauxAssiduite = recruits.length > 0 ? Math.round((totalAssidus / recruits.length) * 100) : 0;

  // 1-Tap Toggle Rapide : si non pointé -> PRESENT. Si déjà PRESENT -> ouvre modal d'ajustement
  const handleFastTap = async (recruit: Recruit) => {
    if (!canEdit) return;
    const existing = dayRecordsMap.get(recruit.id);

    if (!existing || existing.statut !== 'PRESENT') {
      // 1 seul geste : pointer présent instantanément
      const newRec: SchoolAttendanceRecord = {
        recrueId: recruit.id,
        jourIndex: selectedDay,
        statut: 'PRESENT',
        horodatage: new Date().toISOString(),
        pointeParMatricule: currentUser.matricule
      };
      await onRecordAttendance([newRec]);
      setFeedbackMsg(`${recruit.prenom} pointé(e) PRÉSENT(E) (J${selectedDay})`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } else {
      // Second geste : ouvrir modal de modification (retard, absence, abandon)
      setActiveModalRecruit(recruit);
      setModalStatus('RETARD');
    }
  };

  const handleApplyModal = async () => {
    if (!activeModalRecruit || !canEdit) return;
    setIsSubmitting(true);
    try {
      const record: SchoolAttendanceRecord = {
        recrueId: activeModalRecruit.id,
        jourIndex: selectedDay,
        statut: modalStatus,
        retardMinutes: modalStatus === 'RETARD' ? retardMinutes : undefined,
        motifAbsence: modalStatus !== 'PRESENT' ? motifAbsence : undefined,
        horodatage: new Date().toISOString(),
        pointeParMatricule: currentUser.matricule
      };
      await onRecordAttendance([record]);
      setActiveModalRecruit(null);
      setFeedbackMsg(`Pointage enregistré pour ${activeModalRecruit.prenom} (${modalStatus})`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAllPresentClick = async () => {
    if (!canEdit) return;
    setIsSubmitting(true);
    try {
      await onMarkAllPresent(currentGroup.id, selectedDay);
      setFeedbackMsg(`Succès : ${recruits.length} recrues pointées PRÉSENTES en 1 clic pour Jour ${selectedDay} !`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Barre d'action supérieure tactile : Sélecteur de Jour + Bouton Géant Tous Présents */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sélecteur de jour d'école */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            {lang === 'ar' ? 'اليوم التكويني :' : 'Jour de formation :'}
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {daysArray.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`min-h-[48px] min-w-[54px] px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  selectedDay === day
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>J{day}</span>
                <span className="text-[10px] font-normal opacity-90">
                  {day === 1 ? '5S/Init' : day === 2 ? 'Normes' : day === 3 ? 'Sertis.' : day === 4 ? 'Connect.' : 'Test Fin'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton Géant Tous Présents (< 30 secondes pour 20 recrues) */}
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              type="button"
              disabled={isSubmitting || recruits.length === 0}
              onClick={handleAllPresentClick}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              <Zap className="w-5 h-5 text-emerald-200" />
              <span>{t.allPresentButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* Message de feedback instantané */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Cartouche récapitulatif d'assiduité du jour */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase">
              {t.markPresent}
            </div>
            <div className="text-lg font-black text-emerald-950 font-mono">
              {countPresent} / {recruits.length}
            </div>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase">
              {t.markLate}
            </div>
            <div className="text-lg font-black text-amber-950 font-mono">
              {countRetard}
            </div>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase">
              {t.markAbsent}
            </div>
            <div className="text-lg font-black text-rose-950 font-mono">
              {countAbsent}
            </div>
          </div>
        </div>

        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-sky-800 uppercase">
              {t.attendanceRate}
            </div>
            <div className="text-lg font-black text-sky-950 font-mono">
              {tauxAssiduite}%
            </div>
          </div>
        </div>
      </div>

      {/* Grille tactile de pointage des recrues */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            {lang === 'ar'
              ? `لائحة المستفيدين للفوج (${recruits.length}) - اليوم ${selectedDay}`
              : `Pointage des recrues du groupe (${recruits.length}) - Jour ${selectedDay}`}
          </span>
          <span className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? 'ضغطة واحدة = حاضر | ضغطة ثانية = تسجيل تأخر أو غياب'
              : '1 tap = Présent | 2ème geste = Retard / Absence'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recruits.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucune recrue dans ce groupe.
            </div>
          ) : (
            recruits.map((recruit) => {
              const record = dayRecordsMap.get(recruit.id);
              const status: AttendanceStatus = record?.statut || 'ABSENT';
              const isRecorded = !!record;

              return (
                <div
                  key={recruit.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  {/* Recrue & Métadonnées */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 font-mono">
                      {recruit.prenom[0]}{recruit.nom[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {recruit.nom} {recruit.prenom}
                        </span>
                        <RecruitStatusBadge status={recruit.statut} size="sm" lang={lang} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                        <span>CIN: {recruit.cin}</span>
                        <span>•</span>
                        <span>Matr: {recruit.matricule || 'En attente SAP'}</span>
                        <span>•</span>
                        <span className="text-blue-700 font-semibold">
                          Jours validés: {recruit.ecoleJoursValides || 0}/{totalDays}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action tactiles >= 48px */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Bouton rapide d'état */}
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleFastTap(recruit)}
                      className={`min-h-[48px] min-w-[140px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !isRecorded
                          ? 'bg-slate-100 text-slate-500 border border-dashed border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                          : status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : status === 'RETARD'
                          ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                          : status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                          : 'bg-slate-800 text-white'
                      }`}
                      title="1 tap = Présent, tap à nouveau pour ajuster"
                    >
                      {status === 'PRESENT' && <CheckCircle2 className="w-4 h-4" />}
                      {status === 'RETARD' && <Clock className="w-4 h-4" />}
                      {status === 'ABSENT' && <UserX className="w-4 h-4" />}
                      {status === 'ABANDON' && <AlertTriangle className="w-4 h-4" />}

                      <span>
                        {!isRecorded
                          ? 'À pointer'
                          : status === 'PRESENT'
                          ? t.markPresent
                          : status === 'RETARD'
                          ? `Retard (${record.retardMinutes || 15}m)`
                          : status === 'ABSENT'
                          ? t.markAbsent
                          : t.markDropout}
                      </span>
                    </button>

                    {/* Bouton pour forcer un autre état (retard, absent, abandon) */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalRecruit(recruit);
                          setModalStatus(record?.statut || 'RETARD');
                        }}
                        className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Détails du pointage (retard, absence)"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}

                    {/* Consulter la fiche recrue */}
                    <button
                      type="button"
                      onClick={() => onSelectRecruit(recruit)}
                      className="min-h-[48px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                      <span className="hidden sm:inline">Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal tactile d'ajustement du pointage (Retard, Absence, Abandon) */}
      {activeModalRecruit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {lang === 'ar' ? 'تعديل نقطة الحضور' : 'Ajustement du pointage'} : J{selectedDay}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModalRecruit.nom} {activeModalRecruit.prenom} (CIN: {activeModalRecruit.cin})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRecruit(null)}
                className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Choix du statut */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Statut
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PRESENT', 'RETARD', 'ABSENT', 'ABANDON'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        modalStatus === st
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'PRESENT' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {st === 'RETARD' && <Clock className="w-4 h-4 text-amber-500" />}
                      {st === 'ABSENT' && <UserX className="w-4 h-4 text-rose-600" />}
                      {st === 'ABANDON' && <AlertTriangle className="w-4 h-4 text-slate-800" />}
                      <span>
                        {st === 'PRESENT'
                          ? t.markPresent
                          : st === 'RETARD'
                          ? t.markLate
                          : st === 'ABSENT'
                          ? t.markAbsent
                          : t.markDropout}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Si Retard : Minutes de retard */}
              {modalStatus === 'RETARD' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    {t.lateMinutes}
                  </label>
                  <div className="flex gap-2">
                    {[10, 15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setRetardMinutes(mins)}
                        className={`min-h-[44px] flex-1 rounded-lg border text-xs font-bold cursor-pointer ${
                          retardMinutes === mins
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Si Absent ou Retard : Motif */}
              {modalStatus !== 'PRESENT' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    {t.absenceReason}
                  </label>
                  <select
                    value={motifAbsence}
                    onChange={(e) => setMotifAbsence(e.target.value)}
                    className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                  >
                    <option value="Transport navette retardé">Transport / Navette usine en retard</option>
                    <option value="Certificat médical d’indisposition">Maladie / Certificat médical</option>
                    <option value="Démarche administrative officielle">Démarche administrative (CNI/Casier)</option>
                    <option value="Urgence familiale">Urgence familiale justifiée</option>
                    <option value="Absence non justifiée">Absence non justifiée</option>
                  </select>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModalRecruit(null)}
                className="min-h-[48px] px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApplyModal}
                className="min-h-[48px] px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
