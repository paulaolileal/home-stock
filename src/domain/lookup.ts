/** Prefixes the name with its emoji, when set (e.g. category icons). */
export function withEmoji(item: { name: string; emoji?: string }): string {
  return item.emoji ? `${item.emoji} ${item.name}` : item.name;
}

/** Resolves the display name for an id, falling back to "—" when the referenced item was deleted. */
export function resolveName(
  items: { id: string; name: string; emoji?: string }[],
  id: string,
): string {
  const item = items.find((i) => i.id === id);
  return item ? withEmoji(item) : "—";
}
