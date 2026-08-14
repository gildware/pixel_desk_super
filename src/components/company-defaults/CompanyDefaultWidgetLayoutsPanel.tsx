"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  listPlatformWidgets,
  listPlatformWidgetLayouts,
  replacePlatformWidgetLayout,
} from "@/src/services/api/platformDefaults.api";
import type {
  PlatformDefaultWidgetRow,
  PlatformDefaultWidgetLayoutRow,
  WidgetLayoutAudience,
} from "@/src/types/platformDefaults.types";
import { widgetMediaUrl, isWidgetMediaUrl } from "@/src/utils/widgetMediaUrl";
import {
  filterCatalogForAudience,
  isWidgetApplicableForAudience,
} from "@/src/utils/widgetVisibility";
import { CatalogDragHandle, GripIcon } from "@/src/components/platform-catalog/CatalogDragHandle";

const GRID_COLS = 5;
const GRID_ROWS = 3;
const GRID_GAP = 6;
const GRID_INSET = 12;

const audienceLabels: Record<WidgetLayoutAudience, string> = {
  admin: "Admin",
  member: "Member",
  client: "Client",
};

const AUDIENCES: WidgetLayoutAudience[] = ["admin", "member", "client"];

type PlacedWidget = {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function overlaps(a: PlacedWidget, b: PlacedWidget): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function canPlaceAt(
  placed: PlacedWidget[],
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  if (x < 0 || y < 0 || x + w > GRID_COLS || y + h > GRID_ROWS) return false;
  const cand: PlacedWidget = { type, x, y, w, h };
  return !placed.some((p) => p.type !== type && overlaps(p, cand));
}

function findEmptySpot(
  placed: PlacedWidget[],
  w: number,
  h: number,
): { x: number; y: number } | null {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (canPlaceAt(placed, "__new__", x, y, w, h)) return { x, y };
    }
  }
  return null;
}

function autoPackWidgets(
  types: string[],
  catalogByCode: Map<string, PlatformDefaultWidgetRow>,
): PlacedWidget[] {
  const placed: PlacedWidget[] = [];
  for (const type of types) {
    const row = catalogByCode.get(type);
    if (!row) continue;
    const w = Math.max(1, row.gridW);
    const h = Math.max(1, row.gridH);
    const spot = findEmptySpot(placed, w, h);
    if (spot) placed.push({ type, x: spot.x, y: spot.y, w, h });
  }
  return placed;
}

function itemsToPlaced(
  items: { type: string; x: number; y: number }[],
  catalogByCode: Map<string, PlatformDefaultWidgetRow>,
): PlacedWidget[] {
  return items
    .map((item) => {
      const row = catalogByCode.get(item.type);
      if (!row) return null;
      return {
        type: item.type,
        x: item.x,
        y: item.y,
        w: Math.max(1, row.gridW),
        h: Math.max(1, row.gridH),
      };
    })
    .filter((item): item is PlacedWidget => item != null);
}

function reorderPlacedByType(placed: PlacedWidget[], fromType: string, toType: string): PlacedWidget[] {
  const fromIdx = placed.findIndex((p) => p.type === fromType);
  const toIdx = placed.findIndex((p) => p.type === toType);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return placed;
  const next = [...placed];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

function coordsToId(x: number, y: number): string {
  return `cell-${x}-${y}`;
}

function idToCoords(id: string): [number, number] {
  const parts = id.split("-");
  return [Number(parts[1]), Number(parts[2])];
}

function WidgetPreviewFallback({
  label,
  gridW,
  gridH,
  compact,
}: {
  label: string;
  gridW: number;
  gridH: number;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-1.5 py-2 text-center dark:from-slate-900 dark:to-slate-800">
      <span
        className={`line-clamp-2 font-medium leading-tight text-gray-800 dark:text-gray-100 ${
          compact ? "text-[8px]" : "text-[11px] sm:text-xs"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-1 shrink-0 font-mono tracking-wide text-gray-500 dark:text-gray-400 ${
          compact ? "text-[7px]" : "text-[10px]"
        }`}
      >
        {gridW} X {gridH}
      </span>
    </div>
  );
}

function WidgetPreviewImage({
  row,
  compact,
}: {
  row: PlatformDefaultWidgetRow;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = isWidgetMediaUrl(row.previewImage) ? widgetMediaUrl(row.previewImage) : "";

  if (!src || failed) {
    return (
      <WidgetPreviewFallback
        label={row.label}
        gridW={row.gridW}
        gridH={row.gridH}
        compact={compact}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={row.label}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function WidgetIconThumb({ row }: { row: PlatformDefaultWidgetRow }) {
  const [failed, setFailed] = useState(false);
  const src = isWidgetMediaUrl(row.icon) ? widgetMediaUrl(row.icon) : "";

  if (!src || failed) {
    return (
      <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <span className="text-[9px] font-bold leading-none text-brand-600 dark:text-brand-400">
          {row.code}
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-8 w-8 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function PreviewDroppableCell({
  id,
  cellWidth,
  cellHeight,
}: {
  id: string;
  cellWidth: number;
  cellHeight: number;
}) {
  const [x, y] = idToCoords(id);
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="rounded border border-dashed border-gray-200/80 dark:border-gray-700/60"
      style={{
        position: "absolute",
        left: x * (cellWidth + GRID_GAP),
        top: y * (cellHeight + GRID_GAP),
        width: cellWidth,
        height: cellHeight,
        pointerEvents: "none",
      }}
    />
  );
}

function PreviewWidgetContent({
  widget,
  row,
  compact,
}: {
  widget: PlacedWidget;
  row?: PlatformDefaultWidgetRow;
  compact?: boolean;
}) {
  if (row) {
    return <WidgetPreviewImage row={row} compact={compact ?? (widget.w <= 1 && widget.h <= 1)} />;
  }
  return (
    <WidgetPreviewFallback
      label={widget.type}
      gridW={widget.w}
      gridH={widget.h}
      compact={compact ?? (widget.w <= 1 && widget.h <= 1)}
    />
  );
}

function DraggablePreviewWidget({
  widget,
  row,
  cellWidth,
  cellHeight,
  disabled,
}: {
  widget: PlacedWidget;
  row?: PlatformDefaultWidgetRow;
  cellWidth: number;
  cellHeight: number;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.type,
    disabled,
  });

  const shrink = 6;
  const style: React.CSSProperties = {
    position: "absolute",
    width: widget.w * cellWidth + (widget.w - 1) * GRID_GAP - shrink * 2,
    height: widget.h * cellHeight + (widget.h - 1) * GRID_GAP - shrink * 2,
    left: widget.x * (cellWidth + GRID_GAP) + shrink,
    top: widget.y * (cellHeight + GRID_GAP) + shrink,
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition: transform ? "none" : undefined,
    zIndex: isDragging ? 1 : 10,
    touchAction: "none",
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-900 ${
        isDragging
          ? "border-brand-400 ring-2 ring-brand-500/30"
          : "border-gray-200 dark:border-gray-700"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <div
        {...listeners}
        {...attributes}
        className={`h-full w-full ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
      >
        <PreviewWidgetContent
          widget={widget}
          row={row}
          compact={widget.w <= 1 && widget.h <= 1}
        />
      </div>
    </div>
  );
}

function DragOverlayPreviewWidget({
  widget,
  row,
  cellWidth,
  cellHeight,
}: {
  widget: PlacedWidget;
  row?: PlatformDefaultWidgetRow;
  cellWidth: number;
  cellHeight: number;
}) {
  const shrink = 6;
  return (
    <div
      className="cursor-grabbing overflow-hidden rounded-lg border border-brand-400 bg-white shadow-lg ring-2 ring-brand-500/40 dark:bg-gray-900"
      style={{
        width: widget.w * cellWidth + (widget.w - 1) * GRID_GAP - shrink * 2,
        height: widget.h * cellHeight + (widget.h - 1) * GRID_GAP - shrink * 2,
        touchAction: "none",
      }}
    >
      <PreviewWidgetContent
        widget={widget}
        row={row}
        compact={widget.w <= 1 && widget.h <= 1}
      />
    </div>
  );
}

function DashboardPreviewGrid({
  placed,
  catalogByCode,
  disabled,
  onMove,
}: {
  placed: PlacedWidget[];
  catalogByCode: Map<string, PlatformDefaultWidgetRow>;
  disabled?: boolean;
  onMove: (type: string, x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(0);
  const [cellHeight, setCellHeight] = useState(0);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [highlightArea, setHighlightArea] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    valid: boolean;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth - GRID_INSET * 2;
      const h = el.clientHeight - GRID_INSET * 2;
      setCellWidth((w - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS);
      setCellHeight((h - (GRID_ROWS - 1) * GRID_GAP) / GRID_ROWS);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeWidget = activeDragType
    ? placed.find((w) => w.type === activeDragType) ?? null
    : null;

  const resolveDrop = useCallback(
    (activeId: string, overId: string) => {
      const activeWidget = placed.find((w) => w.type === activeId);
      if (!activeWidget) return null;

      let [targetX, targetY] = idToCoords(overId);
      targetX = Math.min(Math.max(0, targetX), GRID_COLS - activeWidget.w);
      targetY = Math.min(Math.max(0, targetY), GRID_ROWS - activeWidget.h);

      const valid = canPlaceAt(
        placed,
        activeWidget.type,
        targetX,
        targetY,
        activeWidget.w,
        activeWidget.h,
      );

      return { activeWidget, targetX, targetY, valid };
    },
    [placed],
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || disabled) return;

    const resolved = resolveDrop(String(active.id), String(over.id));
    if (!resolved) return;

    const { activeWidget, targetX, targetY, valid } = resolved;
    setHighlightArea({
      x: targetX,
      y: targetY,
      w: activeWidget.w,
      h: activeWidget.h,
      valid,
    });
  };

  const clearDragState = () => {
    setActiveDragType(null);
    setHighlightArea(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    setActiveDragType(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    clearDragState();
    if (!over || disabled) return;

    const resolved = resolveDrop(String(active.id), String(over.id));
    if (!resolved?.valid) return;

    onMove(resolved.activeWidget.type, resolved.targetX, resolved.targetY);
  };

  const gridReady = cellWidth > 0 && cellHeight > 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-white/[0.02]"
        style={{ aspectRatio: `${GRID_COLS} / ${GRID_ROWS}` }}
      >
        <div
          className="absolute"
          style={{
            inset: GRID_INSET,
            pointerEvents: placed.length === 0 ? "none" : undefined,
          }}
        >
          {gridReady && (
            <>
              {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
                const x = i % GRID_COLS;
                const y = Math.floor(i / GRID_COLS);
                return (
                  <PreviewDroppableCell
                    key={coordsToId(x, y)}
                    id={coordsToId(x, y)}
                    cellWidth={cellWidth}
                    cellHeight={cellHeight}
                  />
                );
              })}

              {highlightArea && (
                <div
                  className={`pointer-events-none absolute rounded-lg border-2 transition-colors duration-100 ${
                    highlightArea.valid
                      ? "border-brand-400 bg-brand-400/15"
                      : "border-error-400 bg-error-400/15"
                  }`}
                  style={{
                    left: highlightArea.x * (cellWidth + GRID_GAP),
                    top: highlightArea.y * (cellHeight + GRID_GAP),
                    width:
                      highlightArea.w * cellWidth +
                      (highlightArea.w - 1) * GRID_GAP,
                    height:
                      highlightArea.h * cellHeight +
                      (highlightArea.h - 1) * GRID_GAP,
                  }}
                />
              )}

              {placed.map((item) => (
                <DraggablePreviewWidget
                  key={item.type}
                  widget={item}
                  row={catalogByCode.get(item.type)}
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                  disabled={disabled}
                />
              ))}
            </>
          )}

          {placed.length === 0 && (
            <div className="flex h-full items-center justify-center text-theme-xs text-gray-400">
              Select widgets, then drag them in the preview to match the dashboard layout
            </div>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeWidget && gridReady ? (
          <DragOverlayPreviewWidget
            widget={activeWidget}
            row={catalogByCode.get(activeWidget.type)}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function CompanyDefaultWidgetLayoutsPanel() {
  const [catalog, setCatalog] = useState<PlatformDefaultWidgetRow[]>([]);
  const [layouts, setLayouts] = useState<PlatformDefaultWidgetLayoutRow[]>([]);
  const [audience, setAudience] = useState<WidgetLayoutAudience>("admin");
  const [placedWidgets, setPlacedWidgets] = useState<PlacedWidget[]>([]);
  const [listDragType, setListDragType] = useState<string | null>(null);
  const [listDropType, setListDropType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [widgetRows, layoutRows] = await Promise.all([
        listPlatformWidgets(),
        listPlatformWidgetLayouts(),
      ]);
      setCatalog(widgetRows);
      setLayouts(layoutRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load default widgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeLayout = useMemo(
    () => layouts.find((row) => row.audience === audience),
    [layouts, audience],
  );

  const catalogByCode = useMemo(
    () => new Map(catalog.map((row) => [row.code, row])),
    [catalog],
  );

  useEffect(() => {
    if (!activeLayout) {
      setPlacedWidgets([]);
      return;
    }
    const applicable = activeLayout.items.filter((item) => {
      const row = catalog.find((c) => c.code === item.type);
      return row && isWidgetApplicableForAudience(row.visibility, audience);
    });
    setPlacedWidgets(itemsToPlaced(applicable, catalogByCode));
    setSavedAt(activeLayout.updatedAt);
  }, [activeLayout, audience, catalog, catalogByCode]);

  const pickerOptions = useMemo(
    () => filterCatalogForAudience(catalog, audience),
    [catalog, audience],
  );

  const selectedTypes = useMemo(() => placedWidgets.map((p) => p.type), [placedWidgets]);

  const selectedPickerRows = useMemo(
    () =>
      selectedTypes
        .map((code) => pickerOptions.find((r) => r.code === code))
        .filter((r): r is PlatformDefaultWidgetRow => r != null),
    [selectedTypes, pickerOptions],
  );

  const toggleWidget = (code: string) => {
    setPlacedWidgets((prev) => {
      if (prev.some((p) => p.type === code)) {
        return prev.filter((p) => p.type !== code);
      }
      const row = catalogByCode.get(code);
      if (!row) return prev;
      const w = Math.max(1, row.gridW);
      const h = Math.max(1, row.gridH);
      const spot = findEmptySpot(prev, w, h);
      if (!spot) return prev;
      return [...prev, { type: code, x: spot.x, y: spot.y, w, h }];
    });
  };

  const handleMoveWidget = (type: string, x: number, y: number) => {
    setPlacedWidgets((prev) =>
      prev.map((p) => (p.type === type ? { ...p, x, y } : p)),
    );
  };

  const handleListDrop = (targetType: string) => {
    if (!listDragType || listDragType === targetType) return;
    setPlacedWidgets((prev) => {
      const reordered = reorderPlacedByType(prev, listDragType, targetType);
      return autoPackWidgets(
        reordered.map((p) => p.type),
        catalogByCode,
      );
    });
    setListDragType(null);
    setListDropType(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = placedWidgets.map(({ type, x, y }) => ({ type, x, y }));
      const updated = await replacePlatformWidgetLayout(audience, payload);
      setLayouts((prev) => {
        const rest = prev.filter((row) => row.audience !== updated.audience);
        return [...rest, updated].sort((a, b) => a.audience.localeCompare(b.audience));
      });
      setPlacedWidgets(itemsToPlaced(updated.items, catalogByCode));
      setSavedAt(updated.updatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]" />
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="max-w-3xl text-theme-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Choose which widgets new admins, members, and clients receive on first login. Drag
            widgets in the preview to arrange them — the layout is saved exactly as shown.
          </p>
        </div>
        {savedAt && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Last saved {new Date(savedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {AUDIENCES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setAudience(key)}
            className={`rounded-full px-4 py-1.5 text-theme-xs font-medium transition-colors ${
              audience === key
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
            }`}
          >
            {audienceLabels[key]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-1 dark:border-gray-800 dark:bg-white/[0.02]">
          <h5 className="mb-3 text-theme-sm font-semibold text-gray-900 dark:text-white/90">
            Select widgets
          </h5>
          <p className="mb-4 text-[11px] text-gray-500 dark:text-gray-400">
            {selectedTypes.length} selected · showing widgets for{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {audienceLabels[audience]}
            </span>{" "}
            only
          </p>

          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {pickerOptions.length === 0 ? (
              <p className="py-8 text-center text-theme-xs text-gray-500 dark:text-gray-400">
                No widgets available for this audience.
              </p>
            ) : (
              pickerOptions.map((row) => {
                const isSelected = selectedTypes.includes(row.code);
                return (
                  <div
                    key={row.code}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/20"
                        : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={saving}
                      onChange={() => toggleWidget(row.code)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => toggleWidget(row.code)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <WidgetIconThumb row={row} />
                      <span className="min-w-0">
                        <span className="block truncate text-theme-xs font-medium text-gray-900 dark:text-white/90">
                          {row.label}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {row.code} · {row.gridW}×{row.gridH}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {selectedPickerRows.length > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h6 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <GripIcon />
                Drag to reorder
              </h6>
              <div className="space-y-1.5">
                {selectedPickerRows.map((row) => {
                  const isDragging = listDragType === row.code;
                  const isDropTarget = listDropType === row.code && listDragType !== row.code;
                  return (
                    <div
                      key={row.code}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-theme-xs ${
                        isDragging ? "opacity-40" : ""
                      } ${
                        isDropTarget
                          ? "border-brand-300 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-950/20"
                          : "border-gray-100 dark:border-gray-800"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (listDragType && listDragType !== row.code) {
                          setListDropType(row.code);
                        }
                      }}
                      onDragLeave={() => {
                        if (listDropType === row.code) setListDropType(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleListDrop(row.code);
                      }}
                    >
                      <CatalogDragHandle
                        id={row.code}
                        label={row.label}
                        disabled={saving}
                        onDragStart={setListDragType}
                        onDragEnd={() => {
                          setListDragType(null);
                          setListDropType(null);
                        }}
                      />
                      <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                        {row.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-3 dark:border-gray-800 dark:bg-white/[0.02]">
          <h5 className="mb-1 text-theme-sm font-semibold text-gray-900 dark:text-white/90">
            Dashboard preview
          </h5>
          <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">
            Drag widgets to reposition on the grid — matches the admin dashboard layout.
          </p>

          <DashboardPreviewGrid
            placed={placedWidgets}
            catalogByCode={catalogByCode}
            disabled={saving}
            onMove={handleMoveWidget}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-brand-500 px-6 py-2.5 text-theme-xs font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save default widgets"}
        </button>
      </div>
    </section>
  );
}
