export function sortByOrder<T extends { sortOrder: number }>(
  rows: T[],
  tieBreaker: (a: T, b: T) => number,
): T[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || tieBreaker(a, b));
}

export function reorderById<T extends { id: string }>(
  rows: T[],
  fromId: string,
  toId: string,
): T[] {
  const fromIdx = rows.findIndex((r) => r.id === fromId);
  const toIdx = rows.findIndex((r) => r.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return rows;
  const next = [...rows];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

export function nextSortOrder(rows: { sortOrder: number }[]): number {
  if (!rows.length) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function persistSortReorder<T extends { id: string; sortOrder: number }>(
  reordered: T[],
  updateFn: (id: string, sortOrder: number) => Promise<T>,
  applyRows: (rows: T[]) => void,
  sortFn: (rows: T[]) => T[],
): Promise<void> {
  const previous = reordered;
  const withNewOrder = reordered.map((row, index) => ({ ...row, sortOrder: index }));
  applyRows(withNewOrder);
  try {
    const updated = await Promise.all(
      withNewOrder.map((row) => updateFn(row.id, row.sortOrder)),
    );
    applyRows(sortFn(updated));
  } catch (e) {
    applyRows(previous);
    throw e;
  }
}
