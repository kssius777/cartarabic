import raw from '../../data/cartes.json'

export type Rarity = 1 | 2 | 3 | 4 | 5

export interface Card {
  id: string
  ar: string
  translit: string
  fr: string
  theme: string
  kind: 'mot' | 'phrase'
  rarity: Rarity
  rarityName: string
}

export const CARDS = raw as Card[]
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]))
export const TOTAL = CARDS.length

export function cardNumber(card: Card): string {
  return `${String(CARDS.indexOf(card) + 1).padStart(3, '0')}/${TOTAL}`
}

export interface ThemeInfo {
  label: string
  icon: string
  color: string
  light: string
}

export const THEMES: Record<string, ThemeInfo> = {
  salutations: { label: 'Salutations', icon: '👋', color: '#e8a33d', light: '#fbe3b8' },
  pronoms: { label: 'Pronoms', icon: '👤', color: '#8e7cc3', light: '#e2dbf5' },
  famille: { label: 'Famille', icon: '👪', color: '#e06c8c', light: '#f9d4de' },
  nourriture: { label: 'Nourriture', icon: '🍞', color: '#e4572e', light: '#fbd2c4' },
  maison: { label: 'Maison', icon: '🏠', color: '#a9744f', light: '#ecd9c9' },
  corps: { label: 'Corps', icon: '✋', color: '#f08a5d', light: '#fcdccd' },
  nature: { label: 'Nature', icon: '🌿', color: '#4caf50', light: '#cdeccf' },
  animaux: { label: 'Animaux', icon: '🐾', color: '#8d6e63', light: '#e3d6d1' },
  nombres: { label: 'Nombres', icon: '🔢', color: '#607d8b', light: '#d5e0e5' },
  couleurs: { label: 'Couleurs', icon: '🎨', color: '#d6409f', light: '#f6d0e8' },
  temps: { label: 'Temps', icon: '⏳', color: '#3f88c5', light: '#cfe3f3' },
  ville: { label: 'Ville', icon: '🏙️', color: '#546e7a', light: '#d3dde2' },
  adjectifs: { label: 'Adjectifs', icon: '✨', color: '#c9a227', light: '#f3e8bf' },
  questions: { label: 'Questions', icon: '❓', color: '#26a69a', light: '#c8ebe7' },
  verbes: { label: 'Verbes', icon: '⚡', color: '#f4b400', light: '#fdecb3' },
  expressions: { label: 'Expressions', icon: '🌙', color: '#3949ab', light: '#d0d5f1' },
  phrases: { label: 'Phrases', icon: '💬', color: '#00897b', light: '#c2e6e2' },
  outils: { label: 'Petits mots', icon: '🔗', color: '#78909c', light: '#d7dee2' },
  courses: { label: 'Au magasin', icon: '🛒', color: '#ef6c00', light: '#fde0c2' },
  voyage: { label: 'Voyage', icon: '✈️', color: '#0288d1', light: '#c3e4f6' },
  travail: { label: 'Au travail', icon: '💼', color: '#5d4037', light: '#e0d3cc' },
  ecole: { label: 'À l\'école', icon: '🎒', color: '#7b1fa2', light: '#e6cdee' },
  sante: { label: 'Santé', icon: '🩺', color: '#d32f2f', light: '#f7cfcf' },
  restaurant: { label: 'Au restaurant', icon: '🍽️', color: '#c0ca33', light: '#eff2c4' },
  vetements: { label: 'Vêtements', icon: '👕', color: '#ad1457', light: '#f3cadd' },
  emotions: { label: 'Émotions', icon: '💖', color: '#e91e63', light: '#f9cbdb' },
  transport: { label: 'Transport', icon: '🚆', color: '#546e7a', light: '#d3dde2' },
  metiers: { label: 'Métiers', icon: '👷', color: '#6d4c41', light: '#e3d6d0' },
  tech: { label: 'Technologie', icon: '📱', color: '#3f51b5', light: '#d1d6f0' },
  loisirs: { label: 'Loisirs', icon: '⚽', color: '#43a047', light: '#cfe9d0' },
  religion: { label: 'Religion', icon: '🕌', color: '#00695c', light: '#c0e0dc' },
}

export const RARITIES: Record<Rarity, { name: string; symbol: string; color: string }> = {
  // Raretés calées sur les niveaux du cadre européen (CECRL).
  1: { name: 'A1', symbol: '●', color: '#9aa3ad' },
  2: { name: 'A2', symbol: '◆', color: '#43a047' },
  3: { name: 'B1', symbol: '★', color: '#1e88e5' },
  4: { name: 'B2', symbol: '★★', color: '#8e24aa' },
  5: { name: 'C1', symbol: '★★★', color: '#f9a825' },
}
