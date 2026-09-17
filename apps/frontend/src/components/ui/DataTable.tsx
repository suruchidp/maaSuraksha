import { ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  loading,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const id = useId();

  if (loading) {
    return <p className="text-sm text-gray-500 py-6 text-center">{t("common.loading")}</p>;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("common.noData")}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rose-100/60 bg-white">
          {rows.map((row, i) => (
            <tr key={`${id}-${i}-${row.id}`} className="hover:bg-rose-50/60">
              {columns.map((col) => (
                <td key={`${id}-${col.key}`} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}