/**
 * Moves an item one step up/down among its siblings and returns the new
 * sort_order for every sibling (normalized 0..n-1).
 */
export function reorder<T extends { id: string }>(
  siblings: readonly T[],
  id: string,
  direction: "up" | "down",
): Array<{ id: string; sort_order: number }> {
  const index = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= siblings.length) return [];
  const next = [...siblings];
  const [moved] = next.splice(index, 1);
  if (!moved) return [];
  next.splice(target, 0, moved);
  return next.map((s, i) => ({ id: s.id, sort_order: i }));
}
