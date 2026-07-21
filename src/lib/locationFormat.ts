import type { Location } from "@/domain/types";

const SEPARATOR = ">";
const BREADCRUMB = " › "; // "Cozinha › Geladeira"

/** Splits a hierarchical location name like "Cozinha > Geladeira" into its segments. */
export function locationSegments(name: string): string[] {
  return name
    .split(SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Renders a hierarchical location name for display, e.g. "Cozinha › Geladeira". */
export function formatLocation(name: string): string {
  return locationSegments(name).join(BREADCRUMB) || name;
}

/** Last segment of a hierarchical location name — the name within its group. */
export function locationLeaf(name: string): string {
  const segments = locationSegments(name);
  return segments[segments.length - 1] ?? name;
}

/** First segment of a hierarchical location name — used to cluster related locations. */
export function locationGroup(name: string): string {
  return locationSegments(name)[0] ?? name;
}

export type LocationGroup = { group: string; items: Location[] };

/** Groups locations by their top-level segment, preserving arrival order. */
export function groupLocations(locations: Location[]): LocationGroup[] {
  const order: string[] = [];
  const byGroup = new Map<string, Location[]>();
  for (const loc of locations) {
    const group = locationGroup(loc.name);
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
      order.push(group);
    }
    byGroup.get(group)!.push(loc);
  }
  return order.map((group) => ({ group, items: byGroup.get(group)! }));
}

/** Only show a group header when there's real hierarchy — avoids redundant labels for flat locations. */
export function shouldShowGroupLabel(items: Location[]): boolean {
  return items.length > 1 || locationSegments(items[0]?.name ?? "").length > 1;
}
