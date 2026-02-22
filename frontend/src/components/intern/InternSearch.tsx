import React, { useState, useRef, useCallback, useEffect } from "react";

const DEBOUNCE_MS = 300;

export interface Intern {
    id: string;
    name: string;
}

/**
 * Calls GET /api/v1/users/search?query=... via the Vite proxy.
 * Auth token is injected server-side by the proxy (from .env CORPUS_TOKEN).
 */
async function searchUsersFromCorpus(query: string): Promise<Intern[]> {
    const url = `/api/v1/users/search?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
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
const InternSearch: React.FC<InternSearchProps> = ({ addedInterns, onInternsChange }) => {
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
            const results = await searchUsersFromCorpus(trimmed);
            setSearchResults(results);
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                console.error("Search failed:", err);
                setSearchResults([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

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

        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleRemoveIntern = (internId: string) => {
        const updated = internsList.filter((i) => i.id !== internId);
        if (onInternsChange) {
            onInternsChange(updated);
        } else {
            setLocalInternsList(updated);
        }
    };

    const hasQuery = searchQuery.trim().length > 0;

    return (
        <div className="intern-search">
            {/* ── Add Intern Input ── */}
            <h3 className="intern-search-label">Add Intern</h3>

            <div className="intern-dropdown-wrapper">
                <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                    <input
                        id="intern-search-input"
                        aria-label="Search intern by name"
                        type="text"
                        placeholder="Search intern by name…"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={{
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 14,
                            padding: "8px 10px",
                            width: "100%",
                        }}
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
                                                    className="secondary-button"
                                                    style={{ marginLeft: "auto", padding: "4px 10px", fontSize: 12 }}
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

            {/* ── Added Interns Section ── */}
            <h4 className="intern-search-added-header">
                Added Interns ({internsList.length})
            </h4>

            {internsList.length === 0 ? (
                <p className="intern-search-empty">No interns added yet</p>
            ) : (
                <div className="team-interns">
                    {internsList.map((intern) => (
                        <article className="intern-card" key={intern.id}>
                            <div style={{ display: "grid", gap: 4 }}>
                                <div className="intern-id">{intern.name}</div>
                                <div style={{ color: "#6b7280", fontSize: 12 }}>
                                    ID: {intern.id}
                                </div>
                            </div>
                            <div className="intern-actions">
                                <button
                                    type="button"
                                    className="ghost-button"
                                    aria-label={`Remove ${intern.name}`}
                                    title="Remove"
                                    onClick={() => handleRemoveIntern(intern.id)}
                                >
                                    ❌
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InternSearch;
