import React from 'react';
import { useTranslation } from 'react-i18next';
import type { InternAudioMetadata } from '../../services/corpus/corpusService';
import { getAudioRecordUrl } from '../../services/corpus/corpusService';
import type { StandupSlotResult } from '../../utils/verification';
import StandupAudioPlayer from '../audio/StandupAudioPlayer';
import { useAuth } from '../../contexts/AuthContext';

export type SubmissionStatus = 'COMPLETED' | 'PENDING';

export interface InternCardProps {
  internId: string;
  internName?: string;
  todayValidCount?: number;
  slotStatuses?: StandupSlotResult[];
  standupDateLabel?: string;
  audios?: InternAudioMetadata[];
  activeAudioId?: string | null;
  onPlay?: (internId: string, audioId: string) => void;
  onPause?: () => void;
  onDeleteIntern?: (internId: string) => void;
  onUpdateIntern?: (internId: string, newName: string) => void;
  pendingApproval?: 'ADD' | 'REMOVE';
  onApprovePending?: (internId: string) => void;
  onRejectPending?: (internId: string) => void;
}

export const InternCard: React.FC<InternCardProps> = ({
  internId,
  internName,
  todayValidCount,
  slotStatuses = [],
  standupDateLabel,
  audios = [],
  activeAudioId,
  onPlay,
  onPause,
  onDeleteIntern,
  onUpdateIntern,
  pendingApproval,
  onApprovePending,
  onRejectPending,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdminOrMentor = user?.role === 'admin' || user?.role === 'mentor';
  const displayName = (internName ?? '').trim() || t('interns.unnamedIntern');
  const visibleSlotStatuses = slotStatuses.filter(
    (slot) => slot.status === 'GOOD' || slot.status === 'DELAYED'
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(displayName);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [resolvedUrls, setResolvedUrls] = React.useState<
    Record<string, string>
  >({});
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEditedName(displayName);
  }, [displayName]);

  const handleSave = () => {
    const nextName = editedName.trim();
    if (!nextName || !onUpdateIntern) {
      setIsEditing(false);
      return;
    }

    onUpdateIntern(internId, nextName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(displayName);
    setIsEditing(false);
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
    if (isExpanded && onPause) {
      onPause();
    }
  };

  const handlePlay = async (audioId: string, existingUrl?: string) => {
    // If it's a full URL, just use it
    if (
      existingUrl &&
      (existingUrl.startsWith('http') || existingUrl.startsWith('blob'))
    ) {
      onPlay?.(internId, audioId);
      return;
    }

    // Try to resolve it if it's missing or just an ID
    if (!resolvedUrls[audioId]) {
      setResolvingId(audioId);
      try {
        const url = await getAudioRecordUrl(audioId);
        if (url) {
          setResolvedUrls((prev) => ({ ...prev, [audioId]: url }));
        }
      } catch (error) {
        console.error('Failed to resolve audio URL:', error);
      } finally {
        setResolvingId(null);
      }
    }

    onPlay?.(internId, audioId);
  };

  const getSlotStatusClass = (status: StandupSlotResult['status']) => {
    switch (status) {
      case 'GOOD':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'DELAYED':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400';
      case 'MISSING':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <article className="p-5 sm:p-6 relative overflow-hidden bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 rounded-2xl backdrop-blur-xl shadow-md shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:bg-white/60 dark:hover:bg-slate-900/55 hover:border-blue-500/35 hover:shadow-lg transition-all duration-300 grid gap-4">
      <div className="flex justify-between items-start">
        <div className="grid gap-1">
          <div className="text-slate-800 dark:text-slate-100 text-sm font-semibold flex flex-wrap items-center gap-2">
            <span>{displayName}</span>
            {pendingApproval === 'ADD' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                Pending Add Approval
              </span>
            )}
            {pendingApproval === 'REMOVE' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                Pending Removal Approval
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2 flex-wrap">
              <input
                aria-label={t('interns.editInternNameFor', {
                  name: displayName,
                })}
                onChange={(event) => setEditedName(event.target.value)}
                className="px-3 py-1.5 bg-white/30 dark:bg-slate-950/20 border border-slate-300/60 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-xs min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                type="text"
                value={editedName}
              />
              <button
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer border-none outline-none"
                onClick={handleSave}
                type="button"
              >
                {t('button.save')}
              </button>
              <button
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 active:bg-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm transition-all duration-200 cursor-pointer outline-none"
                onClick={handleCancel}
                type="button"
              >
                {t('button.cancel')}
              </button>
            </div>
          ) : (
            <>
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                {t('interns.qualifiedUploads')}
                {standupDateLabel
                  ? t('interns.onDate', { date: standupDateLabel })
                  : ''}
                : {todayValidCount ?? 0}
              </div>
              {visibleSlotStatuses.length > 0 ? (
                <div className="grid gap-1.5 mt-1.5">
                  {visibleSlotStatuses.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <span className="text-slate-700 dark:text-slate-200 text-xs font-semibold min-w-[78px]">
                        {slot.label}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getSlotStatusClass(slot.status)}`}
                      >
                        {slot.status}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        {slot.windowLabel}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pendingApproval && isAdminOrMentor && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onApprovePending?.(internId)}
                className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-all border-none outline-none shadow-sm"
                type="button"
                title="Approve request"
              >
                Approve
              </button>
              <button
                onClick={() => onRejectPending?.(internId)}
                className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 cursor-pointer transition-all border-none outline-none shadow-sm"
                type="button"
                title="Reject request"
              >
                Reject
              </button>
            </div>
          )}
          {audios.length > 0 && !isEditing && (
            <button
              className={`px-3 py-1 text-[11px] font-bold rounded-full border transition-all duration-200 cursor-pointer ${
                isExpanded
                  ? 'bg-blue-500/10 border-blue-500/35 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-500/5 dark:bg-slate-950/20 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              onClick={toggleExpanded}
              type="button"
            >
              {isExpanded
                ? t('interns.hideAudios')
                : t('interns.viewAudiosCount', { count: audios.length })}
            </button>
          )}
          {onUpdateIntern ? (
            <button
              aria-label={t('interns.editAria', { name: displayName })}
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-950/20 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-all duration-250 cursor-pointer outline-none"
              title={t('button.edit')}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          ) : null}
          {onDeleteIntern ? (
            <button
              aria-label={t('interns.deleteAria', { name: displayName })}
              onClick={() => onDeleteIntern(internId)}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-950/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-650 dark:text-red-400 transition-all duration-250 cursor-pointer outline-none"
              title={t('button.delete')}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {isExpanded && (
        <section className="mt-2 p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-950/20">
          {audios.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {t('interns.noStandupAudios')}
            </div>
          ) : (
            <ul className="list-none p-0 m-0 grid gap-2">
              {audios.map((audio, index) => {
                const isPlaying = activeAudioId === audio.id;
                const audioDate = audio.uploadedAt
                  ? new Date(audio.uploadedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : t('interns.unknownDate');

                return (
                  <li
                    key={audio.id}
                    className={`flex items-center justify-between gap-2 text-xs p-2 rounded-lg border transition-all duration-200 ${
                      isPlaying
                        ? 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300'
                        : 'bg-white/45 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="grid">
                      <strong className="text-slate-800 dark:text-slate-200">
                        {t('interns.standupIndex', { index: index + 1 })}
                      </strong>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {audioDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPlaying &&
                      (resolvedUrls[audio.id] || audio.audioUrl) ? (
                        <div className="flex items-center gap-2 w-full max-w-[300px]">
                          <StandupAudioPlayer
                            audioUrl={
                              resolvedUrls[audio.id] || audio.audioUrl || ''
                            }
                            label={t('interns.standupIndex', {
                              index: index + 1,
                            })}
                            onPause={() => onPause?.()}
                          />
                          <button
                            className="px-2 py-1 h-8 flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-655 dark:text-red-400 cursor-pointer transition-colors duration-200"
                            onClick={() => onPause?.()}
                            title={t('audio.closePlayer')}
                            type="button"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-3.5 h-3.5"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : resolvingId === audio.id ? (
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">
                          {t('interns.resolving')}
                        </span>
                      ) : (
                        <button
                          disabled={!audio.audioUrl && !audio.id}
                          onClick={() => handlePlay(audio.id, audio.audioUrl)}
                          className="px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-[11px] font-bold cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none"
                          type="button"
                        >
                          {t('audio.play')}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </article>
  );
};

export default InternCard;
