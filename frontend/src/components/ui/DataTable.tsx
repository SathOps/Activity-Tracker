import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from 'lucide-react';
import { cn, toDisplayText } from '../../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string | number;
  searchable?: boolean;
  pageSize?: number;
  className?: string;
  compact?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyFn,
  searchable = false,
  pageSize = 20,
  className,
  compact = false,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => toDisplayText(v).toLowerCase().includes(q))
    );
  }, [data, query]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = toDisplayText(av).localeCompare(
        toDisplayText(bv),
        undefined,
        {
          numeric: true,
        }
      );
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
      return;
    }
    if (sortDir === 'asc') {
      setSortDir('desc');
      return;
    }
    setSortKey(null);
    setSortDir(null);
  }

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k)
      return <ChevronsUpDown size={13} className="text-slate-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={13} className="text-brand-600" />
    ) : (
      <ChevronDown size={13} className="text-brand-600" />
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {searchable && (
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search…"
            style={{
              width: '100%',
              paddingLeft: 36,
              paddingRight: 14,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(12px)',
              fontSize: 14,
              color: 'var(--slate-800)',
              outline: 'none',
            }}
          />
        </div>
      )}

      <div
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  style={{
                    ...(col.width ? { width: col.width } : {}),
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--slate-400)',
                    padding: compact ? '10px 12px' : '12px 18px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: col.sortable ? 'none' : 'auto',
                    fontFamily: 'var(--font-display)',
                  }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon k={String(col.key)} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '40px 18px',
                    textAlign: 'center',
                    fontSize: 14,
                    color: 'var(--slate-400)',
                  }}
                >
                  No data found.
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={keyFn(row)}
                  style={{
                    background:
                      idx % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.015)',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                  }}
                >
                  {columns.map((col) => {
                    const raw = row[col.key as keyof T];
                    return (
                      <td
                        key={String(col.key)}
                        style={{
                          padding: compact ? '8px 12px' : '12px 18px',
                          fontSize: compact ? 12 : 14,
                          color: 'var(--slate-700)',
                        }}
                      >
                        {col.render
                          ? col.render(raw, row)
                          : toDisplayText(raw || '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--slate-400)',
          }}
        >
          <span>
            {sorted.length} row{sorted.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: '1px solid var(--slate-200)',
                background: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 500,
                cursor: page === 1 ? 'default' : 'pointer',
                opacity: page === 1 ? 0.3 : 1,
                color: 'var(--slate-600)',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: '1px solid var(--slate-200)',
                background: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 500,
                cursor: page === totalPages ? 'default' : 'pointer',
                opacity: page === totalPages ? 0.3 : 1,
                color: 'var(--slate-600)',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
