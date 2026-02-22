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

    // Use parent-controlled list when provided, otherwise use local state
    const internsList = addedInterns ?? localInternsList;

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

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
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            handleSearch(value);
        }, DEBOUNCE_MS);
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
    };

    return (
        <div className="intern-search">
            <h3>Search Interns</h3>

            <input
                id="intern-search-input"
                type="text"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={handleInputChange}
            />

            {/* ── Search Results ── */}
            <div className="intern-search-results">
                {isLoading && <p className="search-status">Searching…</p>}

                {!isLoading &&
                    searchQuery.trim().length > 0 &&
                    searchResults.length === 0 && (
                        <p className="search-status">No users found</p>
                    )}

                {!isLoading &&
                    searchResults.map((intern) => (
                        <div key={intern.id} className="intern-search-result-item">
                            <div>
                                <strong>{intern.name}</strong>
                                <span className="intern-search-result-id">
                                    {" "}{intern.id}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={isAlreadyAdded(intern.id)}
                                onClick={() => handleAddIntern(intern)}
                            >
                                {isAlreadyAdded(intern.id) ? "Added" : "Add"}
                            </button>
                        </div>
                    ))}
            </div>

            {/* ── Added Interns List ── */}
            {internsList.length > 0 && (
                <div className="intern-search-added">
                    <h4>Added Interns ({internsList.length})</h4>
                    <ul>
                        {internsList.map((intern) => (
                            <li key={intern.id}>
                                {intern.name}{" "}
                                <span className="intern-search-result-id">
                                    {intern.id}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InternSearch;
