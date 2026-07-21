/** Resolves the display name for an id, falling back to "—" when the referenced item was deleted. */
export function resolveName(items: { id: string; name: string }[], id: string): string {
  return items.find((i) => i.id === id)?.name ?? "—";
}
