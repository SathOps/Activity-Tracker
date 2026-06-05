import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InternSearch, { Intern } from '../intern/InternSearch';

export interface InternsDashboardProps {
  addedInterns: Intern[];
  authToken: string;
  onInternsChange: (interns: Intern[]) => void;
  onRemoveIntern: (internId: string) => void;
  canManageInterns?: boolean;
}

const InternsDashboard: React.FC<InternsDashboardProps> = ({
  addedInterns,
  authToken,
  onInternsChange,
  onRemoveIntern,
  canManageInterns = true,
}) => {
  const { t } = useTranslation();
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAddForm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowAddForm(false);
    }
  };

  const normalizedQuery = listSearchQuery.trim().toLowerCase();
  const filteredInterns = normalizedQuery
    ? addedInterns.filter(
        (intern) =>
          intern.name.toLowerCase().includes(normalizedQuery) ||
          intern.id.toLowerCase().includes(normalizedQuery)
      )
    : addedInterns;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Left: Interns List ── */}
      <section className="w-full bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <header className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 m-0 tracking-tight flex items-center gap-2">
              {t('interns.title')}{' '}
              <span className="text-xs text-blue-500 font-semibold bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                ({addedInterns.length})
              </span>
            </h2>
            {canManageInterns ? (
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer border-none outline-none"
                onClick={() => setShowAddForm(true)}
              >
                + Add Intern
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic max-w-[420px] text-right">
                Intern list is visible here, but roster edits require
                admin-granted standup edit permission.
              </span>
            )}
          </div>

          <input
            type="text"
            className="w-full px-4 py-2.5 bg-white/30 dark:bg-slate-950/20 border border-slate-300/60 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 hover:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
            placeholder={t('interns.searchByNameOrIdPlaceholder')}
            aria-label={t('interns.searchListAria')}
            value={listSearchQuery}
            onChange={(e) => setListSearchQuery(e.target.value)}
          />
        </header>

        <div className="w-full">
          {addedInterns.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium py-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-500/5 dark:bg-slate-950/10">
              {t('interns.noneAddedYet')}
            </p>
          ) : filteredInterns.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium py-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-500/5 dark:bg-slate-950/10">
              {t('interns.noMatchingInterns')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredInterns.map((intern) => (
                <article
                  className="p-4 relative overflow-hidden bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 rounded-2xl backdrop-blur-xl shadow-md shadow-black/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:bg-white/60 dark:hover:bg-slate-900/55 hover:border-blue-500/35 hover:shadow-lg transition-all duration-300 flex items-center justify-between gap-3"
                  key={intern.id}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-slate-800 dark:text-slate-200 text-sm font-semibold truncate">
                      {intern.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {t('interns.idPrefix', { id: intern.id })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer border-none outline-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('interns.removeAria', { name: intern.name })}
                    title={t('interns.removeTitle')}
                    onClick={() => onRemoveIntern(intern.id)}
                    disabled={!canManageInterns}
                  >
                    ✕
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Modal Pop-up: Add Intern ── */}
      {showAddForm && canManageInterns && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('interns.addIntern')}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="w-full max-w-[520px] bg-white/45 dark:bg-slate-900/45 border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 animate-[fade-in_0.2s_ease-out]">
            <header className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 m-0">
                {t('interns.addIntern')}
              </h3>
              <button
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer border-none outline-none"
                onClick={() => setShowAddForm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="flex flex-col gap-4 pt-2">
              <InternSearch
                addedInterns={addedInterns}
                authToken={authToken}
                onInternsChange={onInternsChange}
                hideHeader
                inlineResults
              />
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 shadow-sm transition-all duration-200 cursor-pointer outline-none"
                  onClick={() => setShowAddForm(false)}
                >
                  {t('button.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternsDashboard;
