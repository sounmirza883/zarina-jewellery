// Pure wishlist helpers (no Supabase, no React) so they can be unit tested.

/** Same limit as wishlist_merge() in supabase/schema.sql. */
export const MAX_WISHLIST = 200;

/** Product ids look like "zj-ring-01"; anything else is dropped before it can reach storage or the database. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export const isValidId = (id: unknown): id is string => typeof id === 'string' && ID_PATTERN.test(id);

/** Clean a list read from storage or the network: valid ids only, no repeats, original order, capped. */
export function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (isValidId(id)) seen.add(id);
    if (seen.size >= MAX_WISHLIST) break;
  }
  return [...seen];
}

/** Adds the id at the end, or removes it when it is already saved. */
export function toggleId(ids: string[], id: string): string[] {
  if (!isValidId(id)) return ids;
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= MAX_WISHLIST ? ids : [...ids, id];
}

/** The browser list and the account list as one list: the account's order first, then new local ids. */
export function mergeIds(remote: unknown, local: unknown): string[] {
  return normalizeIds([...normalizeIds(remote), ...normalizeIds(local)]);
}
