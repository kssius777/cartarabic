import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import {
  answerBooster,
  answerReview,
  applyPlacement,
  BRILLANT,
  makeQuestion,
  newSave,
  openBooster,
  placementCards,
  placementLevel,
  reviewSession,
  type Save,
} from './rules'

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const NOW = 1_000_000_000_000
const byRarity = (r: number) => CARDS.filter((c) => c.rarity === r)

describe('cartes', () => {
  it('a 200 cartes uniques et vocalisées', () => {
    expect(CARDS).toHaveLength(200)
    expect(new Set(CARDS.map((c) => c.ar)).size).toBe(200)
    for (const c of CARDS) expect(c.ar).toMatch(/[ً-ْ]/)
  })
})

describe('questions', () => {
  it('propose 4 choix distincts dont la bonne réponse', () => {
    const rng = seeded()
    for (const card of CARDS) {
      const q = makeQuestion(card, 'fr-ar-nt', rng)
      expect(q.choices).toHaveLength(4)
      expect(q.choices).toContain(card)
      expect(new Set(q.choices.map((c) => c.fr)).size).toBe(4)
    }
  })
})

describe('test de niveau', () => {
  it('tire 12 cartes de la plus facile à la plus difficile', () => {
    const cards = placementCards(seeded())
    expect(cards).toHaveLength(12)
    expect(cards.map((c) => c.rarity)).toEqual([...cards.map((c) => c.rarity)].sort())
  })

  it("s'arrête au premier palier raté", () => {
    const res = [
      ...byRarity(1).slice(0, 3).map((card) => ({ card, correct: true })),
      ...byRarity(2).slice(0, 3).map((card, i) => ({ card, correct: i === 0 })),
      ...byRarity(3).slice(0, 2).map((card) => ({ card, correct: true })),
    ]
    expect(placementLevel(res)).toBe(1)
  })

  it('offre les cartes réussies et 3 boosters', () => {
    const [a, b] = CARDS
    const save = applyPlacement(newSave(), [{ card: a, correct: true }, { card: b, correct: false }], NOW)
    expect(Object.keys(save.owned)).toEqual([a.id])
    expect(save.boosters).toBe(3)
    expect(save.level).toBe(1)
  })
})

describe('boosters', () => {
  it('donne 5 cartes différentes de rareté adaptée', () => {
    const save: Save = { ...newSave(), level: 2 }
    for (let s = 1; s < 50; s++) {
      const cards = openBooster(save, seeded(s))
      expect(new Set(cards).size).toBe(5)
      expect(cards.every((c) => c.rarity <= 3)).toBe(true)
    }
  })
})

describe('punitions', () => {
  const [a, b] = CARDS

  it("oublier une carte possédée défausse un exemplaire", () => {
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 2, box: 3, due: NOW, progress: 1 } } }
    const r = answerReview(save, a, false, NOW, seeded())
    expect(r.save.owned[a.id].copies).toBe(1)
    expect(r.save.owned[a.id].box).toBe(0)
    const r2 = answerReview(r.save, a, false, NOW, seeded())
    expect(r2.save.owned[a.id]).toBeUndefined()
  })

  it("rater une carte non possédée retire une autre carte", () => {
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 1, box: 1, due: NOW, progress: 0 } } }
    const r = answerBooster(save, b, false, NOW, seeded())
    expect(r.outcome).toMatchObject({ kind: 'lost-other', lost: a })
    expect(r.save.owned).toEqual({})
  })
})

describe('progression', () => {
  it('3 bonnes réponses espacées donnent un exemplaire, et 3 exemplaires une carte brillante', () => {
    const [a] = CARDS
    let save: Save = { ...newSave(), owned: { [a.id]: { copies: 1, box: 0, due: NOW, progress: 0 } } }
    let now = NOW
    for (let i = 0; i < 6; i++) {
      save = answerReview(save, a, true, now, seeded()).save
      now = save.owned[a.id].due
    }
    expect(save.owned[a.id].copies).toBe(BRILLANT)
  })

  it("une bonne réponse avant l'heure ne compte pas", () => {
    const [a] = CARDS
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 1, box: 2, due: NOW + 1000, progress: 2 } } }
    const r = answerReview(save, a, true, NOW, seeded())
    expect(r.save.owned[a.id].copies).toBe(1)
  })

  it('les révisions commencent par les cartes à revoir', () => {
    const owned = Object.fromEntries(
      CARDS.slice(0, 30).map((c, i) => [c.id, { copies: 1, box: 1, due: i < 5 ? NOW - 1 : NOW + 1e6, progress: 0 }]),
    )
    const session = reviewSession({ ...newSave(), owned }, NOW, seeded(), 6)
    expect(session).toHaveLength(6)
    const dueIds = CARDS.slice(0, 5).map((c) => c.id)
    expect(session.filter((c) => dueIds.includes(c.id))).toHaveLength(5)
  })
})
