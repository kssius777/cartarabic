import raw from '../../data/personnages.json'

export type FigRarity = 1 | 2 | 3 | 4 | 5

export interface Figure {
  id: string
  category: string
  rarity: FigRarity
  ar: string
  translit: string
  name: string
  /** Titre exact de l'article de Wikipédia en français, d'où vient la photo. */
  wiki: string
  desc: string
  /** Faux pour les prophètes, les compagnons et les scènes qui pourraient les représenter : on montre la calligraphie du nom. */
  image: boolean
  era: string
  /** Description et époque en arabe vocalisé, affichées par défaut sur la carte. */
  descAr?: string
  eraAr?: string
}

export const FIGURES = raw as Figure[]
export const FIGURE_BY_ID = new Map(FIGURES.map((f) => [f.id, f]))

export const FIG_CATEGORIES: Record<string, { label: string; ar: string; icon: string; color: string }> = {
  prophetes: { label: 'Prophètes', ar: 'اَلْأَنْبِيَاءُ', icon: '📜', color: '#1b7f5a' },
  compagnons: { label: 'Compagnons', ar: 'اَلصَّحَابَةُ', icon: '🌙', color: '#2e7d32' },
  femmes: { label: 'Femmes illustres', ar: 'نِسَاءٌ شَهِيرَاتٌ', icon: '🌹', color: '#ad1457' },
  califes: { label: 'Califes', ar: 'اَلْخُلَفَاءُ', icon: '👑', color: '#6a1b9a' },
  chefs: { label: 'Sultans et chefs', ar: 'اَلسَّلَاطِينُ وَالْقَادَةُ', icon: '⚔️', color: '#b71c1c' },
  savants: { label: 'Savants', ar: 'اَلْعُلَمَاءُ', icon: '📚', color: '#1565c0' },
  spirituels: { label: 'Mystiques', ar: 'اَلْمُتَصَوِّفَةُ', icon: '✨', color: '#4527a0' },
  lettres: { label: 'Lettres', ar: 'اَلْأُدَبَاءُ', icon: '🖋️', color: '#5d4037' },
  modernes: { label: 'Époque moderne', ar: 'اَلْعَصْرُ الْحَدِيثُ', icon: '🎙️', color: '#37474f' },
  abrahamique: { label: 'Monde abrahamique', ar: 'اَلْعَالَمُ الْإِبْرَاهِيمِيُّ', icon: '🕊️', color: '#00838f' },
  lieux: { label: 'Lieux', ar: 'اَلْأَمَاكِنُ', icon: '🕌', color: '#00695c' },
  evenements: { label: 'Événements', ar: 'اَلْأَحْدَاثُ', icon: '🏺', color: '#e65100' },
}

export const FIG_RARITIES: Record<FigRarity, { name: string; ar: string; color: string }> = {
  1: { name: 'Bronze', ar: 'بُرُونْزِيَّةٌ', color: '#b0713d' },
  2: { name: 'Argent', ar: 'فِضِّيَّةٌ', color: '#9fb3c8' },
  3: { name: 'Or', ar: 'ذَهَبِيَّةٌ', color: '#e0b43a' },
  4: { name: 'Platine', ar: 'بْلَاتِينِيَّةٌ', color: '#7fd6e0' },
  5: { name: 'Légendaire', ar: 'أُسْطُورِيَّةٌ', color: '#ff7ad9' },
}

export const FIGURE_BOOSTER_PRICE = 150
export const FIGURE_BOOSTER_SIZE = 5
/** Chances de tirage par rareté (en %). */
const WEIGHTS: Record<FigRarity, number> = { 1: 40, 2: 30, 3: 18, 4: 9, 5: 3 }

function pickRarity(rng: () => number): FigRarity {
  let r = rng() * 100
  for (const k of [1, 2, 3, 4, 5] as FigRarity[]) {
    r -= WEIGHTS[k]
    if (r < 0) return k
  }
  return 1
}

/** Tire des personnages, en évitant les doublons dans un même booster et en favorisant ceux qu'on n'a pas encore. */
export function drawFigures(owned: Record<string, number>, rng: () => number, size = FIGURE_BOOSTER_SIZE): Figure[] {
  const picked: Figure[] = []
  for (let n = 0; n < size && picked.length < FIGURES.length; n++) {
    const rarity = pickRarity(rng)
    const free = (f: Figure) => !picked.includes(f)
    const tier = FIGURES.filter((f) => f.rarity === rarity && free(f))
    const fresh = tier.filter((f) => !owned[f.id])
    const pool = fresh.length && rng() < 0.75 ? fresh : tier.length ? tier : FIGURES.filter(free)
    picked.push(pool[Math.floor(rng() * pool.length)])
  }
  return picked
}
