import { CARD_BY_ID, type Rarity } from './cards'
import { FIGURE_BY_ID } from './figures'
import { newSave, START_COINS, type Owned, type Save } from './rules'

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
      owned[id] = {
        copies,
        box: Math.max(0, Math.floor(num(o.box, 0))),
        due: num(o.due, 0),
        progress: Math.max(0, num(o.progress, 0)),
      }
    }
  }
  return {
    version: 1,
    level,
    owned,
    boosters: Math.max(0, Math.floor(num(r.boosters, 0))),
    reviewsDone: Math.max(0, Math.floor(num(r.reviewsDone, 0))),
    coins: Math.max(0, Math.floor(num(r.coins, START_COINS))),
    figures: cleanFigures(r.figures),
    missed: Array.isArray(r.missed)
      ? r.missed.filter((id): id is string => typeof id === 'string' && CARD_BY_ID.has(id)).slice(-60)
      : [],
  }
}

function cleanFigures(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, n] of Object.entries(raw)) {
    const copies = Math.floor(num(n, 0))
    if (FIGURE_BY_ID.has(id) && copies > 0) out[id] = copies
  }
  return out
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
  const data = JSON.stringify(save)
  try {
    localStorage.setItem(KEY, data)
  } catch {
    // Stockage plein : on sacrifie le cache des photos, jamais la partie.
    try {
      localStorage.removeItem('cartarabic-wiki-v1')
      localStorage.setItem(KEY, data)
    } catch {
      // Ignoré : la partie continue sans sauvegarde.
    }
  }
}

/** Demande au navigateur de ne pas effacer la sauvegarde quand il manque de place (Safari vide sinon les sites peu visités). */
export function requestPersistence() {
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    // Ignoré : non pris en charge.
  }
}

const EXPORT_PREFIX = 'CARTARABIC1:'

/** Code texte de la partie, à copier pour la reprendre sur un autre appareil. */
export function exportSave(save: Save): string {
  const bytes = new TextEncoder().encode(JSON.stringify(save))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return EXPORT_PREFIX + btoa(bin)
}

/** Relit un code (ou le contenu d'un fichier) de sauvegarde. Renvoie null s'il est illisible. */
export function importSave(text: string): Save | null {
  try {
    const t = text.trim()
    const json = t.startsWith('{')
      ? t
      : new TextDecoder().decode(
          Uint8Array.from(atob(t.replace(EXPORT_PREFIX, '').replace(/\s+/g, '')), (ch) => ch.charCodeAt(0)),
        )
    const raw = JSON.parse(json)
    if (!raw || typeof raw !== 'object' || !('owned' in raw)) return null
    const save = sanitize(raw)
    return save.level ? save : null
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignoré.
  }
}
