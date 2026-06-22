"use client";

import React, { useCallback, useState } from "react";
import { reorderById } from "./catalogSortUtils";

export function GripIcon() {
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

export function CatalogDragHandle({
  id,
  label,
  disabled,
  onDragStart,
  onDragEnd,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      aria-label={`Drag to reorder ${label}`}
      className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md hover:bg-gray-100 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
      }}
    >
      <GripIcon />
    </button>
  );
}

export function useCatalogDragReorder<T extends { id: string }>(
  sortedRows: T[],
  onReorder: (reordered: T[]) => Promise<void>,
  onError?: (message: string) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

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

  const rowClassName = (id: string) => {
    const isDragging = dragId === id;
    const isDropTarget = dropTargetId === id && dragId !== id;
    return `${isDragging ? "opacity-40" : ""} ${
      isDropTarget ? "bg-brand-50/60 dark:bg-brand-950/20" : ""
    }`.trim();
  };

  const rowDragProps = (id: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragId && dragId !== id) setDropTargetId(id);
    },
    onDragLeave: () => {
      if (dropTargetId === id) setDropTargetId(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      void handleDrop(id);
    },
  });

  return {
    reordering,
    rowClassName,
    rowDragProps,
    dragHandleProps: (id: string, label: string) => ({
      id,
      label,
      disabled: reordering,
      onDragStart: setDragId,
      onDragEnd: () => {
        setDragId(null);
        setDropTargetId(null);
      },
    }),
  };
}
