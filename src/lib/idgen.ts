function slugify(text: string, maxLen = 32): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, maxLen)
    .replace(/-$/, "");
}

export function productId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function categoryId(name: string): string {
  return `cat-${slugify(name)}-${Date.now().toString(36)}`;
}

export function locationId(name: string): string {
  return `loc-${slugify(name)}-${Date.now().toString(36)}`;
}
