import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';

function AdminDataTable({ columns, rows, pageSize = 8, emptyMessage = 'No records match your filters.' }) {
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const first = column.sortValue ? column.sortValue(a) : a[sort.key];
      const second = column.sortValue ? column.sortValue(b) : b[sort.key];
      const comparison = typeof first === 'number' && typeof second === 'number'
        ? first - second
        : String(first ?? '').localeCompare(String(second ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [rows, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const toggleSort = (key) => {
    setPage(0);
    setSort((current) => current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  };

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-overflow">
        <table className="admin-table">
          <thead><tr>{columns.map((column) => (
            <th key={column.key} scope="col">
              {column.sortable === false || column.key === 'actions' ? column.label : (
                <button type="button" className="admin-sort-button" onClick={() => toggleSort(column.key)}>{column.label}<ChevronsUpDown size={13} /></button>
              )}
            </th>
          ))}</tr></thead>
          <tbody>{visibleRows.length ? visibleRows.map((row, index) => (
            <tr key={row.id || `${currentPage}-${index}`}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}
            </tr>
          )) : <tr><td className="admin-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
        </table>
      </div>
      <div className="admin-table-pagination">
        <span>Showing {sortedRows.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of {sortedRows.length}</span>
        <div>
          <button type="button" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button type="button" aria-label="Next page" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export default AdminDataTable;
