import { CARDS, CARD_BY_ID, type Card, type Rarity } from './cards'

/** Nombre d'exemplaires pour qu'une carte devienne brillante (retenue). */
export const BRILLANT = 3
/** Bonnes réponses espacées nécessaires pour gagner un exemplaire. */
export const PROGRESS_FOR_COPY = 3
export const REVIEW_SIZE = 15
export const BOOSTER_SIZE = 10
export const START_BOOSTERS = 3
/** Bonnes réponses en révision pour gagner un booster. */
export const POINTS_FOR_BOOSTER = 20

const MIN = 60_000
const DAY = 86_400_000
/** Délai avant de revoir une carte, selon sa boîte (répétition espacée). */
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY]
const MAX_BOX = INTERVALS.length - 1

export interface Owned {
  copies: number
  box: number
  due: number
  progress: number
}

export interface Save {
  version: 1
  level: Rarity | null
  owned: Record<string, Owned>
  boosters: number
  reviewsDone: number
  /** Bonnes réponses en révision depuis le dernier booster gagné. */
  points: number
  /** Jour (AAAA-MM-JJ) du dernier booster gratuit quotidien. */
  lastDaily: string
}

export type Rng = () => number

export function newSave(): Save {
  return { version: 1, level: null, owned: {}, boosters: 0, reviewsDone: 0, points: 0, lastDaily: '' }
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const isBrillant = (o: Owned | undefined) => !!o && o.copies >= BRILLANT

function intervalFor(box: number, brillant: boolean) {
  return INTERVALS[box] * (brillant ? 2 : 1)
}

// ---------- Questions ----------

/** ar-fr : arabe → français ; fr-ar : français → arabe ; -nt : choix qui se ressemblent (même thème). */
export type QType = 'ar-fr' | 'fr-ar' | 'ar-fr-nt' | 'fr-ar-nt'

export interface Question {
  card: Card
  type: QType
  choices: Card[]
}

export function questionTypeFor(o: Owned | undefined): QType {
  const box = o?.box ?? 0
  if (box <= 1) return 'ar-fr'
  if (box === 2) return 'fr-ar'
  if (box === 3) return 'ar-fr-nt'
  return 'fr-ar-nt'
}

export function makeQuestion(card: Card, type: QType, rng: Rng): Question {
  const pool = CARDS.filter((c) => c.kind === card.kind && c.fr !== card.fr && c.ar !== card.ar)
  const hard = type !== 'ar-fr'
  // Les questions difficiles proposent des cartes qui se ressemblent (même thème).
  const scored = shuffle(pool, rng).map((c) => ({
    c,
    score: hard ? (c.theme === card.theme ? 2 : 0) + (c.rarity === card.rarity ? 1 : 0) : 0,
  }))
  scored.sort((a, b) => b.score - a.score)
  const distractors: Card[] = []
  for (const { c } of scored) {
    if (distractors.length === 3) break
    if (distractors.some((d) => d.fr === c.fr || d.ar === c.ar)) continue
    distractors.push(c)
  }
  return { card, type, choices: shuffle([card, ...distractors], rng) }
}

// ---------- Test de niveau ----------

const PLACEMENT_PLAN: Record<Rarity, number> = { 1: 3, 2: 3, 3: 2, 4: 2, 5: 2 }
/** Bonnes réponses nécessaires dans un palier pour le valider. */
export const PLACEMENT_PASS = 2

export function placementCards(rng: Rng): Card[] {
  return ([1, 2, 3, 4, 5] as Rarity[]).flatMap((r) =>
    shuffle(
      CARDS.filter((c) => c.rarity === r),
      rng,
    ).slice(0, PLACEMENT_PLAN[r]),
  )
}

export interface PlacementResult {
  card: Card
  correct: boolean
}

export function placementLevel(results: PlacementResult[]): Rarity {
  let level: Rarity = 1
  for (const r of [1, 2, 3, 4, 5] as Rarity[]) {
    const ok = results.filter((x) => x.card.rarity === r && x.correct).length
    if (ok < PLACEMENT_PASS) break
    level = r
  }
  return level
}

export function applyPlacement(save: Save, results: PlacementResult[], now: number): Save {
  const owned = { ...save.owned }
  for (const { card, correct } of results) {
    if (correct) owned[card.id] = { copies: 1, box: 1, due: now + INTERVALS[1], progress: 0 }
  }
  return { ...save, owned, level: placementLevel(results), boosters: save.boosters + START_BOOSTERS }
}

// ---------- Boosters ----------

export function openBooster(save: Save, rng: Rng): Card[] {
  const level = save.level ?? 1
  const notOwned = CARDS.filter((c) => !save.owned[c.id])
  const picked: Card[] = []
  const take = (match: (c: Card) => boolean) => {
    const fresh = notOwned.filter((c) => match(c) && !picked.includes(c))
    const fallback = CARDS.filter((c) => match(c) && !picked.includes(c))
    const pool = fresh.length ? fresh : fallback.length ? fallback : CARDS.filter((c) => !picked.includes(c))
    picked.push(pool[Math.floor(rng() * pool.length)])
  }
  for (let i = 0; i < BOOSTER_SIZE - 3; i++) take((c) => c.rarity <= level)
  take((c) => c.rarity === level)
  take((c) => c.rarity === level)
  if (level < 5 && rng() < 0.1) take((c) => c.rarity === level + 1)
  else take((c) => c.rarity <= level)
  return shuffle(picked, rng)
}

export function consumeBooster(save: Save): Save {
  return { ...save, boosters: Math.max(0, save.boosters - 1) }
}

// ---------- Réponses et punitions ----------

export type Outcome =
  | { kind: 'won'; card: Card; copies: number }
  | { kind: 'progress'; card: Card; copies: number; gainedCopy: boolean; progress: number; boosterEarned?: boolean }
  | { kind: 'lost-copy'; card: Card; copiesLeft: number }
  | { kind: 'lost-other'; card: Card; lost: Card | null; copiesLeft: number }

function loseCopy(owned: Record<string, Owned>, id: string, now: number): number {
  const o = owned[id]
  if (!o) return 0
  if (o.copies <= 1) {
    delete owned[id]
    return 0
  }
  owned[id] = { copies: o.copies - 1, box: 0, due: now, progress: 0 }
  return o.copies - 1
}

function punish(save: Save, card: Card, now: number, rng: Rng): { save: Save; outcome: Outcome } {
  const owned = { ...save.owned }
  if (owned[card.id]) {
    const copiesLeft = loseCopy(owned, card.id, now)
    return { save: { ...save, owned }, outcome: { kind: 'lost-copy', card, copiesLeft } }
  }
  const others = Object.keys(owned)
  if (!others.length) {
    return { save, outcome: { kind: 'lost-other', card, lost: null, copiesLeft: 0 } }
  }
  const id = others[Math.floor(rng() * others.length)]
  const copiesLeft = loseCopy(owned, id, now)
  return {
    save: { ...save, owned },
    outcome: { kind: 'lost-other', card, lost: CARD_BY_ID.get(id)!, copiesLeft },
  }
}

/** Réponse à une carte de booster : la gagner, ou être puni. */
export function answerBooster(save: Save, card: Card, correct: boolean, now: number, rng: Rng) {
  if (!correct) return punish(save, card, now, rng)
  const owned = { ...save.owned }
  const o = owned[card.id]
  owned[card.id] = o
    ? { ...o, copies: o.copies + 1 }
    : { copies: 1, box: 1, due: now + INTERVALS[1], progress: 0 }
  const outcome: Outcome = { kind: 'won', card, copies: owned[card.id].copies }
  return { save: { ...save, owned }, outcome }
}

/** Réponse en révision : la carte progresse, ou on perd un exemplaire. */
export function answerReview(save: Save, card: Card, correct: boolean, now: number, rng: Rng) {
  const o = save.owned[card.id]
  if (!o) return answerBooster(save, card, correct, now, rng)
  if (!correct) return punish(save, card, now, rng)
  const wasDue = o.due <= now
  const box = Math.min(o.box + 1, MAX_BOX)
  let { copies, progress } = o
  let gainedCopy = false
  if (wasDue) progress++
  if (progress >= PROGRESS_FOR_COPY && copies < BRILLANT) {
    copies++
    progress = 0
    gainedCopy = true
  }
  const next: Owned = { copies, progress, box, due: now + intervalFor(box, copies >= BRILLANT) }
  // Chaque bonne réponse en révision rapproche du prochain booster.
  const points = save.points + 1
  const boosterEarned = points >= POINTS_FOR_BOOSTER
  const outcome: Outcome = { kind: 'progress', card, copies, gainedCopy, progress, boosterEarned }
  return {
    save: {
      ...save,
      owned: { ...save.owned, [card.id]: next },
      points: boosterEarned ? 0 : points,
      boosters: save.boosters + (boosterEarned ? 1 : 0),
    },
    outcome,
  }
}

// ---------- Révisions ----------

export function dueCount(save: Save, now: number): number {
  return Object.values(save.owned).filter((o) => o.due <= now).length
}

export function reviewSession(save: Save, now: number, rng: Rng, size = REVIEW_SIZE): Card[] {
  const entries = Object.entries(save.owned)
  const due = entries.filter(([, o]) => o.due <= now).sort((a, b) => a[1].due - b[1].due)
  // Les cartes pas encore à revoir complètent la séance, les brillantes plus rarement.
  const rest = entries
    .filter(([, o]) => o.due > now)
    .map(([id, o]) => ({ id, w: rng() + (isBrillant(o) ? 0.7 : 0) }))
    .sort((a, b) => a.w - b.w)
    .map((x) => x.id)
  const ids = [...due.map(([id]) => id), ...rest].slice(0, size)
  return shuffle(
    ids.map((id) => CARD_BY_ID.get(id)!),
    rng,
  )
}

export function finishReview(save: Save): Save {
  return { ...save, reviewsDone: save.reviewsDone + 1 }
}

/** Un booster offert par jour, le reste se gagne en révisant. */
export function claimDaily(save: Save, today: string): Save {
  if (!save.level || save.lastDaily === today) return save
  return { ...save, lastDaily: today, boosters: save.boosters + 1 }
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- Progression ----------

/** Le niveau monte quand on possède la moitié des cartes de sa rareté maximale. */
export function levelUp(save: Save): Save {
  const level = save.level
  if (!level || level >= 5) return save
  const tier = CARDS.filter((c) => c.rarity === level)
  const have = tier.filter((c) => save.owned[c.id]).length
  return have * 2 >= tier.length ? { ...save, level: (level + 1) as Rarity } : save
}

/** Évite d'être bloqué : sans carte ni booster, on reçoit un booster. */
export function rescue(save: Save): Save {
  if (save.level && !Object.keys(save.owned).length && save.boosters === 0) return { ...save, boosters: 1 }
  return save
}

export function stats(save: Save) {
  const owned = Object.values(save.owned)
  return {
    owned: owned.length,
    brillant: owned.filter(isBrillant).length,
    total: CARDS.length,
  }
}

export function hasWon(save: Save): boolean {
  return CARDS.every((c) => isBrillant(save.owned[c.id]))
}
