import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCorpusRuntimeBaseUrl } from '../../services/api/batches';

const DEBOUNCE_MS = 300;

export interface Intern {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
}

function readSearchField(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

/**
 * Calls Corpus through the backend session proxy.
 */
async function searchUsersFromCorpus(
  query: string,
  _authToken: string
): Promise<Intern[]> {
  const url = new URL(
    `${getCorpusRuntimeBaseUrl()}/corpus/proxy/api/v1/users/search`,
    window.location.origin
  );
  url.searchParams.set('query', query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error(`Corpus search failed (${response.status})`);
    return [];
  }

  const payload = await response.json();

  // Handle both array and { data: [...] } / { items: [...] } shapes
  const items: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

  return items
    .map((item: unknown): Intern | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const obj = item as Record<string, unknown>;
      // API returns { username: "..." } — use username as both id and name
      const profileId =
        readSearchField(obj.username) ??
        readSearchField(obj.user_id) ??
        readSearchField(obj.id) ??
        '';

      const displayName =
        readSearchField(obj.name) ??
        readSearchField(obj.full_name) ??
        readSearchField(obj.fullName) ??
        readSearchField(obj.display_name) ??
        readSearchField(obj.displayName) ??
        profileId;

      if (!profileId || !displayName) {
        return null;
      }

      const usernameValue = readSearchField(obj.username);
      const email =
        readSearchField(obj.email) ??
        readSearchField(obj.email_address) ??
        readSearchField(obj.emailAddress) ??
        '';
      const phone =
        readSearchField(obj.phone) ??
        readSearchField(obj.phone_number) ??
        readSearchField(obj.phoneNumber) ??
        readSearchField(obj.mobile) ??
        '';

      const profile: Intern = {
        id: profileId,
        name: displayName,
        username: usernameValue || profileId,
        email: email || undefined,
        phone: phone || undefined,
      };

      return profile;
    })
    .filter((intern): intern is Intern => intern !== null && intern.id !== '');
}

export interface InternSearchProps {
  authToken: string;
  /** When provided, use parent-controlled interns list instead of local state */
  addedInterns?: Intern[];
  /** Called when an intern is added; required when addedInterns is provided */
  onInternsChange?: (interns: Intern[]) => void;
  hideHeader?: boolean;
  inlineResults?: boolean;
}

/**
 * Standalone search-and-add component.
 * Searches users from real Corpus API and allows
 * adding them to a local interns list.
 */
const InternSearch: React.FC<InternSearchProps> = ({
  authToken,
  addedInterns,
  onInternsChange,
  hideHeader = false,
  inlineResults = false,
}) => {
  const { t } = useTranslation();
  const emailLabel = t('interns.email');
  const phoneLabel = t('interns.phone');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Intern[]>([]);
  const [localInternsList, setLocalInternsList] = useState<Intern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Use parent-controlled list when provided, otherwise use local state
  const internsList = addedInterns ?? localInternsList;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAlreadyAdded = useCallback(
    (internId: string) => internsList.some((i) => i.id === internId),
    [internsList]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (!trimmed) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);

      try {
        const results = await searchUsersFromCorpus(trimmed, authToken);
        setSearchResults(results);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Search failed:', err);
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [authToken]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void handleSearch(value);
    }, DEBOUNCE_MS);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setShowDropdown(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleAddIntern = (intern: Intern) => {
    if (isAlreadyAdded(intern.id)) {
      return;
    }

    const updated = [...internsList, intern];
    if (onInternsChange) {
      onInternsChange(updated);
    } else {
      setLocalInternsList(updated);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="mb-5">
      {/* ── Add Intern Input ── */}
      {!hideHeader && (
        <h3 className="text-[var(--text-main)] text-[22px] font-bold m-0 mb-[14px]">
          {t('interns.addIntern')}
        </h3>
      )}

      <div className="relative w-full">
        <div className="relative w-full">
          <input
            id="intern-search-input"
            className="w-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-[12px] text-[var(--text-main)] text-[14px] px-[12px] py-[10px] transition-[border-color,background-color,box-shadow] duration-[220ms] ease-in-out placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:shadow-[var(--focus-ring)] focus:outline-none"
            aria-label={t('interns.searchByNameAria')}
            type="text"
            placeholder={t('interns.searchByNamePlaceholder')}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* ── Search Results Dropdown ── */}
          {showDropdown && hasQuery ? (
            <ul
              className={`${
                inlineResults
                  ? 'static shadow-none mt-3 max-h-80'
                  : 'absolute top-[calc(100%+8px)] left-0 shadow-[var(--shadow-hover)] max-h-[300px]'
              } z-50 w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-xl overflow-y-auto p-2 m-0 flex flex-col gap-1 list-none`}
            >
              {isLoading ? (
                <li className="border border-dashed border-[var(--border-strong)] rounded-[12px] text-[var(--text-subtle)] text-[14px] m-0 px-[16px] py-[22px] text-center bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--surface-2)_100%)]">
                  {t('interns.searching')}
                </li>
              ) : searchResults.length === 0 ? (
                <li className="border border-dashed border-[var(--border-strong)] rounded-[12px] text-[var(--text-subtle)] text-[14px] m-0 px-[16px] py-[22px] text-center bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--surface-2)_100%)]">
                  {t('interns.noInternsFound')}
                </li>
              ) : (
                searchResults.map((intern) => {
                  const added = isAlreadyAdded(intern.id);
                  const displayUsername = `@${intern.username ?? intern.id}`;
                  const hasMeta = !!(intern.email || intern.phone);

                  return (
                    <li
                      key={intern.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors focus:outline-none ${
                        added
                          ? 'opacity-60 cursor-not-allowed hover:bg-transparent'
                          : 'cursor-pointer hover:bg-[var(--surface-1)] focus:bg-[var(--surface-1)]'
                      }`}
                      tabIndex={added ? -1 : 0}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!added) {
                          handleAddIntern(intern);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!added) {
                            handleAddIntern(intern);
                          }
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-[14px] font-semibold text-[var(--text-main)] truncate">
                            {intern.name}
                          </span>
                          <span className="text-[11px] font-medium text-[var(--text-subtle)] truncate">
                            {displayUsername}
                          </span>
                        </div>
                        {hasMeta ? (
                          <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-subtle)]">
                            {intern.email ? (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold uppercase">
                                  {emailLabel}
                                </span>
                                <span className="font-normal truncate">
                                  {intern.email}
                                </span>
                              </span>
                            ) : null}
                            {intern.phone ? (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold uppercase">
                                  {phoneLabel}
                                </span>
                                <span className="font-normal truncate">
                                  {intern.phone}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {added ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] bg-[var(--surface-2)] px-2 py-1 rounded-full ml-auto whitespace-nowrap">
                          {t('interns.added')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-[12px] ml-auto px-[10px] py-[4px] bg-[var(--surface-1)] border border-[var(--border)] rounded-[8px] text-[var(--text-main)] font-semibold transition-colors hover:bg-[var(--surface-2)] cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddIntern(intern);
                          }}
                        >
                          {t('button.add')}
                        </button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InternSearch;
