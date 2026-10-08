/**
 * Converts an arbitrary label into a URL-safe slug.
 * e.g. "Home & Garden" -> "home-garden"
 */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
