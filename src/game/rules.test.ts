import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import { FIGURE_BOOSTER_PRICE, FIGURE_BOOSTER_SIZE, FIGURES } from './figures'
import {
  BOOSTER_SIZE,
  cardsToWork,
  dayKey,
  COINS_PER_CORRECT,
  buyFigureBooster,
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
  it('a au moins 300 cartes uniques et vocalisées', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(300)
    expect(new Set(CARDS.map((c) => c.ar)).size).toBe(CARDS.length)
    expect(new Set(CARDS.map((c) => c.fr)).size).toBe(CARDS.length)
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
  }, 60_000)

  it('propose des leurres de la même forme que la réponse', () => {
    const rng = seeded()
    const words = (s: string) => s.trim().split(/\s+/).length
    let close = 0
    const sample = CARDS.filter((_, i) => i % 50 === 0)
    for (const card of sample) {
      const q = makeQuestion(card, 'ar-fr', rng)
      const others = q.choices.filter((c) => c !== card)
      if (others.every((c) => Math.abs(words(c.fr) - words(card.fr)) <= 1)) close++
    }
    expect(close / sample.length).toBeGreaterThan(0.9)
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
      ...byRarity(1)
        .slice(0, 3)
        .map((card) => ({ card, correct: true })),
      ...byRarity(2)
        .slice(0, 3)
        .map((card, i) => ({ card, correct: i === 0 })),
      ...byRarity(3)
        .slice(0, 2)
        .map((card) => ({ card, correct: true })),
    ]
    expect(placementLevel(res)).toBe(1)
  })

  it('offre les cartes réussies et 3 boosters', () => {
    const [a, b] = CARDS
    const save = applyPlacement(
      newSave(),
      [
        { card: a, correct: true },
        { card: b, correct: false },
      ],
      NOW,
    )
    expect(Object.keys(save.owned)).toEqual([a.id])
    expect(save.boosters).toBe(3)
    expect(save.level).toBe(1)
  })
})

describe('boosters', () => {
  it('donne 10 cartes différentes de rareté adaptée', () => {
    const save: Save = { ...newSave(), level: 2 }
    for (let s = 1; s < 50; s++) {
      const cards = openBooster(save, seeded(s))
      expect(new Set(cards).size).toBe(BOOSTER_SIZE)
      expect(cards.every((c) => c.rarity <= 3)).toBe(true)
    }
  })

  it('deux nouveaux joueurs ne reçoivent pas le même premier booster', () => {
    // Le tirage vient de Math.random à chaque ouverture : aucune graine commune à tous les joueurs.
    const first = () =>
      openBooster({ ...newSave(), level: 1 }, Math.random)
        .map((c) => c.id)
        .sort()
        .join()
    const players = Array.from({ length: 20 }, first)
    expect(new Set(players).size).toBe(players.length)
    // Le même joueur n'a pas non plus deux fois la même suite de cartes.
    const order = () =>
      openBooster({ ...newSave(), level: 1 }, Math.random)
        .map((c) => c.id)
        .join()
    expect(order()).not.toBe(order())
  })

  it('les révisions et le test de niveau changent d’une fois à l’autre', () => {
    const owned = Object.fromEntries(CARDS.slice(0, 40).map((c) => [c.id, { copies: 1, box: 1, due: 0, progress: 0 }]))
    const save: Save = { ...newSave(), level: 1, owned }
    const session = () =>
      reviewSession(save, Date.now(), Math.random)
        .map((c) => c.id)
        .join()
    expect(session()).not.toBe(session())
    const test = () =>
      placementCards(Math.random)
        .map((c) => c.id)
        .join()
    expect(test()).not.toBe(test())
  })
})

describe('dinars', () => {
  it('chaque bonne réponse rapporte des dinars', () => {
    const [c] = CARDS
    const save: Save = { ...newSave(), level: 1, owned: { [c.id]: { copies: 1, box: 0, due: NOW, progress: 0 } } }
    expect(answerReview(save, c, true, NOW, seeded()).save.coins).toBe(save.coins + COINS_PER_CORRECT)
    expect(answerReview(save, c, false, NOW, seeded()).save.coins).toBe(save.coins)
  })
})

describe('personnages', () => {
  it('un booster coûte des dinars et donne des personnages différents', () => {
    const save: Save = { ...newSave(), level: 1, coins: FIGURE_BOOSTER_PRICE + 5 }
    const r = buyFigureBooster(save, seeded())!
    expect(r.save.coins).toBe(5)
    expect(new Set(r.figures).size).toBe(FIGURE_BOOSTER_SIZE)
    expect(Object.values(r.save.figures).reduce((a, b) => a + b, 0)).toBe(FIGURE_BOOSTER_SIZE)
    expect(buyFigureBooster(r.save, seeded())).toBeNull()
  })

  it('ne montre jamais de photo pour les prophètes et les compagnons', () => {
    expect(FIGURES.length).toBeGreaterThan(900)
    expect(FIGURES.filter((f) => ['prophetes', 'compagnons'].includes(f.category) && f.image)).toEqual([])
  })
})

describe('punitions', () => {
  const [a, b] = CARDS

  it('oublier une carte possédée défausse un exemplaire', () => {
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 2, box: 3, due: NOW, progress: 1 } } }
    const r = answerReview(save, a, false, NOW, seeded())
    expect(r.save.owned[a.id].copies).toBe(1)
    expect(r.save.owned[a.id].box).toBe(0)
    const r2 = answerReview(r.save, a, false, NOW, seeded())
    expect(r2.save.owned[a.id]).toBeUndefined()
  })

  it("rater une carte jamais vue n'est pas puni, mais elle est notée", () => {
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 1, box: 1, due: NOW, progress: 0 } } }
    const r = answerBooster(save, b, false, NOW, seeded())
    expect(r.outcome.kind).toBe('discovered')
    expect(r.save.owned[a.id].copies).toBe(1)
    expect(r.save.missed).toContain(b.id)
    expect(r.save.fails[b.id]).toBe(1)
    expect(r.save.history.days[dayKey(NOW)]).toEqual([0, 1])
    expect(cardsToWork(r.save).map((x) => x.card)).toEqual([b])
  })

  it('rater une carte déjà vue et non possédée retire une autre carte', () => {
    const save: Save = { ...newSave(), owned: { [a.id]: { copies: 1, box: 1, due: NOW, progress: 0 } }, fails: { [b.id]: 1 } }
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
    expect(r.save.owned[a.id]).toMatchObject({ box: 2, due: NOW + 1000 })
  })

  it('une carte ratée revient dans le booster suivant', () => {
    const save: Save = { ...newSave(), level: 1 }
    const missedCard = CARDS.find((c) => c.rarity === 4)!
    const r = answerBooster(save, missedCard, false, NOW, seeded())
    expect(r.save.missed).toContain(missedCard.id)
    const booster = openBooster(r.save, seeded())
    expect(booster).toHaveLength(BOOSTER_SIZE)
    expect(booster).toContain(missedCard)
    expect(answerBooster(r.save, missedCard, true, NOW, seeded()).save.missed).not.toContain(missedCard.id)
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
