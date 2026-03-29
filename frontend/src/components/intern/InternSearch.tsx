import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
 * Calls GET /api/v1/users/search?query=... via the Vite proxy.
 * Includes Authorization header from logged-in user session.
 */
async function searchUsersFromCorpus(
  query: string,
  authToken: string
): Promise<Intern[]> {
  const url = `/api/v1/users/search?query=${encodeURIComponent(query)}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
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
    <div className="intern-search">
      {/* ── Add Intern Input ── */}
      <h3 className="intern-search-label">{t('interns.addIntern')}</h3>

      <div className="intern-dropdown-wrapper">
        <div className="intern-search-input-wrapper">
          <input
            id="intern-search-input"
            className="intern-search-input"
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
            <ul className="intern-dropdown" role="listbox">
              {isLoading ? (
                <li className="intern-dropdown-empty">
                  {t('interns.searching')}
                </li>
              ) : searchResults.length === 0 ? (
                <li className="intern-dropdown-empty">
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
                      role="option"
                      aria-selected={false}
                      aria-disabled={added}
                      className={`intern-dropdown-item${added ? ' disabled' : ''}`}
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
                      <div className="intern-dropdown-details">
                        <div className="intern-dropdown-title-row">
                          <span className="intern-dropdown-name">
                            {intern.name}
                          </span>
                          <span className="intern-dropdown-username">
                            {displayUsername}
                          </span>
                        </div>
                        {hasMeta ? (
                          <div className="intern-dropdown-meta">
                            {intern.email ? (
                              <span className="intern-dropdown-meta-item">
                                <span className="intern-dropdown-meta-label">
                                  {emailLabel}
                                </span>
                                <span className="intern-dropdown-meta-value">
                                  {intern.email}
                                </span>
                              </span>
                            ) : null}
                            {intern.phone ? (
                              <span className="intern-dropdown-meta-item">
                                <span className="intern-dropdown-meta-label">
                                  {phoneLabel}
                                </span>
                                <span className="intern-dropdown-meta-value">
                                  {intern.phone}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {added ? (
                        <span className="intern-dropdown-badge">
                          {t('interns.added')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button intern-dropdown-add-btn"
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
