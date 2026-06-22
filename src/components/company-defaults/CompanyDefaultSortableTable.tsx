"use client";

import React, { useCallback, useMemo, useState } from "react";
import type {
  PlatformDefaultLeaveTypeRow,
  PlatformDefaultRow,
} from "@/src/types/platformDefaults.types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";

type Row = PlatformDefaultRow | PlatformDefaultLeaveTypeRow;

function isLeaveTypeRow(row: Row): row is PlatformDefaultLeaveTypeRow {
  return "shortName" in row;
}

function sortRows<T extends { sortOrder: number; name: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

function reorderById<T extends { id: string }>(rows: T[], fromId: string, toId: string): T[] {
  const fromIdx = rows.findIndex((r) => r.id === fromId);
  const toIdx = rows.findIndex((r) => r.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return rows;
  const next = [...rows];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className="text-gray-400 dark:text-gray-500"
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

type EditForm = {
  name: string;
  description: string;
  shortName: string;
  isActive: boolean;
};

export default function CompanyDefaultSortableTable({
  title,
  rows,
  variant = "simple",
  onToggle,
  onDelete,
  onUpdate,
  onReorder,
  renderAdd,
  onError,
}: {
  title: string;
  rows: Row[];
  variant?: "simple" | "leaveType";
  onToggle: (row: Row, active: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    body: Partial<Pick<PlatformDefaultLeaveTypeRow, "name" | "shortName" | "description" | "isActive">>,
  ) => Promise<Row>;
  onReorder: (reordered: Row[]) => Promise<void>;
  renderAdd: () => React.ReactNode;
  onError?: (message: string) => void;
}) {
  const sortedRows = useMemo(() => sortRows(rows), [rows]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const [editRow, setEditRow] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    description: "",
    shortName: "",
    isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (row: Row) => {
    setEditRow(row);
    setEditForm({
      name: row.name,
      description: row.description ?? "",
      shortName: isLeaveTypeRow(row) ? row.shortName : "",
      isActive: row.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    if (!editForm.name.trim()) {
      onError?.("Name is required.");
      return;
    }
    if (variant === "leaveType" && !editForm.shortName.trim()) {
      onError?.("Short name is required.");
      return;
    }
    setSavingEdit(true);
    try {
      await onUpdate(editRow.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        ...(variant === "leaveType" ? { shortName: editForm.shortName.trim() } : {}),
        isActive: editForm.isActive,
      });
      setEditRow(null);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDrop = useCallback(
    async (targetId: string) => {
      if (!dragId || dragId === targetId || reordering) return;
      const reordered = reorderById(sortedRows, dragId, targetId);
      setDragId(null);
      setDropTargetId(null);
      setReordering(true);
      try {
        await onReorder(reordered);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Reorder failed");
      } finally {
        setReordering(false);
      }
    },
    [dragId, onError, onReorder, reordering, sortedRows],
  );

  return (
    <div>
      <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
      {renderAdd()}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-left text-theme-sm text-gray-800 dark:text-white/90">
          <thead className="bg-gray-50 text-theme-xs uppercase dark:bg-white/[0.04]">
            <tr>
              <th className="w-10 px-2 py-2" aria-label="Reorder" />
              <th className="px-3 py-2">Name</th>
              {variant === "leaveType" && <th className="px-3 py-2">Short</th>}
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isDragging = dragId === row.id;
              const isDropTarget = dropTargetId === row.id && dragId !== row.id;
              return (
                <tr
                  key={row.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragId && dragId !== row.id) setDropTargetId(row.id);
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === row.id) setDropTargetId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleDrop(row.id);
                  }}
                  className={`border-t border-gray-200 dark:border-gray-800 ${
                    isDragging ? "opacity-40" : ""
                  } ${isDropTarget ? "bg-brand-50/60 dark:bg-brand-950/20" : ""}`}
                >
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      draggable={!reordering}
                      disabled={reordering}
                      aria-label={`Drag to reorder ${row.name}`}
                      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md hover:bg-gray-100 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
                      onDragStart={(e) => {
                        setDragId(row.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", row.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropTargetId(null);
                      }}
                    >
                      <GripIcon />
                    </button>
                  </td>
                  <td className="px-3 py-2">{row.name}</td>
                  {variant === "leaveType" && isLeaveTypeRow(row) && (
                    <td className="px-3 py-2">{row.shortName}</td>
                  )}
                  <td className="max-w-xs truncate px-3 py-2 text-gray-600 dark:text-gray-400">
                    {row.description ?? ""}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      disabled={reordering}
                      onChange={(e) => onToggle(row, e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-brand-600 hover:underline dark:text-brand-400"
                        disabled={reordering}
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-error-600 dark:text-error-400"
                        disabled={reordering}
                        onClick={() => void onDelete(row.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editRow && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close edit dialog"
            onClick={() => setEditRow(null)}
          />
          <div className="relative w-[min(92vw,520px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              Edit {variant === "leaveType" ? "leave type" : "template"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                  Name
                </span>
                <input
                  className={inputClass}
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              {variant === "leaveType" && (
                <label className="block">
                  <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                    Short name
                  </span>
                  <input
                    className={inputClass}
                    value={editForm.shortName}
                    onChange={(e) => setEditForm((f) => ({ ...f, shortName: e.target.value }))}
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                  Description
                </span>
                <input
                  className={inputClass}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                disabled={savingEdit}
                className="h-9 rounded-lg border border-gray-200 px-3 text-theme-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit}
                className="h-9 rounded-lg bg-brand-500 px-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { sortRows };
