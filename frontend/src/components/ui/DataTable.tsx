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

  const cell = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const head = compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs';

  return (
    <div className={cn('w-full', className)}>
      {searchable && (
        <div className="relative mb-3">
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
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    head,
                    'font-semibold uppercase tracking-wide text-slate-500 text-left',
                    col.sortable &&
                      'cursor-pointer select-none hover:bg-slate-100'
                  )}
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
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-slate-400"
                >
                  No data found.
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={keyFn(row)}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col) => {
                    const raw = row[col.key as keyof T];
                    return (
                      <td
                        key={String(col.key)}
                        className={cn(cell, 'text-slate-700')}
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
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>
            {sorted.length} row{sorted.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
            >
              ← Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
