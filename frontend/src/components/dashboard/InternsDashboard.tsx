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
    <div className="interns-dashboard">
      {/* ── Left: Interns List ── */}
      <section className="interns-list-panel">
        <header className="interns-list-header">
          <div className="flex items-center justify-between">
            <h2 className="interns-list-title m-0">
              {t('interns.title')}{' '}
              <span className="interns-list-count">
                ({addedInterns.length})
              </span>
            </h2>
            {canManageInterns ? (
              <button
                type="button"
                className="btn-primary py-1.5 px-3.5 text-[13px]"
                onClick={() => setShowAddForm(true)}
              >
                + Add Intern
              </button>
            ) : (
              <span className="text-xs text-[var(--text-secondary)] italic max-w-[420px] text-right">
                Intern list is visible here, but roster edits require
                admin-granted standup edit permission.
              </span>
            )}
          </div>

          <input
            type="text"
            className="interns-list-search"
            placeholder={t('interns.searchByNameOrIdPlaceholder')}
            aria-label={t('interns.searchListAria')}
            value={listSearchQuery}
            onChange={(e) => setListSearchQuery(e.target.value)}
          />
        </header>

        <div className="interns-list-body">
          {addedInterns.length === 0 ? (
            <p className="interns-list-empty">{t('interns.noneAddedYet')}</p>
          ) : filteredInterns.length === 0 ? (
            <p className="interns-list-empty">
              {t('interns.noMatchingInterns')}
            </p>
          ) : (
            <div className="interns-list-items">
              {filteredInterns.map((intern) => (
                <article className="interns-list-card" key={intern.id}>
                  <div className="interns-list-card-info">
                    <span className="interns-list-card-name">
                      {intern.name}
                    </span>
                    <span className="interns-list-card-id">
                      {t('interns.idPrefix', { id: intern.id })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
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
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t('interns.addIntern')}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div
            className="modal-container animate-panel-fade-in"
            style={{ width: '100%', maxWidth: '520px' }}
          >
            <header className="modal-header">
              <h3 className="modal-title font-display font-bold text-lg text-[var(--text-primary)]">
                {t('interns.addIntern')}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddForm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="modal-body" style={{ padding: '20px' }}>
              <InternSearch
                addedInterns={addedInterns}
                authToken={authToken}
                onInternsChange={onInternsChange}
                hideHeader
                inlineResults
              />
              <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
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
