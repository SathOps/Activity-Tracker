import React, { useState, useRef, useCallback, useEffect } from "react";

const DEBOUNCE_MS = 300;

export interface Intern {
    id: string;
    name: string;
}

/**
 * Calls GET /api/v1/users/search?query=... via the Vite proxy.
 * Includes Authorization header from logged-in user session.
 */
async function searchUsersFromCorpus(query: string, authToken: string): Promise<Intern[]> {
    const url = `/api/v1/users/search?query=${encodeURIComponent(query)}`;
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
        method: "GET",
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
        .map((item: unknown) => {
            const obj = item as Record<string, unknown>;
            // API returns { username: "..." } — use username as both id and name
            const username = String(
                obj.username ?? obj.name ?? obj.full_name ?? obj.id ?? ""
            );
            if (!username) return null;
            return { id: username, name: username };
        })
        .filter((intern): intern is Intern => intern !== null && intern.id !== "");
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
const InternSearch: React.FC<InternSearchProps> = ({ authToken, addedInterns, onInternsChange }) => {
    const [searchQuery, setSearchQuery] = useState("");
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

    const handleSearch = useCallback(async (query: string) => {
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
            if ((err as Error).name !== "AbortError") {
                console.error("Search failed:", err);
                setSearchResults([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

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
            handleSearch(value);
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

        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
    };

    const hasQuery = searchQuery.trim().length > 0;

    return (
        <div className="intern-search">
            {/* ── Add Intern Input ── */}
            <h3 className="intern-search-label">Add Intern</h3>

            <div className="intern-dropdown-wrapper">
                <div className="intern-search-input-wrapper">
                    <input
                        id="intern-search-input"
                        className="intern-search-input"
                        aria-label="Search intern by name"
                        type="text"
                        placeholder="Search intern by name…"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />

                    {/* ── Search Results Dropdown ── */}
                    {showDropdown && hasQuery ? (
                        <ul className="intern-dropdown" role="listbox">
                            {isLoading ? (
                                <li className="intern-dropdown-empty">Searching…</li>
                            ) : searchResults.length === 0 ? (
                                <li className="intern-dropdown-empty">No interns found</li>
                            ) : (
                                searchResults.map((intern) => {
                                    const added = isAlreadyAdded(intern.id);
                                    return (
                                        <li
                                            key={intern.id}
                                            role="option"
                                            aria-selected={false}
                                            aria-disabled={added}
                                            className={`intern-dropdown-item${added ? " disabled" : ""}`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                if (!added) {
                                                    handleAddIntern(intern);
                                                }
                                            }}
                                        >
                                            <span className="intern-dropdown-name">{intern.name}</span>
                                            <span className="intern-dropdown-id">{intern.id}</span>
                                            {added ? (
                                                <span className="intern-dropdown-badge">Added</span>
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
                                                    Add
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
