import { CARD_BY_ID, type Rarity } from './cards'
import { newSave, type Owned, type Save } from './rules'

const KEY = 'cartarabic-save-v1'

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** Répare une sauvegarde ancienne ou abîmée au lieu de faire planter le jeu. */
export function sanitize(raw: unknown): Save {
  const base = newSave()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<Save>
  const level = typeof r.level === 'number' && r.level >= 1 && r.level <= 5 ? (Math.floor(r.level) as Rarity) : null
  const owned: Record<string, Owned> = {}
  if (r.owned && typeof r.owned === 'object') {
    for (const [id, o] of Object.entries(r.owned)) {
      if (!CARD_BY_ID.has(id) || !o || typeof o !== 'object') continue
      const copies = Math.floor(num(o.copies, 0))
      if (copies < 1) continue
      owned[id] = { copies, box: Math.max(0, Math.floor(num(o.box, 0))), due: num(o.due, 0), progress: Math.max(0, num(o.progress, 0)) }
    }
  }
  return {
    version: 1,
    level,
    owned,
    boosters: Math.max(0, Math.floor(num(r.boosters, 0))),
    reviewsDone: Math.max(0, Math.floor(num(r.reviewsDone, 0))),
    points: Math.max(0, Math.floor(num(r.points, 0))),
    lastDaily: typeof r.lastDaily === 'string' ? r.lastDaily : '',
  }
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitize(JSON.parse(raw))
  } catch {
    // Stockage indisponible ou sauvegarde illisible : on repart d'une partie neuve.
  }
  return newSave()
}

export function storeSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Ignoré : la partie continue sans sauvegarde.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignoré.
  }
}
