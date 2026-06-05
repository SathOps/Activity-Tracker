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
            className={cn(
              'w-full pl-9 pr-3.5 py-2.5 rounded-[14px] outline-none text-sm text-slate-800',
              'border border-white/60 bg-white/65 backdrop-blur-[12px]',
              'focus:ring-2 focus:ring-brand-500/20 transition-shadow' // Added slight focus ring for UX
            )}
          />
        </div>
      )}

      <div className="rounded-[18px] overflow-hidden bg-white/[0.72] backdrop-blur-[16px] border border-white/60 shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-indigo-500/[0.04]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    'text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400',
                    'border-b border-black/[0.04] font-[family-name:var(--font-display)]',
                    compact ? 'px-3 py-2.5' : 'px-[18px] py-3',
                    col.sortable
                      ? 'cursor-pointer select-none hover:bg-indigo-500/[0.02] transition-colors'
                      : 'cursor-default select-auto'
                  )}
                  style={col.width ? { width: col.width } : {}}
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
                  className="py-10 px-[18px] text-center text-sm text-slate-400"
                >
                  No data found.
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={keyFn(row)}
                  className={cn(
                    'transition-colors duration-150 border-b border-black/[0.03]',
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-indigo-500/[0.015]'
                  )}
                >
                  {columns.map((col) => {
                    const raw = row[col.key as keyof T];
                    return (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'text-slate-700',
                          compact
                            ? 'px-3 py-2 text-xs'
                            : 'px-[18px] py-3 text-sm'
                        )}
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
        <div className="mt-4 flex items-center justify-between text-[13px] text-slate-400">
          <span>
            {sorted.length} row{sorted.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={cn(
                'px-3.5 py-1.5 rounded-[10px] text-xs font-medium transition-all',
                'border border-slate-200 bg-white/60 text-slate-600',
                'hover:bg-white/80 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-white/60'
              )}
            >
              ← Prev
            </button>
            <span className="text-xs font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={cn(
                'px-3.5 py-1.5 rounded-[10px] text-xs font-medium transition-all',
                'border border-slate-200 bg-white/60 text-slate-600',
                'hover:bg-white/80 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-white/60'
              )}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
