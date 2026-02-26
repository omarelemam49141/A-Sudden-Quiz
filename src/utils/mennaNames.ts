/** Latin spellings (compared case-insensitive). */
const MENNA_LATIN = ['menna', 'mennah', 'mena', 'menah']

/** Arabic spellings (compared after trim). */
const MENNA_ARABIC = ['منة', 'منه', 'منّا', 'مينا']

/**
 * Returns true if the given name is considered a "Menna" variant.
 */
export function isMennaName(name: string): boolean {
  const t = name.trim()
  if (!t) return false
  if (MENNA_ARABIC.some((v) => t === v)) return true
  const lower = t.toLowerCase()
  return MENNA_LATIN.some((v) => lower === v)
}
